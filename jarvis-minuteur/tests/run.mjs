// Tests : import d'un programme texte, fuseau Casablanca, alertes, et envoi push réel (chiffré) vers un faux serveur push.
import fs from 'node:fs'; import vm from 'node:vm'; import http from 'node:http'; import https from 'node:https';
import crypto from 'node:crypto'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
import webpush from 'web-push';
import { processDue, configureWebPush } from '../netlify/lib/push-core.mjs';
const require = createRequire(import.meta.url);
const ece = require('http_ece');

const mod = { exports: {} };
vm.runInNewContext(fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8'), { module: mod, Intl, Date, globalThis: {} });
const J = mod.exports;

// ---- 1. import texte
const sample = `Programme de mercredi
8h – 9h30 Maths : exercices p.42
9h30 Pause
9:45 - 11h HG – lire la leçon
11h00 à 12h15 Français dictée
12h15 Repas
13h40 - 14h30 : Physique-chimie
14h30 – 15h SVT
15h Goûter
15h20-16h50 Fortnite
16h50 - 17h30 Minecraft
22h Dodo`;
const rows = JSON.parse(JSON.stringify(J.parseProgram(sample)));
console.table(rows.map((r) => ({ ...r, cat: J.category(r.name).k })));
assert.equal(rows.length, 11);
assert.deepEqual(rows[0], { start: '08:00', end: '09:30', name: 'Maths : exercices p.42' });
assert.deepEqual(rows[1], { start: '09:30', end: '09:45', name: 'Pause' });            // fin = début suivant
assert.deepEqual(rows[2], { start: '09:45', end: '11:00', name: 'HG – lire la leçon' });
assert.deepEqual(rows[3], { start: '11:00', end: '12:15', name: 'Français dictée' });
assert.deepEqual(rows[5], { start: '13:40', end: '14:30', name: 'Physique-chimie' });
assert.equal(rows[10].end, '22:30');
assert.deepEqual(rows.map((r) => J.category(r.name).k),
  ['maths', 'pause', 'hg', 'francais', 'repas', 'pc', 'svt', 'pause', 'jeu', 'jeu', 'dodo']);
assert.equal(J.category('Lecture libre').k, 'francais');
assert.equal(J.category('Vélo').k, 'autre');
assert.equal(J.parseProgram('13h40 Maths\n14h10 الرياضيات')[1].name, 'الرياضيات');

// ---- 2. fuseau Africa/Casablanca (UTC+1 normal, UTC+0 pendant le Ramadan)
for (const [y, mo, d] of [[2026, 1, 15], [2026, 2, 25], [2026, 7, 1], [2026, 11, 8], [2027, 2, 10]])
  for (const [h, m] of [[0, 5], [8, 0], [13, 40], [23, 55]]) {
    const ts = J.casaToEpoch(y, mo, d, h, m);
    assert.equal(J.casaHHMM(ts), String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
    assert.equal(new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Africa/Casablanca' }), `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
const now = J.casaToEpoch(2026, 11, 8, 8, 0);
const acts = J.schedule([...rows, { start: '23:30', end: '00:15', name: 'Film' }], now);
assert.equal(acts[0].startMs, now);
assert.equal(acts.at(-1).endMs, J.casaToEpoch(2026, 11, 9, 0, 15)); // passe minuit
const alerts = JSON.parse(JSON.stringify(J.buildAlerts(acts, now)));
const fort = alerts.filter((a) => a.id.startsWith('w8') || a.id.startsWith('e8'));
console.log(fort);
assert.equal(fort[0].title, 'Plus que 5 minutes');
assert.equal(J.casaHHMM(fort[0].at), '16:45');
assert.equal(fort[1].title, "C'est fini : Fortnite");
assert.equal(fort[1].body, 'Maintenant : Minecraft');
assert.ok(!alerts.some((a) => a.title === 'Plus que 5 minutes' && /Maths/.test(a.body)));
console.log('✔ import + fuseau + alertes OK');

// ---- 3. push : vrai chiffrement web-push vers un faux service push, déchiffré côté "navigateur"
const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys();
const auth = crypto.randomBytes(16);
const received = [];
const { publicKey, privateKey } = webpush.generateVAPIDKeys();
configureWebPush(webpush, { VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: privateKey, VAPID_SUBJECT: 'mailto:test@example.com' });
const srv = http.createServer((req, res) => {
  const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => {
    assert.match(req.headers.authorization, /^vapid t=.+, k=/);
    const plain = ece.decrypt(Buffer.concat(chunks), { version: 'aes128gcm', privateKey: ecdh, authSecret: auth.toString('base64url') });
    received.push(JSON.parse(plain.toString())); res.writeHead(201); res.end();
  });
});
await new Promise((r) => srv.listen(0, r));
const sub = { endpoint: `http://127.0.0.1:${srv.address().port}/push/abc`, keys: { p256dh: ecdh.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } };
// web-push utilise https : on le redirige vers http pour ce test local
const realReq = https.request; https.request = (opts, cb) => http.request({ ...opts, protocol: 'http:', agent: undefined }, cb);

const mem = new Map();
const store = { list: async () => ({ blobs: [...mem.keys()].map((key) => ({ key })) }), get: async (k) => mem.get(k) ?? null,
  setJSON: async (k, v) => { mem.set(k, structuredClone(v)); }, delete: async (k) => { mem.delete(k); } };
await store.setJSON('device-1234', { subscription: sub, alerts: J.buildAlerts(acts, now) });
const n0 = mem.get('device-1234').alerts.length;
// la fonction planifiée tourne à 16h45 puis 16h50 (Casablanca)
assert.equal(await processDue(store, webpush, J.casaToEpoch(2026,11,8,16,44)), 0); // alertes passées : trop vieilles, supprimées
assert.equal(await processDue(store, webpush, J.casaToEpoch(2026,11,8,16,45)+10e3), 1);
assert.equal(await processDue(store, webpush, J.casaToEpoch(2026,11,8,16,50)+5e3), 1);
console.log('Notifications reçues et déchiffrées :', received);
assert.deepEqual(received[0].title, 'Plus que 5 minutes');
assert.deepEqual(received[1], { title: "C'est fini : Fortnite", body: 'Maintenant : Minecraft', tag: received[1].tag });
assert.ok(mem.get('device-1234').alerts.length < n0 && mem.get('device-1234').alerts.every((a) => a.at > J.casaToEpoch(2026,11,8,16,50)+5e3));
// annulation (programme arrêté)
await store.delete('device-1234'); assert.equal(await processDue(store, webpush, J.casaToEpoch(2026,11,8,23,59)), 0);
https.request = realReq; srv.close();
console.log('✔ push OK');

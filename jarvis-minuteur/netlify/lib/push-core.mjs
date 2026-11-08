// Logique partagée par les fonctions Netlify (testable sans Netlify).
export const MAX_LATE_MS = 20 * 60 * 1000; // une alerte en retard de plus de 20 min n'est plus envoyée

export function validId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(id);
}

export function validSubscription(s) {
  return s && typeof s.endpoint === 'string' && /^https:\/\//.test(s.endpoint) && s.keys && s.keys.p256dh && s.keys.auth;
}

export function cleanAlerts(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 200)
    .filter((a) => a && Number.isFinite(a.at))
    .map((a) => ({ id: String(a.id || a.at).slice(0, 80), at: Math.round(a.at), title: String(a.title || 'JARVIS').slice(0, 120), body: String(a.body || '').slice(0, 300) }))
    .sort((a, b) => a.at - b.at);
}

export function configureWebPush(webpush, env = process.env) {
  const pub = env.VAPID_PUBLIC_KEY, priv = env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY manquantes');
  webpush.setVapidDetails(env.VAPID_SUBJECT || 'mailto:jarvis.minuteur@gmail.com', pub, priv);
  return webpush;
}

export async function sendOne(webpush, subscription, alert) {
  return webpush.sendNotification(subscription, JSON.stringify({ title: alert.title, body: alert.body, tag: alert.id }), { TTL: 600, urgency: 'high' });
}

// Envoie les alertes arrivées à échéance, supprime celles envoyées.
// store : { list(), get(key,{type:'json'}), setJSON(key,val), delete(key) } (interface Netlify Blobs)
export async function processDue(store, webpush, now = Date.now()) {
  const { blobs } = await store.list();
  let sent = 0;
  for (const { key } of blobs) {
    const rec = await store.get(key, { type: 'json' });
    if (!rec || !Array.isArray(rec.alerts)) { await store.delete(key); continue; }
    const due = rec.alerts.filter((a) => a.at <= now);
    if (!due.length) continue;
    const rest = rec.alerts.filter((a) => a.at > now);
    let gone = false;
    // si plusieurs alertes sont dues en même temps, on n'envoie que la plus récente encore valable
    const fresh = due.filter((a) => now - a.at <= MAX_LATE_MS);
    for (const a of fresh.slice(-2)) {
      try { await sendOne(webpush, rec.subscription, a); sent++; }
      catch (e) {
        console.error('push error', key, e.statusCode, e.body || e.message);
        if (e.statusCode === 404 || e.statusCode === 410) { gone = true; break; }
      }
    }
    if (gone || !rest.length) await store.delete(key);
    else await store.setJSON(key, { ...rec, alerts: rest });
  }
  return sent;
}

/* JARVIS Minuteur — logique côté navigateur (sans framework). */
(function (root) {
  'use strict';

  const TZ = 'Africa/Casablanca';
  const MIN = 60 * 1000;

  /* ================= 1. LECTURE DU TEXTE ================= */
  // Heures : 13h40, 13:40, 13h, 13 h 40, 9H05
  const TIME_RE = /(?<![\d])([01]?\d|2[0-4])\s*(?:h|H|:|\.)\s*([0-5]\d)?(?![\d])/g;
  const pad = (n) => String(n).padStart(2, '0');
  const toHHMM = (h, m) => pad(h % 24) + ':' + pad(m);
  const toMinutes = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const fromMinutes = (x) => toHHMM(Math.floor(((x % 1440) + 1440) % 1440 / 60), ((x % 60) + 60) % 60);

  function parseProgram(text) {
    const rows = [];
    for (let line of String(text).split(/\r?\n/)) {
      line = line.replace(/[|]/g, ' ').trim();
      if (!line) continue;
      const times = [];
      let m;
      TIME_RE.lastIndex = 0;
      while ((m = TIME_RE.exec(line)) && times.length < 2) {
        // un nombre seul suivi de ":" sans minutes (ex. "Exercice 3 :") n'est pas une heure
        if (m[2] === undefined && /:|\./.test(m[0])) continue;
        times.push({ h: +m[1], m: m[2] ? +m[2] : 0, i: m.index, len: m[0].length });
      }
      if (!times.length) {
        // ligne sans heure : on la colle au nom de l'activité précédente
        if (rows.length && !rows[rows.length - 1].name) rows[rows.length - 1].name = line;
        continue;
      }
      let name = line;
      for (const t of [...times].reverse()) name = name.slice(0, t.i) + ' ' + name.slice(t.i + t.len);
      name = name
        .replace(/^\s*(?:de|from|à|a|jusqu'?à)\s+/i, ' ')
        .replace(/\s+(?:à|a|au)\s+(?=\s)/i, ' ')
        .replace(/^[\s\-–—:.,;>→]+|[\s\-–—:.,;>→]+$/g, '')
        .replace(/^\s*(?:à|a)\s+/i, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      rows.push({
        start: toHHMM(times[0].h, times[0].m),
        end: times[1] ? toHHMM(times[1].h, times[1].m) : '',
        name,
      });
    }
    // fin manquante = début de l'activité suivante (ou +30 min pour la dernière)
    rows.forEach((r, i) => {
      if (!r.end) r.end = rows[i + 1] ? rows[i + 1].start : fromMinutes(toMinutes(r.start) + 30);
      if (!r.name) r.name = 'Activité';
    });
    return rows;
  }

  /* ================= COULEURS ================= */
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const CATS = [
    { k: 'jeu', c: '#b36bff', re: /\b(jeux?|jouer|fortnite|ps[345]?|playstation|minecraft|console|switch|roblox)\b/ },
    { k: 'maths', c: '#ff5fa2', re: /\b(maths?|mathematiques?|رياضيات)/ },
    { k: 'hg', c: '#2fd16b', re: /\b(hg|histoire|geo(graphie)?|emc)\b|تاريخ|جغرافيا/ },
    { k: 'francais', c: '#3e8bff', re: /\b(francais|fr|dictee|conjugaison|grammaire|lecture)\b|فرنسية/ },
    { k: 'pc', c: '#ffd23f', re: /\b(physique|chimie|pc)\b|فيزياء/ },
    { k: 'svt', c: '#9cf28a', re: /\b(svt|sciences? de la vie|biologie)\b|علوم/ },
    { k: 'pause', c: '#8a96a3', re: /\b(pause|gouter|recre(ation)?)\b|استراحة/ },
    { k: 'repas', c: '#ffb878', re: /\b(repas|dejeuner|diner|petit[- ]dej\w*|manger|souper|ftour)\b|غداء|عشاء/ },
    { k: 'dodo', c: '#3550c8', re: /\b(dodo|dormir|sommeil|coucher|nuit)\b|نوم/ },
  ];
  function category(name) {
    const n = norm(name);
    for (const c of CATS) if (c.re.test(n)) return c;
    return { k: 'autre', c: '#00e5ff' };
  }
  const isFreeTime = (name) => category(name).k === 'jeu' || /\b(temps libre|libre|loisirs?|tele|tv|youtube|telephone|tablette)\b/.test(norm(name));

  /* ================= FUSEAU Africa/Casablanca ================= */
  const fmt = typeof Intl !== 'undefined' ? new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }) : null;
  function casaParts(ts) {
    const p = {};
    for (const x of fmt.formatToParts(new Date(ts))) p[x.type] = +x.value;
    return p;
  }
  function tzOffset(ts) {
    const p = casaParts(ts);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ts / 1000) * 1000;
  }
  // heure « murale » de Casablanca -> timestamp absolu (gère les changements d'heure du Ramadan)
  function casaToEpoch(y, mo, d, h, mi) {
    const guess = Date.UTC(y, mo - 1, d, h, mi);
    let ts = guess - tzOffset(guess);
    ts = guess - tzOffset(ts);
    return ts;
  }
  function casaHHMM(ts) { const p = casaParts(ts); return toHHMM(p.hour, p.minute); }

  // Transforme le tableau (HH:MM) en activités datées pour aujourd'hui à Casablanca
  function schedule(rows, now = Date.now()) {
    const t = casaParts(now);
    // minutes depuis minuit "aujourd'hui" (peut dépasser 1440) -> timestamp
    const toMs = (abs) => casaToEpoch(t.year, t.month, t.day + Math.floor(abs / 1440), Math.floor((abs % 1440) / 60), abs % 60);
    let dayShift = 0, prevStart = -1;
    return rows.filter((r) => r.start && r.end).map((r, i) => {
      let startAbs = toMinutes(r.start) + dayShift * 1440;
      // programme qui passe minuit (ex. 23h Film -> 0h30 Dodo)
      if (i > 0 && startAbs < prevStart - 12 * 60) { dayShift++; startAbs += 1440; }
      let endAbs = toMinutes(r.end) + dayShift * 1440;
      while (endAbs <= startAbs) endAbs += 1440;
      prevStart = startAbs;
      return { name: r.name, startMs: toMs(startAbs), endMs: toMs(endAbs) };
    });
  }

  // Liste des alertes à programmer sur le serveur
  function buildAlerts(acts, now = Date.now()) {
    const out = [];
    acts.forEach((a, i) => {
      const next = acts[i + 1];
      if (isFreeTime(a.name) && a.endMs - 5 * MIN > now && a.endMs - a.startMs > 6 * MIN) {
        out.push({ id: 'w' + i + '-' + a.endMs, at: a.endMs - 5 * MIN, title: 'Plus que 5 minutes', body: a.name + ' se termine à ' + casaHHMM(a.endMs) });
      }
      if (a.endMs > now) {
        out.push({ id: 'e' + i + '-' + a.endMs, at: a.endMs, title: "C'est fini : " + a.name, body: next ? 'Maintenant : ' + next.name : 'Programme terminé, bravo !' });
      }
    });
    return out;
  }

  const api = { parseProgram, category, isFreeTime, schedule, buildAlerts, casaToEpoch, casaHHMM, toMinutes };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
  root.JARVIS = api;

  /* =================================================================== */
  /* ======================= INTERFACE NAVIGATEUR ======================= */
  /* =================================================================== */
  const $ = (s) => document.querySelector(s);
  const LS = 'jarvis.minuteur.v1';
  const CLIENT_ID = (() => {
    let id = localStorage.getItem('jarvis.clientId');
    if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); localStorage.setItem('jarvis.clientId', id); }
    return id;
  })();
  const FN = '/.netlify/functions/';

  let state = load() || { rows: [], running: false, acts: [], pausedAt: null, fired: [] };
  function load() { try { return JSON.parse(localStorage.getItem(LS)); } catch { return null; } }
  function save() { try { localStorage.setItem(LS, JSON.stringify(state)); } catch {} }

  /* ---------- Tableau modifiable ---------- */
  const tbody = $('#tbl tbody');
  function renderTable() {
    tbody.innerHTML = '';
    state.rows.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><input type="time" data-f="start"></td><td><input type="time" data-f="end"></td>
        <td><input type="text" data-f="name" placeholder="Activité"></td><td><button class="del" title="Supprimer" aria-label="Supprimer">✕</button></td>`;
      tr.querySelectorAll('input').forEach((inp) => {
        inp.value = r[inp.dataset.f] || '';
        inp.addEventListener('input', () => { r[inp.dataset.f] = inp.value; if (inp.dataset.f === 'name') color(); save(); });
      });
      const color = () => tr.querySelector('[data-f=name]').style.setProperty('--c', category(r.name).c);
      color();
      tr.querySelector('.del').onclick = () => { state.rows.splice(i, 1); save(); renderTable(); };
      tbody.appendChild(tr);
    });
  }
  $('#btnAddRow').onclick = () => {
    const last = state.rows[state.rows.length - 1];
    const s = last ? last.end : casaHHMM(Date.now());
    state.rows.push({ start: s, end: s ? `${String(Math.floor((toMinutes(s) + 30) / 60) % 24).padStart(2, '0')}:${String((toMinutes(s) + 30) % 60).padStart(2, '0')}` : '', name: '' });
    save(); renderTable();
    tbody.lastElementChild.querySelector('[data-f=name]').focus();
  };

  /* ---------- Onglets & import ---------- */
  document.querySelectorAll('.tab').forEach((b) => b.onclick = () => {
    document.querySelectorAll('.tab,.tabpane').forEach((x) => x.classList.remove('active'));
    b.classList.add('active'); $('#' + b.dataset.tab).classList.add('active');
  });
  const status = (t) => { $('#ocrStatus').textContent = t; };
  function applyText(text) {
    $('#rawText').value = text;
    const rows = parseProgram(text);
    if (!rows.length) { status("Aucune heure trouvée. Corrige le texte dans l'onglet « Texte » ou ajoute les lignes à la main."); return; }
    state.rows = rows; save(); renderTable();
    status(rows.length + ' activité(s) trouvée(s). Vérifie le tableau avant de lancer.');
  }
  $('#btnParse').onclick = () => applyText($('#rawText').value);

  function loadScript(src) {
    return new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => ko(new Error('Chargement impossible : ' + src)); document.head.appendChild(s); });
  }
  $('#fileImage').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      status('Chargement de la lecture d’image…');
      if (!root.Tesseract) await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
      const worker = await Tesseract.createWorker(['fra', 'ara'], 1, {
        logger: (m) => { if (m.status === 'recognizing text') status('Lecture de l’image… ' + Math.round(m.progress * 100) + ' %'); },
      });
      const { data } = await worker.recognize(f);
      await worker.terminate();
      applyText(data.text);
    } catch (err) { status('Erreur de lecture : ' + err.message); }
    e.target.value = '';
  };
  $('#filePdf').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      status('Lecture du PDF…');
      if (!root.pdfjsLib) await loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
      let text = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const tc = await page.getTextContent();
        // regroupe les morceaux par ligne (même hauteur y)
        const lines = new Map();
        for (const it of tc.items) {
          const y = Math.round(it.transform[5]);
          const key = [...lines.keys()].find((k) => Math.abs(k - y) < 4) ?? y;
          if (!lines.has(key)) lines.set(key, []);
          lines.get(key).push({ x: it.transform[4], s: it.str });
        }
        [...lines.entries()].sort((a, b) => b[0] - a[0]).forEach(([, parts]) => {
          text += parts.sort((a, b) => a.x - b.x).map((p) => p.s).join(' ') + '\n';
        });
      }
      applyText(text);
    } catch (err) { status('Erreur PDF : ' + err.message); }
    e.target.value = '';
  };

  /* ---------- Service worker & push ---------- */
  let swReg = null;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then((r) => { swReg = r; }).catch(() => {});
  }
  const pushStatus = (t) => { $('#pushStatus').textContent = t; };

  function updateNotifButton() {
    const b = $('#btnNotif');
    if (!('Notification' in window)) { b.textContent = isIOS() && !isStandalone() ? '🔔 Installe l’appli pour les notifications' : '🔕 Notifications non disponibles'; return; }
    if (Notification.permission === 'granted') { b.textContent = '🔔 Notifications activées'; b.classList.add('btn-ok'); }
    else if (Notification.permission === 'denied') b.textContent = '🔕 Notifications refusées (Réglages)';
  }
  $('#btnNotif').onclick = async () => {
    if (!('Notification' in window)) { if (isIOS()) $('#iosDialog').showModal(); return; }
    const p = await Notification.requestPermission();
    updateNotifButton();
    if (p === 'granted') {
      const sub = await subscribePush().catch((e) => { pushStatus('Push : ' + e.message); return null; });
      if (sub) {
        // notification de test immédiate envoyée par le serveur
        fetch(FN + 'test-push', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subscription: sub }) })
          .then((r) => pushStatus(r.ok ? 'Notification de test envoyée par le serveur ✔' : 'Le serveur n’a pas pu envoyer la notification de test.'))
          .catch(() => pushStatus('Serveur injoignable (mode hors ligne ?)'));
      }
      if (state.running) syncServer();
    }
  };

  function b64ToUint8(b64) {
    const s = (b64 + '='.repeat((4 - b64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  }
  async function subscribePush() {
    if (!('PushManager' in window) || !('serviceWorker' in navigator)) throw new Error('non disponible sur cet appareil');
    if (Notification.permission !== 'granted') throw new Error('notifications non autorisées');
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const r = await fetch(FN + 'vapid-public-key');
      if (!r.ok) throw new Error('clé VAPID absente sur le serveur');
      const { publicKey } = await r.json();
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(publicKey) });
    }
    return sub.toJSON();
  }

  // Envoie (ou annule) les alertes sur le serveur. Chaque envoi REMPLACE les anciennes alertes.
  let syncTimer = null;
  function syncServer() { clearTimeout(syncTimer); syncTimer = setTimeout(doSync, 400); }
  async function doSync() {
    const active = state.running && !state.pausedAt;
    try {
      if (!active) {
        await fetch(FN + 'alerts?id=' + encodeURIComponent(CLIENT_ID), { method: 'DELETE' });
        pushStatus(state.running ? 'En pause : alertes du serveur suspendues.' : '');
        return;
      }
      const sub = await subscribePush();
      const alerts = buildAlerts(state.acts);
      const r = await fetch(FN + 'alerts', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: CLIENT_ID, subscription: sub, alerts }),
      });
      pushStatus(r.ok ? `📡 ${alerts.length} alerte(s) programmée(s) sur le serveur — elles arriveront même si l’appli est fermée.` : 'Le serveur a refusé les alertes.');
    } catch (e) {
      pushStatus('⚠ Alertes serveur inactives (' + e.message + '). Les alertes ne marcheront que si l’appli reste ouverte.');
    }
  }

  /* ---------- Minuteur ---------- */
  const ring = $('#ring');
  const CIRC = 2 * Math.PI * 130;
  ring.style.strokeDasharray = CIRC;
  const ticks = document.querySelector('.r-ticks');
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * 2 * Math.PI, r1 = i % 5 ? 112 : 106, r2 = 118;
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', 150 + r1 * Math.cos(a)); l.setAttribute('y1', 150 + r1 * Math.sin(a));
    l.setAttribute('x2', 150 + r2 * Math.cos(a)); l.setAttribute('y2', 150 + r2 * Math.sin(a));
    ticks.appendChild(l);
  }

  function showView(run) { $('#viewEdit').hidden = run; $('#viewRun').hidden = !run; }

  $('#btnStart').onclick = () => {
    const rows = state.rows.filter((r) => r.start && r.end && r.name.trim());
    if (!rows.length) { status('Ajoute au moins une activité avec une heure de début, de fin et un nom.'); return; }
    unlockAudio();
    state.acts = schedule(rows);
    state.running = true; state.pausedAt = null; state.fired = [];
    const now = Date.now();
    state.acts.forEach((a, i) => { if (a.endMs <= now) state.fired.push('e' + i + '-' + a.endMs, 'w' + i + '-' + a.endMs); });
    save(); showView(true); syncServer(); tick();
  };

  function currentIndex(now) {
    const i = state.acts.findIndex((a) => a.endMs > now);
    return i;
  }
  function nowEff() { return state.pausedAt || Date.now(); }

  function fmtDur(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(x);
  }

  function tick() {
    if (!state.running) return;
    const now = nowEff();
    checkLocalAlerts(now);
    const i = currentIndex(now);
    const list = $('#list');
    list.innerHTML = '';
    state.acts.forEach((a, k) => {
      const li = document.createElement('li');
      li.style.setProperty('--c', category(a.name).c);
      li.className = k < i || i < 0 ? 'done' : k === i ? 'current' : '';
      li.innerHTML = `<span class="chk">${li.className === 'done' ? '✔' : k === i ? '▶' : '○'}</span><span class="t">${casaHHMM(a.startMs)} – ${casaHHMM(a.endMs)}</span><span class="n"></span>`;
      li.querySelector('.n').textContent = a.name;
      list.appendChild(li);
    });
    const wrap = document.querySelector('.reactor-wrap');
    if (i < 0) {
      $('#curName').textContent = 'Programme terminé';
      $('#countdown').textContent = '✔';
      $('#curRange').textContent = 'Bravo !';
      ring.style.strokeDashoffset = CIRC; $('#bar').style.width = '100%';
      wrap.classList.remove('final');
      document.documentElement.style.setProperty('--accent', '#00e5ff');
      return;
    }
    const a = state.acts[i];
    const waiting = now < a.startMs;
    const total = a.endMs - a.startMs, left = waiting ? a.startMs - now : a.endMs - now;
    const frac = waiting ? 1 : Math.min(1, Math.max(0, left / total));
    document.documentElement.style.setProperty('--accent', category(a.name).c);
    $('#curName').textContent = waiting ? 'Bientôt : ' + a.name : a.name;
    $('#countdown').textContent = fmtDur(left);
    $('#curRange').textContent = casaHHMM(a.startMs) + ' → ' + casaHHMM(a.endMs);
    ring.style.strokeDashoffset = CIRC * (1 - frac);
    $('#bar').style.width = ((1 - frac) * 100) + '%';
    wrap.classList.toggle('final', !waiting && left <= 10000 && !state.pausedAt);
    $('#pausedTag').hidden = !state.pausedAt;
    $('#btnPause').textContent = state.pausedAt ? '▶ Reprendre' : '⏸ Pause';
  }
  setInterval(tick, 250);

  /* ---------- Alertes locales (appli ouverte) : notification + son + voix ---------- */
  function checkLocalAlerts(now) {
    if (state.pausedAt) return;
    for (const al of buildAlerts(state.acts, -Infinity)) {
      if (al.at <= now && !state.fired.includes(al.id)) {
        state.fired.push(al.id); save();
        if (now - al.at < 2 * MIN) fireLocal(al);
      }
    }
  }
  function fireLocal(al) {
    // même "tag" que la notification push : si les deux arrivent, une seule reste affichée
    if ('Notification' in window && Notification.permission === 'granted' && swReg) {
      swReg.showNotification(al.title, { body: al.body, tag: al.id, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', renotify: true });
    }
    beep(al.id.startsWith('w') ? 2 : 3);
    speak(al.title.replace("C'est fini :", "C'est fini :") + '. ' + al.body);
  }
  let actx = null;
  function unlockAudio() {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch {}
    try { speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch {}
  }
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  function beep(n) {
    if (!actx) return;
    for (let k = 0; k < n; k++) {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + k * 0.35;
      o.type = 'sine'; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1320, t + 0.2);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.32);
    }
  }
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR'; u.rate = 1;
    const v = speechSynthesis.getVoices().find((x) => /^fr/i.test(x.lang));
    if (v) u.voice = v;
    setTimeout(() => speechSynthesis.speak(u), 900);
  }

  /* ---------- Boutons du minuteur ---------- */
  function shiftFrom(i, ms) { for (let k = i; k < state.acts.length; k++) { if (k > i) state.acts[k].startMs += ms; state.acts[k].endMs += ms; } }
  function resetFired() { state.fired = state.fired.filter((id) => buildAlerts(state.acts, -Infinity).some((a) => a.id === id && a.at <= Date.now())); }

  $('#btnNext').onclick = () => {
    const now = nowEff(), i = currentIndex(now);
    if (i < 0) return;
    const a = state.acts[i];
    state.fired.push('e' + i + '-' + now, 'w' + i + '-' + now);
    a.endMs = now; if (a.startMs > now) a.startMs = now;
    const n = state.acts[i + 1];
    if (n && n.startMs > now) n.startMs = now;
    save(); syncServer(); tick();
  };
  $('#btnPlus5').onclick = () => {
    const i = currentIndex(nowEff()); if (i < 0) return;
    shiftFrom(i, 5 * MIN); resetFired(); save(); syncServer(); tick();
  };
  $('#btnPause').onclick = () => {
    if (state.pausedAt) {
      const d = Date.now() - state.pausedAt, i = currentIndex(state.pausedAt);
      state.pausedAt = null;
      if (i >= 0) shiftFrom(i, d);
    } else state.pausedAt = Date.now();
    save(); syncServer(); tick();
  };
  $('#btnEdit').onclick = () => {
    // le tableau reprend les heures actuelles (y compris +5 min, pauses…)
    state.rows = state.acts.map((a) => ({ start: casaHHMM(a.startMs), end: casaHHMM(a.endMs), name: a.name }));
    stopProgram();
  };
  $('#btnStop').onclick = () => { if (confirm('Arrêter le programme et annuler toutes les alertes ?')) stopProgram(); };
  function stopProgram() {
    state.running = false; state.pausedAt = null; state.acts = [];
    save(); syncServer(); renderTable(); showView(false);
    document.documentElement.style.setProperty('--accent', '#00e5ff');
  }

  /* ---------- Installation ---------- */
  function isStandalone() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
  function isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  let deferredPrompt = null;
  const btnInstall = $('#btnInstall');
  if (!isStandalone() && isIOS()) btnInstall.hidden = false;
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; if (!isStandalone()) btnInstall.hidden = false; });
  addEventListener('appinstalled', () => { btnInstall.hidden = true; deferredPrompt = null; });
  matchMedia('(display-mode: standalone)').addEventListener?.('change', (e) => { if (e.matches) btnInstall.hidden = true; });
  btnInstall.onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') btnInstall.hidden = true;
      deferredPrompt = null;
    } else {
      $('#iosDialog').showModal();
    }
  };

  /* ---------- Démarrage ---------- */
  if (!state.rows.length) applyText($('#rawText').placeholder.replace(/&#10;/g, '\n'));
  renderTable(); updateNotifButton();
  if (state.running) { showView(true); tick(); if ('Notification' in window && Notification.permission === 'granted') syncServer(); }
  navigator.serviceWorker?.addEventListener('message', (e) => { if (e.data?.type === 'focus') tick(); });
})(typeof window !== 'undefined' ? window : globalThis);

/* Service worker JARVIS Minuteur : cache hors ligne + notifications push */
const CACHE = 'jarvis-v1';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'manifest.json', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.startsWith('/.netlify/')) return; // jamais de cache pour le serveur
  if (url.origin === location.origin) {
    // réseau d'abord (pour avoir les mises à jour), cache si hors ligne
    e.respondWith(
      fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
        .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
    );
  } else if (/cdn\.jsdelivr\.net|tessdata/.test(url.host + url.pathname)) {
    // librairies OCR / PDF : cache d'abord
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const c2 = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, c2)); return res; })));
  }
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'JARVIS', body: e.data && e.data.text() }; }
  const title = d.title || 'JARVIS Minuteur';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    tag: d.tag || undefined,
    renotify: true,
    requireInteraction: true,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    vibrate: [300, 150, 300, 150, 300],
    data: { url: './index.html' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if ('focus' in c) { c.postMessage({ type: 'focus' }); return c.focus(); } }
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || './');
  })());
});

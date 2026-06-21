// Offline cache. Bump CACHE on every deploy so browsers fetch fresh files.
const CACHE = 'mournwood-remake-v11';
const ASSETS = [
  './', './index.html', './manifest.json', './icon.svg', './css/style.css',
  './js/main.js', './js/art.js',
  './js/engine/rng.js', './js/engine/statuses.js', './js/engine/combat.js',
  './js/data/cards.js', './js/data/enemies.js', './js/data/hunters.js', './js/data/relics.js', './js/data/pacts.js',
  './js/game/run.js',
  './js/ui/combat.js', './js/ui/audio.js', './js/ui/map.js', './js/ui/nodes.js',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => { e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request))); });

// hub-stats tracker v2

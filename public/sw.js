const CACHE_COVERS = 'jukebox-covers-v1';
const CACHE_QUEUE_AUDIO = 'jukebox-queue-audio-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function isAudioRequest(url) {
  return /\.(mp3|wav|ogg|m4a|flac|mp4)(\?|$)/i.test(url);
}

function isImageRequest(url) {
  return /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(url);
}

async function matchIgnoreSearch(cacheName, request) {
  const cache = await caches.open(cacheName);
  return cache.match(request, { ignoreSearch: true });
}

async function cacheFirstAudio(request) {
  const cached = await matchIgnoreSearch(CACHE_QUEUE_AUDIO, request);
  if (cached) return cached;
  return fetch(request);
}

async function cacheFirstCover(request) {
  const cached = await matchIgnoreSearch(CACHE_COVERS, request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_COVERS);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  if (isAudioRequest(url)) {
    event.respondWith(cacheFirstAudio(event.request));
    return;
  }

  if (isImageRequest(url) && !url.startsWith(self.location.origin)) {
    event.respondWith(cacheFirstCover(event.request));
  }
});

async function putUrls(cacheName, urls) {
  const cache = await caches.open(cacheName);
  await Promise.all(
    (urls || []).map(async (url) => {
      if (!url) return;
      const existing = await cache.match(url, { ignoreSearch: true });
      if (existing) return;
      try {
        const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch {
        // Rede / CORS
      }
    })
  );
}

async function pruneCache(cacheName, keepUrls) {
  const cache = await caches.open(cacheName);
  const keep = new Set(keepUrls || []);
  const keys = await cache.keys();
  await Promise.all(
    keys.map((request) => {
      const keepHit = [...keep].some(
        (url) => request.url === url || request.url.split('?')[0] === String(url).split('?')[0]
      );
      return keepHit ? Promise.resolve() : cache.delete(request);
    })
  );
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'JUKEBOX_SYNC_QUEUE_MEDIA') return;

  event.waitUntil(
    Promise.all([
      putUrls(CACHE_QUEUE_AUDIO, data.audioUrls),
      putUrls(CACHE_COVERS, data.coverUrls),
      pruneCache(CACHE_QUEUE_AUDIO, data.audioUrls),
    ])
  );
});

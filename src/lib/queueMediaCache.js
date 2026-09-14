export const QUEUE_PRECACHE_COUNT = 5;

function uniqueUrls(urls) {
  return [...new Set((urls || []).filter(Boolean))];
}

async function postToServiceWorker(payload) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  const worker = registration?.active || navigator.serviceWorker.controller;
  worker?.postMessage(payload);
}

export function syncQueueMediaCache({ currentSong, queue = [] } = {}) {
  const upcoming = queue.slice(0, QUEUE_PRECACHE_COUNT);
  const tracks = currentSong ? [currentSong, ...upcoming] : upcoming;

  const audioUrls = uniqueUrls(tracks.map((track) => track.media_url || track.audio_url));
  const coverUrls = uniqueUrls(tracks.map((track) => track.cover || track.cover_url));

  return postToServiceWorker({
    type: 'JUKEBOX_SYNC_QUEUE_MEDIA',
    audioUrls,
    coverUrls,
  });
}

export function registerJukeboxServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW opcional — app funciona sem cache de mídia
    });
  });
}

import { parseDurationSeconds } from './utils';

function resolveMediaUrl(url) {
  if (!url) return '';
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

/** Lê duração do item da API (`files` / `musicas`) com vários nomes de campo. */
export function resolveDurationSecondsFromTrack(track) {
  if (!track) return null;

  const candidates = [
    track.duration_seconds,
    track.duration,
    track.length_seconds,
    track.length,
    track.duracao,
    track.duracao_segundos,
    track.media?.duration_seconds,
    track.metadata?.duration_seconds,
  ];

  for (const value of candidates) {
    const parsed = parseDurationSeconds(value);
    if (parsed != null && parsed > 0) return parsed;
  }

  const ms = track.duration_ms ?? track.length_ms;
  if (ms != null) {
    const fromMs = parseDurationSeconds(Number(ms) / 1000);
    if (fromMs != null && fromMs > 0) return fromMs;
  }

  return null;
}

export function trackNeedsDurationProbe(track) {
  return (
    (track?.duration_seconds == null || track.duration_seconds <= 0) && Boolean(track?.media_url)
  );
}

export function probeTrackDuration(mediaUrl, signal) {
  return new Promise((resolve) => {
    if (!mediaUrl) {
      resolve(null);
      return;
    }

    const audio = new Audio();
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      audio.removeAttribute('src');
      audio.load();
      resolve(value);
    };

    const onAbort = () => finish(null);
    signal?.addEventListener('abort', onAbort, { once: true });

    audio.preload = 'metadata';
    audio.addEventListener(
      'loadedmetadata',
      () => {
        const seconds = audio.duration;
        finish(Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : null);
      },
      { once: true }
    );
    audio.addEventListener('error', () => finish(null), { once: true });
    window.setTimeout(() => finish(null), 12_000);

    audio.src = resolveMediaUrl(mediaUrl);
    audio.load();
  });
}

const PROBE_CONCURRENCY = 3;

export async function enrichTracksWithDurations(tracks, { signal, onTrackDuration } = {}) {
  if (!tracks?.length) return tracks;

  const result = tracks.map((track) => ({ ...track }));
  const pending = result
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => trackNeedsDurationProbe(track));

  if (pending.length === 0) return result;

  let cursor = 0;

  const worker = async () => {
    while (cursor < pending.length) {
      if (signal?.aborted) return;
      const slot = cursor++;
      const { track, index } = pending[slot];
      const seconds = await probeTrackDuration(track.media_url, signal);
      if (seconds == null || signal?.aborted) continue;

      result[index] = { ...result[index], duration_seconds: seconds };
      onTrackDuration?.(index, seconds);
    }
  };

  const workers = Math.min(PROBE_CONCURRENCY, pending.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));

  return result;
}

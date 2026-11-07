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
    track.duracao_formatada,
    track.tempo,
    track.tempo_segundos,
    track.time,
    track.media?.duration_seconds,
    track.media?.duration,
    track.metadata?.duration_seconds,
    track.metadata?.duration,
    track.file?.duration_seconds,
    track.file?.duration,
    track.audio?.duration_seconds,
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

export function resolveMediaUrlFromTrack(track) {
  if (!track) return null;

  const direct =
    track.media_url ||
    track.audio_url ||
    track.stream_url ||
    track.public_url ||
    track.url ||
    track.media?.media_url ||
    track.media?.url ||
    track.file?.media_url ||
    track.audio?.url;

  const value = direct ? String(direct).trim() : '';
  return value || null;
}

export function trackNeedsDurationProbe(track) {
  const needsDuration = track?.duration_seconds == null || track.duration_seconds <= 0;
  return needsDuration && Boolean(resolveMediaUrlFromTrack(track));
}

function readDurationSeconds(audio) {
  const seconds = audio?.duration;
  return Number.isFinite(seconds) && seconds > 0 && seconds !== Infinity
    ? Math.floor(seconds)
    : null;
}

function probeWithCrossOrigin(mediaUrl, crossOrigin, signal, timeoutMs) {
  return new Promise((resolve) => {
    const audio = new Audio();
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      audio.removeAttribute('src');
      audio.load();
      resolve(value);
    };

    const tryResolve = () => {
      const seconds = readDurationSeconds(audio);
      if (seconds != null) finish(seconds);
    };

    const onAbort = () => finish(null);
    signal?.addEventListener('abort', onAbort);

    if (crossOrigin) {
      audio.crossOrigin = crossOrigin;
    }

    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', tryResolve);
    audio.addEventListener('durationchange', tryResolve);
    audio.addEventListener(
      'canplay',
      () => {
        tryResolve();
      },
      { once: true }
    );
    audio.addEventListener('error', () => finish(null), { once: true });
    window.setTimeout(() => finish(readDurationSeconds(audio)), timeoutMs);

    audio.src = resolveMediaUrl(mediaUrl);
    audio.load();
  });
}

export async function probeTrackDuration(mediaUrl, signal) {
  if (!mediaUrl) return null;

  const withCors = await probeWithCrossOrigin(mediaUrl, 'anonymous', signal, 14_000);
  if (withCors != null) return withCors;

  return probeWithCrossOrigin(mediaUrl, null, signal, 14_000);
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
      const mediaUrl = resolveMediaUrlFromTrack(track);
      const seconds = await probeTrackDuration(mediaUrl, signal);
      if (seconds == null || signal?.aborted) continue;

      result[index] = { ...result[index], duration_seconds: seconds };
      onTrackDuration?.(index, seconds);
    }
  };

  const workers = Math.min(PROBE_CONCURRENCY, pending.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));

  return result;
}

const KEYS = {
  TOKEN: 'jukebox_maquina_token',
  INFO: 'jukebox_maquina_info',
  CREDITS: 'jukebox_credits_balance',
  VOLUME: 'jukebox_volume_percent',
  LAST_GENRE: 'jukebox_last_genre_path',
  LAST_ALBUM: 'jukebox_last_album_path',
  NEEDS_SYNC: 'jukebox_needs_sync',
  LIBRARY_FETCHED_AT: 'jukebox_library_fetched_at',
};

const PERSISTENT_KEYS = {
  QUEUE: 'jukebox_session_queue',
  CURRENT_SONG: 'jukebox_session_current_song',
  RESUME_PLAYBACK: 'jukebox_should_resume_playback',
};

const LEGACY_SESSION_KEYS = {
  QUEUE: 'jukebox_session_queue',
  CURRENT_SONG: 'jukebox_session_current_song',
};

export function getMaquinaToken() {
  const token = localStorage.getItem(KEYS.TOKEN);
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  return token;
}

export function setMaquinaSession({ token, ...info }) {
  if (!token || token === 'undefined' || token === 'null') {
    throw new Error('Token da máquina não recebido do servidor.');
  }
  localStorage.setItem(KEYS.TOKEN, token);
  localStorage.setItem(KEYS.INFO, JSON.stringify(info));
}

export function getMaquinaInfo() {
  const raw = localStorage.getItem(KEYS.INFO);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearMaquinaSession() {
  localStorage.removeItem(KEYS.TOKEN);
  localStorage.removeItem(KEYS.INFO);
  localStorage.removeItem(KEYS.LAST_GENRE);
  localStorage.removeItem(KEYS.LAST_ALBUM);
  localStorage.removeItem(KEYS.NEEDS_SYNC);
  localStorage.removeItem(KEYS.LIBRARY_FETCHED_AT);
  localStorage.removeItem(PERSISTENT_KEYS.QUEUE);
  localStorage.removeItem(PERSISTENT_KEYS.CURRENT_SONG);
  localStorage.removeItem(PERSISTENT_KEYS.RESUME_PLAYBACK);
  sessionStorage.removeItem(LEGACY_SESSION_KEYS.QUEUE);
  sessionStorage.removeItem(LEGACY_SESSION_KEYS.CURRENT_SONG);
}

export function getMaquinaTeclas() {
  return getMaquinaInfo()?.teclas || [];
}

export function updateMaquinaTeclas(teclas) {
  const token = getMaquinaToken();
  const info = getMaquinaInfo() || {};
  if (!token) return;
  setMaquinaSession({ token, ...info, teclas });
}

export function getCreditsBalance() {
  const raw = localStorage.getItem(KEYS.CREDITS);
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export function setCreditsBalance(balance) {
  localStorage.setItem(KEYS.CREDITS, String(Math.max(0, balance)));
}

export function addCredits(amount) {
  const next = getCreditsBalance() + amount;
  setCreditsBalance(next);
  return next;
}

export function deductCredits(amount) {
  const next = Math.max(0, getCreditsBalance() - amount);
  setCreditsBalance(next);
  return next;
}

export function getVolumePercent() {
  const raw = localStorage.getItem(KEYS.VOLUME);
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 100;
}

export function setVolumePercent(percent) {
  localStorage.setItem(KEYS.VOLUME, String(Math.max(0, Math.min(100, percent))));
}

export function getLastGenrePath() {
  return localStorage.getItem(KEYS.LAST_GENRE) || null;
}

export function setLastGenrePath(path) {
  if (!path) {
    localStorage.removeItem(KEYS.LAST_GENRE);
    return;
  }
  localStorage.setItem(KEYS.LAST_GENRE, path);
}

export function getLastAlbumPath() {
  return localStorage.getItem(KEYS.LAST_ALBUM) || null;
}

export function setLastAlbumPath(path) {
  if (!path) {
    localStorage.removeItem(KEYS.LAST_ALBUM);
    return;
  }
  localStorage.setItem(KEYS.LAST_ALBUM, path);
}

export function getStoredNeedsSync() {
  return localStorage.getItem(KEYS.NEEDS_SYNC) === 'true';
}

export function setStoredNeedsSync(value) {
  localStorage.setItem(KEYS.NEEDS_SYNC, value ? 'true' : 'false');
  localStorage.setItem(KEYS.LIBRARY_FETCHED_AT, String(Date.now()));
}

export function getLibraryFetchedAt() {
  const raw = localStorage.getItem(KEYS.LIBRARY_FETCHED_AT);
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function readJson(storage, key) {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function migrateSessionKeyToLocal(key) {
  const legacy = readJson(sessionStorage, key);
  if (legacy == null) return;
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(legacy));
  }
  sessionStorage.removeItem(key);
}

function trackIdentity(track) {
  return track?.id || track?.key || null;
}

export function getSessionQueue() {
  migrateSessionKeyToLocal(PERSISTENT_KEYS.QUEUE);
  const data = readJson(localStorage, PERSISTENT_KEYS.QUEUE);
  return Array.isArray(data) ? data : [];
}

/** Fila persistida com a faixa em reprodução sempre na posição 0 (se existir). */
export function getPersistedQueue() {
  let queue = getSessionQueue();
  const savedCurrent = getSessionCurrentSong();
  if (!savedCurrent?.media_url) {
    return queue;
  }

  const currentId = trackIdentity(savedCurrent);
  const existingIndex = queue.findIndex((item) => trackIdentity(item) === currentId);

  if (existingIndex === -1) {
    queue = [{ ...savedCurrent, playbackStarted: true }, ...queue];
  } else if (existingIndex > 0) {
    const [current] = queue.splice(existingIndex, 1);
    queue = [{ ...current, playbackStarted: true }, ...queue];
  } else {
    queue = [{ ...queue[0], ...savedCurrent, playbackStarted: true }, ...queue.slice(1)];
  }

  setSessionQueue(queue);
  return queue;
}

export function setSessionQueue(queue) {
  const items = queue || [];
  localStorage.setItem(PERSISTENT_KEYS.QUEUE, JSON.stringify(items));
  setShouldResumePlayback(items.length > 0);
}

export function getSessionCurrentSong() {
  migrateSessionKeyToLocal(PERSISTENT_KEYS.CURRENT_SONG);
  const data = readJson(localStorage, PERSISTENT_KEYS.CURRENT_SONG);
  return data && typeof data === 'object' ? data : null;
}

export function setSessionCurrentSong(song) {
  if (!song) {
    localStorage.removeItem(PERSISTENT_KEYS.CURRENT_SONG);
    return;
  }
  localStorage.setItem(PERSISTENT_KEYS.CURRENT_SONG, JSON.stringify(song));
}

export function shouldResumePlayback() {
  return localStorage.getItem(PERSISTENT_KEYS.RESUME_PLAYBACK) === 'true';
}

export function setShouldResumePlayback(value) {
  if (value) {
    localStorage.setItem(PERSISTENT_KEYS.RESUME_PLAYBACK, 'true');
    return;
  }
  localStorage.removeItem(PERSISTENT_KEYS.RESUME_PLAYBACK);
}

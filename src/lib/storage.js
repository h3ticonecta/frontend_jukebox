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

const SESSION_KEYS = {
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
  sessionStorage.removeItem(SESSION_KEYS.QUEUE);
  sessionStorage.removeItem(SESSION_KEYS.CURRENT_SONG);
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

function readSessionJson(key) {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getSessionQueue() {
  const data = readSessionJson(SESSION_KEYS.QUEUE);
  return Array.isArray(data) ? data : [];
}

export function setSessionQueue(queue) {
  sessionStorage.setItem(SESSION_KEYS.QUEUE, JSON.stringify(queue || []));
}

export function getSessionCurrentSong() {
  return readSessionJson(SESSION_KEYS.CURRENT_SONG);
}

export function setSessionCurrentSong(song) {
  if (!song) {
    sessionStorage.removeItem(SESSION_KEYS.CURRENT_SONG);
    return;
  }
  sessionStorage.setItem(SESSION_KEYS.CURRENT_SONG, JSON.stringify(song));
}

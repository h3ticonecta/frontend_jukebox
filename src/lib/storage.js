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

const ADMIN_KEYS = {
  TOKEN: 'jukebox_admin_token',
  USER: 'jukebox_admin_user',
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

export function getAdminToken() {
  const token = localStorage.getItem(ADMIN_KEYS.TOKEN);
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  return token;
}

export function setAdminSession({ token, username }) {
  if (!token || token === 'undefined' || token === 'null') {
    throw new Error('Token do administrador não recebido do servidor.');
  }
  localStorage.setItem(ADMIN_KEYS.TOKEN, token);
  localStorage.setItem(ADMIN_KEYS.USER, username || '');
}

export function getAdminUsername() {
  return localStorage.getItem(ADMIN_KEYS.USER) || '';
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_KEYS.TOKEN);
  localStorage.removeItem(ADMIN_KEYS.USER);
}

export function getMaquinaTeclas() {
  return getMaquinaInfo()?.teclas || [];
}

export function getMaquinaConfigUpdatedAt() {
  const value = getMaquinaInfo()?.config_updated_at;
  return value == null || value === '' ? null : String(value);
}

export function getComportamentoVolume() {
  return getMaquinaInfo()?.comportamento_volume || null;
}

export function updateComportamentoVolume(comportamento_volume) {
  patchMaquinaInfo({ comportamento_volume });
}

export function updateMaquinaTeclas(teclas) {
  const token = getMaquinaToken();
  const info = getMaquinaInfo() || {};
  if (!token) return;
  setMaquinaSession({ token, ...info, teclas });
}

export function patchMaquinaInfo(patch) {
  const token = getMaquinaToken();
  const info = getMaquinaInfo() || {};
  if (!token || !patch) return;
  setMaquinaSession({ token, ...info, ...patch });
}

export function updateMaquinaVolumeConfig(comportamento_volume) {
  const token = getMaquinaToken();
  if (!token) return;
  const info = getMaquinaInfo() || {};
  setMaquinaSession({ token, ...info, comportamento_volume });
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

/** Fração 0–1 por passo das teclas de volume (3%). */
export const VOLUME_STEP_DELTA = 0.03;

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

/** Cada linha da fila tem id estável — permite a mesma música várias vezes. */
export function normalizePersistedQueue(queue) {
  if (!Array.isArray(queue)) return [];
  return queue.map((item, index) => {
    if (!item || typeof item !== 'object') return item;
    if (item.queueEntryId) return item;
    const base = trackIdentity(item) || 'track';
    return { ...item, queueEntryId: `${base}-slot-${index}` };
  });
}

export function ensureQueueEntryId(track, index = 0) {
  if (!track || typeof track !== 'object') return track;
  if (track.queueEntryId) return track;
  const base = trackIdentity(track) || 'track';
  return {
    ...track,
    queueEntryId: `${base}-${Date.now().toString(36)}-${index}`,
  };
}

export function queueItemsMatch(a, b) {
  if (!a || !b) return false;
  if (a.queueEntryId && b.queueEntryId) return a.queueEntryId === b.queueEntryId;
  return a === b;
}

export function removeFirstQueueMatch(items, target) {
  let removed = false;
  return items.filter((item) => {
    if (removed) return true;
    if (queueItemsMatch(item, target)) {
      removed = true;
      return false;
    }
    if (!target.queueEntryId && !item.queueEntryId && target.id && item.id === target.id) {
      removed = true;
      return false;
    }
    return true;
  });
}

export function promoteQueueItemToFront(items, track) {
  const playing = { ...track, playbackStarted: true };
  let idx = track.queueEntryId
    ? items.findIndex((item) => item.queueEntryId === track.queueEntryId)
    : -1;
  if (idx < 0 && track.queueEntryId) {
    return [playing, ...items];
  }
  if (idx < 0 && track.id) {
    idx = items.findIndex((item) => item.id === track.id && !item.queueEntryId);
    if (idx < 0) {
      idx = items.findIndex((item) => item.id === track.id);
    }
  }
  if (idx < 0) return [playing, ...items];
  const next = [...items];
  next[idx] = { ...next[idx], ...playing };
  const [head] = next.splice(idx, 1);
  return [head, ...next];
}

export function getSessionQueue() {
  migrateSessionKeyToLocal(PERSISTENT_KEYS.QUEUE);
  const data = readJson(localStorage, PERSISTENT_KEYS.QUEUE);
  return normalizePersistedQueue(Array.isArray(data) ? data : []);
}

/** Fila persistida com a faixa em reprodução sempre na posição 0 (se existir). */
export function getPersistedQueue() {
  let queue = getSessionQueue();
  const savedCurrent = getSessionCurrentSong();
  if (!savedCurrent?.media_url) {
    return queue;
  }

  let existingIndex = -1;
  if (savedCurrent.queueEntryId) {
    existingIndex = queue.findIndex((item) => item.queueEntryId === savedCurrent.queueEntryId);
  }
  if (existingIndex === -1) {
    const currentId = trackIdentity(savedCurrent);
    existingIndex = queue.findIndex((item) => trackIdentity(item) === currentId);
  }

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
  const items = normalizePersistedQueue(queue || []);
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

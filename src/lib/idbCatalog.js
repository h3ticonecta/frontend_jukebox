const DB_NAME = 'jukebox_catalog';
const DB_VERSION = 1;
const STORE_GENRES = 'genres';
const STORE_ALBUMS = 'albums';
const STORE_TRACKS = 'tracks';

const GENRES_KEY = 'Musicas/';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponível'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_GENRES)) {
        db.createObjectStore(STORE_GENRES);
      }
      if (!db.objectStoreNames.contains(STORE_ALBUMS)) {
        db.createObjectStore(STORE_ALBUMS);
      }
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function withStore(storeName, mode, fn) {
  const db = await openDb();
  try {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const resultPromise = Promise.resolve(fn(store));
    const [result] = await Promise.all([resultPromise, txDone(tx)]);
    return result;
  } finally {
    db.close();
  }
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGetGenres() {
  try {
    return await withStore(STORE_GENRES, 'readonly', (store) => requestToPromise(store.get(GENRES_KEY)));
  } catch {
    return null;
  }
}

export async function idbSetGenres(genres) {
  try {
    await withStore(STORE_GENRES, 'readwrite', (store) => {
      store.put({ genres, fetchedAt: Date.now() }, GENRES_KEY);
    });
  } catch {
    // Quota / private mode
  }
}

export async function idbGetAlbums(genrePath) {
  if (!genrePath) return null;
  try {
    return await withStore(STORE_ALBUMS, 'readonly', (store) => requestToPromise(store.get(genrePath)));
  } catch {
    return null;
  }
}

export async function idbSetAlbums(genrePath, entry) {
  if (!genrePath) return;
  try {
    await withStore(STORE_ALBUMS, 'readwrite', (store) => {
      store.put({ ...entry, fetchedAt: Date.now() }, genrePath);
    });
  } catch {
    // Quota / private mode
  }
}

export async function idbGetAllAlbums() {
  try {
    return await withStore(STORE_ALBUMS, 'readonly', (store) => {
      const keysReq = store.getAllKeys();
      const valuesReq = store.getAll();
      return Promise.all([requestToPromise(keysReq), requestToPromise(valuesReq)]).then(
        ([keys, values]) => keys.map((key, index) => [key, values[index]])
      );
    });
  } catch {
    return [];
  }
}

export async function idbGetTracks(albumPath) {
  if (!albumPath) return null;
  try {
    const row = await withStore(STORE_TRACKS, 'readonly', (store) => requestToPromise(store.get(albumPath)));
    return row?.tracks ?? null;
  } catch {
    return null;
  }
}

export async function idbGetAllTracks() {
  try {
    return await withStore(STORE_TRACKS, 'readonly', (store) => {
      const keysReq = store.getAllKeys();
      const valuesReq = store.getAll();
      return Promise.all([requestToPromise(keysReq), requestToPromise(valuesReq)]).then(
        ([keys, values]) => keys.map((key, index) => [key, values[index]?.tracks ?? []])
      );
    });
  } catch {
    return [];
  }
}

export async function idbSetTracks(albumPath, tracks) {
  if (!albumPath) return;
  try {
    await withStore(STORE_TRACKS, 'readwrite', (store) => {
      store.put({ tracks, fetchedAt: Date.now() }, albumPath);
    });
  } catch {
    // Quota / private mode
  }
}

export async function idbClearCatalog() {
  try {
    const db = await openDb();
    try {
      const tx = db.transaction([STORE_GENRES, STORE_ALBUMS, STORE_TRACKS], 'readwrite');
      tx.objectStore(STORE_GENRES).clear();
      tx.objectStore(STORE_ALBUMS).clear();
      tx.objectStore(STORE_TRACKS).clear();
      await txDone(tx);
    } finally {
      db.close();
    }
  } catch {
    // ignore
  }
}

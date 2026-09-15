import { MUSIC_ROOT_PREFIX } from '../api/config';
import { fetchMusicas, getTracksFromResponse } from '../api/musicas';
import { isPrefetchableCoverUrl } from './utils';

const COVER_BATCH_SIZE = 8;
const FETCH_RETRIES = 3;
const RETRY_BASE_MS = 600;
const ALBUM_REQUEST_DELAY_MS = 50;

function isAbortError(error) {
  return error?.name === 'AbortError';
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function collectCoverUrls(target, url) {
  if (isPrefetchableCoverUrl(url)) target.add(url);
}

async function fetchMusicasWithRetry(token, options, { retries = FETCH_RETRIES } = {}) {
  let lastError;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    if (options.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      return await fetchMusicas(token, options);
    } catch (error) {
      if (isAbortError(error)) throw error;
      lastError = error;
      if (attempt < retries - 1) {
        await delay(RETRY_BASE_MS * (attempt + 1));
      }
    }
  }

  throw lastError;
}

async function prefetchCoverBatch(urls, { signal, onItemDone }) {
  await Promise.all(
    urls.map(async (url) => {
      if (signal?.aborted) return;
      try {
        await fetch(url, { mode: 'cors', credentials: 'omit', signal });
      } catch (error) {
        if (!isAbortError(error)) {
          // Rede / CORS — segue com as demais capas
        }
      } finally {
        onItemDone?.();
      }
    })
  );
}

export async function runCatalogPrefetch({
  token,
  cache,
  signal,
  onProgress,
  mapFolder,
  mapTrack,
  parseAlbumsPayload,
}) {
  if (!token || !cache) {
    throw new Error('Sessão inválida para preparar o cache.');
  }

  const coverUrls = new Set();
  const failures = {
    genres: 0,
    tracks: 0,
  };

  const report = (phase, current, total, label) => {
    onProgress?.({ phase, current, total, label });
  };

  report('genres', 0, 1, 'SUCESSOS');

  const rootData = await fetchMusicasWithRetry(token, { prefix: MUSIC_ROOT_PREFIX, signal });
  const genres = (rootData?.folders || []).map(mapFolder);
  cache.setGenres(genres);
  genres.forEach((genre) => collectCoverUrls(coverUrls, genre.cover));
  report('genres', 1, 1, 'SUCESSOS');

  const albumPaths = [];
  let genresLoaded = 0;

  for (let genreIndex = 0; genreIndex < genres.length; genreIndex += 1) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const genre = genres[genreIndex];
    report('albums', genreIndex, genres.length, genre.name);

    try {
      const data = await fetchMusicasWithRetry(token, { prefix: genre.path, signal });
      const state = parseAlbumsPayload(data, genre);
      cache.setAlbums(genre.path, state);
      state.albums.forEach((album) => collectCoverUrls(coverUrls, album.cover));
      genresLoaded += 1;

      if (state.tracks.length > 0 && state.selectedAlbum?.path) {
        cache.setTracks(state.selectedAlbum.path, state.tracks);
      } else {
        state.albums.forEach((album) => {
          if (album.path) albumPaths.push(album);
        });
      }
    } catch (error) {
      if (isAbortError(error)) throw error;
      failures.genres += 1;
    }
  }

  report('albums', genres.length, genres.length, 'Artistas');

  let tracksLoaded = 0;

  for (let albumIndex = 0; albumIndex < albumPaths.length; albumIndex += 1) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const album = albumPaths[albumIndex];
    report('tracks', albumIndex, albumPaths.length, album.name);

    try {
      const data = await fetchMusicasWithRetry(token, { prefix: album.path, signal });
      const tracks = getTracksFromResponse(data).map(mapTrack);
      cache.setTracks(album.path, tracks);
      tracksLoaded += 1;
    } catch (error) {
      if (isAbortError(error)) throw error;
      failures.tracks += 1;
    }

    if (albumIndex < albumPaths.length - 1) {
      await delay(ALBUM_REQUEST_DELAY_MS);
    }
  }

  if (albumPaths.length > 0) {
    report('tracks', albumPaths.length, albumPaths.length, 'Músicas');
  }

  const covers = [...coverUrls];
  let coversDone = 0;
  report('covers', 0, covers.length, 'Capas');

  for (let index = 0; index < covers.length; index += COVER_BATCH_SIZE) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const batch = covers.slice(index, index + COVER_BATCH_SIZE);
    await prefetchCoverBatch(batch, {
      signal,
      onItemDone: () => {
        coversDone += 1;
        report('covers', coversDone, covers.length, 'Capas');
      },
    });
  }

  return {
    genres: genres.length,
    genresLoaded,
    albums: albumPaths.length,
    tracksLoaded,
    tracksTotal: albumPaths.length,
    covers: covers.length,
    failures,
    partial:
      failures.genres > 0 ||
      failures.tracks > 0 ||
      genresLoaded < genres.length ||
      tracksLoaded < albumPaths.length,
  };
}

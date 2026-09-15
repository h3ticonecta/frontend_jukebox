import { MUSIC_ROOT_PREFIX } from '../api/config';
import { fetchMusicas, getTracksFromResponse } from '../api/musicas';
import { isPrefetchableCoverUrl } from './utils';

const COVER_BATCH_SIZE = 8;

function isAbortError(error) {
  return error?.name === 'AbortError';
}

function collectCoverUrls(target, url) {
  if (isPrefetchableCoverUrl(url)) target.add(url);
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

  const report = (phase, current, total, label) => {
    onProgress?.({ phase, current, total, label });
  };

  report('genres', 0, 1, 'SUCESSOS');

  const rootData = await fetchMusicas(token, { prefix: MUSIC_ROOT_PREFIX, signal });
  const genres = (rootData?.folders || []).map(mapFolder);
  cache.setGenres(genres);
  genres.forEach((genre) => collectCoverUrls(coverUrls, genre.cover));
  report('genres', 1, 1, 'SUCESSOS');

  const albumPaths = [];

  for (let genreIndex = 0; genreIndex < genres.length; genreIndex += 1) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const genre = genres[genreIndex];
    report('albums', genreIndex, genres.length, genre.name);

    const data = await fetchMusicas(token, { prefix: genre.path, signal });
    const state = parseAlbumsPayload(data, genre);
    cache.setAlbums(genre.path, state);
    state.albums.forEach((album) => collectCoverUrls(coverUrls, album.cover));

    if (state.tracks.length > 0 && state.selectedAlbum?.path) {
      cache.setTracks(state.selectedAlbum.path, state.tracks);
    } else {
      state.albums.forEach((album) => {
        if (album.path) albumPaths.push(album);
      });
    }
  }

  report('albums', genres.length, genres.length, 'Artistas');

  for (let albumIndex = 0; albumIndex < albumPaths.length; albumIndex += 1) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const album = albumPaths[albumIndex];
    report('tracks', albumIndex, albumPaths.length, album.name);

    const data = await fetchMusicas(token, { prefix: album.path, signal });
    const tracks = getTracksFromResponse(data).map(mapTrack);
    cache.setTracks(album.path, tracks);
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
    albums: albumPaths.length,
    covers: covers.length,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MUSIC_ROOT_PREFIX } from '../api/config';
import { fetchMusicas, getFoldersFromResponse, getTracksFromResponse } from '../api/musicas';
import { buildAlbumsStateFromApi, mapFolderFromApi, mapTrackFromApi } from '../lib/library';
import { createLibraryCache } from '../lib/libraryCache';
import {
  getLastAlbumPath,
  getLastGenrePath,
  getStoredNeedsSync,
  setLastAlbumPath,
  setLastGenrePath,
  setStoredNeedsSync,
} from '../lib/storage';

const GRADIENTS = [
  'from-amber-500 to-orange-700',
  'from-yellow-400 to-amber-600',
  'from-emerald-500 to-green-700',
  'from-green-500 to-teal-600',
  'from-purple-600 to-blue-500',
  'from-pink-500 to-violet-600',
  'from-rose-400 to-pink-600',
  'from-indigo-500 to-purple-700',
];

const EMPTY_LOADING = { genres: false, albums: false, tracks: false };

function mapFolder(folder, index) {
  return mapFolderFromApi(folder, index, GRADIENTS);
}

function mapTrack(track, index) {
  return mapTrackFromApi(track, index);
}

function isAbortError(error) {
  return error?.name === 'AbortError';
}

function parseAlbumsPayload(data, genre) {
  const folders = getFoldersFromResponse(data);
  const folderTracks = getTracksFromResponse(data);

  return buildAlbumsStateFromApi(
    { ...data, folders, musicas: folderTracks },
    genre,
    {
      mapFolder: (folder, index) => mapFolder(folder, index),
      mapTrack: (track, index) => mapTrack(track, index),
    }
  );
}

function preserveSelectedAlbum(state, albumPath, cache) {
  if (!albumPath) return state;
  const album = state.albums.find((item) => item.path === albumPath);
  if (!album) return state;

  const tracks =
    state.tracks.length > 0 ? state.tracks : cache.getTracks(albumPath) || [];

  return {
    ...state,
    selectedAlbum: album,
    tracks,
  };
}

function pickInitialGenre(mapped, current) {
  if (current) {
    const stillThere = mapped.find((genre) => genre.path === current.path);
    if (stillThere) return stillThere;
  }

  const savedPath = getLastGenrePath();
  return mapped.find((genre) => genre.path === savedPath) || mapped[0] || null;
}

export function useLibrary(token) {
  const [genres, setGenres] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreSelectionKey, setGenreSelectionKey] = useState(0);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [needsSync, setNeedsSync] = useState(() => getStoredNeedsSync());
  const [loading, setLoading] = useState(EMPTY_LOADING);
  const [error, setError] = useState(null);

  const cacheRef = useRef(createLibraryCache());

  const abortControllersRef = useRef({
    genres: null,
    albums: null,
    tracks: null,
  });
  const loadSeqRef = useRef({
    genres: 0,
    albums: 0,
    tracks: 0,
  });
  const selectedGenrePathRef = useRef(null);
  const selectedAlbumPathRef = useRef(null);

  const isLoading = useMemo(
    () => loading.genres || loading.albums || loading.tracks,
    [loading]
  );

  const applyAlbumsState = useCallback((state) => {
    setAlbums(state.albums);
    setTracks(state.tracks);
    setSelectedAlbum(state.selectedAlbum);
    selectedAlbumPathRef.current = state.selectedAlbum?.path ?? null;
    if (state.selectedAlbum?.path) {
      setLastAlbumPath(state.selectedAlbum.path);
    }
  }, []);

  const loadPrefix = useCallback(
    async (prefix, scope, { silent = false } = {}) => {
      if (!token) return null;

      abortControllersRef.current[scope]?.abort();
      const controller = new AbortController();
      abortControllersRef.current[scope] = controller;
      const seq = ++loadSeqRef.current[scope];

      if (!silent) {
        setLoading((current) => ({ ...current, [scope]: true }));
      }
      setError(null);

      try {
        const data = await fetchMusicas(token, { prefix, signal: controller.signal });
        if (controller.signal.aborted || seq !== loadSeqRef.current[scope]) return null;
        const nextNeedsSync = Boolean(data?.needs_sync);
        setNeedsSync(nextNeedsSync);
        setStoredNeedsSync(nextNeedsSync);
        return { data, seq };
      } catch (err) {
        if (isAbortError(err) || seq !== loadSeqRef.current[scope]) return null;
        if (!silent) {
          setError(err.message || 'Erro ao carregar biblioteca');
        }
        return null;
      } finally {
        if (!silent && !controller.signal.aborted && seq === loadSeqRef.current[scope]) {
          setLoading((current) => ({ ...current, [scope]: false }));
        }
      }
    },
    [token]
  );

  const loadGenres = useCallback(async () => {
    const cachedGenres = cacheRef.current.getGenres();
    const result = await loadPrefix(MUSIC_ROOT_PREFIX, 'genres', {
      silent: Boolean(cachedGenres?.length),
    });
    if (!result) return;

    const folders = getFoldersFromResponse(result.data);
    const mapped = folders.map(mapFolder);
    cacheRef.current.setGenres(mapped);
    setGenres(mapped);

    if (mapped.length > 0) {
      setSelectedGenre((current) => {
        const next = pickInitialGenre(mapped, current);
        selectedGenrePathRef.current = next?.path ?? null;
        if (next?.path) setLastGenrePath(next.path);
        return next;
      });
    }
  }, [loadPrefix]);

  const loadAlbums = useCallback(
    async (genre) => {
      const genrePath = genre?.path;
      if (!genrePath) {
        setAlbums([]);
        return;
      }

      const cached = cacheRef.current.getAlbums(genrePath);
      const silent = Boolean(cached);

      if (cached) {
        applyAlbumsState(preserveSelectedAlbum(cached, selectedAlbumPathRef.current || getLastAlbumPath(), cacheRef.current));
      }

      const result = await loadPrefix(genrePath, 'albums', { silent });
      if (!result || selectedGenrePathRef.current !== genrePath) return;

      const state = preserveSelectedAlbum(
        parseAlbumsPayload(result.data, genre),
        selectedAlbumPathRef.current || getLastAlbumPath(),
        cacheRef.current
      );
      cacheRef.current.setAlbums(genrePath, state);
      applyAlbumsState(state);

      if (state.selectedAlbum?.path && !state.tracks.length) {
        const cachedTracks = cacheRef.current.getTracks(state.selectedAlbum.path);
        if (cachedTracks) {
          setTracks(cachedTracks);
        }
      }
    },
    [loadPrefix, applyAlbumsState]
  );

  const loadAlbumTracks = useCallback(
    async (album) => {
      const albumPath = album?.path;
      if (!albumPath) {
        setTracks([]);
        return;
      }

      const cachedTracks = cacheRef.current.getTracks(albumPath);
      const silent = Boolean(cachedTracks);

      if (cachedTracks) {
        setTracks(cachedTracks);
        setSelectedAlbum(album);
      }

      const result = await loadPrefix(albumPath, 'tracks', { silent });
      if (!result || selectedAlbumPathRef.current !== albumPath) return;

      const folderTracks = getTracksFromResponse(result.data).map(mapTrack);
      cacheRef.current.setTracks(albumPath, folderTracks);
      setTracks(folderTracks);
      setSelectedAlbum(album);
    },
    [loadPrefix]
  );

  const refreshLibrary = useCallback(async () => {
    await cacheRef.current.clear({ persist: true });
    await loadGenres();
    if (selectedGenre) {
      await loadAlbums(selectedGenre);
      if (selectedAlbum) {
        await loadAlbumTracks(selectedAlbum);
      }
    }
  }, [loadGenres, loadAlbums, loadAlbumTracks, selectedGenre, selectedAlbum]);

  useEffect(() => {
    if (!token) {
      cacheRef.current.clear({ persist: true });
      return undefined;
    }

    let cancelled = false;

    const boot = async () => {
      await cacheRef.current.hydrate();
      if (cancelled) return;

      const cachedGenres = cacheRef.current.getGenres();
      if (cachedGenres?.length) {
        setGenres(cachedGenres);
        const genre = pickInitialGenre(cachedGenres, null);
        if (genre) {
          selectedGenrePathRef.current = genre.path;
          setSelectedGenre(genre);
          setLastGenrePath(genre.path);

          const cachedAlbums = cacheRef.current.getAlbums(genre.path);
          if (cachedAlbums) {
            const albumPath = getLastAlbumPath();
            selectedAlbumPathRef.current = albumPath;
            applyAlbumsState(preserveSelectedAlbum(cachedAlbums, albumPath, cacheRef.current));
          }
        }
      }

      loadGenres();
    };

    boot();

    return () => {
      cancelled = true;
      abortControllersRef.current.genres?.abort();
    };
  }, [token, loadGenres, applyAlbumsState]);

  useEffect(() => {
    if (token && selectedGenre?.path) {
      loadAlbums(selectedGenre);
    }
  }, [token, selectedGenre?.path, genreSelectionKey, loadAlbums]);

  const selectGenre = useCallback(
    (genre) => {
      if (!genre?.path) return;

      selectedGenrePathRef.current = genre.path;
      selectedAlbumPathRef.current = null;
      setSelectedGenre(genre);
      setSelectedTrack(null);
      setLastGenrePath(genre.path);
      setLastAlbumPath(null);

      const cached = cacheRef.current.getAlbums(genre.path);
      if (cached) {
        applyAlbumsState(cached);
      } else {
        setSelectedAlbum(null);
        setTracks([]);
        setAlbums([]);
      }

      setGenreSelectionKey((key) => key + 1);
    },
    [applyAlbumsState]
  );

  const selectAlbum = useCallback(
    (album) => {
      if (!album?.path) return;

      selectedAlbumPathRef.current = album.path;
      setSelectedAlbum(album);
      setSelectedTrack(null);
      setLastAlbumPath(album.path);

      const cachedTracks = cacheRef.current.getTracks(album.path);
      if (cachedTracks) {
        setTracks(cachedTracks);
      } else {
        setTracks([]);
      }

      loadAlbumTracks(album);
    },
    [loadAlbumTracks]
  );

  const navigateGenre = useCallback(
    (delta) => {
      if (!genres.length) return;
      const currentIndex = genres.findIndex((genre) => genre.id === selectedGenre?.id);
      const start = currentIndex < 0 ? 0 : currentIndex;
      const nextIndex = Math.max(0, Math.min(genres.length - 1, start + delta));
      if (genres[nextIndex]) {
        selectGenre(genres[nextIndex]);
      }
    },
    [genres, selectedGenre, selectGenre]
  );

  const navigateAlbum = useCallback(
    (delta) => {
      if (!albums.length) return;
      const currentIndex = albums.findIndex((album) => album.id === selectedAlbum?.id);
      const start = currentIndex < 0 ? 0 : currentIndex;
      const nextIndex = Math.max(0, Math.min(albums.length - 1, start + delta));
      if (albums[nextIndex]) {
        selectAlbum(albums[nextIndex]);
      }
    },
    [albums, selectedAlbum, selectAlbum]
  );

  const navigateTrack = useCallback(
    (delta) => {
      if (!tracks.length) return null;
      const currentIndex = tracks.findIndex((track) => track.id === selectedTrack?.id);
      const start = currentIndex < 0 ? 0 : currentIndex;
      const nextIndex = Math.max(0, Math.min(tracks.length - 1, start + delta));
      const nextTrack = tracks[nextIndex];
      if (nextTrack) {
        setSelectedTrack(nextTrack);
      }
      return nextTrack || null;
    },
    [tracks, selectedTrack]
  );

  const selectTrack = useCallback((track) => {
    setSelectedTrack(track);
  }, []);

  return {
    genres,
    albums,
    tracks,
    selectedGenre,
    selectedAlbum,
    selectedTrack,
    needsSync,
    loading,
    isLoading,
    error,
    selectGenre,
    selectAlbum,
    selectTrack,
    navigateGenre,
    navigateAlbum,
    navigateTrack,
    refreshLibrary,
    setError,
  };
}

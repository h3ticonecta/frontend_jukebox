import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MUSIC_ROOT_PREFIX } from '../api/config';
import { fetchMusicas, getFoldersFromResponse, getTracksFromResponse } from '../api/musicas';
import { formatFolderCountLabel, mapFolderFromApi, mapTrackFromApi } from '../lib/library';

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

export function useLibrary(token) {
  const [genres, setGenres] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreSelectionKey, setGenreSelectionKey] = useState(0);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [needsSync, setNeedsSync] = useState(false);
  const [loading, setLoading] = useState(EMPTY_LOADING);
  const [error, setError] = useState(null);

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

  const loadPrefix = useCallback(
    async (prefix, scope) => {
      if (!token) return null;

      abortControllersRef.current[scope]?.abort();
      const controller = new AbortController();
      abortControllersRef.current[scope] = controller;
      const seq = ++loadSeqRef.current[scope];

      setLoading((current) => ({ ...current, [scope]: true }));
      setError(null);

      try {
        const data = await fetchMusicas(token, { prefix, signal: controller.signal });
        if (controller.signal.aborted || seq !== loadSeqRef.current[scope]) return null;
        setNeedsSync(Boolean(data?.needs_sync));
        return { data, seq };
      } catch (err) {
        if (isAbortError(err) || seq !== loadSeqRef.current[scope]) return null;
        setError(err.message || 'Erro ao carregar biblioteca');
        return null;
      } finally {
        if (!controller.signal.aborted && seq === loadSeqRef.current[scope]) {
          setLoading((current) => ({ ...current, [scope]: false }));
        }
      }
    },
    [token]
  );

  const loadGenres = useCallback(async () => {
    const result = await loadPrefix(MUSIC_ROOT_PREFIX, 'genres');
    if (!result) return;

    const folders = getFoldersFromResponse(result.data);
    const mapped = folders.map(mapFolder);
    setGenres(mapped);

    if (mapped.length > 0) {
      setSelectedGenre((current) => {
        if (current) {
          selectedGenrePathRef.current = current.path;
          return current;
        }
        selectedGenrePathRef.current = mapped[0].path;
        return mapped[0];
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

      const result = await loadPrefix(genrePath, 'albums');
      if (!result || selectedGenrePathRef.current !== genrePath) return;

      const { data } = result;
      const folders = getFoldersFromResponse(data);
      const folderTracks = getTracksFromResponse(data);

      if (folders.length > 0) {
        setAlbums(folders.map(mapFolder));
        setTracks([]);
        setSelectedAlbum(null);
      } else if (folderTracks.length > 0) {
        const filesCount = data.files_count ?? folderTracks.length;
        const albumEntry = {
          id: genre.path,
          path: genre.path,
          name: genre.name,
          cover: data.cover_url || genre.cover,
          coverColor: genre.coverColor,
          subfoldersCount: 0,
          filesCount,
          countLabel: formatFolderCountLabel({ subfoldersCount: 0, filesCount }),
        };
        setAlbums([albumEntry]);
        setSelectedAlbum(albumEntry);
        selectedAlbumPathRef.current = albumEntry.path;
        setTracks(folderTracks.map(mapTrack));
      } else {
        setAlbums([]);
        setTracks([]);
        setSelectedAlbum(null);
        selectedAlbumPathRef.current = null;
      }
    },
    [loadPrefix]
  );

  const loadAlbumTracks = useCallback(
    async (album) => {
      const albumPath = album?.path;
      if (!albumPath) {
        setTracks([]);
        return;
      }

      const result = await loadPrefix(albumPath, 'tracks');
      if (!result || selectedAlbumPathRef.current !== albumPath) return;

      const folderTracks = getTracksFromResponse(result.data);
      setTracks(folderTracks.map(mapTrack));
      setSelectedAlbum(album);
    },
    [loadPrefix]
  );

  const refreshLibrary = useCallback(async () => {
    await loadGenres();
    if (selectedGenre) {
      await loadAlbums(selectedGenre);
      if (selectedAlbum) {
        await loadAlbumTracks(selectedAlbum);
      }
    }
  }, [loadGenres, loadAlbums, loadAlbumTracks, selectedGenre, selectedAlbum]);

  useEffect(() => {
    if (token) {
      loadGenres();
    }

    return () => {
      abortControllersRef.current.genres?.abort();
    };
  }, [token, loadGenres]);

  useEffect(() => {
    if (token && selectedGenre?.path) {
      loadAlbums(selectedGenre);
    }
  }, [token, selectedGenre?.path, genreSelectionKey, loadAlbums]);

  const selectGenre = useCallback((genre) => {
    if (!genre?.path) return;

    selectedGenrePathRef.current = genre.path;
    selectedAlbumPathRef.current = null;
    setSelectedGenre(genre);
    setSelectedAlbum(null);
    setTracks([]);
    setAlbums([]);
    setGenreSelectionKey((key) => key + 1);
  }, []);

  const selectAlbum = useCallback(
    (album) => {
      if (!album?.path) return;

      selectedAlbumPathRef.current = album.path;
      setSelectedAlbum(album);
      setTracks([]);
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

  return {
    genres,
    albums,
    tracks,
    selectedGenre,
    selectedAlbum,
    needsSync,
    loading,
    isLoading,
    error,
    selectGenre,
    selectAlbum,
    navigateGenre,
    navigateAlbum,
    refreshLibrary,
    setError,
  };
}

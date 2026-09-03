import { useCallback, useEffect, useState } from 'react';
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

function mapFolder(folder, index) {
  return mapFolderFromApi(folder, index, GRADIENTS);
}

function mapTrack(track, index) {
  return mapTrackFromApi(track, index);
}

export function useLibrary(token) {
  const [genres, setGenres] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [needsSync, setNeedsSync] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPrefix = useCallback(
    async (prefix) => {
      if (!token) return null;
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchMusicas(token, { prefix });
        setNeedsSync(Boolean(data?.needs_sync));
        return data;
      } catch (err) {
        setError(err.message || 'Erro ao carregar biblioteca');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  const loadGenres = useCallback(async () => {
    const data = await loadPrefix(MUSIC_ROOT_PREFIX);
    if (!data) return;
    const folders = getFoldersFromResponse(data);
    const mapped = folders.map(mapFolder);
    setGenres(mapped);
    if (mapped.length > 0) {
      setSelectedGenre((current) => current || mapped[0]);
    }
  }, [loadPrefix]);

  const loadAlbums = useCallback(
    async (genre) => {
      if (!genre?.path) {
        setAlbums([]);
        return;
      }
      const data = await loadPrefix(genre.path);
      if (!data) return;

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
        setTracks(folderTracks.map(mapTrack));
      } else {
        setAlbums([]);
        setTracks([]);
        setSelectedAlbum(null);
      }
    },
    [loadPrefix]
  );

  const loadAlbumTracks = useCallback(
    async (album) => {
      if (!album?.path) {
        setTracks([]);
        return;
      }
      const data = await loadPrefix(album.path);
      if (!data) return;
      const folderTracks = getTracksFromResponse(data);
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
  }, [token, loadGenres]);

  useEffect(() => {
    if (token && selectedGenre) {
      loadAlbums(selectedGenre);
    }
  }, [token, selectedGenre, loadAlbums]);

  const selectGenre = useCallback((genre) => {
    setSelectedGenre(genre);
    setSelectedAlbum(null);
    setTracks([]);
  }, []);

  const selectAlbum = useCallback(
    (album) => {
      setSelectedAlbum(album);
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

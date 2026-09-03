import { useCallback, useEffect, useState } from 'react';
import { MUSIC_ROOT_PREFIX } from '../api/config';
import { fetchMusicas, getFoldersFromResponse, getTracksFromResponse } from '../api/musicas';

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
  return {
    id: folder.path,
    path: folder.path,
    name: folder.name,
    cover: folder.cover_url || folder.cover?.media_url || null,
    coverColor: GRADIENTS[index % GRADIENTS.length],
    songsCount: folder.files_count || 0,
  };
}

function mapTrack(track, index) {
  return {
    id: track.key,
    key: track.key,
    number: String(index + 1).padStart(2, '0'),
    title: track.title || track.name,
    duration: 0,
    media_url: track.media_url || track.audio_url,
    cover_url: track.cover_url || track.cover?.media_url || null,
    pasta: track.folder_path || '',
    media_type: track.media_type || 'audio',
    artist: track.folder_path?.split('/').filter(Boolean).slice(-1)[0] || '',
  };
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
        setAlbums([
          {
            id: genre.path,
            path: genre.path,
            name: genre.name,
            album: genre.name,
            cover: data.cover_url || genre.cover,
            coverColor: genre.coverColor,
            songsCount: folderTracks.length,
          },
        ]);
        setSelectedAlbum({
          id: genre.path,
          path: genre.path,
          name: genre.name,
          album: genre.name,
          cover: data.cover_url || genre.cover,
          coverColor: genre.coverColor,
          songsCount: folderTracks.length,
        });
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
    refreshLibrary,
    setError,
  };
}

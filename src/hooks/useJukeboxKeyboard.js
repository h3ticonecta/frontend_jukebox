import { useCallback, useEffect, useState } from 'react';

const ALBUM_COLS = 3;

function getAlbumGridPosition(index, cols = ALBUM_COLS) {
  return { row: Math.floor(index / cols), col: index % cols };
}

function getAlbumIndexAt(row, col, albums, cols = ALBUM_COLS) {
  const rowStart = row * cols;
  if (rowStart >= albums.length || row < 0) return null;
  const itemsInRow = Math.min(cols, albums.length - rowStart);
  if (col < 0 || col >= itemsInRow) return null;
  return rowStart + col;
}

export function useJukeboxKeyboard({
  library,
  onAddToQueue,
  onHighlightQueue,
  onHits,
  onCredit,
  onSkip,
  onVolume,
  onCancel,
}) {
  const [focusZone, setFocusZone] = useState('genres');

  const focusGenre = useCallback(
    (genre) => {
      if (!genre) return;
      library.selectGenre(genre);
      setFocusZone('genres');
    },
    [library]
  );

  const focusAlbum = useCallback(
    (album) => {
      if (!album) return;
      library.selectAlbum(album);
      setFocusZone('albums');
    },
    [library]
  );

  const focusTrack = useCallback(
    (track) => {
      if (!track) return;
      library.selectTrack(track);
      setFocusZone('tracks');
    },
    [library]
  );

  const getCurrentAlbumIndex = useCallback(() => {
    const idx = library.albums.findIndex((album) => album.id === library.selectedAlbum?.id);
    return idx < 0 ? 0 : idx;
  }, [library.albums, library.selectedAlbum?.id]);

  const moveGenreHorizontal = useCallback(
    (delta) => {
      const { genres, selectedGenre } = library;
      if (!genres.length) return;
      const currentIndex = genres.findIndex((genre) => genre.id === selectedGenre?.id);
      const start = currentIndex < 0 ? 0 : currentIndex;
      const nextIndex = (start + delta + genres.length) % genres.length;
      focusGenre(genres[nextIndex]);
    },
    [library, focusGenre]
  );

  const enterAlbumsFromGenres = useCallback(() => {
    if (!library.albums.length) return;
    focusAlbum(library.albums[0]);
  }, [library.albums, focusAlbum]);

  const enterGenresFromAlbums = useCallback(() => {
    if (library.selectedGenre) {
      focusGenre(library.selectedGenre);
    } else if (library.genres.length > 0) {
      focusGenre(library.genres[0]);
    }
  }, [library.selectedGenre, library.genres, focusGenre]);

  const moveAlbumHorizontal = useCallback(
    (delta) => {
      if (!library.albums.length) return;
      const idx = getCurrentAlbumIndex();
      const { row, col } = getAlbumGridPosition(idx, ALBUM_COLS);

      if (delta > 0) {
        const nextInRow = idx + 1;
        const nextRowStart = (row + 1) * ALBUM_COLS;

        if (col < ALBUM_COLS - 1 && nextInRow < library.albums.length) {
          focusAlbum(library.albums[nextInRow]);
        } else if (nextRowStart < library.albums.length) {
          focusAlbum(library.albums[nextRowStart]);
        } else {
          focusAlbum(library.albums[library.albums.length - 1]);
        }
        return;
      }

      if (col > 0) {
        focusAlbum(library.albums[idx - 1]);
        return;
      }

      if (row > 0) {
        const prevRowStart = (row - 1) * ALBUM_COLS;
        const prevRowCount = Math.min(ALBUM_COLS, library.albums.length - prevRowStart);
        focusAlbum(library.albums[prevRowStart + prevRowCount - 1]);
        return;
      }

      enterGenresFromAlbums();
    },
    [library.albums, getCurrentAlbumIndex, focusAlbum, enterGenresFromAlbums]
  );

  const moveAlbumVertical = useCallback(
    (deltaRow) => {
      if (!library.albums.length) return;
      const idx = getCurrentAlbumIndex();
      const { row, col } = getAlbumGridPosition(idx, ALBUM_COLS);
      const targetRow = row + deltaRow;

      if (deltaRow < 0) {
        if (targetRow < 0) {
          enterGenresFromAlbums();
          return;
        }

        const targetIdx = getAlbumIndexAt(targetRow, col, library.albums, ALBUM_COLS);
        if (targetIdx != null) {
          focusAlbum(library.albums[targetIdx]);
          return;
        }

        const rowStart = targetRow * ALBUM_COLS;
        const itemsInRow = Math.min(ALBUM_COLS, library.albums.length - rowStart);
        focusAlbum(library.albums[rowStart + itemsInRow - 1]);
        return;
      }

      const targetIdx = getAlbumIndexAt(targetRow, col, library.albums, ALBUM_COLS);
      if (targetIdx != null) {
        focusAlbum(library.albums[targetIdx]);
        return;
      }

      if (library.tracks.length > 0) {
        focusTrack(library.selectedTrack || library.tracks[0]);
        return;
      }

      const lastRow = Math.floor((library.albums.length - 1) / ALBUM_COLS);
      const lastRowStart = lastRow * ALBUM_COLS;
      const itemsInLastRow = library.albums.length - lastRowStart;
      focusAlbum(library.albums[lastRowStart + Math.min(col, itemsInLastRow - 1)]);
    },
    [library, getCurrentAlbumIndex, focusAlbum, focusTrack, enterGenresFromAlbums]
  );

  const moveTrack = useCallback(
    (delta) => {
      if (!library.tracks.length) return;
      const currentIndex = library.tracks.findIndex((track) => track.id === library.selectedTrack?.id);
      const start = currentIndex < 0 ? 0 : currentIndex;
      const nextIndex = Math.max(0, Math.min(library.tracks.length - 1, start + delta));
      focusTrack(library.tracks[nextIndex]);
    },
    [library, focusTrack]
  );

  const leaveTracksUp = useCallback(() => {
    if (!library.albums.length) {
      enterGenresFromAlbums();
      return;
    }

    const albumIndex = library.albums.findIndex((album) => album.id === library.selectedAlbum?.id);
    const idx = albumIndex < 0 ? 0 : albumIndex;
    focusAlbum(library.albums[idx]);
  }, [library.albums, library.selectedAlbum?.id, focusAlbum, enterGenresFromAlbums]);

  const activateFocused = useCallback(() => {
    onHighlightQueue();

    if (focusZone === 'tracks' && library.selectedTrack) {
      onAddToQueue(library.selectedTrack);
    }
  }, [focusZone, library.selectedTrack, onAddToQueue, onHighlightQueue]);

  const handleKeyboardAction = useCallback(
    (acao) => {
      switch (acao) {
        case 'cima':
          if (focusZone === 'tracks' && library.tracks.length > 0) {
            const trackIndex = library.tracks.findIndex((track) => track.id === library.selectedTrack?.id);
            if (trackIndex <= 0) {
              leaveTracksUp();
            } else {
              moveTrack(-1);
            }
          } else if (focusZone === 'albums' && library.albums.length > 0) {
            moveAlbumVertical(-1);
          }
          break;
        case 'baixo':
          if (focusZone === 'tracks' && library.tracks.length > 0) {
            moveTrack(1);
          } else if (focusZone === 'albums' && library.albums.length > 0) {
            moveAlbumVertical(1);
          } else if (focusZone === 'genres') {
            enterAlbumsFromGenres();
          }
          break;
        case 'esquerda':
          if (focusZone === 'genres') {
            moveGenreHorizontal(-1);
          } else if (focusZone === 'albums' && library.albums.length > 0) {
            moveAlbumHorizontal(-1);
          } else if (focusZone === 'tracks' && library.albums.length > 0) {
            focusAlbum(library.selectedAlbum || library.albums[0]);
          }
          break;
        case 'direita':
          if (focusZone === 'genres') {
            moveGenreHorizontal(1);
          } else if (focusZone === 'albums' && library.albums.length > 0) {
            moveAlbumHorizontal(1);
          } else if (focusZone === 'tracks' && library.albums.length > 0) {
            focusAlbum(library.selectedAlbum || library.albums[library.albums.length - 1]);
          }
          break;
        case 'credito':
          onCredit();
          break;
        case 'hits':
          setFocusZone('genres');
          onHits();
          break;
        case 'fila':
          activateFocused();
          break;
        case 'pular':
          onSkip();
          break;
        case 'vol_mais':
          onVolume(0.1);
          break;
        case 'vol_menos':
          onVolume(-0.1);
          break;
        case 'cancelar':
          onCancel();
          break;
        default:
          break;
      }
    },
    [
      focusZone,
      library,
      moveGenreHorizontal,
      moveAlbumHorizontal,
      moveAlbumVertical,
      moveTrack,
      enterAlbumsFromGenres,
      leaveTracksUp,
      focusAlbum,
      activateFocused,
      onCredit,
      onHits,
      onSkip,
      onVolume,
      onCancel,
    ]
  );

  useEffect(() => {
    if (!library.selectedAlbum?.id) return;
    const albumElement = document.querySelector(`[data-album-id="${library.selectedAlbum.id}"]`);
    if (albumElement && focusZone === 'albums') {
      albumElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [library.selectedAlbum?.id, focusZone]);

  useEffect(() => {
    if (!library.selectedTrack?.id) return;
    const trackElement = document.querySelector(`[data-track-id="${library.selectedTrack.id}"]`);
    if (trackElement && focusZone === 'tracks') {
      trackElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [library.selectedTrack?.id, focusZone]);

  const focusedGenreId = focusZone === 'genres' ? library.selectedGenre?.id : null;
  const focusedAlbumId = focusZone === 'albums' ? library.selectedAlbum?.id : null;
  const focusedTrackId = focusZone === 'tracks' ? library.selectedTrack?.id : null;

  return {
    focusZone,
    setFocusZone,
    focusedGenreId,
    focusedAlbumId,
    focusedTrackId,
    handleKeyboardAction,
  };
}

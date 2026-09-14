function stripExtension(filename) {
  if (!filename) return '';
  return filename.replace(/\.[^.]+$/, '');
}

export function getArtistFromFolderPath(folderPath) {
  if (!folderPath) return '';

  const segments = folderPath.split('/').filter(Boolean);
  if (segments[0]?.toLowerCase() === 'musicas') {
    segments.shift();
  }

  return segments[segments.length - 1] || '';
}

export function formatFolderCountLabel({ subfoldersCount = 0, filesCount = 0 } = {}) {
  if (subfoldersCount > 0) {
    return `${subfoldersCount} artista${subfoldersCount === 1 ? '' : 's'}`;
  }

  return `${filesCount} música${filesCount === 1 ? '' : 's'}`;
}

export function buildAlbumsStateFromApi(data, genre, { mapFolder, mapTrack }) {
  const folders = data?.folders || [];
  const folderTracks =
    data?.musicas || data?.musicas_list || data?.files || data?.files_list || [];

  if (folders.length > 0) {
    return {
      albums: folders.map((folder, index) => mapFolder(folder, index)),
      tracks: [],
      selectedAlbum: null,
    };
  }

  if (folderTracks.length > 0) {
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

    return {
      albums: [albumEntry],
      tracks: folderTracks.map((track, index) => mapTrack(track, index)),
      selectedAlbum: albumEntry,
    };
  }

  return {
    albums: [],
    tracks: [],
    selectedAlbum: null,
  };
}

export function mapFolderFromApi(folder, index, gradients) {
  const subfoldersCount = folder.subfolders_count ?? 0;
  const filesCount = folder.files_count ?? 0;

  return {
    id: folder.path,
    path: folder.path,
    name: folder.name,
    cover: folder.cover_url || folder.cover?.media_url || null,
    coverColor: gradients[index % gradients.length],
    subfoldersCount,
    filesCount,
    countLabel: formatFolderCountLabel({ subfoldersCount, filesCount }),
  };
}

export function mapTrackFromApi(track, index) {
  const title = track.title || stripExtension(track.name);

  const isMedia =
    track.media_type === 'audio' || track.media_type === 'video' || !track.media_type;

  return {
    id: track.key,
    key: track.key,
    number: String(index + 1).padStart(2, '0'),
    title,
    duration_seconds:
      isMedia && track.duration_seconds != null ? track.duration_seconds : null,
    media_url: track.media_url || track.audio_url,
    cover_url: track.cover_url || track.cover?.media_url || null,
    pasta: track.folder_path || '',
    folder_path: track.folder_path || '',
    media_type: track.media_type || 'audio',
    artist: getArtistFromFolderPath(track.folder_path),
  };
}

export function buildPlayerSubtitle(song, album) {
  if (!song) return '';

  const artist = song.artist || getArtistFromFolderPath(song.pasta || song.folder_path);
  const albumName = album?.name;

  if (artist && albumName && artist !== albumName) {
    return `${artist} - ${albumName}`;
  }

  return artist || albumName || '';
}

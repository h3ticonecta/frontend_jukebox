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

  return {
    id: track.key,
    key: track.key,
    number: String(index + 1).padStart(2, '0'),
    title,
    duration: 0,
    media_url: track.media_url || track.audio_url,
    cover_url: track.cover_url || track.cover?.media_url || null,
    pasta: track.folder_path || '',
    media_type: track.media_type || 'audio',
    artist: getArtistFromFolderPath(track.folder_path),
  };
}

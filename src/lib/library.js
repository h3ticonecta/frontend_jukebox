import { DEFAULT_SONG_PRICE } from '../api/config';
import { parseDurationSeconds } from './utils';

function stripExtension(filename) {
  if (!filename) return '';
  return filename.replace(/\.[^.]+$/, '');
}

/** Chave R2 usada em tocadas — API pode enviar `key`, `path` ou só `name` + pasta. */
export function resolveTrackKey(track) {
  if (!track) return null;

  const direct =
    track.key || track.path || track.file_key || track.file_path || track.r2_key || track.object_key;
  if (direct) return String(direct);

  const folder = track.folder_path || track.folder || track.prefix || '';
  if (track.name && folder) {
    const base = folder.endsWith('/') ? folder : `${folder}/`;
    return `${base}${track.name}`;
  }

  return track.name ? String(track.name) : null;
}

export function resolveTrackFolderPath(track, fallbackPath = '') {
  const explicit = track?.folder_path || track?.folder || track?.prefix || track?.pasta;
  if (explicit) return String(explicit);

  const key = resolveTrackKey(track);
  if (key && key.includes('/')) {
    return key.slice(0, key.lastIndexOf('/') + 1);
  }

  return fallbackPath || '';
}

export function normalizeMusicFolderPath(path) {
  if (!path) return '';
  const trimmed = String(path).trim();
  if (!trimmed) return '';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

export function buildMusicaTocadaPayload(track, album, valor = DEFAULT_SONG_PRICE) {
  const musicaKey = resolveTrackKey(track);
  const pasta = normalizeMusicFolderPath(
    resolveTrackFolderPath(track, album?.path || '')
  );

  return {
    musica_key: musicaKey,
    musica_nome: track.title,
    titulo: track.title,
    pasta,
    media_type: track.media_type || 'audio',
    media_url: track.media_url || track.audio_url || null,
    cover_url: track.cover_url || track.cover || album?.cover || null,
    valor,
  };
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
  const folderTotal =
    typeof data?.totals?.current_folders === 'number'
      ? data.totals.current_folders
      : folders.length;
  const folderTracks = data?.musicas || data?.musicas_list || data?.files || [];

  if (folders.length > 0) {
    return {
      albums: folders.map((folder, index) => mapFolder(folder, index)),
      tracks: [],
      selectedAlbum: null,
      folderTotal,
    };
  }

  if (folderTotal > 0) {
    return {
      albums: [],
      tracks: [],
      selectedAlbum: null,
      folderTotal,
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
      folderTotal: 0,
    };
  }

  return {
    albums: [],
    tracks: [],
    selectedAlbum: null,
    folderTotal: 0,
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

export function mapTrackFromApi(track, index, albumPath = '') {
  const title = track.title || stripExtension(track.name);
  const key = resolveTrackKey(track);
  const folderPath = resolveTrackFolderPath(track, albumPath);

  const isMedia =
    track.media_type === 'audio' || track.media_type === 'video' || !track.media_type;

  return {
    id: key || `track-${index}`,
    key,
    number: String(index + 1).padStart(2, '0'),
    title,
    duration_seconds: isMedia ? parseDurationSeconds(track.duration_seconds) : null,
    media_url: track.media_url || track.audio_url || track.media?.media_url || null,
    cover_url: track.cover_url || track.cover?.media_url || null,
    pasta: folderPath,
    folder_path: folderPath,
    media_type: track.media_type || 'audio',
    artist: getArtistFromFolderPath(folderPath),
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

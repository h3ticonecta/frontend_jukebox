import { apiRequest } from './client';

export async function fetchMusicas(token, { prefix = '', q = '' } = {}) {
  const params = new URLSearchParams();
  if (prefix) params.set('prefix', prefix);
  if (q) params.set('q', q);

  const query = params.toString();
  const path = query ? `/api/v1/musicas/?${query}` : '/api/v1/musicas/';
  return apiRequest(path, { token });
}

export function getTracksFromResponse(data) {
  return data?.musicas || data?.musicas_list || [];
}

export function getFoldersFromResponse(data) {
  return data?.folders || [];
}

export function getFolderCover(folder, responseCoverUrl) {
  return folder?.cover_url || folder?.cover?.media_url || responseCoverUrl || null;
}

export async function resolveFolderCover(token, folder) {
  const direct = getFolderCover(folder);
  if (direct) return direct;

  const subfoldersCount = folder?.subfolders_count ?? 0;
  if (!folder?.path || subfoldersCount <= 0) return null;

  try {
    const data = await fetchMusicas(token, { prefix: folder.path });
    const children = getFoldersFromResponse(data);

    for (const child of children) {
      const childCover = getFolderCover(child);
      if (childCover) return childCover;
    }

    return getFolderCover(null, data?.cover_url);
  } catch {
    return null;
  }
}

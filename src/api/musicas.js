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
  return data?.musicas || data?.musicas_list || data?.files || data?.files_list || [];
}

export function getFoldersFromResponse(data) {
  return data?.folders || [];
}

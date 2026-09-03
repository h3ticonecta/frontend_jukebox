import { apiRequest } from './client';

export async function fetchMusicas(token, { prefix = '', q = '' } = {}) {
  const params = new URLSearchParams();
  if (prefix) params.set('prefix', prefix);
  if (q) params.set('q', q);

  const query = params.toString();
  return apiRequest(`/api/v1/musicas/${query ? `?${query}` : ''}`, { token });
}

export function getTracksFromResponse(data) {
  return data?.musicas || data?.musicas_list || [];
}

export function getFoldersFromResponse(data) {
  return data?.folders || [];
}

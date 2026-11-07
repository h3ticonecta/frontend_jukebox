import { apiRequest } from './client';

export async function fetchMusicas(token, { prefix = '', q = '', signal } = {}) {
  const params = new URLSearchParams();
  if (prefix) params.set('prefix', prefix);
  if (q) params.set('q', q);

  const query = params.toString();
  const path = query ? `/api/v1/musicas/?${query}` : '/api/v1/musicas/';
  return apiRequest(path, { token, signal });
}

export function getFoldersFromResponse(data) {
  return data?.folders || [];
}

/** Total de subpastas no prefixo atual (painel ARTISTAS / BANDAS). */
export function getFolderTotalFromResponse(data) {
  const folders = getFoldersFromResponse(data);
  if (typeof data?.totals?.current_folders === 'number') {
    return data.totals.current_folders;
  }
  return folders.length;
}

/** Faixas ao navegar por `prefix` (categoria ou artista). `files_list` vem vazio fora da busca. */
export function getNavigationTracksFromResponse(data) {
  return data?.musicas || data?.musicas_list || data?.files || [];
}

/** Inclui `files_list` — reservado para `?q=` (busca). */
export function getTracksFromResponse(data) {
  const fromNavigation = getNavigationTracksFromResponse(data);
  if (fromNavigation.length > 0) {
    return fromNavigation;
  }
  return data?.files_list || [];
}

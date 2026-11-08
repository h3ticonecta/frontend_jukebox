import { apiRequest } from './client';

/**
 * Contrato 12 — Configuração da Roleta (por máquina).
 *
 * Admin (Authorization: Token <token-admin>):
 *   GET /api/v1/maquinas/{id}/roleta/
 *   PUT /api/v1/maquinas/{id}/roleta/  (faixas_valor substitui as anteriores)
 *
 * Jukebox (Authorization: Maquina <token>):
 *   GET /api/v1/maquinas/roleta/  (ativada=false → resumo mínimo)
 */
export async function fetchRoletaMaquina(token) {
  return apiRequest('/api/v1/maquinas/roleta/', { token });
}

export async function fetchRoletaAdmin(token, maquinaId) {
  return apiRequest(`/api/v1/maquinas/${maquinaId}/roleta/`, {
    token,
    tokenType: 'Token',
  });
}

export async function saveRoletaAdmin(token, maquinaId, payload) {
  return apiRequest(`/api/v1/maquinas/${maquinaId}/roleta/`, {
    method: 'PUT',
    token,
    tokenType: 'Token',
    body: payload,
  });
}

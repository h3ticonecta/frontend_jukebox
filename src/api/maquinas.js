import { apiRequest } from './client';

export async function registrarCredito(token, { valor, origem = 'moeda', observacao = '' }) {
  return apiRequest('/api/v1/maquinas/creditos/', {
    method: 'POST',
    token,
    body: { valor, origem, observacao },
  });
}

export async function registrarMusicaTocada(token, payload) {
  return apiRequest('/api/v1/maquinas/tocadas/', {
    method: 'POST',
    token,
    body: payload,
  });
}

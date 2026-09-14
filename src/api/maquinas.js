import { apiRequest } from './client';

export async function fetchMaquinaConfig(token) {
  return apiRequest('/api/v1/maquinas/config/', { token });
}

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

export async function fetchLeitura(token, { dataInicio, dataFim } = {}) {
  const params = new URLSearchParams();
  if (dataInicio) params.set('data_inicio', dataInicio);
  if (dataFim) params.set('data_fim', dataFim);
  const query = params.toString();
  const path = query ? `/api/v1/maquinas/leitura/?${query}` : '/api/v1/maquinas/leitura/';
  return apiRequest(path, { token });
}

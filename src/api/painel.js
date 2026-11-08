import { apiRequest } from './client';

/**
 * Contrato 11 — Painel Administrativo (Dashboard).
 * GET /api/v1/maquinas/painel-administrativo/ com token de usuário admin
 * (Authorization: Token <token-admin>, via POST /api/v1/auth/token/).
 *
 * Filtros (query):
 * - periodo: 'tudo' | 'hoje' | 'semana' | 'mes'
 * - dataInicio/dataFim (YYYY-MM-DD): juntos, ignoram o preset
 * - maquinaId: id da máquina
 * - status: 'todos' | 'ativo' | 'inativo'
 */
export async function fetchPainelAdministrativo(
  token,
  { periodo, dataInicio, dataFim, maquinaId, status } = {}
) {
  const params = new URLSearchParams();

  if (dataInicio && dataFim) {
    params.set('data_inicio', dataInicio);
    params.set('data_fim', dataFim);
  } else if (periodo && periodo !== 'tudo') {
    params.set('periodo', periodo);
  }

  if (maquinaId) params.set('maquina_id', maquinaId);
  if (status && status !== 'todos') params.set('status', status);

  const query = params.toString();
  const path = query
    ? `/api/v1/maquinas/painel-administrativo/?${query}`
    : '/api/v1/maquinas/painel-administrativo/';

  return apiRequest(path, { token, tokenType: 'Token' });
}

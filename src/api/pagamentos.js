import { apiRequest } from './client';
import { getMaquinaInfo, getMaquinaToken } from '../lib/storage';

/**
 * Contrato 13 — PIX (QR Code) via Mercado Pago.
 * Contrato 14 — Configuração de créditos PIX (`/pagamentos/pix-creditos/`).
 *
 * Jukebox (Authorization: Maquina <token>):
 *   GET  /api/v1/pagamentos/pix-creditos/opcoes/
 *   POST /api/v1/pagamentos/pix/qrcode/
 *   GET  /api/v1/pagamentos/pix/{id}/
 *   POST /api/v1/pagamentos/pix/{id}/sincronizar/
 *
 * Admin (Authorization: Token <token-admin>):
 *   GET/POST /api/v1/pagamentos/pix-creditos/
 *   GET/PUT/PATCH/DELETE /api/v1/pagamentos/pix-creditos/{id}/
 */

export const PIX_CREDITOS_PADRAO = [
  { id: 'padrao-5', valor_pix: '5.00', valor_pix_numero: 5, quantidade_creditos: 5, ordem: 1, ativo: true },
  { id: 'padrao-10', valor_pix: '10.00', valor_pix_numero: 10, quantidade_creditos: 10, ordem: 2, ativo: true },
  { id: 'padrao-20', valor_pix: '20.00', valor_pix_numero: 20, quantidade_creditos: 20, ordem: 3, ativo: true },
  { id: 'padrao-50', valor_pix: '50.00', valor_pix_numero: 50, quantidade_creditos: 50, ordem: 4, ativo: true },
  { id: 'padrao-100', valor_pix: '100.00', valor_pix_numero: 100, quantidade_creditos: 100, ordem: 5, ativo: true },
];
function resolveMaquinaToken(token) {
  const raw = token || getMaquinaToken();
  if (!raw) return null;
  const value = String(raw).trim();
  // Evita "Maquina Maquina <key>" se o storage já gravou o esquema
  return value.replace(/^(Maquina|Token)\s+/i, '');
}

/** Mercado Pago exige payer.email válido; usuário da máquina (ex.: Macgustavo) não serve. */
function pixPayerEmail() {
  const info = getMaquinaInfo() || {};
  const candidates = [info.email, info.usuario, info.nome_jukebox];
  const looksEmail = candidates.find((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '')));
  if (looksEmail) return String(looksEmail).trim().toLowerCase();
  const slug = String(info.id || info.usuario || 'jukebox')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'jukebox';
  return `jukebox-${slug}@h3ti.com.br`;
}

export async function criarPixQrCode(token, { valor, descricao = 'Créditos jukebox' }) {
  const authToken = resolveMaquinaToken(token);
  const info = getMaquinaInfo() || {};
  const maquinaId = info.id;
  const email = pixPayerEmail();
  if (!authToken) {
    const missing = new Error(
      'Token da máquina ausente. Saia e entre de novo com o usuário da jukebox.'
    );
    missing.status = 401;
    throw missing;
  }
  return apiRequest('/api/v1/pagamentos/pix/qrcode/', {
    method: 'POST',
    token: authToken,
    tokenType: 'Maquina',
    credentials: 'omit',
    body: {
      valor: Number(Number(valor).toFixed(2)),
      descricao,
      email,
      payer_email: email,
      ...(maquinaId ? { maquina_id: maquinaId } : {}),
    },
  });
}

export async function consultarPix(token, id) {
  return apiRequest(`/api/v1/pagamentos/pix/${id}/`, {
    token: resolveMaquinaToken(token),
    tokenType: 'Maquina',
  });
}

export async function sincronizarPix(token, id) {
  return apiRequest(`/api/v1/pagamentos/pix/${id}/sincronizar/`, {
    method: 'POST',
    token: resolveMaquinaToken(token),
    tokenType: 'Maquina',
  });
}

export function pixStatusKind(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'aprovado' || value === 'approved') return 'aprovado';
  if (
    ['recusado', 'rejected', 'cancelled', 'cancelado', 'expired', 'expirado', 'refunded'].includes(
      value
    )
  ) {
    return 'falhou';
  }
  return 'pendente';
}

export function pixQrImageSrc(base64) {
  if (!base64) return null;
  const value = String(base64).trim();
  if (value.startsWith('data:')) return value;
  return `data:image/png;base64,${value}`;
}

export function mapPixError(err) {
  const code = err?.data?.error?.code;
  const apiMessage = err?.data?.error?.message || err?.data?.detail || err?.message;
  if (code === 'MP_NOT_CONFIGURED') {
    return 'PIX não configurado. Cadastre a conta Mercado Pago no Admin.';
  }
  if (code === 'MP_API_ERROR' || /payer\.email/i.test(String(apiMessage || ''))) {
    if (/payer\.email/i.test(String(apiMessage || ''))) {
      return 'O Mercado Pago exige um e-mail válido do pagador. O app envia um e-mail técnico da máquina; se o erro continuar, o backend precisa usar esse campo (não o usuário da jukebox).';
    }
    return apiMessage || 'Mercado Pago recusou a cobrança.';
  }
  if (code === 'UNAUTHORIZED' || err?.status === 401 || err?.status === 403) {
    return (
      apiMessage ||
      'Token da máquina recusado. Saia da jukebox e entre de novo com usuário e senha da máquina.'
    );
  }
  return apiMessage || 'Não foi possível gerar o PIX.';
}

export function normalizePixOpcao(raw, index = 0) {
  const valor = Number(raw?.valor_pix_numero ?? raw?.valor_pix ?? 0);
  const creditos = Math.max(0, Math.round(Number(raw?.quantidade_creditos ?? valor) || 0));
  return {
    id: raw?.id ?? `local-${index}`,
    valor_pix: raw?.valor_pix ?? (Number.isFinite(valor) ? valor.toFixed(2) : '0.00'),
    valor_pix_numero: valor,
    quantidade_creditos: creditos,
    ordem: Number(raw?.ordem) || index + 1,
    ativo: raw?.ativo !== false,
  };
}

export function parsePixOpcoes(data, { onlyActive = true } = {}) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.opcoes)
      ? data.opcoes
      : Array.isArray(data?.results)
        ? data.results
        : [];
  return list
    .map((raw, index) => normalizePixOpcao(raw, index))
    .filter((item) => item.valor_pix_numero > 0 && item.quantidade_creditos > 0)
    .filter((item) => (onlyActive ? item.ativo !== false : true))
    .sort((a, b) => a.ordem - b.ordem || a.valor_pix_numero - b.valor_pix_numero);
}

export function resolvePixCreditosConcedidos(cobranca, fallback = 0) {
  const candidates = [cobranca?.quantidade_creditos, cobranca?.creditos_concedidos, fallback];
  for (const candidate of candidates) {
    const n = Math.round(Number(candidate));
    if (Number.isFinite(n) && n > 0) return n;
  }
  const valor = Math.round(Number(cobranca?.valor_numero ?? cobranca?.valor) || 0);
  return valor > 0 ? valor : 0;
}

export async function fetchPixCreditoOpcoes(token) {
  const data = await apiRequest('/api/v1/pagamentos/pix-creditos/opcoes/', {
    token: resolveMaquinaToken(token),
    tokenType: 'Maquina',
  });
  return parsePixOpcoes(data, { onlyActive: true });
}

function pixCreditosAdmin(token, path = '', options = {}) {
  return apiRequest(`/api/v1/pagamentos/pix-creditos/${path}`, {
    token,
    tokenType: 'Token',
    ...options,
  });
}

export async function listPixCreditosAdmin(token) {
  const data = await pixCreditosAdmin(token);
  return parsePixOpcoes(data, { onlyActive: false });
}

export function createPixCreditoAdmin(token, body) {
  return pixCreditosAdmin(token, '', { method: 'POST', body });
}

export function updatePixCreditoAdmin(token, id, body) {
  return pixCreditosAdmin(token, `${id}/`, { method: 'PATCH', body });
}

export function deletePixCreditoAdmin(token, id) {
  return pixCreditosAdmin(token, `${id}/`, { method: 'DELETE' });
}

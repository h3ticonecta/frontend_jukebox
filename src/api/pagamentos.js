import { apiRequest } from './client';
import { getMaquinaInfo, getMaquinaToken } from '../lib/storage';

/**
 * Contrato 13 — PIX (QR Code) via Mercado Pago.
 *
 * Jukebox (Authorization: Maquina <token>):
 *   POST /api/v1/pagamentos/pix/qrcode/
 *   GET  /api/v1/pagamentos/pix/{id}/
 *   POST /api/v1/pagamentos/pix/{id}/sincronizar/
 */
function resolveMaquinaToken(token) {
  const raw = token || getMaquinaToken();
  if (!raw) return null;
  const value = String(raw).trim();
  // Evita "Maquina Maquina <key>" se o storage já gravou o esquema
  return value.replace(/^(Maquina|Token)\s+/i, '');
}

export async function criarPixQrCode(token, { valor, descricao = 'Créditos jukebox' }) {
  const authToken = resolveMaquinaToken(token);
  const maquinaId = getMaquinaInfo()?.id;
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
  if (code === 'MP_API_ERROR') {
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

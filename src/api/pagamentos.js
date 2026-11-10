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

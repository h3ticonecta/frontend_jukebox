import { apiRequest } from './client';

/**
 * Contrato 13 — PIX (QR Code) via Mercado Pago.
 *
 * Jukebox (Authorization: Maquina <token>):
 *   POST /api/v1/pagamentos/pix/qrcode/
 *   GET  /api/v1/pagamentos/pix/{id}/
 *   POST /api/v1/pagamentos/pix/{id}/sincronizar/
 */
export async function criarPixQrCode(token, { valor, descricao = 'Créditos jukebox' }) {
  return apiRequest('/api/v1/pagamentos/pix/qrcode/', {
    method: 'POST',
    token,
    body: { valor, descricao },
  });
}

export async function consultarPix(token, id) {
  return apiRequest(`/api/v1/pagamentos/pix/${id}/`, { token });
}

export async function sincronizarPix(token, id) {
  return apiRequest(`/api/v1/pagamentos/pix/${id}/sincronizar/`, {
    method: 'POST',
    token,
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
  if (code === 'MP_NOT_CONFIGURED') {
    return 'PIX não configurado. Cadastre a conta Mercado Pago no Admin.';
  }
  if (code === 'MP_API_ERROR') {
    return err?.data?.error?.message || 'Mercado Pago recusou a cobrança.';
  }
  if (err?.status === 401) {
    return 'Sessão da máquina inválida. Entre novamente.';
  }
  return err?.message || 'Não foi possível gerar o PIX.';
}

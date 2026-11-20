export const CONNECTIVITY_ERROR_MESSAGE =
  'Sem conexão com o servidor. Verifique a rede ou tente de novo.';

const NETWORK_RAW = ['failed to fetch', 'networkerror', 'network request failed', 'load failed'];

export function isNetworkFetchError(err) {
  if (!err || err?.name === 'AbortError') return false;
  if (typeof err?.status === 'number' && err.status === 0) return true;
  const msg = String(err?.message || '').toLowerCase();
  return NETWORK_RAW.some((bit) => msg.includes(bit));
}

export function isConnectivityBannerMessage(message) {
  if (!message) return false;
  const text = String(message).toLowerCase();
  return (
    message === CONNECTIVITY_ERROR_MESSAGE || NETWORK_RAW.some((bit) => text.includes(bit))
  );
}

export function mapUserFacingApiError(err, fallback = 'Erro na requisição') {
  if (!err) return fallback;
  if (isNetworkFetchError(err)) return CONNECTIVITY_ERROR_MESSAGE;
  if (err?.data?.error?.message) return err.data.error.message;
  if (typeof err?.message === 'string' && err.message) return err.message;
  return fallback;
}

/** Normaliza mensagens já gravadas no estado (ex.: banner do header). */
export function normalizeErrorMessage(message) {
  if (!message) return null;
  if (isConnectivityBannerMessage(message)) return CONNECTIVITY_ERROR_MESSAGE;
  return message;
}

export function clearConnectivityBanner(setError) {
  setError((prev) => (isConnectivityBannerMessage(prev) ? null : prev));
}
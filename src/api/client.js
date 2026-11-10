import { API_BASE_URL } from './config';
import { getMaquinaToken } from '../lib/storage';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function formatApiErrorMessage(data, status) {
  if (data?.error?.message) return data.error.message;
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.detail)) return data.detail.join(', ');
  if (data && typeof data === 'object') {
    const parts = [];
    Object.entries(data).forEach(([field, messages]) => {
      if (field === 'error') return;
      const text = Array.isArray(messages) ? messages.join(' ') : String(messages);
      parts.push(`${field}: ${text}`);
    });
    if (parts.length > 0) return parts.join(' · ');
  }
  return `Erro na requisição (${status})`;
}

export async function apiRequest(path, options = {}) {
  const { token = getMaquinaToken(), tokenType = 'Maquina', body, headers = {}, ...rest } = options;

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const authToken = token && token !== 'undefined' ? String(token).trim() : null;
  if (authToken) {
    requestHeaders.Authorization = `${tokenType} ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    signal: rest.signal,
  });

  const contentType = response.headers.get('content-type') || '';
  const data =
    response.status === 204 || !contentType.includes('application/json')
      ? null
      : await response.json();

  if (!response.ok) {
    const message =
      (data && formatApiErrorMessage(data, response.status)) ||
      data?.message ||
      `Erro na requisição (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

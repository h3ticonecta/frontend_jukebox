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
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.detail ||
      data?.message ||
      `Erro na requisição (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

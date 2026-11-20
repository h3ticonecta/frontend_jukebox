import { apiRequest } from './client';

/** `GET /` — service info (guia de integração backend, contrato 01-service-info). */
export async function getServiceInfo() {
  return apiRequest('/');
}
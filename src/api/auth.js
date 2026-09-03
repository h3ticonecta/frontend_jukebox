import { apiRequest } from './client';

export async function loginMaquina(usuario, senha) {
  return apiRequest('/api/v1/maquinas/auth/', {
    method: 'POST',
    body: { usuario, senha },
  });
}

export async function loginAdmin(username, password) {
  const data = await apiRequest('/api/v1/auth/token/', {
    method: 'POST',
    body: { username, password },
    tokenType: 'Token',
  });
  return data.token;
}

export async function checkHealth() {
  return apiRequest('/health/');
}

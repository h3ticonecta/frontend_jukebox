import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loginMaquina } from '../api/auth';
import { fetchMaquinaConfig } from '../api/maquinas';
import {
  clearMaquinaSession,
  getMaquinaInfo,
  getMaquinaToken,
  getMaquinaTeclas,
  setMaquinaSession,
  updateMaquinaTeclas,
} from '../lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getMaquinaToken());
  const [machine, setMachine] = useState(() => getMaquinaInfo());
  const [teclas, setTeclas] = useState(() => getMaquinaTeclas());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (usuario, senha) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loginMaquina(usuario, senha);
      const authToken = data?.token;
      if (!authToken) {
        throw new Error('Servidor não retornou o token da máquina. Verifique o backend.');
      }
      const sessionTeclas = data.teclas || [];
      setMaquinaSession({
        token: authToken,
        id: data.id,
        nome_jukebox: data.nome_jukebox,
        usuario: data.usuario,
        teclas: sessionTeclas,
      });
      setToken(authToken);
      setMachine({
        id: data.id,
        nome_jukebox: data.nome_jukebox,
        usuario: data.usuario,
      });
      setTeclas(sessionTeclas);
      return data;
    } catch (err) {
      const message =
        err?.data?.error?.message ||
        err?.data?.non_field_errors?.[0] ||
        err?.data?.detail ||
        err.message ||
        'Falha no login da máquina';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearMaquinaSession();
    setToken(null);
    setMachine(null);
    setTeclas([]);
    setError(null);
  }, []);

  const refreshConfig = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await fetchMaquinaConfig(token);
      if (data?.teclas) {
        setTeclas(data.teclas);
        updateMaquinaTeclas(data.teclas);
      }
      return data;
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      refreshConfig();
    }
  }, [token, refreshConfig]);

  const value = useMemo(
    () => ({
      token,
      machine,
      teclas,
      isAuthenticated: Boolean(token),
      isLoading,
      error,
      login,
      logout,
      refreshConfig,
      clearError: () => setError(null),
    }),
    [token, machine, teclas, isLoading, error, login, logout, refreshConfig]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

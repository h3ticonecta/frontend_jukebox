import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { loginMaquina } from '../api/auth';
import {
  clearMaquinaSession,
  getMaquinaInfo,
  getMaquinaToken,
  setMaquinaSession,
} from '../lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getMaquinaToken());
  const [machine, setMachine] = useState(() => getMaquinaInfo());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (usuario, senha) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loginMaquina(usuario, senha);
      setMaquinaSession({
        token: data.token,
        id: data.id,
        nome_jukebox: data.nome_jukebox,
        usuario: data.usuario,
      });
      setToken(data.token);
      setMachine({
        id: data.id,
        nome_jukebox: data.nome_jukebox,
        usuario: data.usuario,
      });
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
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      machine,
      isAuthenticated: Boolean(token),
      isLoading,
      error,
      login,
      logout,
      clearError: () => setError(null),
    }),
    [token, machine, isLoading, error, login, logout]
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

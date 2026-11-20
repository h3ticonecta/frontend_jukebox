import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loginMaquina, checkHealth } from '../api/auth';
import { getServiceInfo } from '../api/serviceInfo';
import { fetchMaquinaConfig } from '../api/maquinas';
import { configNeedsUpdate, startMaquinaConfigSync } from '../lib/maquinaConfigSync';
import {
  clearMaquinaSession,
  getComportamentoVolume,
  getMaquinaConfigUpdatedAt,
  getMaquinaInfo,
  getMaquinaToken,
  getMaquinaTeclas,
  setMaquinaSession,
  patchMaquinaInfo,
  updateMaquinaTeclas,
  updateMaquinaVolumeConfig,
} from '../lib/storage';
import { idbClearCatalog } from '../lib/idbCatalog';

function mapLoginErrorMessage(err) {
  const code = err?.data?.error?.code;
  if (code === 'INVALID_CREDENTIALS') {
    return 'Usuário ou senha inválidos.';
  }
  if (code === 'MACHINE_INACTIVE') {
    return 'Máquina inativa. Contate o administrador.';
  }
  return (
    err?.data?.error?.message ||
    err?.data?.non_field_errors?.[0] ||
    err?.data?.detail ||
    err?.message ||
    'Falha no login da máquina'
  );
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getMaquinaToken());
  const [machine, setMachine] = useState(() => getMaquinaInfo());
  const [teclas, setTeclas] = useState(() => getMaquinaTeclas());
  const [comportamentoVolume, setComportamentoVolume] = useState(() => getComportamentoVolume());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiReachable, setApiReachable] = useState(null);

  const refreshRef = useRef(null);

  const applyConfigPayload = useCallback((data) => {
    if (data?.teclas) {
      setTeclas(data.teclas);
      updateMaquinaTeclas(data.teclas);
    }
    if (data?.comportamento_volume !== undefined) {
      const volumeConfig = data.comportamento_volume || null;
      setComportamentoVolume(volumeConfig);
      updateMaquinaVolumeConfig(volumeConfig);
    }
    if (data?.nome_jukebox || data?.usuario || data?.id) {
      setMachine((current) => ({
        id: data.id ?? current?.id,
        nome_jukebox: data.nome_jukebox ?? current?.nome_jukebox,
        usuario: data.usuario ?? current?.usuario,
      }));
      patchMaquinaInfo({
        id: data.id,
        nome_jukebox: data.nome_jukebox,
        usuario: data.usuario,
      });
    }
    if (data?.updated_at != null && data.updated_at !== '') {
      patchMaquinaInfo({ config_updated_at: data.updated_at });
    }
  }, []);

  const refreshConfig = useCallback(
    async ({ force = false, authToken } = {}) => {
      const activeToken = authToken ?? token;
      if (!activeToken) return null;
      try {
        const data = await fetchMaquinaConfig(activeToken);
        const prev = getMaquinaConfigUpdatedAt();
        const next = data?.updated_at ?? null;
        if (!force && !configNeedsUpdate(prev, next)) {
          return data;
        }
        applyConfigPayload(data);
        return data;
      } catch {
        return null;
      }
    },
    [token, applyConfigPayload]
  );

  refreshRef.current = refreshConfig;

  useEffect(() => {
    let cancelled = false;

    const probeApi = async () => {
      try {
        const [health, info] = await Promise.all([
          checkHealth().catch(() => null),
          getServiceInfo().catch(() => null),
        ]);
        if (cancelled) return;
        const healthOk = health?.status === 'ok';
        const infoOk = Boolean(info?.service);
        setApiReachable(healthOk || infoOk);
      } catch {
        if (!cancelled) setApiReachable(false);
      }
    };

    void probeApi();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    return startMaquinaConfigSync({
      pull: (opts) => refreshRef.current?.(opts),
    });
  }, [token]);

  const login = useCallback(
    async (usuario, senha) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await loginMaquina(usuario, senha);
        const authToken = data?.token;
        if (!authToken) {
          throw new Error('Servidor não retornou o token da máquina. Verifique o backend.');
        }
        const sessionTeclas = data.teclas || [];
        const volumeConfig = data.comportamento_volume || null;
        setMaquinaSession({
          token: authToken,
          id: data.id,
          nome_jukebox: data.nome_jukebox,
          usuario: data.usuario,
          teclas: sessionTeclas,
          comportamento_volume: volumeConfig,
          config_updated_at: data.updated_at ?? null,
        });
        setToken(authToken);
        setMachine({
          id: data.id,
          nome_jukebox: data.nome_jukebox,
          usuario: data.usuario,
        });
        setTeclas(sessionTeclas);
        setComportamentoVolume(volumeConfig);
        if (!data.updated_at) {
          void refreshRef.current?.({ force: true, authToken });
        }
        return data;
      } catch (err) {
        setError(mapLoginErrorMessage(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearMaquinaSession();
    idbClearCatalog();
    setToken(null);
    setMachine(null);
    setTeclas([]);
    setComportamentoVolume(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      machine,
      teclas,
      comportamentoVolume,
      apiReachable,
      isAuthenticated: Boolean(token),
      isLoading,
      error,
      login,
      logout,
      refreshConfig,
      clearError: () => setError(null),
    }),
    [
      token,
      machine,
      teclas,
      comportamentoVolume,
      apiReachable,
      isLoading,
      error,
      login,
      logout,
      refreshConfig,
    ]
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
import { useCallback, useState } from 'react';
import { clearAdminSession, getAdminToken } from '../../lib/storage';
import AdminDashboard from './AdminDashboard';
import AdminLoginCard from './AdminLoginCard';

/**
 * Rota `#/admin` — Painel Administrativo (contrato 11).
 * Autenticação própria: token de usuário admin (Django), independente
 * do token da máquina usado na jukebox.
 */
export default function AdminPage() {
  const [token, setToken] = useState(() => getAdminToken());
  const [logoutMessage, setLogoutMessage] = useState(null);

  const handleLogout = useCallback((message = null) => {
    clearAdminSession();
    setToken(null);
    setLogoutMessage(message);
  }, []);

  if (!token) {
    return (
      <>
        {logoutMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-destructive/15 border border-destructive/40 text-destructive text-sm shadow-lg">
            {logoutMessage}
          </div>
        )}
        <AdminLoginCard
          onLogin={(nextToken) => {
            setLogoutMessage(null);
            setToken(nextToken);
          }}
        />
      </>
    );
  }

  return <AdminDashboard token={token} onLogout={handleLogout} />;
}

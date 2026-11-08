import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { loginAdmin } from '../../api/auth';
import { setAdminSession } from '../../lib/storage';

function mapAdminLoginError(err) {
  if (Array.isArray(err?.data?.non_field_errors) && err.data.non_field_errors.length > 0) {
    return 'Usuário ou senha inválidos.';
  }
  return err?.message || 'Falha no login do administrador';
}

export default function AdminLoginCard({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const token = await loginAdmin(username.trim(), password);
      setAdminSession({ token, username: username.trim() });
      onLogin(token);
    } catch (err) {
      setError(mapAdminLoginError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="text-secondary" size={32} />
          <h1 className="text-2xl font-display text-secondary neon-glow-cyan">Painel Administrativo</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Acesso restrito a administradores (token de usuário do backend).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-username" className="block text-xs text-muted-foreground mb-1.5">
              Usuário
            </label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="usuário do administrador"
              className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs text-muted-foreground mb-1.5">
              Senha
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="senha do administrador"
              className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>

          <a
            href="#/"
            className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar para a jukebox
          </a>
        </form>
      </div>
    </div>
  );
}

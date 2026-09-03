import { useEffect, useState } from 'react';
import { Coins, X } from 'lucide-react';

export default function CreditModal({ open, onClose, onConfirm, isLoading }) {
  const [valor, setValor] = useState('1.00');

  useEffect(() => {
    if (open) setValor('1.00');
  }, [open]);

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const amount = Number.parseFloat(valor.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) return;
    onConfirm(amount);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Coins className="text-primary" size={20} />
            <h3 className="text-sm font-display text-primary">Inserir Crédito</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="valor-credito" className="block text-xs text-muted-foreground mb-1.5">
              Valor (R$)
            </label>
            <input
              id="valor-credito"
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Registrando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

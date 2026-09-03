import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ClipboardList,
  Coins,
  Hash,
  SkipForward,
  Volume1,
  Volume2,
  X,
} from 'lucide-react';
import { formatTeclaDisplay, sortTeclas } from '../../lib/keyboard';

const ICONS = {
  cima: ArrowUp,
  baixo: ArrowDown,
  esquerda: ArrowLeft,
  direita: ArrowRight,
  credito: Coins,
  hits: Hash,
  fila: ClipboardList,
  pular: SkipForward,
  vol_mais: Volume2,
  vol_menos: Volume1,
  cancelar: X,
};

const ICON_COLORS = {
  credito: 'text-primary',
  hits: 'text-secondary',
  cancelar: 'text-destructive',
};

function KeyIcon({ acao }) {
  const Icon = ICONS[acao];
  if (!Icon) return <span className="w-4 h-4" />;
  return <Icon size={16} className={ICON_COLORS[acao] || 'text-muted-foreground'} />;
}

export default function KeysPanel({ teclas = [], onClose }) {
  const sorted = sortTeclas(teclas);

  return (
    <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-border bg-[#2a2d35] shadow-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60">
        <h3 className="text-sm font-display text-primary tracking-wider">TECLAS</h3>
      </div>
      <ul className="py-2">
        {sorted.length === 0 ? (
          <li className="px-4 py-3 text-xs text-muted-foreground">Nenhuma tecla configurada.</li>
        ) : (
          sorted.map((item) => (
            <li
              key={item.acao}
              className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors"
            >
              <KeyIcon acao={item.acao} />
              <span className="flex-1 text-sm text-foreground/90">{item.label}</span>
              <kbd className="min-w-[2rem] px-2 py-1 rounded bg-[#1a1c22] border border-border text-xs text-foreground font-mono text-center">
                {formatTeclaDisplay(item.tecla)}
              </kbd>
            </li>
          ))
        )}
      </ul>
      {onClose && (
        <button
          type="button"
          className="sr-only"
          onClick={onClose}
          aria-label="Fechar painel de teclas"
        />
      )}
    </div>
  );
}

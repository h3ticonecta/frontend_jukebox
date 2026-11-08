import { Dices } from 'lucide-react';

/** Atalho flutuante para reabrir a roleta quando há giros pendentes. */
export default function RoletaFab({ giros, onClick }) {
  if (!giros) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-[4.5rem] left-4 z-40 flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold shadow-[0_0_18px_hsl(var(--neon-cyan)/0.45)] hover:brightness-110 active:scale-95 transition-all touch-manipulation"
      aria-label={`Abrir roleta — ${giros} giro(s) disponíveis`}
    >
      <Dices size={18} />
      Roleta ×{giros}
    </button>
  );
}

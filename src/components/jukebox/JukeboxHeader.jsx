import { Disc, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function JukeboxHeader({
  isPlaying = false,
  isSyncing = false,
  isRegistered = false,
  machineName,
  errorMessage,
  onOpenBilling,
  onSyncLibrary,
}) {
  return (
    <>
      <header className="relative z-10 px-4 py-3 flex items-center gap-3 border-b border-border shrink-0">
        <Disc className={cn('text-primary shrink-0', isPlaying && 'animate-spin-vinyl')} size={32} />
        <h1 className="text-2xl font-display text-primary neon-glow-amber tracking-wider">JUKE-BOX</h1>
        {isRegistered ? (
          <span className="text-[10px] font-semibold text-secondary bg-secondary/10 border border-secondary/30 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            {machineName || 'Registrado'}
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-destructive bg-destructive/10 border border-destructive/30 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            Não registrado
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenBilling}
            className="px-2.5 py-1 rounded-md border border-primary/40 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider hover:bg-primary/20 transition-colors"
          >
            Leitura
          </button>
          <button
            type="button"
            onClick={onSyncLibrary}
            disabled={isSyncing}
            className="p-1.5 text-muted-foreground hover:text-secondary transition-colors disabled:opacity-50"
            title="Atualizar Biblioteca"
            aria-label="Atualizar Biblioteca"
          >
            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>
      </header>
      {errorMessage && (
        <div className="relative z-10 px-4 py-2 bg-destructive/20 border-b border-destructive/30 shrink-0">
          <p className="text-xs text-destructive">{errorMessage}</p>
        </div>
      )}
    </>
  );
}

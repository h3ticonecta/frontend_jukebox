import { Coins, ListMusic, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { Disc } from 'lucide-react';
import { cn } from '../../lib/utils';

function VinylThumb({ cover, isSpinning }) {
  return (
    <div
      className={cn(
        'w-12 h-12 rounded-full relative shrink-0 overflow-hidden border-2 border-primary/40',
        isSpinning && 'animate-spin-vinyl'
      )}
    >
      {cover ? (
        <img src={cover} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <Disc className="text-primary" size={20} />
        </div>
      )}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-background" />
    </div>
  );
}

export default function PlayerBar({
  currentSong,
  isPlaying,
  progress = 0,
  credits,
  queueCount,
  onTogglePlay,
}) {
  if (!currentSong) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-20 glass-surface border-t border-border flex items-center justify-between z-40 px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Coins size={28} className="text-primary" />
          <span className="text-2xl font-display text-primary neon-glow-amber font-bold">{credits}</span>
          <span className="text-sm text-muted-foreground">créditos</span>
        </div>
        <p className="text-muted-foreground text-sm font-display">Selecione uma música para começar</p>
        <div className="flex items-center gap-2">
          <ListMusic size={28} className="text-secondary" />
          <span className="text-2xl font-display text-secondary font-bold">{queueCount}</span>
          <span className="text-sm text-muted-foreground">em espera</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-surface border-t border-primary/20 neon-border-amber z-40 shrink-0">
      <div className="w-full h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-150" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center gap-3 px-4 py-2 h-[72px]">
        <div className="flex items-center gap-2 shrink-0 mr-2">
          <Coins className="text-primary" size={26} />
          <span className="text-xl font-display text-primary neon-glow-amber font-bold">{credits}</span>
        </div>
        <VinylThumb cover={currentSong.cover} isSpinning={isPlaying} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{currentSong.title}</p>
          <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="p-2 text-foreground hover:text-primary active:scale-90 transition-colors">
            <SkipBack size={22} fill="currentColor" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="p-3 rounded-full bg-primary text-primary-foreground hover:brightness-110 active:scale-90 neon-border-amber transition-all"
          >
            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          </button>
          <button type="button" className="p-2 text-foreground hover:text-primary active:scale-90 transition-colors">
            <SkipForward size={22} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}

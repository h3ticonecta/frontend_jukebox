import { Coins, Disc, ListMusic, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';

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

function VolumeSlider({ volume, onChange }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Volume2 size={18} className="text-foreground/80" />
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={(e) => onChange(Number(e.target.value))}
        className="player-volume-slider w-24 h-1 cursor-pointer appearance-none rounded-full bg-muted"
        style={{
          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${volume}%, hsl(var(--muted)) ${volume}%, hsl(var(--muted)) 100%)`,
        }}
        aria-label="Volume"
      />
    </div>
  );
}

export default function PlayerBar({
  audioRef,
  currentSong,
  subtitle,
  isPlaying,
  currentTime = 0,
  duration = null,
  volume = 100,
  credits,
  queueCount,
  onTogglePlay,
  onPrevious,
  onNext,
  onVolumeChange,
  onInsertCredit,
}) {
  if (!currentSong) {
    return (
      <>
        <audio ref={audioRef} className="hidden" preload="metadata" />
        <div className="fixed bottom-0 left-0 right-0 h-20 glass-surface border-t border-border flex items-center justify-between z-40 px-4 shrink-0">
          <button
            type="button"
            onClick={onInsertCredit}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Inserir crédito (R$ 1,00)"
          >
            <Coins size={28} className="text-primary" />
            <span className="text-2xl font-display text-primary neon-glow-amber font-bold">{credits}</span>
            <span className="text-sm text-muted-foreground">créditos</span>
          </button>
          <p className="text-muted-foreground text-sm font-display">Selecione uma música para começar</p>
          <div className="flex items-center gap-2">
            <ListMusic size={28} className="text-secondary" />
            <span className="text-2xl font-display text-secondary font-bold">{queueCount}</span>
            <span className="text-sm text-muted-foreground">em espera</span>
          </div>
        </div>
      </>
    );
  }

  const displaySubtitle =
    subtitle ||
    (currentSong.artist && currentSong.artist !== currentSong.title ? currentSong.artist : '');
  const progress =
    duration != null && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-surface border-t border-primary/20 neon-border-amber z-40 shrink-0">
      <audio ref={audioRef} className="hidden" preload="metadata" />

      <div className="w-full h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-150" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center gap-3 px-4 py-2 h-[72px]">
        <button
          type="button"
          onClick={onInsertCredit}
          className="flex items-center gap-2 shrink-0 mr-2 hover:opacity-80 transition-opacity"
          title="Inserir crédito (R$ 1,00)"
        >
          <Coins className="text-primary" size={26} />
          <span className="text-xl font-display text-primary neon-glow-amber font-bold">{credits}</span>
        </button>

        <VinylThumb cover={currentSong.cover || currentSong.cover_url} isSpinning={isPlaying} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {currentSong.number ? `${currentSong.number}- ${currentSong.title}` : currentSong.title}
          </p>
          {displaySubtitle && (
            <p className="text-xs text-muted-foreground truncate">{displaySubtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onPrevious}
            className="p-2 text-foreground hover:text-primary active:scale-90 transition-colors"
            aria-label="Anterior"
          >
            <SkipBack size={22} fill="currentColor" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="p-3 rounded-full bg-primary text-primary-foreground hover:brightness-110 active:scale-90 neon-border-amber transition-all"
            aria-label={isPlaying ? 'Pausar' : 'Tocar'}
          >
            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="p-2 text-foreground hover:text-primary active:scale-90 transition-colors"
            aria-label="Próximo"
          >
            <SkipForward size={22} fill="currentColor" />
          </button>
        </div>

        <p className="text-sm text-foreground tabular-nums shrink-0 min-w-[5.5rem] text-center">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </p>

        <VolumeSlider volume={volume} onChange={onVolumeChange} />
      </div>
    </div>
  );
}

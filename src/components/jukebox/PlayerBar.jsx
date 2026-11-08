import { Clock, Coins, Disc, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';

function VinylThumb({ cover, isSpinning }) {
  return (
    <div
      className={cn(
        'w-10 h-10 rounded-full relative shrink-0 overflow-hidden border-2 border-primary/40',
        isSpinning && 'animate-spin-vinyl'
      )}
    >
      {cover ? (
        <img src={cover} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <Disc className="text-primary" size={18} />
        </div>
      )}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-background" />
    </div>
  );
}

function VolumeSlider({ volume, onChange }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <Volume2 size={16} className="text-foreground/80" />
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={(e) => onChange(Number(e.target.value))}
        className="player-volume-slider w-20 h-1 cursor-pointer appearance-none rounded-full bg-muted"
        style={{
          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${volume}%, hsl(var(--muted)) ${volume}%, hsl(var(--muted)) 100%)`,
        }}
        aria-label="Volume"
      />
    </div>
  );
}

function PlaybackTimeline({ currentTime, duration, isPlaying, onSeek }) {
  const hasDuration = duration != null && duration > 0;
  const progress = hasDuration ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleSeek = (event) => {
    if (!hasDuration || !onSeek) return;
    const pct = Number(event.target.value) / 100;
    onSeek(pct * duration);
  };

  if (!isPlaying && currentTime <= 0) {
    return <div className="w-full h-px bg-border/60" aria-hidden="true" />;
  }

  return (
    <div
      className={cn(
        'relative w-full shrink-0',
        isPlaying ? 'h-1.5' : 'h-1'
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={hasDuration ? duration : undefined}
      aria-valuenow={currentTime}
      aria-label="Linha do tempo da música"
    >
      <div className="absolute inset-0 bg-muted/70" />
      <div
        className={cn(
          'absolute inset-y-0 left-0 bg-primary transition-[width] duration-150 ease-linear',
          isPlaying && 'shadow-[0_0_14px_hsl(var(--primary)/0.75)]'
        )}
        style={{ width: `${progress}%` }}
      />
      {hasDuration && onSeek && (
        <input
          type="range"
          min={0}
          max={100}
          step={0.05}
          value={progress}
          onChange={handleSeek}
          className="absolute inset-0 z-10 w-full h-full cursor-pointer opacity-0 touch-manipulation"
          aria-label="Buscar posição na música"
        />
      )}
    </div>
  );
}

function WaitingBadge({ queueCount, showLabel = false }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <Clock size={showLabel ? 20 : 18} className="text-secondary" />
      <span
        className={cn(
          'font-display text-secondary font-bold tabular-nums',
          showLabel ? 'text-xl' : 'text-base'
        )}
      >
        {queueCount}
      </span>
      {showLabel && <span className="text-xs text-muted-foreground">em espera</span>}
    </div>
  );
}

export default function PlayerBar({
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
  onSeek,
}) {
  const displaySubtitle =
    subtitle ||
    (currentSong?.artist && currentSong.artist !== currentSong.title ? currentSong.artist : '');

  return (
    <>
      {!currentSong ? (
        <div className="fixed bottom-0 left-0 right-0 h-14 glass-surface border-t border-border flex items-center justify-between z-40 px-4 shrink-0">
          <button
            type="button"
            onClick={onInsertCredit}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Inserir crédito (R$ 1,00)"
          >
            <Coins size={24} className="text-primary" />
            <span className="text-xl font-display text-primary neon-glow-amber font-bold">{credits}</span>
            <span className="text-xs text-muted-foreground">créditos</span>
          </button>
          <p className="text-muted-foreground text-sm font-display">Selecione uma música para começar</p>
          <WaitingBadge queueCount={queueCount} showLabel />
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 glass-surface border-t border-primary/20 neon-border-amber z-40 shrink-0">
          <PlaybackTimeline
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={onSeek}
          />

          <div className="flex items-center gap-3 px-4 h-[56px]">
            <div className="flex items-center gap-2.5 min-w-0 shrink-0">
              <button
                type="button"
                onClick={onInsertCredit}
                className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
                title="Inserir crédito (R$ 1,00)"
              >
                <Coins className="text-primary" size={22} />
                <span className="text-lg font-display text-primary neon-glow-amber font-bold">{credits}</span>
              </button>

              <VinylThumb cover={currentSong.cover || currentSong.cover_url} isSpinning={isPlaying} />

              <div className="min-w-0 max-w-[220px]">
                <p className="text-sm font-semibold text-foreground truncate">
                  {currentSong.number ? `${currentSong.number}- ${currentSong.title}` : currentSong.title}
                </p>
                {displaySubtitle && (
                  <p className="text-xs text-muted-foreground truncate">{displaySubtitle}</p>
                )}
              </div>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onPrevious}
                  className="p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-foreground hover:text-primary active:scale-90 transition-colors touch-manipulation"
                  aria-label="Anterior"
                >
                  <SkipBack size={20} fill="currentColor" />
                </button>
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-primary text-[#121619] flex items-center justify-center hover:brightness-110 active:scale-95 transition-all touch-manipulation"
                  aria-label={isPlaying ? 'Pausar' : 'Tocar'}
                >
                  {isPlaying ? (
                    <Pause size={20} fill="currentColor" />
                  ) : (
                    <Play size={20} fill="currentColor" className="ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-foreground hover:text-primary active:scale-90 transition-colors touch-manipulation"
                  aria-label="Próximo"
                >
                  <SkipForward size={20} fill="currentColor" />
                </button>
              </div>

              <p className="text-xs text-foreground tabular-nums shrink-0 min-w-[4.5rem] text-center">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </p>

              <VolumeSlider volume={volume} onChange={onVolumeChange} />

              <WaitingBadge queueCount={queueCount} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { Coins, Disc, ListMusic, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';

const PLAYER_BG = '#121619';
const PLAYER_ACCENT = '#F8A428';
const PLAYER_MUTED = '#9CA3AF';

function CoverThumb({ cover, title }) {
  return (
    <div className="w-11 h-11 rounded-full shrink-0 overflow-hidden bg-[#1a1f24] border border-white/10">
      {cover ? (
        <img src={cover} alt={title || ''} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Disc className="text-white/40" size={20} />
        </div>
      )}
    </div>
  );
}

function VolumeSlider({ volume, onChange }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Volume2 size={18} className="text-white/90" />
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={(e) => onChange(Number(e.target.value))}
        className="player-volume-slider w-24 h-1 cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(to right, ${PLAYER_ACCENT} 0%, ${PLAYER_ACCENT} ${volume}%, #3a3f46 ${volume}%, #3a3f46 100%)`,
        }}
        aria-label="Volume"
      />
    </div>
  );
}

function IdleBar({ credits, queueCount, onInsertCredit }) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 h-[72px] flex items-center justify-between px-5 border-t border-white/5 shrink-0"
      style={{ backgroundColor: PLAYER_BG }}
    >
      <button
        type="button"
        onClick={onInsertCredit}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        title="Inserir crédito (R$ 1,00)"
      >
        <Coins size={24} style={{ color: PLAYER_ACCENT }} />
        <span className="text-xl font-display font-bold" style={{ color: PLAYER_ACCENT }}>
          {credits}
        </span>
        <span className="text-sm" style={{ color: PLAYER_MUTED }}>
          créditos
        </span>
      </button>
      <p className="text-sm" style={{ color: PLAYER_MUTED }}>
        Selecione uma música para começar
      </p>
      <div className="flex items-center gap-2">
        <ListMusic size={22} className="text-secondary" />
        <span className="text-lg font-bold text-secondary">{queueCount}</span>
        <span className="text-sm" style={{ color: PLAYER_MUTED }}>
          em espera
        </span>
      </div>
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
        <IdleBar credits={credits} queueCount={queueCount} onInsertCredit={onInsertCredit} />
      </>
    );
  }

  const title = currentSong.number ? `${currentSong.number}- ${currentSong.title}` : currentSong.title;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 h-[72px] flex items-center gap-4 px-5 border-t border-white/5 shrink-0"
      style={{ backgroundColor: PLAYER_BG }}
    >
      <audio ref={audioRef} className="hidden" preload="metadata" />

      <CoverThumb cover={currentSong.cover || currentSong.cover_url} title={currentSong.title} />

      <div className="min-w-[140px] max-w-[220px] shrink-0">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        {subtitle && (
          <p className="text-xs truncate" style={{ color: PLAYER_MUTED }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onPrevious}
          className="p-2 text-white/90 hover:text-white active:scale-90 transition-all"
          aria-label="Anterior"
        >
          <SkipBack size={20} fill="currentColor" />
        </button>
        <button
          type="button"
          onClick={onTogglePlay}
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center',
            'hover:brightness-110 active:scale-95 transition-all'
          )}
          style={{ backgroundColor: PLAYER_ACCENT, color: '#121619' }}
          aria-label={isPlaying ? 'Pausar' : 'Tocar'}
        >
          {isPlaying ? (
            <Pause size={22} fill="currentColor" />
          ) : (
            <Play size={22} fill="currentColor" className="ml-0.5" />
          )}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="p-2 text-white/90 hover:text-white active:scale-90 transition-all"
          aria-label="Próximo"
        >
          <SkipForward size={20} fill="currentColor" />
        </button>
      </div>

      <p className="text-sm text-white tabular-nums shrink-0 min-w-[5.5rem] text-center">
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </p>

      <VolumeSlider volume={volume} onChange={onVolumeChange} />
    </div>
  );
}

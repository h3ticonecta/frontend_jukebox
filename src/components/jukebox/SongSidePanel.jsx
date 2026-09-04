import { Disc, ListPlus, Play } from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';
import EmptyState from '../shared/EmptyState';

export default function SongSidePanel({ album, tracks, playingTrackId, onPlay, onAddToQueue }) {
  if (!album) {
    return (
      <div className="hidden md:flex w-[380px] shrink-0 flex-col border-l-2 border-primary/30 min-h-0">
        <EmptyState icon={Disc} message="Selecione uma pasta" />
      </div>
    );
  }

  return (
    <div className="hidden md:flex w-[380px] shrink-0 flex-col border-l-2 border-primary/30 min-h-0 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-border shrink-0">
        <img
          src={album.cover}
          alt={album.name}
          className="w-12 h-12 rounded-md object-cover shrink-0 neon-border-amber"
        />
        <div className="min-w-0">
          <h3 className="text-sm font-display text-foreground truncate">{album.name}</h3>
          <p className="text-xs text-muted-foreground">{album.countLabel}</p>
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto scrollbar-hide" style={{ padding: 'var(--browser-scroll-pad)' }}>
        {tracks.map((track, index) => {
          const isPlaying = playingTrackId === track.id;
          return (
            <li
              key={track.id}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg cursor-pointer group transition-colors mb-0.5',
                isPlaying && 'bg-primary/15 border border-primary/30',
                !isPlaying && 'hover:bg-muted/50'
              )}
            >
              <span className="text-xs w-5 text-center text-muted-foreground shrink-0">
                {track.number || String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm truncate', isPlaying && 'text-primary font-semibold')}>{track.title}</p>
                {track.artist && track.artist !== track.title && (
                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                )}
              </div>
              {track.duration_seconds != null && (
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {formatDuration(track.duration_seconds)}
                </span>
              )}
              <button
                type="button"
                title="Adicionar à fila"
                className="p-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-secondary transition-opacity"
                onClick={() => onAddToQueue(track)}
              >
                <ListPlus size={14} />
              </button>
              <button
                type="button"
                title="Tocar"
                className="p-1.5 text-primary hover:text-primary/80 transition-colors"
                onClick={() => onPlay(track)}
              >
                <Play size={14} fill="currentColor" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

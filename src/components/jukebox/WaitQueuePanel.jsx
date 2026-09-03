import { ListMusic, Music } from 'lucide-react';
import { cn } from '../../lib/utils';
import EmptyState from '../shared/EmptyState';
import EqualizerBars from '../shared/EqualizerBars';

export default function WaitQueuePanel({ currentSong, isPlaying, queue, highlighted = false }) {
  return (
    <div
      className={cn(
        'w-[360px] h-full flex flex-col overflow-hidden border-l-2 shrink-0 transition-all duration-300',
        highlighted ? 'border-secondary ring-2 ring-secondary/50 shadow-[0_0_20px_hsl(var(--secondary)/0.4)]' : 'border-primary/30'
      )}
    >
      <div className="px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ListMusic className="text-secondary" size={18} />
          <span className="text-sm font-display text-secondary tracking-wide neon-glow-cyan">FILA DE ESPERA</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-bold">{queue.length}</span>
      </div>

      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ padding: 'var(--browser-scroll-pad)' }}
      >
        {currentSong && (
          <div className="rounded-lg ring-2 ring-primary shadow-[0_0_18px_hsl(var(--primary)/0.5)] bg-primary/10 flex items-center justify-between px-3 py-2 gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-primary font-bold">Tocando agora</span>
              <p className="text-sm text-foreground font-semibold truncate">{currentSong.title}</p>
              {currentSong.artist && currentSong.artist !== currentSong.title && (
                <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
              )}
            </div>
            <EqualizerBars isPlaying={isPlaying} />
          </div>
        )}

        {queue.length === 0 ? (
          <EmptyState icon={Music} message="Nenhuma música na fila" size="sm" />
        ) : (
          <ul>
            {queue.map((song, i) => (
              <li
                key={`${song.id}-${i}`}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5',
                  'hover:bg-muted/50 transition-colors'
                )}
              >
                <span className="text-xs w-5 text-center text-secondary font-bold shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{song.title}</p>
                  {song.artist && song.artist !== song.title && (
                    <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

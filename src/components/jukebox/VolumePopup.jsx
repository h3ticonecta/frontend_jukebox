import { cn } from '../../lib/utils';

const SEGMENTS = 20;

/**
 * Popup central de volume (estilo jukebox clássico).
 * Aparece sempre que o volume muda (tecla `vol`, legado ou slider)
 * e some sozinho após um curto intervalo sem alterações.
 * Não bloqueia toques: pointer-events-none.
 */
export default function VolumePopup({ volume = 0, visible }) {
  const percent = Math.round(Math.min(100, Math.max(0, volume)));
  const filledSegments = Math.round((percent / 100) * SEGMENTS);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[90] flex flex-col items-center justify-center gap-5',
        'bg-black/60 pointer-events-none transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      <p className="text-sm font-display uppercase tracking-[0.4em] text-primary neon-glow-amber">
        Volume
      </p>
      <p className="text-7xl md:text-8xl font-display text-primary neon-glow-amber tabular-nums">
        {percent}%
      </p>
      <div
        className="flex items-center gap-1 rounded-lg border border-primary/60 bg-background/90 px-2.5 py-2 neon-border-amber"
        aria-hidden="true"
      >
        {Array.from({ length: SEGMENTS }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'h-5 w-2 rounded-[2px] transition-colors duration-100',
              index < filledSegments
                ? 'bg-primary shadow-[0_0_6px_hsl(var(--neon-amber)/0.8)]'
                : 'bg-muted'
            )}
          />
        ))}
      </div>
    </div>
  );
}

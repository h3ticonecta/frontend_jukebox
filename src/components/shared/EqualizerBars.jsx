import { cn } from '../../lib/utils';

export default function EqualizerBars({ isPlaying, barCount = 5 }) {
  return (
    <div className="flex items-end gap-0.5 h-5">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1 bg-primary rounded-sm',
            isPlaying && 'animate-[equalizer-bar_0.8s_ease-in-out_infinite]'
          )}
          style={{
            animationDelay: `${i * 0.12}s`,
            height: isPlaying ? undefined : '30%',
          }}
        />
      ))}
    </div>
  );
}

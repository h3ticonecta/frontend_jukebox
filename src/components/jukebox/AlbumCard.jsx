import { useEffect, useState } from 'react';
import { Disc } from 'lucide-react';
import { cn } from '../../lib/utils';

const SIZES = {
  sm: 'w-12 h-12',
  md: 'w-full h-full',
  lg: 'w-[100px] h-[100px]',
  xl: 'w-[180px] h-[180px]',
};

const VINYL_GROOVE_RINGS = [
  'inset-[4%]',
  'inset-[7%]',
  'inset-[10%]',
  'inset-[13%]',
  'inset-[16%]',
  'inset-[19%]',
];

function VinylCard({
  gradientClass,
  albumName,
  coverImage,
  isSelected,
  isFocused = false,
  spinWhenSelected = true,
  onClick,
  vinylSize = 'lg',
}) {
  const [imgOk, setImgOk] = useState(true);
  const hasImage = !!coverImage && imgOk;
  const isLarge = vinylSize === 'xl';

  useEffect(() => {
    setImgOk(true);
  }, [coverImage]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full relative transition-transform duration-300 hover:scale-105 active:scale-95 shrink-0 group touch-manipulation cursor-grab active:cursor-grabbing',
        SIZES[vinylSize] || SIZES.lg,
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_18px_hsl(var(--primary)/0.5)]',
        isFocused && !isSelected && 'ring-2 ring-secondary ring-offset-2 ring-offset-background shadow-[0_0_14px_hsl(var(--secondary)/0.45)]'
      )}
      style={
        isSelected
          ? undefined
          : {
              boxShadow: isFocused
                ? '0 0 15px rgba(56,189,248,0.35), inset 0 0 30px rgba(0,0,0,0.4)'
                : '0 0 15px rgba(251,236,63,0.3), inset 0 0 30px rgba(0,0,0,0.4)',
            }
      }
    >
      <div className="absolute inset-0 rounded-full bg-zinc-900 border-2 border-zinc-700 overflow-hidden">
        <div className="absolute inset-0 rounded-full pointer-events-none bg-[repeating-radial-gradient(circle_at_center,transparent_0,transparent_1px,rgba(255,255,255,0.04)_1px,rgba(255,255,255,0.04)_2px)] opacity-70" />
        <div className="absolute inset-1 rounded-full border border-zinc-600/50 pointer-events-none" />
        <div className="absolute inset-3 rounded-full border border-zinc-600/40 pointer-events-none" />
        {VINYL_GROOVE_RINGS.map((inset, index) => (
          <div
            key={inset}
            className={cn('absolute rounded-full border pointer-events-none', inset)}
            style={{ borderColor: `rgba(113, 113, 122, ${0.22 + (index % 2) * 0.08})` }}
          />
        ))}
        <div className="absolute inset-[22%] rounded-full overflow-hidden border-2 border-zinc-800 z-[1]">
          {hasImage ? (
            <div
              className={cn(
                'vinyl-label-spin w-full h-full',
                isSelected && spinWhenSelected && 'animate-spin-vinyl',
                !isSelected && 'group-hover:animate-spin-vinyl-slow'
              )}
            >
              <img
                src={coverImage}
                alt={albumName}
                draggable={false}
                className="w-full h-full object-cover img-no-drag pointer-events-none select-none"
                onDragStart={(event) => event.preventDefault()}
                onError={() => setImgOk(false)}
              />
            </div>
          ) : (
            <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', gradientClass)}>
              <Disc className="text-foreground/80" size={isLarge ? 36 : 22} />
            </div>
          )}
        </div>
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900 border border-zinc-700 z-10',
            isLarge ? 'w-4 h-4' : 'w-3 h-3'
          )}
        />
      </div>
    </button>
  );
}

export default function AlbumCard({
  gradientClass,
  albumName,
  artistName,
  coverImage,
  size = 'md',
  isSelected = false,
  isFocused = false,
  spinWhenSelected = true,
  onClick,
}) {
  const [imgOk, setImgOk] = useState(true);
  const hasImage = !!coverImage && imgOk;

  if (size === 'lg' || size === 'xl') {
    return (
      <VinylCard
        gradientClass={gradientClass}
        albumName={albumName}
        coverImage={coverImage}
        isSelected={isSelected}
        isFocused={isFocused}
        spinWhenSelected={spinWhenSelected}
        onClick={onClick}
        vinylSize={size}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        SIZES[size],
        'rounded-lg relative transition-transform duration-300 hover:scale-105 active:scale-95',
        'cursor-pointer shrink-0 group touch-manipulation',
        isSelected &&
          'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_18px_hsl(var(--primary)/0.5)]',
        isFocused &&
          !isSelected &&
          'ring-2 ring-secondary ring-offset-2 ring-offset-background shadow-[0_0_14px_hsl(var(--secondary)/0.45)]',
        !isSelected && !isFocused && 'neon-border-amber'
      )}
    >
      <div className="absolute inset-0 rounded-[inherit] overflow-hidden">
        {hasImage ? (
          <img
            src={coverImage}
            alt={albumName}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover img-no-drag pointer-events-none select-none"
            onDragStart={(event) => event.preventDefault()}
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br flex items-center justify-center', gradientClass)}>
            <Disc className="text-foreground/80" size={22} />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent z-10">
          <p className="text-foreground text-xs font-display truncate">{albumName}</p>
          <p className="text-foreground/70 text-[10px] truncate">{artistName}</p>
        </div>
      </div>
    </button>
  );
}

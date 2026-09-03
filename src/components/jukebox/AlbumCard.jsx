import { useState } from 'react';
import { Disc } from 'lucide-react';
import { cn } from '../../lib/utils';

const SIZES = {
  sm: 'w-12 h-12',
  md: 'w-full h-full',
  lg: 'w-[72px] h-[72px]',
};

function VinylCard({ gradientClass, albumName, coverImage, isSelected, onClick }) {
  const [imgOk, setImgOk] = useState(true);
  const hasImage = !!coverImage && imgOk;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full relative transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 group',
        SIZES.lg,
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_18px_hsl(var(--primary)/0.5)]'
      )}
      style={{
        boxShadow: '0 0 15px rgba(251,236,63,0.3), inset 0 0 30px rgba(0,0,0,0.4)',
      }}
    >
      <div className="absolute inset-0 rounded-full bg-zinc-900 border-2 border-zinc-700 overflow-hidden">
        <div className="absolute inset-1 rounded-full border border-zinc-600/50" />
        <div className="absolute inset-3 rounded-full border border-zinc-600/30" />
        <div className="absolute inset-[22%] rounded-full overflow-hidden border-2 border-zinc-800">
          {hasImage ? (
            <img
              src={coverImage}
              alt={albumName}
              className="w-full h-full object-cover group-hover:animate-spin-vinyl-slow"
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', gradientClass)}>
              <Disc className="text-foreground/80" size={16} />
            </div>
          )}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-900 z-10" />
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
  onClick,
}) {
  const [imgOk, setImgOk] = useState(true);
  const hasImage = !!coverImage && imgOk;

  if (size === 'lg') {
    return (
      <VinylCard
        gradientClass={gradientClass}
        albumName={albumName}
        coverImage={coverImage}
        isSelected={isSelected}
        onClick={onClick}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        SIZES[size],
        'rounded-lg flex flex-col items-center justify-center gap-1',
        'transition-all duration-300 hover:scale-105 active:scale-95',
        'neon-border-amber cursor-pointer shrink-0 overflow-hidden relative group',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_18px_hsl(var(--primary)/0.5)]',
        isFocused && 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background'
      )}
    >
      {hasImage ? (
        <img
          src={coverImage}
          alt={albumName}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className={cn('absolute inset-0 bg-gradient-to-br flex items-center justify-center', gradientClass)}>
          <Disc className="text-foreground/80" size={32} />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent z-10">
        <p className="text-foreground text-sm font-display truncate">{albumName}</p>
        <p className="text-foreground/70 text-xs truncate">{artistName}</p>
      </div>
    </button>
  );
}

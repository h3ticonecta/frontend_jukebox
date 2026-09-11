import { useCallback, useMemo } from 'react';
import { Star } from 'lucide-react';
import { useInfiniteMarquee } from '../../hooks/useInfiniteMarquee';
import { GenreCarouselSkeleton } from '../shared/Skeleton';
import AlbumCard from './AlbumCard';

function GenreSlide({ genre, isSelected, onActivate }) {
  return (
    <div className="flex flex-col items-center gap-2.5 shrink-0 w-[200px]">
      <AlbumCard
        size="xl"
        gradientClass={genre.coverColor}
        albumName={genre.name}
        coverImage={genre.cover}
        artistName=""
        isSelected={isSelected}
        onClick={() => onActivate(genre)}
      />
      <button
        type="button"
        onClick={() => onActivate(genre)}
        className="text-sm font-semibold text-foreground/80 text-center leading-tight max-w-full px-1 touch-manipulation hover:text-foreground active:scale-[0.98] transition-colors"
      >
        {genre.name}
      </button>
      <button
        type="button"
        onClick={() => onActivate(genre)}
        className="text-xs text-muted-foreground touch-manipulation hover:text-foreground/80 active:scale-[0.98] transition-colors"
      >
        {genre.countLabel}
      </button>
    </div>
  );
}

export default function GenreCarousel({ genres, selectedGenre, onSelectGenre, isLoading = false }) {
  const loopGenres = useMemo(() => {
    if (genres.length === 0) return [];
    return [...genres, ...genres];
  }, [genres]);

  const { scrollerRef, wasDragged, pauseForInteraction } = useInfiniteMarquee({
    enabled: genres.length > 0,
  });

  const handleActivate = useCallback(
    (genre) => {
      if (wasDragged()) return;
      pauseForInteraction();
      onSelectGenre(genre);
    },
    [onSelectGenre, pauseForInteraction, wasDragged]
  );

  if (isLoading && genres.length === 0) {
    return <GenreCarouselSkeleton />;
  }

  if (genres.length === 0) {
    return (
      <section id="hits-section" className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Star className="text-primary fill-primary" size={16} />
          <h2 className="text-sm font-display text-primary neon-glow-amber tracking-wider">SUCESSOS</h2>
        </div>
      </section>
    );
  }

  return (
    <section id="hits-section" className="px-4 py-4 border-b border-border shrink-0">
      <div className="flex items-center gap-2 mb-4">
        <Star className="text-primary fill-primary" size={16} />
        <h2 className="text-sm font-display text-primary neon-glow-amber tracking-wider">SUCESSOS</h2>
      </div>

      <div
        ref={scrollerRef}
        className="genre-marquee-mask overflow-x-auto overflow-y-hidden scrollbar-hide cursor-grab active:cursor-grabbing touch-pan-x select-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex w-max gap-8 pr-8">
          {loopGenres.map((genre, index) => (
            <GenreSlide
              key={`${genre.id}-${index}`}
              genre={genre}
              isSelected={selectedGenre?.id === genre.id}
              onActivate={handleActivate}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

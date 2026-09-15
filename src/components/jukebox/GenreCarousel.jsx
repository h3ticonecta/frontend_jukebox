import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Star } from 'lucide-react';
import { useInfiniteMarquee } from '../../hooks/useInfiniteMarquee';
import { GenreCarouselSkeleton } from '../shared/Skeleton';
import AlbumCard from './AlbumCard';

function GenreSlide({ genre, marqueeIndex, isSelected, isFocused, isClone, onActivate }) {
  return (
    <div
      className="flex flex-col items-center gap-2.5 shrink-0 w-[200px]"
      data-genre-id={genre.id}
      data-marquee-index={marqueeIndex}
    >
      <AlbumCard
        size="xl"
        gradientClass={genre.coverColor}
        albumName={genre.name}
        coverImage={genre.cover}
        artistName=""
        isSelected={isSelected}
        isFocused={isFocused}
        spinWhenSelected={!isClone}
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

export default function GenreCarousel({
  genres,
  selectedGenre,
  focusedGenreId,
  onSelectGenre,
  isLoading = false,
}) {
  const loopGenres = useMemo(() => {
    if (genres.length === 0) return [];
    return [...genres, ...genres];
  }, [genres]);

  const { scrollerRef, trackRef, wasDragged, pauseForInteraction, scrollToItemIndex } = useInfiniteMarquee({
    enabled: genres.length > 0,
  });
  const pendingScrollIndexRef = useRef(null);

  const handleActivate = useCallback(
    (genre) => {
      if (wasDragged()) return;
      pauseForInteraction();
      onSelectGenre(genre);
    },
    [onSelectGenre, pauseForInteraction, wasDragged]
  );

  useEffect(() => {
    if (!selectedGenre?.id || genres.length === 0) {
      pendingScrollIndexRef.current = null;
      return;
    }

    const index = genres.findIndex((genre) => genre.id === selectedGenre.id);
    if (index < 0) return;

    pendingScrollIndexRef.current = index;
    pauseForInteraction();
  }, [selectedGenre?.id, genres, pauseForInteraction]);

  useLayoutEffect(() => {
    const index = pendingScrollIndexRef.current;
    if (index == null || genres.length === 0) return;

    scrollToItemIndex(index, genres.length);
    pendingScrollIndexRef.current = null;
  }, [selectedGenre?.id, genres.length, loopGenres.length, scrollToItemIndex]);

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
        onDragStart={(event) => event.preventDefault()}
      >
        <div ref={trackRef} className="genre-marquee-track flex w-max gap-8 pr-8 pt-8 pb-3">
          {loopGenres.map((genre, index) => {
            const isClone = index >= genres.length;
            const isSelected = selectedGenre?.id === genre.id && !isClone;
            return (
              <GenreSlide
                key={`${genre.id}-${index}`}
                genre={genre}
                marqueeIndex={index}
                isSelected={isSelected}
                isFocused={focusedGenreId === genre.id && !isClone}
                isClone={isClone}
                onActivate={handleActivate}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

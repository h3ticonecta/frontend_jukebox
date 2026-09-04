import { useMemo } from 'react';
import { Star } from 'lucide-react';
import AlbumCard from './AlbumCard';

function GenreSlide({ genre, isSelected, onSelectGenre }) {
  return (
    <div className="flex flex-col items-center gap-2.5 shrink-0 w-[200px]">
      <AlbumCard
        size="xl"
        gradientClass={genre.coverColor}
        albumName={genre.name}
        coverImage={genre.cover}
        artistName=""
        isSelected={isSelected}
        onClick={() => onSelectGenre(genre)}
      />
      <span className="text-sm font-semibold text-foreground/80 text-center leading-tight max-w-full px-1">
        {genre.name}
      </span>
      <span className="text-xs text-muted-foreground">{genre.countLabel}</span>
    </div>
  );
}

export default function GenreCarousel({ genres, selectedGenre, onSelectGenre }) {
  const loopGenres = useMemo(() => {
    if (genres.length === 0) return [];
    return [...genres, ...genres];
  }, [genres]);

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

      <div className="genre-marquee-mask overflow-hidden">
        <div className="flex w-max gap-8 animate-genre-marquee hover:[animation-play-state:paused]">
          {loopGenres.map((genre, index) => (
            <GenreSlide
              key={`${genre.id}-${index}`}
              genre={genre}
              isSelected={selectedGenre?.id === genre.id}
              onSelectGenre={onSelectGenre}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

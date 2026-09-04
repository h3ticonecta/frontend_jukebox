import { Star } from 'lucide-react';
import AlbumCard from './AlbumCard';

export default function GenreCarousel({ genres, selectedGenre, onSelectGenre }) {
  return (
    <section id="hits-section" className="px-4 py-3 border-b border-border shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <Star className="text-primary fill-primary" size={16} />
        <h2 className="text-sm font-display text-primary neon-glow-amber tracking-wider">SUCESSOS</h2>
      </div>
      <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-1">
        {genres.map((genre) => (
          <div key={genre.id} className="flex flex-col items-center gap-2 shrink-0 w-[118px]">
            <AlbumCard
              size="lg"
              gradientClass={genre.coverColor}
              albumName={genre.name}
              coverImage={genre.cover}
              artistName=""
              isSelected={selectedGenre?.id === genre.id}
              onClick={() => onSelectGenre(genre)}
            />
            <span className="text-[11px] font-semibold text-foreground/80 text-center leading-tight">{genre.name}</span>
            <span className="text-[10px] text-muted-foreground">{genre.countLabel}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

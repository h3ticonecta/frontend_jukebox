import './GenreCarousel.css';

function VinylRecord({ genre, isSelected, onClick }) {
  return (
    <button
      className={`vinyl ${isSelected ? 'vinyl--selected' : ''}`}
      type="button"
      onClick={onClick}
    >
      <div className="vinyl__disc">
        <div className="vinyl__grooves" />
        <div
          className="vinyl__label"
          style={{ background: `linear-gradient(135deg, ${genre.color}, ${genre.color}88)` }}
        >
          <span className="vinyl__label-text">{genre.name.split(' ')[0]}</span>
        </div>
      </div>
      <span className="vinyl__name">{genre.name}</span>
      <span className="vinyl__count">{genre.artistsCount} artistas</span>
    </button>
  );
}

function GenreCarousel({ genres, selectedGenre, onSelectGenre }) {
  return (
    <section className="genres">
      <div className="genres__title">
        <svg className="genres__star" width="16" height="16" viewBox="0 0 24 24" fill="#f5a623">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <h2>SUCESSOS</h2>
      </div>
      <div className="genres__carousel">
        {genres.map((genre) => (
          <VinylRecord
            key={genre.id}
            genre={genre}
            isSelected={selectedGenre === genre.id}
            onClick={() => onSelectGenre(genre.id)}
          />
        ))}
      </div>
    </section>
  );
}

export default GenreCarousel;

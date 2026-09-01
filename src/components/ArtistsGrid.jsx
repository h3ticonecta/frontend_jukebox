import './ArtistsGrid.css';

function ArtistsGrid({ artists, selectedArtist, onSelectArtist }) {
  return (
    <section className="artists">
      <div className="artists__header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <h3>
          ARTISTAS / BANDAS <span className="artists__count">({artists.length})</span>
        </h3>
      </div>
      <div className="artists__grid">
        {artists.map((artist) => (
          <button
            key={artist.id}
            className={`artist-card ${selectedArtist.id === artist.id ? 'artist-card--selected' : ''}`}
            type="button"
            onClick={() => onSelectArtist(artist)}
          >
            <img className="artist-card__cover" src={artist.cover} alt={`${artist.name} - ${artist.album}`} />
            <div className="artist-card__overlay">
              <span className="artist-card__name">{artist.name}</span>
              <span className="artist-card__info">
                {artist.album} - {artist.songsCount} músicas
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default ArtistsGrid;

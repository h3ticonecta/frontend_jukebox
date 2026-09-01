import './TrackList.css';

function TrackList({ artist, tracks, onPlay }) {
  return (
    <section className="tracks">
      <div className="tracks__header">
        <img className="tracks__thumb" src={artist.cover} alt={artist.album} />
        <div className="tracks__info">
          <h3 className="tracks__album">
            {artist.name} - {artist.album}
          </h3>
          <span className="tracks__count">{artist.songsCount} músicas</span>
        </div>
      </div>
      <ul className="tracks__list">
        {tracks.map((track) => (
          <li key={track.id} className="tracks__item">
            <span className="tracks__number">{track.number}</span>
            <div className="tracks__details">
              <span className="tracks__title">{track.title}</span>
              <span className="tracks__dots">...</span>
            </div>
            <button
              className="tracks__play"
              type="button"
              aria-label={`Adicionar ${track.title} à fila`}
              onClick={() => onPlay(track)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f5a623">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TrackList;

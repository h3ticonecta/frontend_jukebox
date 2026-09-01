import './QueuePanel.css';

function QueuePanel({ queue }) {
  return (
    <section className="queue">
      <div className="queue__header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        <h3>FILA DE ESPERA</h3>
        <span className="queue__badge">{queue.length}</span>
      </div>
      <div className={`queue__body ${queue.length > 0 ? 'queue__body--filled' : ''}`}>
        {queue.length === 0 ? (
          <div className="queue__empty">
            <svg className="queue__empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <p>Nenhuma música na fila</p>
          </div>
        ) : (
          <ul className="queue__list">
            {queue.map((item, index) => (
              <li key={`${item.id}-${index}`} className="queue__item">
                <span className="queue__position">{index + 1}</span>
                <div className="queue__item-info">
                  <span className="queue__item-title">{item.title}</span>
                  <span className="queue__item-artist">{item.artist}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default QueuePanel;

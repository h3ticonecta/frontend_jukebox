import './StatusBar.css';

function StatusBar({ credits, queueCount }) {
  return (
    <footer className="status-bar">
      <div className="status-bar__credits">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#f5a623">
          <circle cx="12" cy="12" r="10" stroke="#f5a623" strokeWidth="2" fill="none" />
          <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#f5a623" fontWeight="bold">
            $
          </text>
        </svg>
        <span>
          <strong>{credits}</strong> créditos
        </span>
      </div>
      <p className="status-bar__message">Selecione uma música para começar</p>
      <div className="status-bar__waiting">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>
          <strong>{queueCount}</strong> em espera
        </span>
      </div>
    </footer>
  );
}

export default StatusBar;

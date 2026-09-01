import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__logo">JUKE-BOX</h1>
        <span className="header__badge">Não registrado</span>
      </div>
      <div className="header__right">
        <button className="header__btn-leitura" type="button">
          LEITURA
        </button>
        <button className="header__icon-btn" type="button" aria-label="Mensagens">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </button>
        <button className="header__icon-btn" type="button" aria-label="Atualizar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default Header;

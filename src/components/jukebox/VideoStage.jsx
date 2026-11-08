import { useEffect, useState } from 'react';
import { Clapperboard, Maximize2, Minimize2, X } from 'lucide-react';
import { isVideoTrack } from '../../lib/library';
import { cn } from '../../lib/utils';

const IGNORED_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock']);

const MINI_SIZE = 'w-[min(380px,42vw)] h-[min(214px,24vw)]';

/** Tempo no mini player até voltar sozinho à tela cheia: 3 minutos. */
const MINI_AUTO_EXPAND_MS = 3 * 60 * 1000;

/**
 * Palco de vídeo do jukebox.
 *
 * Abriga o elemento de mídia ÚNICO do player (`<video>` toca tanto MP3
 * quanto MP4 — mesma API de áudio usada pelo useAudioPlayer). Estados por
 * faixa de vídeo:
 * - Tela cheia (padrão ao iniciar a faixa): overlay com fundo escuro;
 * - Mini player (qualquer tecla pressionada, ou botão minimizar): janela
 *   ~380px no canto inferior direito, liberando a navegação para escolher
 *   mais faixas e montar a fila. A tecla mantém sua ação normal;
 * - Fechado (botão X): só o áudio continua; "Ver vídeo" reabre.
 *
 * O elemento <video> nunca é desmontado — só muda de tamanho/posição —
 * então a reprodução não é interrompida nas transições.
 *
 * Camada z-30: sob o PlayerBar (z-40), o toast (z-50), o popup de volume
 * (z-90) e modais — os controles continuam acessíveis.
 */
export default function VideoStage({ mediaRef, currentSong }) {
  const [dismissedSongId, setDismissedSongId] = useState(null);
  const [minimizedSongId, setMinimizedSongId] = useState(null);

  const songId = currentSong?.id;
  const videoActive = isVideoTrack(currentSong);
  const dismissed = videoActive && dismissedSongId === songId;
  const minimized = videoActive && minimizedSongId === songId;
  const fullScreen = videoActive && !dismissed && !minimized;
  const miniVisible = videoActive && !dismissed && minimized;

  // Qualquer tecla com o vídeo em tela cheia → mini player. Sem
  // preventDefault: a tecla segue seu fluxo (navegar, fila, crédito...).
  useEffect(() => {
    if (!fullScreen) return undefined;

    const handleKeyDown = (event) => {
      if (IGNORED_KEYS.has(event.key)) return;
      setMinimizedSongId(songId);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullScreen, songId]);

  // Retorno automático à tela cheia 3 minutos após a minimização.
  // Cancela se o usuário expandir/fechar antes ou se a faixa trocar.
  useEffect(() => {
    if (!miniVisible) return undefined;

    const timer = window.setTimeout(() => {
      setMinimizedSongId(null);
    }, MINI_AUTO_EXPAND_MS);

    return () => window.clearTimeout(timer);
  }, [miniVisible, songId]);

  const closeAll = () => {
    setDismissedSongId(songId);
    setMinimizedSongId(null);
  };

  const reopenFull = () => {
    setDismissedSongId(null);
    setMinimizedSongId(null);
  };

  const controlButtonClass =
    'p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-black/60 border border-border text-foreground/80 hover:text-foreground hover:border-foreground/40 active:scale-95 transition-all touch-manipulation';

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 transition-colors duration-300',
          fullScreen ? 'bg-black/95' : 'bg-transparent pointer-events-none'
        )}
        aria-hidden={!fullScreen && !miniVisible}
      >
        <video
          ref={mediaRef}
          className={cn(
            'absolute bg-black transition-all duration-300 ease-out',
            fullScreen && 'bottom-0 right-0 w-full h-full object-contain pb-[60px]',
            miniVisible &&
              `bottom-[4.5rem] right-4 ${MINI_SIZE} object-cover rounded-xl border border-secondary/60 shadow-[0_8px_32px_rgba(0,0,0,0.85)] pointer-events-auto cursor-pointer`,
            !fullScreen && !miniVisible && 'bottom-[4.5rem] right-4 w-px h-px opacity-0 pointer-events-none'
          )}
          preload="auto"
          autoPlay
          playsInline
          onClick={miniVisible ? () => setMinimizedSongId(null) : undefined}
        />

        {fullScreen && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMinimizedSongId(songId)}
              className={controlButtonClass}
              aria-label="Minimizar vídeo (continuar navegando)"
              title="Minimizar vídeo (continuar navegando)"
            >
              <Minimize2 size={20} />
            </button>
            <button
              type="button"
              onClick={closeAll}
              className={controlButtonClass}
              aria-label="Fechar vídeo (a música continua tocando)"
              title="Fechar vídeo (a música continua tocando)"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {miniVisible && (
          <div
            className={cn('absolute bottom-[4.5rem] right-4 pointer-events-none', MINI_SIZE)}
            aria-hidden="true"
          >
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => setMinimizedSongId(null)}
                className={controlButtonClass}
                aria-label="Voltar à tela cheia"
                title="Voltar à tela cheia"
              >
                <Maximize2 size={16} />
              </button>
              <button
                type="button"
                onClick={closeAll}
                className={controlButtonClass}
                aria-label="Fechar vídeo (a música continua tocando)"
                title="Fechar vídeo (a música continua tocando)"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {dismissed && (
        <button
          type="button"
          onClick={reopenFull}
          className="fixed bottom-[4.5rem] right-4 z-30 flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-lg glass-surface border border-secondary/50 text-secondary shadow-lg active:scale-95 transition-all touch-manipulation"
          aria-label="Mostrar vídeo"
          title="Mostrar vídeo"
        >
          <Clapperboard size={18} />
          <span className="text-sm font-display tracking-wide">Ver vídeo</span>
        </button>
      )}
    </>
  );
}

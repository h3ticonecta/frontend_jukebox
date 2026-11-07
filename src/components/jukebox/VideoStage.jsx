import { useState } from 'react';
import { Clapperboard, X } from 'lucide-react';
import { isVideoTrack } from '../../lib/library';
import { cn } from '../../lib/utils';

/**
 * Palco de vídeo do jukebox.
 *
 * Abriga o elemento de mídia ÚNICO do player (`<video>` toca tanto MP3
 * quanto MP4 — mesma API de áudio usada pelo useAudioPlayer). Quando a
 * faixa atual é de vídeo (`media_type: "video"` ou extensão .mp4 etc.),
 * exibe o vídeo em tela cheia; em faixas de áudio o palco fica invisível.
 *
 * Camada z-30: fica sob o PlayerBar (z-40), o toast (z-50), o popup de
 * volume (z-90) e modais — os controles continuam acessíveis.
 */
export default function VideoStage({ mediaRef, currentSong }) {
  const [dismissedSongId, setDismissedSongId] = useState(null);

  const videoActive = isVideoTrack(currentSong);
  const visible = videoActive && dismissedSongId !== currentSong?.id;
  const showReopenButton = videoActive && !visible;

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 flex items-center justify-center bg-black/95',
          'transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden={!visible}
      >
        {/* padding-bottom reserva a faixa do PlayerBar (~72px + timeline) */}
        <video
          ref={mediaRef}
          className="w-full h-full object-contain pb-[76px]"
          preload="auto"
          autoPlay
          playsInline
        />

        {visible && (
          <button
            type="button"
            onClick={() => setDismissedSongId(currentSong.id)}
            className="absolute top-4 right-4 p-3 min-w-[48px] min-h-[48px] rounded-full bg-black/60 border border-border text-foreground/80 hover:text-foreground hover:border-foreground/40 active:scale-95 transition-all touch-manipulation"
            aria-label="Fechar vídeo (a música continua tocando)"
            title="Fechar vídeo (a música continua tocando)"
          >
            <X size={22} />
          </button>
        )}
      </div>

      {showReopenButton && (
        <button
          type="button"
          onClick={() => setDismissedSongId(null)}
          className="fixed bottom-24 right-4 z-30 flex items-center gap-2 px-4 py-3 min-h-[48px] rounded-lg glass-surface border border-secondary/50 text-secondary shadow-lg active:scale-95 transition-all touch-manipulation"
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

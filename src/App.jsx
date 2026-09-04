import { useCallback, useEffect, useRef, useState } from 'react';
import { CREDITS_PER_SONG, DEFAULT_SONG_PRICE } from './api/config';
import { registrarCredito, registrarMusicaTocada } from './api/maquinas';
import { useAuth } from './context/AuthContext';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLibrary } from './hooks/useLibrary';
import { buildPlayerSubtitle } from './lib/library';
import {
  addCredits,
  deductCredits,
  getCreditsBalance,
} from './lib/storage';
import MachineLoginCard from './components/auth/MachineLoginCard';
import AlbumBrowser from './components/jukebox/AlbumBrowser';
import GenreCarousel from './components/jukebox/GenreCarousel';
import JukeboxHeader from './components/jukebox/JukeboxHeader';
import JukeboxShell from './components/jukebox/JukeboxShell';
import PlayerBar from './components/jukebox/PlayerBar';
import SongSidePanel from './components/jukebox/SongSidePanel';
import SyncBanner from './components/jukebox/SyncBanner';
import WaitQueuePanel from './components/jukebox/WaitQueuePanel';
import CreditToast from './components/shared/CreditToast';

function JukeboxApp() {
  const { token, machine, teclas, refreshConfig } = useAuth();
  const library = useLibrary(token);

  const [queue, setQueue] = useState([]);
  const [credits, setCredits] = useState(() => getCreditsBalance());
  const [actionError, setActionError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [keysPanelOpen, setKeysPanelOpen] = useState(false);
  const [highlightQueue, setHighlightQueue] = useState(false);
  const [creditToastVisible, setCreditToastVisible] = useState(false);

  const queueRef = useRef(queue);
  const tracksRef = useRef(library.tracks);
  const creditToastTimerRef = useRef(null);
  const audioRefHolder = useRef(null);
  queueRef.current = queue;
  tracksRef.current = library.tracks;

  const getPlaylist = useCallback(() => {
    if (queueRef.current.length > 0) return queueRef.current;
    return tracksRef.current;
  }, []);

  const playFromPlaylist = useCallback((track) => {
    if (!track) {
      audioRefHolder.current?.clearCurrentSong();
      return;
    }

    const album = library.selectedAlbum || library.selectedGenre;
    audioRefHolder.current?.play({
      ...track,
      cover: track.cover || track.cover_url || album?.cover || null,
    });
  }, [library.selectedAlbum, library.selectedGenre]);

  const handlePlayNext = useCallback(() => {
    const player = audioRefHolder.current;
    const current = player?.currentSong;
    if (!current) return;

    const playlist = getPlaylist();
    const currentIndex = playlist.findIndex((track) => track.id === current.id);
    const nextTrack = currentIndex >= 0 ? playlist[currentIndex + 1] : null;

    if (nextTrack) {
      playFromPlaylist(nextTrack);
      setQueue((prev) => {
        const index = prev.findIndex((track) => track.id === current.id);
        if (index >= 0) return prev.slice(index + 1);
        return prev;
      });
      return;
    }

    player.clearCurrentSong();
    setQueue([]);
  }, [getPlaylist, playFromPlaylist]);

  const audio = useAudioPlayer({ onEnded: handlePlayNext });
  audioRefHolder.current = audio;

  const handleSkip = useCallback(() => {
    handlePlayNext();
  }, [handlePlayNext]);

  const handlePlayPrevious = useCallback(() => {
    const player = audioRefHolder.current;
    if (!player?.currentSong) return;

    if (player.currentTime > 3) {
      player.seek(0);
      return;
    }

    const playlist = getPlaylist();
    const currentIndex = playlist.findIndex((track) => track.id === player.currentSong.id);
    if (currentIndex > 0) {
      playFromPlaylist(playlist[currentIndex - 1]);
    } else {
      player.seek(0);
    }
  }, [getPlaylist, playFromPlaylist]);

  const showCreditToast = useCallback(() => {
    setCreditToastVisible(true);
    if (creditToastTimerRef.current) {
      window.clearTimeout(creditToastTimerRef.current);
    }
    creditToastTimerRef.current = window.setTimeout(() => {
      setCreditToastVisible(false);
      creditToastTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (creditToastTimerRef.current) {
        window.clearTimeout(creditToastTimerRef.current);
      }
    };
  }, []);

  const handleInsertCredit = useCallback(async () => {
    if (!token) return;
    setActionError(null);
    try {
      await registrarCredito(token, { valor: 1, origem: 'moeda' });
      const next = addCredits(1);
      setCredits(next);
      showCreditToast();
    } catch (err) {
      setActionError(err.message || 'Erro ao registrar crédito');
    }
  }, [token, showCreditToast]);

  const handleAddToQueue = useCallback((track) => {
    const album = library.selectedAlbum || library.selectedGenre;
    setQueue((prev) => [
      ...prev,
      {
        ...track,
        cover: track.cover_url || album?.cover || null,
      },
    ]);
  }, [library.selectedAlbum, library.selectedGenre]);

  const handlePlay = useCallback(
    async (track) => {
      if (!token) return;

      if (credits < CREDITS_PER_SONG) {
        setActionError('Créditos insuficientes. Insira créditos para tocar músicas.');
        return;
      }

      setActionError(null);
      const album = library.selectedAlbum || library.selectedGenre;

      try {
        await registrarMusicaTocada(token, {
          musica_key: track.key,
          musica_nome: track.title,
          titulo: track.title,
          pasta: track.pasta || album?.path || '',
          media_type: track.media_type || 'audio',
          media_url: track.media_url,
          cover_url: track.cover_url || album?.cover || null,
          valor: DEFAULT_SONG_PRICE,
        });

        const nextCredits = deductCredits(CREDITS_PER_SONG);
        setCredits(nextCredits);

        const song = {
          ...track,
          cover: track.cover_url || album?.cover || null,
        };

        audio.play(song);
        handleAddToQueue(track);
      } catch (err) {
        setActionError(err.message || 'Erro ao registrar música tocada');
      }
    },
    [token, credits, library.selectedAlbum, library.selectedGenre, audio, handleAddToQueue]
  );

  const handleCancel = useCallback(() => {
    setKeysPanelOpen(false);
    setActionError(null);
  }, []);

  const handleKeyboardAction = useCallback(
    (acao) => {
      switch (acao) {
        case 'cima':
          library.navigateGenre(-1);
          break;
        case 'baixo':
          library.navigateGenre(1);
          break;
        case 'esquerda':
          library.navigateAlbum(-1);
          break;
        case 'direita':
          library.navigateAlbum(1);
          break;
        case 'credito':
          handleInsertCredit();
          break;
        case 'hits':
          document.getElementById('hits-section')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          break;
        case 'fila':
          setHighlightQueue(true);
          break;
        case 'pular':
          handleSkip();
          break;
        case 'vol_mais':
          audio.adjustVolume(0.1);
          break;
        case 'vol_menos':
          audio.adjustVolume(-0.1);
          break;
        case 'cancelar':
          handleCancel();
          break;
        default:
          break;
      }
    },
    [library, audio, handleSkip, handleCancel, handleInsertCredit]
  );

  useKeyboardShortcuts({
    teclas,
    onAction: handleKeyboardAction,
  });

  useEffect(() => {
    if (!highlightQueue) return undefined;
    const timer = window.setTimeout(() => setHighlightQueue(false), 2000);
    return () => window.clearTimeout(timer);
  }, [highlightQueue]);

  const handleToggleKeysPanel = useCallback(
    async (open) => {
      const nextOpen = typeof open === 'boolean' ? open : !keysPanelOpen;
      if (nextOpen) {
        await refreshConfig();
      }
      setKeysPanelOpen(nextOpen);
    },
    [keysPanelOpen, refreshConfig]
  );

  const handleSyncLibrary = useCallback(async () => {
    setIsSyncing(true);
    try {
      await library.refreshLibrary();
    } finally {
      setIsSyncing(false);
    }
  }, [library]);

  const headerError = actionError || library.error;

  return (
    <>
      <JukeboxShell
        header={
          <>
            <JukeboxHeader
              isPlaying={audio.isPlaying}
              isSyncing={isSyncing || library.isLoading}
              isRegistered={Boolean(token)}
              machineName={machine?.nome_jukebox}
              errorMessage={headerError}
              teclas={teclas}
              keysPanelOpen={keysPanelOpen}
              onOpenBilling={() => {}}
              onToggleKeysPanel={handleToggleKeysPanel}
              onSyncLibrary={handleSyncLibrary}
            />
            <SyncBanner needsSync={library.needsSync} />
          </>
        }
        genreCarousel={
          <GenreCarousel
            genres={library.genres}
            selectedGenre={library.selectedGenre}
            onSelectGenre={library.selectGenre}
          />
        }
        queuePanel={
          <WaitQueuePanel
            currentSong={audio.currentSong}
            isPlaying={audio.isPlaying}
            queue={queue}
            highlighted={highlightQueue}
          />
        }
        playerBar={
          <PlayerBar
            audioRef={audio.audioRef}
            currentSong={audio.currentSong}
            subtitle={buildPlayerSubtitle(
              audio.currentSong,
              library.selectedAlbum || library.selectedGenre
            )}
            isPlaying={audio.isPlaying}
            currentTime={audio.currentTime}
            duration={audio.duration}
            volume={audio.volume}
            credits={credits}
            queueCount={queue.length}
            onTogglePlay={audio.togglePlay}
            onPrevious={handlePlayPrevious}
            onNext={handlePlayNext}
            onVolumeChange={audio.setVolume}
            onInsertCredit={handleInsertCredit}
          />
        }
      >
        <div className="flex flex-1 min-h-0 min-w-0">
          <AlbumBrowser
            albums={library.albums}
            selectedAlbumId={library.selectedAlbum?.id}
            onSelectAlbum={library.selectAlbum}
          />
          <SongSidePanel
            album={library.selectedAlbum || library.selectedGenre}
            tracks={library.tracks}
            playingTrackId={audio.currentSong?.id}
            onPlay={handlePlay}
            onAddToQueue={handleAddToQueue}
          />
        </div>
      </JukeboxShell>

      <CreditToast visible={creditToastVisible} />
    </>
  );
}

function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <MachineLoginCard />;
  }

  return <JukeboxApp />;
}

export default App;

import { useCallback, useEffect, useRef, useState } from 'react';
import { CREDITS_PER_SONG, DEFAULT_SONG_PRICE } from './api/config';
import { registrarCredito, registrarMusicaTocada } from './api/maquinas';
import { addBillingEvent } from './lib/billing';
import { useAuth } from './context/AuthContext';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useJukeboxKeyboard } from './hooks/useJukeboxKeyboard';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLibrary } from './hooks/useLibrary';
import { buildPlayerSubtitle } from './lib/library';
import {
  addCredits,
  deductCredits,
  getCreditsBalance,
  getSessionQueue,
  setSessionQueue,
} from './lib/storage';
import { syncQueueMediaCache } from './lib/queueMediaCache';
import MachineLoginCard from './components/auth/MachineLoginCard';
import AlbumBrowser from './components/jukebox/AlbumBrowser';
import BillingModal from './components/jukebox/BillingModal';
import GenreCarousel from './components/jukebox/GenreCarousel';
import JukeboxHeader from './components/jukebox/JukeboxHeader';
import JukeboxShell from './components/jukebox/JukeboxShell';
import PlayerBar from './components/jukebox/PlayerBar';
import SongSidePanel from './components/jukebox/SongSidePanel';
import PrefetchBanner from './components/jukebox/PrefetchBanner';
import SyncBanner from './components/jukebox/SyncBanner';
import WaitQueuePanel from './components/jukebox/WaitQueuePanel';
import CreditToast from './components/shared/CreditToast';

function JukeboxApp() {
  const { token, machine, teclas, refreshConfig } = useAuth();
  const library = useLibrary(token);

  const [queue, setQueue] = useState(() => getSessionQueue());
  const [credits, setCredits] = useState(() => getCreditsBalance());
  const [actionError, setActionError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [keysPanelOpen, setKeysPanelOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [highlightQueue, setHighlightQueue] = useState(false);
  const [creditToastVisible, setCreditToastVisible] = useState(false);

  const queueRef = useRef(queue);
  const tracksRef = useRef(library.tracks);
  const creditToastTimerRef = useRef(null);
  const audioRefHolder = useRef(null);
  queueRef.current = queue;
  tracksRef.current = library.tracks;

  useEffect(() => {
    setSessionQueue(queue);
  }, [queue]);

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

  const playTrack = useCallback(
    async (track, { fromQueue = false } = {}) => {
      if (!token || !track?.media_url) return false;

      if (!fromQueue && getCreditsBalance() < CREDITS_PER_SONG) {
        setActionError('Créditos insuficientes');
        return false;
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

        if (!fromQueue) {
          const nextCredits = deductCredits(CREDITS_PER_SONG);
          setCredits(nextCredits);
        }

        playFromPlaylist({
          ...track,
          cover: track.cover || track.cover_url || album?.cover || null,
        });
        return true;
      } catch (err) {
        setActionError(err.message || 'Erro ao registrar música tocada');
        return false;
      }
    },
    [token, library.selectedAlbum, library.selectedGenre, playFromPlaylist]
  );

  const handlePlayNext = useCallback(async () => {
    const player = audioRefHolder.current;
    const current = player?.currentSong;
    if (!current) return;

    const waiting = queueRef.current;
    if (waiting.length > 0) {
      const [nextTrack, ...rest] = waiting;
      setQueue(rest);
      const played = await playTrack(nextTrack, { fromQueue: true });
      if (!played) {
        setQueue((prev) => [nextTrack, ...prev]);
        player.clearCurrentSong();
      }
      return;
    }

    player.clearCurrentSong();
  }, [playTrack]);

  const audio = useAudioPlayer({ onEnded: handlePlayNext });
  audioRefHolder.current = audio;

  useEffect(() => {
    syncQueueMediaCache({
      currentSong: audio.currentSong,
      queue,
    });
  }, [queue, audio.currentSong]);

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

    const tracks = tracksRef.current;
    const currentIndex = tracks.findIndex((track) => track.id === player.currentSong.id);
    if (currentIndex > 0) {
      playFromPlaylist(tracks[currentIndex - 1]);
    } else {
      player.seek(0);
    }
  }, [playFromPlaylist]);

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
      addBillingEvent({ type: 'credito', valor: 1, creditos: 1 });
      showCreditToast();
    } catch (err) {
      setActionError(err.message || 'Erro ao registrar crédito');
    }
  }, [token, showCreditToast]);

  const handleAddToQueue = useCallback(
    (track) => {
      if (!token || !track?.media_url) return;

      if (getCreditsBalance() < CREDITS_PER_SONG) {
        setActionError('Créditos insuficientes');
        return;
      }

      setActionError(null);
      const nextCredits = deductCredits(CREDITS_PER_SONG);
      setCredits(nextCredits);

      const album = library.selectedAlbum || library.selectedGenre;
      setQueue((prev) => [
        ...prev,
        {
          ...track,
          cover: track.cover_url || album?.cover || null,
        },
      ]);
    },
    [token, library.selectedAlbum, library.selectedGenre]
  );

  const handlePlay = useCallback(
    async (track) => {
      if (!token) return;
      await playTrack(track);
    },
    [token, playTrack]
  );

  const handleCancel = useCallback(() => {
    setKeysPanelOpen(false);
    setBillingOpen(false);
    setActionError(null);
  }, []);

  const keyboard = useJukeboxKeyboard({
    library,
    onAddToQueue: handleAddToQueue,
    onHighlightQueue: () => setHighlightQueue(true),
    onHits: () => document.getElementById('hits-section')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
    onCredit: handleInsertCredit,
    onSkip: handleSkip,
    onVolume: (delta) => audio.adjustVolume(delta),
    onCancel: handleCancel,
  });

  useKeyboardShortcuts({
    teclas,
    onAction: keyboard.handleKeyboardAction,
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
              isPrefetching={library.isPrefetching}
              isRegistered={Boolean(token)}
              machineName={machine?.nome_jukebox}
              errorMessage={headerError}
              teclas={teclas}
              keysPanelOpen={keysPanelOpen}
              onOpenBilling={() => setBillingOpen(true)}
              onToggleKeysPanel={handleToggleKeysPanel}
              onSyncLibrary={handleSyncLibrary}
              onPrefetchCatalog={library.prefetchCatalog}
            />
            <PrefetchBanner progress={library.prefetchProgress} />
            <SyncBanner needsSync={library.needsSync} />
          </>
        }
        genreCarousel={
          <GenreCarousel
            genres={library.genres}
            selectedGenre={library.selectedGenre}
            focusedGenreId={keyboard.focusedGenreId}
            onSelectGenre={(genre) => {
              library.selectGenre(genre);
              keyboard.setFocusZone('genres');
            }}
            isLoading={library.loading.genres}
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
        <div className="flex flex-1 min-h-0 min-w-0 flex-col md:flex-row">
          <AlbumBrowser
            albums={library.albums}
            selectedAlbumId={library.selectedAlbum?.id}
            focusedAlbumId={keyboard.focusedAlbumId}
            onSelectAlbum={(album) => {
              library.selectAlbum(album);
              keyboard.setFocusZone('albums');
            }}
            isLoading={library.loading.albums}
          />
          <SongSidePanel
            album={library.selectedAlbum || library.selectedGenre}
            tracks={library.tracks}
            playingTrackId={audio.currentSong?.id}
            focusedTrackId={keyboard.focusedTrackId}
            onPlay={(track) => {
              library.selectTrack(track);
              keyboard.setFocusZone('tracks');
              handlePlay(track);
            }}
            onAddToQueue={handleAddToQueue}
            isLoading={library.loading.tracks}
          />
        </div>
      </JukeboxShell>

      <CreditToast visible={creditToastVisible} />
      {billingOpen && (
        <BillingModal
          token={token}
          machineName={machine?.nome_jukebox}
          onClose={() => setBillingOpen(false)}
        />
      )}
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

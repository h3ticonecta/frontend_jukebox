import { useCallback, useEffect, useRef, useState } from 'react';
import { CREDITS_PER_SONG } from './api/config';
import { registrarCredito, registrarMusicaTocada } from './api/maquinas';
import { fetchRoletaMaquina } from './api/roleta';
import { addBillingEvent } from './lib/billing';
import {
  ROLETA_SESSION_MS,
  addRoletaGiros,
  getRoletaFaixasParticipantes,
  getRoletaGiros,
  hasRoletaBonusRecarga,
  mergeRoletaFaixas,
  normalizeRoletaConfig,
  resolveInsercaoRoleta,
  setRoletaBonusRecarga,
} from './lib/roleta';
import { useAuth } from './context/AuthContext';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useJukeboxKeyboard } from './hooks/useJukeboxKeyboard';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLibrary } from './hooks/useLibrary';
import { useVolumeShortcuts } from './hooks/useVolumeShortcuts';
import { buildMusicaTocadaPayload, buildPlayerSubtitle } from './lib/library';
import {
  addCredits,
  deductCredits,
  getCreditsBalance,
  getPersistedQueue,
  setSessionCurrentSong,
  setSessionQueue,
} from './lib/storage';
import { syncQueueMediaCache } from './lib/queueMediaCache';
import MachineLoginCard from './components/auth/MachineLoginCard';
import AdminPage from './components/admin/AdminPage';
import AlbumBrowser from './components/jukebox/AlbumBrowser';
import BillingModal from './components/jukebox/BillingModal';
import GenreCarousel from './components/jukebox/GenreCarousel';
import JukeboxHeader from './components/jukebox/JukeboxHeader';
import JukeboxShell from './components/jukebox/JukeboxShell';
import PlayerBar from './components/jukebox/PlayerBar';
import SongSidePanel from './components/jukebox/SongSidePanel';
import PrefetchBanner from './components/jukebox/PrefetchBanner';
import RoletaFab from './components/jukebox/RoletaFab';
import RoletaModal from './components/jukebox/RoletaModal';
import SyncBanner from './components/jukebox/SyncBanner';
import VideoStage from './components/jukebox/VideoStage';
import VolumePopup from './components/jukebox/VolumePopup';
import WaitQueuePanel from './components/jukebox/WaitQueuePanel';
import CreditToast from './components/shared/CreditToast';

function JukeboxApp() {
  const { token, machine, teclas, refreshConfig } = useAuth();
  const library = useLibrary(token);

  const [queue, setQueue] = useState(() => getPersistedQueue());
  const [credits, setCredits] = useState(() => getCreditsBalance());
  const [actionError, setActionError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [keysPanelOpen, setKeysPanelOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [highlightQueue, setHighlightQueue] = useState(false);
  const [creditToastVisible, setCreditToastVisible] = useState(false);
  const [creditToastMessage, setCreditToastMessage] = useState(undefined);
  const [volumePopupVisible, setVolumePopupVisible] = useState(false);
  const [roletaConfig, setRoletaConfig] = useState(null);
  const [roletaGiros, setRoletaGiros] = useState(() => getRoletaGiros());
  const [roletaOpen, setRoletaOpen] = useState(false);

  const queueRef = useRef(queue);
  const tracksRef = useRef(library.tracks);
  const creditToastTimerRef = useRef(null);
  const volumePopupTimerRef = useRef(null);
  const audioRefHolder = useRef(null);
  const resumeStartedRef = useRef(false);
  const roletaConfigRef = useRef(null);
  const roletaSessionRef = useRef({ total: 0, timer: null });
  queueRef.current = queue;
  tracksRef.current = library.tracks;

  useEffect(() => {
    setSessionQueue(queue);
  }, [queue]);

  const playFromPlaylist = useCallback(async (track) => {
    if (!track) {
      audioRefHolder.current?.clearCurrentSong();
      return false;
    }

    const album = library.selectedAlbum || library.selectedGenre;
    const player = audioRefHolder.current;
    if (!player?.play) return false;

    return player.play({
      ...track,
      cover: track.cover || track.cover_url || album?.cover || null,
    });
  }, [library.selectedAlbum, library.selectedGenre]);

  const markPlayingInQueue = useCallback((track) => {
    setQueue((prev) => {
      const playing = { ...track, playbackStarted: true };
      const rest = prev.filter((item) => item.id !== track.id);
      return [playing, ...rest];
    });
  }, []);

  const playTrack = useCallback(
    async (track, { fromQueue = false, resume = false } = {}) => {
      if (!token || !track?.media_url) return false;

      if (!fromQueue && !resume && getCreditsBalance() < CREDITS_PER_SONG) {
        setActionError('Créditos insuficientes');
        return false;
      }

      setActionError(null);
      const album = library.selectedAlbum || library.selectedGenre;
      const song = {
        ...track,
        cover: track.cover || track.cover_url || album?.cover || null,
      };

      if (resume) {
        const started = await playFromPlaylist(song);
        if (!started) return false;
        markPlayingInQueue(song);
        return true;
      }

      try {
        const tocadaPayload = buildMusicaTocadaPayload(song, {
          album: library.selectedAlbum,
          genre: library.selectedGenre,
        });
        if (!tocadaPayload.musica_key) {
          setActionError('Faixa sem chave no catálogo — não foi possível registrar a tocada.');
          return false;
        }
        if (!tocadaPayload.media_url) {
          setActionError('Faixa sem URL de áudio.');
          return false;
        }

        await registrarMusicaTocada(token, tocadaPayload);

        if (!fromQueue) {
          const nextCredits = deductCredits(CREDITS_PER_SONG);
          setCredits(nextCredits);
        }

        const started = await playFromPlaylist(song);
        if (!started) return false;
        if (fromQueue) {
          markPlayingInQueue(song);
        } else {
          // Reprodução direta pela lista: substitui a fila — não tocar as próximas faixas do álbum.
          setQueue([{ ...song, playbackStarted: true }]);
        }
        return true;
      } catch (err) {
        setActionError(err.message || 'Erro ao registrar música tocada');
        return false;
      }
    },
    [token, library.selectedAlbum, library.selectedGenre, playFromPlaylist, markPlayingInQueue]
  );

  const resumeQueuePlayback = useCallback(async () => {
    const pendingQueue = queueRef.current;
    if (pendingQueue.length === 0) return false;

    const nextTrack = pendingQueue[0];
    if (nextTrack.playbackStarted) {
      return playTrack(nextTrack, { resume: true });
    }

    return playTrack(nextTrack, { fromQueue: true });
  }, [playTrack]);

  const handlePlayNext = useCallback(async () => {
    const player = audioRefHolder.current;
    const current = player?.currentSong;
    if (!current) return;

    const waiting = queueRef.current;
    const currentId = current.id;
    const rest =
      waiting.length > 0 && waiting[0].id === currentId
        ? waiting.slice(1)
        : waiting.filter((item) => item.id !== currentId);

    setQueue(rest);

    if (rest.length === 0) {
      player.clearCurrentSong();
      return;
    }

    const played = await playTrack(rest[0], { fromQueue: true });
    if (!played) {
      player.clearCurrentSong();
    }
  }, [playTrack]);

  const audio = useAudioPlayer({
    onEnded: handlePlayNext,
    onDurationKnown: (song, duration_seconds) => {
      library.patchTrackDuration(song.id, Math.floor(duration_seconds));
    },
  });
  audioRefHolder.current = audio;

  // Popup de volume: exibe a cada mudança (tecla vol, legado ou slider)
  // e esconde automaticamente após breve intervalo sem alterações.
  const lastVolumeRef = useRef(audio.volume);
  useEffect(() => {
    if (lastVolumeRef.current === audio.volume) return undefined;
    lastVolumeRef.current = audio.volume;

    setVolumePopupVisible(true);
    if (volumePopupTimerRef.current) window.clearTimeout(volumePopupTimerRef.current);
    volumePopupTimerRef.current = window.setTimeout(() => {
      setVolumePopupVisible(false);
      volumePopupTimerRef.current = null;
    }, 1600);

    return () => {
      if (volumePopupTimerRef.current) {
        window.clearTimeout(volumePopupTimerRef.current);
        volumePopupTimerRef.current = null;
      }
    };
  }, [audio.volume]);

  useEffect(() => {
    const upcoming = audio.currentSong ? queue.slice(1) : queue;
    syncQueueMediaCache({
      currentSong: audio.currentSong,
      queue: upcoming,
    });
  }, [queue, audio.currentSong]);

  useEffect(() => {
    setSessionCurrentSong(audio.currentSong);
  }, [audio.currentSong]);

  useEffect(() => {
    if (!token || !audio.isAudioReady || queue.length === 0) return undefined;

    let cancelled = false;
    let retryTimer = null;

    const tryResume = async () => {
      if (cancelled || resumeStartedRef.current) return;

      const started = await resumeQueuePlayback();
      if (started) {
        resumeStartedRef.current = true;
        return;
      }

      retryTimer = window.setTimeout(tryResume, 2000);
    };

    tryResume();

    return () => {
      cancelled = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [token, audio.isAudioReady, queue.length, resumeQueuePlayback]);

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

  const showCreditToast = useCallback((message) => {
    setCreditToastMessage(message);
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
      if (roletaSessionRef.current.timer) {
        window.clearTimeout(roletaSessionRef.current.timer);
      }
    };
  }, []);

  // Contrato 12 — config da roleta da máquina (falha silenciosa = roleta desligada)
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    fetchRoletaMaquina(token)
      .then((data) => {
        if (cancelled) return;
        const cfg = normalizeRoletaConfig(data);
        roletaConfigRef.current = cfg;
        setRoletaConfig(cfg);
        // Giros pendentes de uma sessão anterior reabrem a roleta no boot
        if (cfg?.ativada && getRoletaGiros() > 0) {
          setRoletaOpen(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Sessão de inserção: pulsos de R$ 1 acumulam; 20s sem pulso fecha a sessão,
  // aplica bônus de recarga pendente e concede giros conforme a faixa atingida.
  const closeRoletaSession = useCallback(() => {
    const session = roletaSessionRef.current;
    session.timer = null;
    const total = session.total;
    session.total = 0;
    if (!total) return;

    if (hasRoletaBonusRecarga()) {
      setRoletaBonusRecarga(false);
      const extra = Math.floor(total * 0.5);
      if (extra > 0) {
        const next = addCredits(extra);
        setCredits(next);
        showCreditToast(`Bônus +50%: +${extra} créditos`);
      }
    }

    const premio = resolveInsercaoRoleta(roletaConfigRef.current, total);
    if (!premio || premio.giros <= 0) return;
    mergeRoletaFaixas(premio.faixasParticipantes);
    setRoletaGiros(addRoletaGiros(premio.giros));
    setRoletaOpen(true);
  }, [showCreditToast]);

  const handleInsertCredit = useCallback(async () => {
    if (!token) return;
    setActionError(null);
    try {
      await registrarCredito(token, { valor: 1, origem: 'moeda' });
      const next = addCredits(1);
      setCredits(next);
      addBillingEvent({ type: 'credito', valor: 1, creditos: 1 });
      showCreditToast();

      const session = roletaSessionRef.current;
      session.total += 1;
      if (session.timer) window.clearTimeout(session.timer);
      session.timer = window.setTimeout(closeRoletaSession, ROLETA_SESSION_MS);
    } catch (err) {
      setActionError(err.message || 'Erro ao registrar crédito');
    }
  }, [token, showCreditToast, closeRoletaSession]);

  const handleRoletaConsumeGiro = useCallback(() => {
    setRoletaGiros(addRoletaGiros(-1));
  }, []);

  const handleRoletaRefundGiro = useCallback(() => {
    setRoletaGiros(addRoletaGiros(1));
  }, []);

  // Prêmio de músicas grátis = créditos locais (1 música = 1 crédito);
  // não é venda — não gera POST /creditos/ nem evento de faturamento.
  const handleRoletaPrizeMusicas = useCallback((musicas) => {
    if (!musicas || musicas <= 0) return;
    setCredits(addCredits(musicas));
  }, []);

  const handleRoletaPrizeBonus = useCallback(() => {
    setRoletaBonusRecarga(true);
  }, []);

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
      const queuedTrack = {
        ...track,
        cover: track.cover_url || album?.cover || null,
      };
      setQueue((prev) => [...prev, queuedTrack]);
      setHighlightQueue(true);

      // Player livre (nada tocando): a faixa entra como atual na hora,
      // em vez de ficar parada na fila.
      if (!audioRefHolder.current?.currentSong) {
        playTrack(queuedTrack, { fromQueue: true });
      }
    },
    [token, library.selectedAlbum, library.selectedGenre, playTrack]
  );

  const handlePlay = useCallback(
    async (track) => {
      if (!token || !track) return;

      // Jukebox clássico: com música tocando (ou itens pagos aguardando),
      // nova seleção entra na fila de espera — nunca substitui a faixa atual.
      if (audioRefHolder.current?.currentSong || queueRef.current.length > 0) {
        handleAddToQueue(track);
        return;
      }

      await playTrack(track);
    },
    [token, playTrack, handleAddToQueue]
  );

  const handlePlayCd = useCallback(async () => {
    const tracks = library.tracks;
    if (!tracks.length || !token) return;

    const track = library.selectedTrack || tracks[0];
    if (!track) return;

    setActionError(null);
    await handlePlay(track);
  }, [library.tracks, library.selectedTrack, token, handlePlay]);

  const handleCancel = useCallback(() => {
    setKeysPanelOpen(false);
    setBillingOpen(false);
    setRoletaOpen(false);
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
    onPlayCd: handlePlayCd,
  });

  useKeyboardShortcuts({
    teclas,
    onAction: keyboard.handleKeyboardAction,
  });

  useVolumeShortcuts({
    teclas,
    onStep: (delta) => audio.adjustVolume(delta),
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
  const waitingQueue = audio.currentSong ? queue.slice(1) : queue;

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
            genresZoneFocused={keyboard.focusZone === 'genres'}
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
            queue={waitingQueue}
            highlighted={highlightQueue}
          />
        }
        playerBar={
          <PlayerBar
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
            queueCount={waitingQueue.length}
            onTogglePlay={audio.togglePlay}
            onPrevious={handlePlayPrevious}
            onNext={handlePlayNext}
            onVolumeChange={audio.setVolume}
            onInsertCredit={handleInsertCredit}
            onSeek={audio.seek}
          />
        }
      >
        <div className="flex flex-1 min-h-0 min-w-0 flex-col md:flex-row">
          <AlbumBrowser
            albums={library.albums}
            albumsTotal={library.albumsFolderTotal}
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

      <CreditToast visible={creditToastVisible} message={creditToastMessage} />
      <VideoStage mediaRef={audio.audioRef} currentSong={audio.currentSong} />
      <VolumePopup volume={audio.volume} visible={volumePopupVisible} />
      {billingOpen && (
        <BillingModal
          token={token}
          machineName={machine?.nome_jukebox}
          onClose={() => setBillingOpen(false)}
        />
      )}
      {!roletaOpen && roletaConfig?.ativada && (
        <RoletaFab giros={roletaGiros} onClick={() => setRoletaOpen(true)} />
      )}
      {roletaOpen && roletaConfig?.ativada && (
        <RoletaModal
          config={roletaConfig}
          giros={roletaGiros}
          credits={credits}
          faixasParticipantes={getRoletaFaixasParticipantes()}
          onConsumeGiro={handleRoletaConsumeGiro}
          onRefundGiro={handleRoletaRefundGiro}
          onPrizeMusicas={handleRoletaPrizeMusicas}
          onPrizeBonus={handleRoletaPrizeBonus}
          onClose={() => setRoletaOpen(false)}
        />
      )}
    </>
  );
}

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return hash;
}

function App() {
  const { isAuthenticated } = useAuth();
  const hash = useHashRoute();

  // Rota SPA do Painel Administrativo (contrato 11) — auth própria,
  // independente do login da máquina.
  if (hash.startsWith('#/admin')) {
    return <AdminPage />;
  }

  if (!isAuthenticated) {
    return <MachineLoginCard />;
  }

  return <JukeboxApp />;
}

export default App;

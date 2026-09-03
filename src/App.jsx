import { useCallback, useState } from 'react';
import { CREDITS_PER_SONG, DEFAULT_SONG_PRICE } from './api/config';
import { registrarCredito, registrarMusicaTocada } from './api/maquinas';
import { useAuth } from './context/AuthContext';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useLibrary } from './hooks/useLibrary';
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

function JukeboxApp() {
  const { token, machine, isAuthenticated } = useAuth();
  const audio = useAudioPlayer();
  const library = useLibrary(token);

  const [queue, setQueue] = useState([]);
  const [credits, setCredits] = useState(() => getCreditsBalance());
  const [actionError, setActionError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleInsertCredit = useCallback(async () => {
    if (!token) return;
    setActionError(null);
    try {
      await registrarCredito(token, { valor: 1, origem: 'moeda' });
      const next = addCredits(1);
      setCredits(next);
    } catch (err) {
      setActionError(err.message || 'Erro ao registrar crédito');
    }
  }, [token]);

  const handleAddToQueue = useCallback(
    (track) => {
      const album = library.selectedAlbum || library.selectedGenre;
      setQueue((prev) => [
        ...prev,
        {
          ...track,
          artist: album?.name || track.artist || '',
          cover: track.cover_url || album?.cover || null,
        },
      ]);
    },
    [library.selectedAlbum, library.selectedGenre]
  );

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
          artist: album?.name || track.artist || '',
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
    <JukeboxShell
      header={
        <>
          <JukeboxHeader
            isPlaying={audio.isPlaying}
            isSyncing={isSyncing || library.isLoading}
            isRegistered={isAuthenticated}
            machineName={machine?.nome_jukebox}
            errorMessage={headerError}
            onOpenBilling={() => {}}
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
        />
      }
      playerBar={
        <PlayerBar
          currentSong={audio.currentSong}
          isPlaying={audio.isPlaying}
          progress={audio.progress}
          credits={credits}
          queueCount={queue.length}
          onTogglePlay={audio.togglePlay}
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

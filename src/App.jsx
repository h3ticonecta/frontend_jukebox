import { useState } from 'react';
import JukeboxShell from './components/jukebox/JukeboxShell';
import JukeboxHeader from './components/jukebox/JukeboxHeader';
import GenreCarousel from './components/jukebox/GenreCarousel';
import AlbumBrowser from './components/jukebox/AlbumBrowser';
import SongSidePanel from './components/jukebox/SongSidePanel';
import WaitQueuePanel from './components/jukebox/WaitQueuePanel';
import PlayerBar from './components/jukebox/PlayerBar';
import { artists, genres, tracks } from './data/mockData';

function App() {
  const [selectedGenre, setSelectedGenre] = useState(genres[0].id);
  const [selectedArtist, setSelectedArtist] = useState(artists[0]);
  const [queue, setQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [credits] = useState(7);

  const handleAddToQueue = (track) => {
    const queueItem = {
      ...track,
      artist: selectedArtist.name,
      album: selectedArtist.album,
      cover: selectedArtist.cover,
    };
    setQueue((prev) => [...prev, queueItem]);
  };

  const handlePlay = (track) => {
    const song = {
      ...track,
      artist: selectedArtist.name,
      album: selectedArtist.album,
      cover: selectedArtist.cover,
    };
    setCurrentSong(song);
    setIsPlaying(true);
    handleAddToQueue(track);
  };

  return (
    <JukeboxShell
      header={
        <JukeboxHeader
          isPlaying={isPlaying}
          isRegistered={false}
          onOpenBilling={() => {}}
          onSyncLibrary={() => {}}
        />
      }
      genreCarousel={
        <GenreCarousel genres={genres} selectedGenre={selectedGenre} onSelectGenre={setSelectedGenre} />
      }
      queuePanel={<WaitQueuePanel currentSong={currentSong} isPlaying={isPlaying} queue={queue} />}
      playerBar={
        <PlayerBar
          currentSong={currentSong}
          isPlaying={isPlaying}
          progress={35}
          credits={credits}
          queueCount={queue.length}
          onTogglePlay={() => setIsPlaying((p) => !p)}
        />
      }
    >
      <div className="flex flex-1 min-h-0 min-w-0">
        <AlbumBrowser
          albums={artists}
          selectedAlbumId={selectedArtist?.id}
          onSelectAlbum={(album) => setSelectedArtist(album)}
        />
        <SongSidePanel
          album={selectedArtist}
          tracks={tracks}
          playingTrackId={currentSong?.id}
          onPlay={handlePlay}
          onAddToQueue={handleAddToQueue}
        />
      </div>
    </JukeboxShell>
  );
}

export default App;

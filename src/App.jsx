import { useState } from 'react';
import Header from './components/Header';
import GenreCarousel from './components/GenreCarousel';
import ArtistsGrid from './components/ArtistsGrid';
import TrackList from './components/TrackList';
import QueuePanel from './components/QueuePanel';
import StatusBar from './components/StatusBar';
import { artists, genres, tracks } from './data/mockData';
import './App.css';

function App() {
  const [selectedGenre, setSelectedGenre] = useState(genres[0].id);
  const [selectedArtist, setSelectedArtist] = useState(artists[0]);
  const [queue, setQueue] = useState([]);
  const [credits] = useState(7);

  const handleAddToQueue = (track) => {
    setQueue((prev) => [
      ...prev,
      {
        ...track,
        artist: selectedArtist.name,
        album: selectedArtist.album,
      },
    ]);
  };

  return (
    <div className="app">
      <Header />
      <GenreCarousel
        genres={genres}
        selectedGenre={selectedGenre}
        onSelectGenre={setSelectedGenre}
      />
      <main className="main-content">
        <ArtistsGrid
          artists={artists}
          selectedArtist={selectedArtist}
          onSelectArtist={setSelectedArtist}
        />
        <TrackList
          artist={selectedArtist}
          tracks={tracks}
          onPlay={handleAddToQueue}
        />
        <QueuePanel queue={queue} />
      </main>
      <StatusBar credits={credits} queueCount={queue.length} />
    </div>
  );
}

export default App;

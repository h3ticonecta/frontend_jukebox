import { useCallback, useEffect, useRef, useState } from 'react';
import { CREDITS_PER_SONG } from '../api/config';

export function useAudioPlayer() {
  const audioRef = useRef(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 1;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (!audio.duration) return;
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  const play = useCallback((song) => {
    const audio = audioRef.current;
    if (!audio || !song?.media_url) return;

    setCurrentSong(song);
    setProgress(0);

    if (audio.src !== song.media_url) {
      audio.src = song.media_url;
    }

    audio.play().catch(() => setIsPlaying(false));
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [currentSong]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const skip = useCallback(() => {
    stop();
    setCurrentSong(null);
  }, [stop]);

  const adjustVolume = useCallback((delta) => {
    setVolume((current) => {
      const next = Math.min(1, Math.max(0, current + delta));
      if (audioRef.current) {
        audioRef.current.volume = next;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return {
    currentSong,
    isPlaying,
    progress,
    volume,
    play,
    togglePlay,
    stop,
    skip,
    adjustVolume,
    creditsPerSong: CREDITS_PER_SONG,
  };
}

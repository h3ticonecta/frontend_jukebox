import { useCallback, useEffect, useRef, useState } from 'react';
import { CREDITS_PER_SONG } from '../api/config';
import { getVolumePercent, setVolumePercent } from '../lib/storage';

export function useAudioPlayer({ onEnded } = {}) {
  const audioRef = useRef(null);
  const onEndedRef = useRef(onEnded);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(null);
  const [volume, setVolumeState] = useState(() => getVolumePercent());

  onEndedRef.current = onEnded;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    audio.volume = getVolumePercent() / 100;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEndedRef.current?.();
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [currentSong]);

  const play = useCallback((song) => {
    const audio = audioRef.current;
    if (!audio || !song?.media_url) return;

    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(
      song.duration_seconds != null && song.duration_seconds >= 0 ? song.duration_seconds : null
    );

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
    setCurrentTime(0);
    setDuration(null);
  }, []);

  const clearCurrentSong = useCallback(() => {
    stop();
    setCurrentSong(null);
  }, [stop]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(time)) return;
    audio.currentTime = Math.max(0, time);
    setCurrentTime(audio.currentTime);
  }, []);

  const setVolume = useCallback((percent) => {
    const next = Math.min(100, Math.max(0, percent));
    setVolumeState(next);
    setVolumePercent(next);
    if (audioRef.current) {
      audioRef.current.volume = next / 100;
    }
  }, []);

  const adjustVolume = useCallback((delta) => {
    setVolumeState((current) => {
      const next = Math.min(100, Math.max(0, current + delta * 100));
      setVolumePercent(next);
      if (audioRef.current) {
        audioRef.current.volume = next / 100;
      }
      return next;
    });
  }, []);

  return {
    audioRef,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    play,
    togglePlay,
    stop,
    clearCurrentSong,
    seek,
    setVolume,
    adjustVolume,
    creditsPerSong: CREDITS_PER_SONG,
  };
}

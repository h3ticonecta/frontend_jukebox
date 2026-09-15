import { useCallback, useEffect, useRef, useState } from 'react';
import { CREDITS_PER_SONG } from '../api/config';
import { getVolumePercent, setVolumePercent } from '../lib/storage';
import { parseDurationSeconds } from '../lib/utils';

function resolveMediaUrl(url) {
  if (!url) return '';
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

async function startPlayback(audio) {
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export function useAudioPlayer({ onEnded } = {}) {
  const audioRef = useRef(null);
  const listenersCleanupRef = useRef(null);
  const onEndedRef = useRef(onEnded);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(null);
  const [volume, setVolumeState] = useState(() => getVolumePercent());

  onEndedRef.current = onEnded;

  const bindAudioRef = useCallback((node) => {
    listenersCleanupRef.current?.();
    listenersCleanupRef.current = null;
    audioRef.current = node;
    setIsAudioReady(Boolean(node));
    if (!node) {
      return;
    }

    node.volume = getVolumePercent() / 100;

    const onTimeUpdate = () => {
      setCurrentTime(node.currentTime || 0);
    };

    const syncDurationFromAudio = () => {
      if (Number.isFinite(node.duration) && node.duration > 0) {
        setDuration((current) => current ?? node.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEndedRef.current?.();
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    node.addEventListener('timeupdate', onTimeUpdate);
    node.addEventListener('loadedmetadata', syncDurationFromAudio);
    node.addEventListener('durationchange', syncDurationFromAudio);
    node.addEventListener('ended', handleEnded);
    node.addEventListener('play', onPlay);
    node.addEventListener('pause', onPause);

    listenersCleanupRef.current = () => {
      node.removeEventListener('timeupdate', onTimeUpdate);
      node.removeEventListener('loadedmetadata', syncDurationFromAudio);
      node.removeEventListener('durationchange', syncDurationFromAudio);
      node.removeEventListener('ended', handleEnded);
      node.removeEventListener('play', onPlay);
      node.removeEventListener('pause', onPause);
    };
  }, []);

  useEffect(() => () => listenersCleanupRef.current?.(), []);

  const play = useCallback(async (song) => {
    const audio = audioRef.current;
    if (!audio || !song?.media_url) return false;

    const nextSrc = resolveMediaUrl(song.media_url);
    const nextDuration = parseDurationSeconds(song.duration_seconds);

    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(nextDuration);

    if (audio.src !== nextSrc) {
      audio.src = song.media_url;
      audio.load();
    }

    let started = await startPlayback(audio);
    if (!started) {
      started = await new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
          if (settled) return;
          settled = true;
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('loadeddata', onCanPlay);
          resolve(value);
        };

        const onCanPlay = async () => {
          finish(await startPlayback(audio));
        };

        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('loadeddata', onCanPlay);

        window.setTimeout(() => finish(false), 8000);
      });
    }

    if (!started) {
      setIsPlaying(false);
    }

    return started;
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
    audioRef: bindAudioRef,
    isAudioReady,
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

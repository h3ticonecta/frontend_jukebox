import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const IMAGE_URL_PATTERN = /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i;
const MEDIA_URL_PATTERN = /\.(mp3|wav|ogg|m4a|flac|mp4|webm|mov)(\?|$)/i;

export function isPrefetchableCoverUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (MEDIA_URL_PATTERN.test(url)) return false;
  return IMAGE_URL_PATTERN.test(url);
}

export function parseDurationSeconds(value) {
  if (value == null || value === '') return null;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

export function formatDuration(seconds) {
  const parsed = parseDurationSeconds(seconds);
  if (parsed == null) return '--:--';
  const total = Math.floor(parsed);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

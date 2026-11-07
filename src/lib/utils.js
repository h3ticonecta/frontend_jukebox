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

export function parseTimecodeToSeconds(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return parseDurationSeconds(value);
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed.includes(':')) return null;

  const parts = trimmed.split(':').map((part) => Number(part.trim()));
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return null;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

export function parseDurationSeconds(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'string' && value.includes(':')) {
    return parseTimecodeToSeconds(value);
  }
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

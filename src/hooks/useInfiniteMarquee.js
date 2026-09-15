import { useCallback, useEffect, useRef } from 'react';

const SCROLL_SPEED = 0.65;
const DRAG_THRESHOLD = 8;
const CLICK_SUPPRESS_MS = 400;

export const MARQUEE_RESUME_DELAY_MS = 5000;

function isFormControl(target) {
  return target instanceof Element && Boolean(target.closest('input, textarea, select'));
}

function preventNativeDrag(event) {
  event.preventDefault();
}

function getHalfWidth(track) {
  if (!track) return 0;
  return track.scrollWidth / 2;
}

function wrapOffset(offset, half) {
  if (half <= 0) return 0;
  let next = offset;
  while (next >= half) next -= half;
  while (next < 0) next += half;
  return next;
}

function applyOffset(track, offset) {
  track.style.transform = `translate3d(-${Math.round(offset)}px, 0, 0)`;
}

export function useInfiniteMarquee({ enabled = true, resumeDelayMs = MARQUEE_RESUME_DELAY_MS } = {}) {
  const scrollerRef = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const rafRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startOffset: 0, moved: false });
  const suppressClickUntilRef = useRef(0);

  const pauseAuto = useCallback(() => {
    pausedRef.current = true;
    clearTimeout(resumeTimerRef.current);
  }, []);

  const scheduleResume = useCallback(() => {
    clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, resumeDelayMs);
  }, [resumeDelayMs]);

  const wasDragged = useCallback(
    () => dragRef.current.moved || Date.now() < suppressClickUntilRef.current,
    []
  );

  const pauseForInteraction = useCallback(() => {
    pauseAuto();
    scheduleResume();
  }, [pauseAuto, scheduleResume]);

  const scrollToItemIndex = useCallback((index, itemCount) => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track || itemCount <= 0 || index < 0 || index >= itemCount) return;

    const slides = track.querySelectorAll('[data-marquee-index]');
    const firstCopy = slides[index];
    const secondCopy = slides[index + itemCount];
    if (!firstCopy) return;

    const half = getHalfWidth(track);
    const centerOffsetFor = (slide) => slide.offsetLeft + slide.offsetWidth / 2 - scroller.clientWidth / 2;

    const current = offsetRef.current;
    let target = centerOffsetFor(firstCopy);
    if (secondCopy) {
      const alternate = centerOffsetFor(secondCopy);
      if (Math.abs(alternate - current) < Math.abs(target - current)) {
        target = alternate;
      }
    }

    offsetRef.current = wrapOffset(target, half);
    applyOffset(track, offsetRef.current);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return undefined;

    offsetRef.current = wrapOffset(offsetRef.current, getHalfWidth(track));
    applyOffset(track, offsetRef.current);

    const tick = () => {
      if (!pausedRef.current) {
        const half = getHalfWidth(track);
        offsetRef.current = wrapOffset(offsetRef.current + SCROLL_SPEED, half);
        applyOffset(track, offsetRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (isFormControl(event.target)) return;
      pauseAuto();
      dragRef.current = {
        active: true,
        startX: event.clientX,
        startOffset: offsetRef.current,
        moved: false,
      };
    };

    const onPointerMove = (event) => {
      if (!dragRef.current.active) return;
      const delta = event.clientX - dragRef.current.startX;

      if (!dragRef.current.moved) {
        if (Math.abs(delta) <= DRAG_THRESHOLD) return;
        dragRef.current.moved = true;
        if (typeof scroller.setPointerCapture === 'function') {
          try {
            scroller.setPointerCapture(event.pointerId);
          } catch {
            // Capture is optional; drag still works while the pointer stays over the scroller.
          }
        }
      }

      const half = getHalfWidth(track);
      const next = wrapOffset(dragRef.current.startOffset - delta, half);
      offsetRef.current = next;
      applyOffset(track, next);
    };

    const onPointerUp = (event) => {
      if (!dragRef.current.active) return;
      const hadDrag = dragRef.current.moved;
      dragRef.current.active = false;
      dragRef.current.moved = false;
      if (scroller.hasPointerCapture?.(event.pointerId)) {
        scroller.releasePointerCapture(event.pointerId);
      }
      scheduleResume();
      if (hadDrag) {
        suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS;
      }
    };

    const onClickCapture = (event) => {
      if (dragRef.current.moved || Date.now() < suppressClickUntilRef.current) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onWheel = (event) => {
      if (!event.deltaX && !event.deltaY) return;
      pauseAuto();
      const half = getHalfWidth(track);
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      offsetRef.current = wrapOffset(offsetRef.current + delta, half);
      applyOffset(track, offsetRef.current);
      scheduleResume();
    };

    scroller.addEventListener('dragstart', preventNativeDrag);
    scroller.addEventListener('pointerdown', onPointerDown);
    scroller.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    scroller.addEventListener('click', onClickCapture, true);
    scroller.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resumeTimerRef.current);
      scroller.removeEventListener('dragstart', preventNativeDrag);
      scroller.removeEventListener('pointerdown', onPointerDown);
      scroller.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      scroller.removeEventListener('click', onClickCapture, true);
      scroller.removeEventListener('wheel', onWheel);
      track.style.transform = '';
    };
  }, [enabled, pauseAuto, scheduleResume]);

  return { scrollerRef, trackRef, wasDragged, pauseForInteraction, scrollToItemIndex };
}

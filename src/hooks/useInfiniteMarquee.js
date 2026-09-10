import { useCallback, useEffect, useRef } from 'react';

const SCROLL_SPEED = 0.65;
const DRAG_THRESHOLD = 8;

export const MARQUEE_RESUME_DELAY_MS = 3000;

export function useInfiniteMarquee({ enabled = true, resumeDelayMs = MARQUEE_RESUME_DELAY_MS } = {}) {
  const scrollerRef = useRef(null);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const rafRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const isAutoScrollingRef = useRef(false);

  const wrapScroll = useCallback((el) => {
    const half = el.scrollWidth / 2;
    if (half <= 0) return;
    if (el.scrollLeft >= half) el.scrollLeft -= half;
    if (el.scrollLeft < 0) el.scrollLeft += half;
  }, []);

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

  const wasDragged = useCallback(() => dragRef.current.moved, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const el = scrollerRef.current;
    if (!el) return undefined;

    const tick = () => {
      if (!pausedRef.current && scrollerRef.current) {
        isAutoScrollingRef.current = true;
        scrollerRef.current.scrollLeft += SCROLL_SPEED;
        wrapScroll(scrollerRef.current);
        isAutoScrollingRef.current = false;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.target.closest('button, a, input, label')) return;
      pauseAuto();
      dragRef.current = {
        active: true,
        startX: event.clientX,
        startScroll: el.scrollLeft,
        moved: false,
      };
      el.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!dragRef.current.active) return;
      const delta = event.clientX - dragRef.current.startX;
      if (Math.abs(delta) > DRAG_THRESHOLD) dragRef.current.moved = true;
      el.scrollLeft = dragRef.current.startScroll - delta;
      wrapScroll(el);
    };

    const onPointerUp = (event) => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      if (el.hasPointerCapture?.(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
      const hadDrag = dragRef.current.moved;
      scheduleResume();
      if (hadDrag) {
        window.setTimeout(() => {
          dragRef.current.moved = false;
        }, 150);
      } else {
        dragRef.current.moved = false;
      }
    };

    const onScroll = () => {
      if (isAutoScrollingRef.current || dragRef.current.active) {
        wrapScroll(el);
        return;
      }
      pauseAuto();
      scheduleResume();
      wrapScroll(el);
    };

    const onWheel = () => {
      pauseAuto();
      scheduleResume();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resumeTimerRef.current);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', onWheel);
    };
  }, [enabled, pauseAuto, scheduleResume, wrapScroll]);

  return { scrollerRef, wasDragged };
}

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

export function useInfiniteMarquee({ enabled = true, resumeDelayMs = MARQUEE_RESUME_DELAY_MS } = {}) {
  const scrollerRef = useRef(null);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const rafRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const suppressClickUntilRef = useRef(0);
  const isAutoScrollingRef = useRef(false);

  const wrapScroll = useCallback((el) => {
    const half = el.scrollWidth / 2;
    if (half <= 0) return;

    let jumped = 0;
    if (el.scrollLeft >= half) {
      el.scrollLeft = Math.round(el.scrollLeft - half);
      jumped = -half;
    } else if (el.scrollLeft <= 0 && dragRef.current.active) {
      el.scrollLeft = Math.round(el.scrollLeft + half);
      jumped = half;
    }

    if (jumped !== 0 && dragRef.current.active) {
      dragRef.current.startScroll += jumped;
    }
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

  const wasDragged = useCallback(
    () => dragRef.current.moved || Date.now() < suppressClickUntilRef.current,
    []
  );

  const pauseForInteraction = useCallback(() => {
    pauseAuto();
    scheduleResume();
  }, [pauseAuto, scheduleResume]);

  useEffect(() => {
    if (!enabled) return undefined;

    const el = scrollerRef.current;
    if (!el) return undefined;

    const endAutoScrollFrame = () => {
      requestAnimationFrame(() => {
        isAutoScrollingRef.current = false;
      });
    };

    const tick = () => {
      if (!pausedRef.current) {
        isAutoScrollingRef.current = true;
        el.scrollLeft = Math.round(el.scrollLeft + SCROLL_SPEED);
        wrapScroll(el);
        endAutoScrollFrame();
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const initialHalf = el.scrollWidth / 2;
    if (initialHalf > 0 && el.scrollLeft < 1) {
      el.scrollLeft = 1;
    }

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (isFormControl(event.target)) return;
      pauseAuto();
      dragRef.current = {
        active: true,
        startX: event.clientX,
        startScroll: el.scrollLeft,
        moved: false,
      };
    };

    const onPointerMove = (event) => {
      if (!dragRef.current.active) return;
      const delta = event.clientX - dragRef.current.startX;

      if (!dragRef.current.moved) {
        if (Math.abs(delta) <= DRAG_THRESHOLD) return;
        dragRef.current.moved = true;
        if (typeof el.setPointerCapture === 'function') {
          try {
            el.setPointerCapture(event.pointerId);
          } catch {
            // Capture is optional; drag still works while the pointer stays over the scroller.
          }
        }
      }

      const half = el.scrollWidth / 2;
      let next = dragRef.current.startScroll - delta;
      if (half > 0) {
        while (next >= half) {
          next -= half;
          dragRef.current.startScroll -= half;
        }
        while (next < 0) {
          next += half;
          dragRef.current.startScroll += half;
        }
      }
      el.scrollLeft = Math.round(next);
      wrapScroll(el);
    };

    const onPointerUp = (event) => {
      if (!dragRef.current.active) return;
      const hadDrag = dragRef.current.moved;
      dragRef.current.active = false;
      dragRef.current.moved = false;
      if (el.hasPointerCapture?.(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
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

    const onScroll = () => {
      if (isAutoScrollingRef.current) return;
      wrapScroll(el);
    };

    const onWheel = () => {
      pauseAuto();
      scheduleResume();
    };

    el.addEventListener('dragstart', preventNativeDrag);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('click', onClickCapture, true);
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resumeTimerRef.current);
      el.removeEventListener('dragstart', preventNativeDrag);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('click', onClickCapture, true);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', onWheel);
    };
  }, [enabled, pauseAuto, scheduleResume, wrapScroll]);

  return { scrollerRef, wasDragged, pauseForInteraction };
}

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
  if (half <= 0) return offset;
  let next = offset;
  while (next >= half) next -= half;
  while (next < 0) next += half;
  return next;
}

function applyTransform(track, offset) {
  track.style.transform = `translate3d(-${offset}px, 0, 0)`;
}

export function useInfiniteMarquee({ enabled = true, resumeDelayMs = MARQUEE_RESUME_DELAY_MS } = {}) {
  const scrollerRef = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(1);
  const modeRef = useRef('auto');
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const rafRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const suppressClickUntilRef = useRef(0);
  const isAutoScrollingRef = useRef(false);

  const enterManualMode = useCallback((scroller, track) => {
    if (!scroller || !track) return;

    const half = getHalfWidth(track);
    const offset =
      modeRef.current === 'auto' ? offsetRef.current : wrapOffset(scroller.scrollLeft, half);

    offsetRef.current = wrapOffset(offset, half);
    track.style.transform = '';
    scroller.style.overflowX = 'auto';
    scroller.scrollLeft = offsetRef.current;
    modeRef.current = 'manual';
  }, []);

  const enterAutoMode = useCallback((scroller, track) => {
    if (!scroller || !track) return;

    const half = getHalfWidth(track);
    const offset =
      modeRef.current === 'manual' ? scroller.scrollLeft : offsetRef.current;

    offsetRef.current = wrapOffset(offset, half);
    applyTransform(track, offsetRef.current);
    scroller.scrollLeft = 0;
    scroller.style.overflowX = 'hidden';
    modeRef.current = 'auto';
  }, []);

  const wrapManualScroll = useCallback((scroller, track) => {
    const half = getHalfWidth(track);
    if (half <= 0) return;

    let jumped = 0;
    while (scroller.scrollLeft >= half) {
      scroller.scrollLeft -= half;
      jumped -= half;
    }

    if (scroller.scrollLeft <= 0 && dragRef.current.active) {
      scroller.scrollLeft += half;
      jumped += half;
    }

    if (jumped !== 0 && dragRef.current.active) {
      dragRef.current.startScroll += jumped;
    }

    offsetRef.current = scroller.scrollLeft;
  }, []);

  const pauseAuto = useCallback(() => {
    pausedRef.current = true;
    clearTimeout(resumeTimerRef.current);
  }, []);

  const scheduleResume = useCallback(() => {
    clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
      const scroller = scrollerRef.current;
      const track = trackRef.current;
      if (scroller && track) {
        enterAutoMode(scroller, track);
      }
    }, resumeDelayMs);
  }, [enterAutoMode, resumeDelayMs]);

  const wasDragged = useCallback(
    () => dragRef.current.moved || Date.now() < suppressClickUntilRef.current,
    []
  );

  const pauseForInteraction = useCallback(() => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (scroller && track && modeRef.current === 'auto') {
      enterManualMode(scroller, track);
    }
    pauseAuto();
    scheduleResume();
  }, [enterManualMode, pauseAuto, scheduleResume]);

  const scrollToItemIndex = useCallback(
    (index, itemCount) => {
      const scroller = scrollerRef.current;
      const track = trackRef.current;
      if (!scroller || !track || itemCount <= 0 || index < 0 || index >= itemCount) return;

      const slides = track.querySelectorAll('[data-marquee-index]');
      const firstCopy = slides[index];
      const secondCopy = slides[index + itemCount];
      if (!firstCopy) return;

      const centerOffsetFor = (slide) =>
        slide.offsetLeft + slide.offsetWidth / 2 - scroller.clientWidth / 2;

      const current =
        modeRef.current === 'auto' ? offsetRef.current : scroller.scrollLeft;
      let target = centerOffsetFor(firstCopy);
      if (secondCopy) {
        const alternate = centerOffsetFor(secondCopy);
        if (Math.abs(alternate - current) < Math.abs(target - current)) {
          target = alternate;
        }
      }

      const half = getHalfWidth(track);
      target = wrapOffset(target, half);
      offsetRef.current = target;

      isAutoScrollingRef.current = true;
      if (modeRef.current === 'auto') {
        applyTransform(track, target);
        scroller.scrollLeft = 0;
      } else {
        scroller.scrollLeft = target;
        wrapManualScroll(scroller, track);
      }
      requestAnimationFrame(() => {
        isAutoScrollingRef.current = false;
      });
    },
    [wrapManualScroll]
  );

  useEffect(() => {
    if (!enabled) return undefined;

    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return undefined;

    enterAutoMode(scroller, track);

    const tick = () => {
      if (!pausedRef.current && modeRef.current === 'auto') {
        isAutoScrollingRef.current = true;
        const half = getHalfWidth(track);
        offsetRef.current = wrapOffset(offsetRef.current + SCROLL_SPEED, half);
        applyTransform(track, offsetRef.current);
        scroller.scrollLeft = 0;
        isAutoScrollingRef.current = false;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const beginInteraction = () => {
      pauseAuto();
      if (modeRef.current === 'auto') {
        enterManualMode(scroller, track);
      }
    };

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (isFormControl(event.target)) return;
      beginInteraction();
      dragRef.current = {
        active: true,
        startX: event.clientX,
        startScroll: scroller.scrollLeft,
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
      scroller.scrollLeft = next;
      offsetRef.current = next;
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

    const onScroll = () => {
      if (isAutoScrollingRef.current || modeRef.current !== 'manual') return;
      wrapManualScroll(scroller, track);
    };

    const onWheel = () => {
      beginInteraction();
      scheduleResume();
    };

    const onTouchStart = (event) => {
      if (isFormControl(event.target)) return;
      beginInteraction();
    };

    const onTouchEnd = () => {
      scheduleResume();
    };

    scroller.addEventListener('dragstart', preventNativeDrag);
    scroller.addEventListener('pointerdown', onPointerDown);
    scroller.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    scroller.addEventListener('click', onClickCapture, true);
    scroller.addEventListener('scroll', onScroll, { passive: true });
    scroller.addEventListener('wheel', onWheel, { passive: true });
    scroller.addEventListener('touchstart', onTouchStart, { passive: true });
    scroller.addEventListener('touchend', onTouchEnd, { passive: true });
    scroller.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resumeTimerRef.current);
      track.style.transform = '';
      scroller.style.overflowX = '';
      scroller.removeEventListener('dragstart', preventNativeDrag);
      scroller.removeEventListener('pointerdown', onPointerDown);
      scroller.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      scroller.removeEventListener('click', onClickCapture, true);
      scroller.removeEventListener('scroll', onScroll);
      scroller.removeEventListener('wheel', onWheel);
      scroller.removeEventListener('touchstart', onTouchStart);
      scroller.removeEventListener('touchend', onTouchEnd);
      scroller.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [enabled, enterAutoMode, enterManualMode, pauseAuto, scheduleResume, wrapManualScroll]);

  return { scrollerRef, trackRef, wasDragged, pauseForInteraction, scrollToItemIndex };
}

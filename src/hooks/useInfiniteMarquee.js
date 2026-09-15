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

function getLoopWidth(track) {
  if (!track) return 0;

  const first = track.querySelector('[data-loop-copy="0"][data-copy-index="0"]');
  const second = track.querySelector('[data-loop-copy="1"][data-copy-index="0"]');
  if (first instanceof HTMLElement && second instanceof HTMLElement) {
    return second.offsetLeft - first.offsetLeft;
  }

  const itemCount = track.querySelectorAll('[data-loop-copy="0"]').length;
  const cloneStart = track.children[itemCount];
  if (cloneStart instanceof HTMLElement) {
    return cloneStart.offsetLeft;
  }

  return track.scrollWidth / 3;
}

function wrapOffset(offset, loopWidth) {
  if (loopWidth <= 0) return offset;

  const min = loopWidth;
  const max = loopWidth * 2;
  let next = offset;

  while (next >= max) next -= loopWidth;
  while (next < min) next += loopWidth;

  return next;
}

function applyTransform(track, offset) {
  track.style.transform = `translate3d(-${offset}px, 0, 0)`;
}

export function useInfiniteMarquee({
  enabled = true,
  resumeDelayMs = MARQUEE_RESUME_DELAY_MS,
  itemCount = 0,
} = {}) {
  const scrollerRef = useRef(null);
  const trackRef = useRef(null);
  const itemCountRef = useRef(itemCount);
  const loopWidthRef = useRef(0);
  const offsetRef = useRef(1);
  const modeRef = useRef('auto');
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const rafRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const suppressClickUntilRef = useRef(0);
  const isAutoScrollingRef = useRef(false);

  itemCountRef.current = itemCount;

  const getLoopWidthCached = useCallback((track) => {
    const measured = getLoopWidth(track);
    if (measured > 0) {
      loopWidthRef.current = measured;
    }
    return loopWidthRef.current;
  }, []);

  const syncOffsetFromLayout = useCallback(
    (scroller, track) => {
      const loopWidth = getLoopWidthCached(track);
      if (loopWidth <= 0) return;

      if (modeRef.current === 'auto') {
        offsetRef.current = wrapOffset(offsetRef.current, loopWidth);
        applyTransform(track, offsetRef.current);
        scroller.scrollLeft = 0;
      } else {
        scroller.scrollLeft = wrapOffset(scroller.scrollLeft, loopWidth);
        offsetRef.current = scroller.scrollLeft;
      }
    },
    [getLoopWidthCached]
  );

  const enterManualMode = useCallback(
    (scroller, track) => {
      if (!scroller || !track) return;

      const loopWidth = getLoopWidthCached(track);
      const offset =
        modeRef.current === 'auto' ? offsetRef.current : wrapOffset(scroller.scrollLeft, loopWidth);

      offsetRef.current = wrapOffset(offset, loopWidth);
      track.style.transform = '';
      scroller.style.overflowX = 'auto';
      scroller.scrollLeft = offsetRef.current;
      modeRef.current = 'manual';
    },
    [getLoopWidthCached]
  );

  const enterAutoMode = useCallback(
    (scroller, track) => {
      if (!scroller || !track) return;

      const loopWidth = getLoopWidthCached(track);
      const offset = modeRef.current === 'manual' ? scroller.scrollLeft : offsetRef.current;

      offsetRef.current = wrapOffset(offset, loopWidth);
      applyTransform(track, offsetRef.current);
      scroller.scrollLeft = 0;
      scroller.style.overflowX = 'hidden';
      modeRef.current = 'auto';
    },
    [getLoopWidthCached]
  );

  const wrapManualScroll = useCallback(
    (scroller, track) => {
      const loopWidth = getLoopWidthCached(track);
      if (loopWidth <= 0) return;

      const min = loopWidth;
      const max = loopWidth * 2;
      let jumped = 0;

      while (scroller.scrollLeft >= max) {
        scroller.scrollLeft -= loopWidth;
        jumped -= loopWidth;
      }

      if (scroller.scrollLeft < min) {
        if (dragRef.current.active || scroller.scrollLeft <= 0) {
          scroller.scrollLeft += loopWidth;
          jumped += loopWidth;
        } else {
          scroller.scrollLeft = min;
        }
      }

      if (jumped !== 0 && dragRef.current.active) {
        dragRef.current.startScroll += jumped;
      }

      offsetRef.current = scroller.scrollLeft;
    },
    [getLoopWidthCached]
  );

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
    (index) => {
      const scroller = scrollerRef.current;
      const track = trackRef.current;
      const count = itemCountRef.current;
      if (!scroller || !track || count <= 0 || index < 0 || index >= count) return;

      const primarySlide = track.querySelector(
        `[data-loop-copy="1"][data-copy-index="${index}"]`
      );
      if (!(primarySlide instanceof HTMLElement)) return;

      const centerOffsetFor = (slide) =>
        slide.offsetLeft + slide.offsetWidth / 2 - scroller.clientWidth / 2;

      const loopWidth = getLoopWidthCached(track);
      const current = modeRef.current === 'auto' ? offsetRef.current : scroller.scrollLeft;
      let target = centerOffsetFor(primarySlide);

      const alternateSlide = track.querySelector(
        `[data-loop-copy="0"][data-copy-index="${index}"]`
      );
      if (alternateSlide instanceof HTMLElement) {
        const alternate = centerOffsetFor(alternateSlide);
        if (Math.abs(alternate - current) < Math.abs(target - current)) {
          target = alternate;
        }
      }

      target = wrapOffset(target, loopWidth);
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
    [getLoopWidthCached, wrapManualScroll]
  );

  useEffect(() => {
    if (!enabled) return undefined;

    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return undefined;

    const loopWidth = getLoopWidthCached(track);
    offsetRef.current = loopWidth > 0 ? loopWidth + 1 : 1;
    enterAutoMode(scroller, track);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            const nextLoopWidth = getLoopWidth(track);
            if (nextLoopWidth <= 0 || Math.abs(nextLoopWidth - loopWidthRef.current) < 1) {
              return;
            }
            loopWidthRef.current = nextLoopWidth;
            syncOffsetFromLayout(scroller, track);
          })
        : null;

    resizeObserver?.observe(track);

    const tick = () => {
      if (!pausedRef.current && modeRef.current === 'auto') {
        isAutoScrollingRef.current = true;
        const width = getLoopWidthCached(track);
        offsetRef.current = wrapOffset(offsetRef.current + SCROLL_SPEED, width);
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

      const loopWidth = getLoopWidthCached(track);
      let next = dragRef.current.startScroll - delta;
      if (loopWidth > 0) {
        const min = loopWidth;
        const max = loopWidth * 2;
        while (next >= max) {
          next -= loopWidth;
          dragRef.current.startScroll -= loopWidth;
        }
        while (next < min) {
          next += loopWidth;
          dragRef.current.startScroll += loopWidth;
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
      resizeObserver?.disconnect();
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
  }, [
    enabled,
    enterAutoMode,
    enterManualMode,
    getLoopWidthCached,
    pauseAuto,
    scheduleResume,
    syncOffsetFromLayout,
    wrapManualScroll,
  ]);

  return { scrollerRef, trackRef, wasDragged, pauseForInteraction, scrollToItemIndex };
}

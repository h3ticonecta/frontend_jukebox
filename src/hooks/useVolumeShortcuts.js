import { useEffect, useRef } from 'react';
import { eventMatchesTecla, resolveVolumeTecla } from '../lib/keyboard';

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

const DEBOUNCE_MS = 400;
const HOLD_START_MS = 520;
const HOLD_TICK_MS = 140;

/**
 * Atalho físico único de volume (backend: `acao: vol` ou legado vol_mais / vol_menos).
 * - Um clique: aumenta o volume
 * - Cliques em sequência (janela de debounce): diminui ao soltar
 * - Manter pressionado (sem repetição de evento): diminui de forma contínua
 */
export function useVolumeShortcuts({ teclas = [], enabled = true, onStep }) {
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  useEffect(() => {
    const volumeKey = resolveVolumeTecla(teclas);
    if (!enabled || !volumeKey || !onStepRef.current) return undefined;

    let active = false;
    let pendingRepeat = false;
    let clickTimer = null;
    let holdTimer = null;
    let tickTimer = null;

    const clearClickTimer = () => {
      if (clickTimer) {
        window.clearTimeout(clickTimer);
        clickTimer = null;
      }
    };

    const stopHold = () => {
      if (holdTimer) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
      if (tickTimer) {
        window.clearInterval(tickTimer);
        tickTimer = null;
      }
    };

    const matches = (event) => eventMatchesTecla(event, volumeKey);

    const handleKeyDown = (event) => {
      if (isTypingTarget(event.target)) return;
      if (!matches(event)) return;
      event.preventDefault();

      if (event.repeat) {
        if (active) {
          pendingRepeat = true;
          stopHold();
        }
        return;
      }

      if (active) return;
      active = true;
      pendingRepeat = false;

      clearClickTimer();
      stopHold();

      holdTimer = window.setTimeout(() => {
        holdTimer = null;
        tickTimer = window.setInterval(() => onStepRef.current?.(-0.1), HOLD_TICK_MS);
      }, HOLD_START_MS);
    };

    const handleKeyUp = (event) => {
      if (!active) return;
      if (isTypingTarget(event.target)) return;
      if (!matches(event)) return;
      event.preventDefault();

      const wasHeldDown = Boolean(tickTimer);
      stopHold();
      active = false;

      if (pendingRepeat) {
        pendingRepeat = false;
        clearClickTimer();
        onStepRef.current?.(-0.1);
        return;
      }

      if (wasHeldDown) {
        return;
      }

      clearClickTimer();
      clickTimer = window.setTimeout(() => {
        clickTimer = null;
        onStepRef.current?.(0.1);
      }, DEBOUNCE_MS);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      clearClickTimer();
      stopHold();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [teclas, enabled]);
}

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
 * - Um clique: +10% ao soltar (após debounce ~400 ms)
 * - Cliques em sequência (janela de debounce): −10% por clique
 * - Manter pressionado: −10% contínuo (início ~520 ms, depois a cada ~140 ms),
 *   inclusive quando o SO emite auto-repeat (event.repeat) — o repeat é tratado
 *   como "tecla ainda pressionada", não como cancelamento do hold
 */
export function useVolumeShortcuts({ teclas = [], enabled = true, onStep }) {
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  useEffect(() => {
    const volumeKey = resolveVolumeTecla(teclas);
    if (!enabled || !volumeKey || !onStepRef.current) return undefined;

    let active = false;
    let hadRepeat = false;
    let ticked = false;
    let lastKeyUpAt = 0;
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

    // Inicia o decréscimo contínuo (idempotente): usado tanto pelo timer
    // de hold (botão sem auto-repeat) quanto pelo auto-repeat do SO.
    const startTicking = () => {
      if (tickTimer) return;
      if (holdTimer) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
      tickTimer = window.setInterval(() => {
        ticked = true;
        onStepRef.current?.(-0.1);
      }, HOLD_TICK_MS);
    };

    const matches = (event) => eventMatchesTecla(event, volumeKey);

    const handleKeyDown = (event) => {
      if (isTypingTarget(event.target)) return;
      if (!matches(event)) return;
      event.preventDefault();

      if (event.repeat) {
        // Auto-repeat do SO = tecla continua pressionada: garante o
        // decréscimo contínuo em vez de encerrar o hold.
        if (active) {
          hadRepeat = true;
          startTicking();
        }
        return;
      }

      if (active) return;
      active = true;
      hadRepeat = false;
      ticked = false;

      clearClickTimer();
      stopHold();

      holdTimer = window.setTimeout(() => {
        holdTimer = null;
        startTicking();
      }, HOLD_START_MS);
    };

    const handleKeyUp = (event) => {
      if (!active) return;
      if (isTypingTarget(event.target)) return;
      if (!matches(event)) return;
      event.preventDefault();

      const wasTicking = ticked;
      const withRepeat = hadRepeat;
      const now = Date.now();
      const isSequence = now - lastKeyUpAt < DEBOUNCE_MS;

      stopHold();
      active = false;
      hadRepeat = false;
      ticked = false;
      lastKeyUpAt = now;
      clearClickTimer();

      // Segurou: os ticks contínuos já baixaram o volume.
      if (wasTicking) return;

      // Auto-repeat do SO sem tempo de tick (soltou logo após o repeat).
      if (withRepeat) {
        onStepRef.current?.(-0.1);
        return;
      }

      // Cliques em sequência: cada clique após o primeiro diminui.
      if (isSequence) {
        onStepRef.current?.(-0.1);
        return;
      }

      // Clique único: aumenta ao soltar, após o debounce.
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

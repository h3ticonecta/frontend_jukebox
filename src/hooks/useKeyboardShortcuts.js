import { useEffect } from 'react';
import { findAcaoByEvent, resolveVolumeTecla } from '../lib/keyboard';

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

export function useKeyboardShortcuts({ teclas = [], enabled = true, onAction }) {
  useEffect(() => {
    if (!enabled || !teclas.length || !onAction) return undefined;

    const volumeTecla = resolveVolumeTecla(teclas);
    const teclasSemVolume = volumeTecla
      ? teclas.filter((item) => item?.tecla !== volumeTecla)
      : teclas;

    const handleKeyDown = (event) => {
      if (isTypingTarget(event.target)) return;

      const acao = findAcaoByEvent(teclasSemVolume, event);
      if (!acao) return;

      event.preventDefault();
      onAction(acao);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [teclas, enabled, onAction]);
}

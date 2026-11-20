/** Alinhado ao guia de integração backend: poll ~5 min + foco da janela. */
export const TECLAS_POLL_MS = 5 * 60 * 1000;

export function configNeedsUpdate(prevUpdatedAt, nextUpdatedAt) {
  if (nextUpdatedAt == null || nextUpdatedAt === '') return true;
  if (!prevUpdatedAt) return true;
  return prevUpdatedAt !== nextUpdatedAt;
}

export function startMaquinaConfigSync({ pull }) {
  const interval = window.setInterval(() => {
    pull({ force: false });
  }, TECLAS_POLL_MS);

  const onFocus = () => {
    pull({ force: false });
  };

  window.addEventListener('focus', onFocus);
  void pull({ force: false });

  return () => {
    window.clearInterval(interval);
    window.removeEventListener('focus', onFocus);
  };
}
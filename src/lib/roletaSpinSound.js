let sharedCtx;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx) sharedCtx = new Ctx();
  return sharedCtx;
}

/** Clique curto de uma “ranhura” passando no ponteiro. */
function playRoletaTick(volume = 0.2) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(920 + Math.random() * 80, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  } catch {
    // Ambiente sem Web Audio
  }
}

/**
 * Ticks durante o giro (intervalo aumenta até o fim, como a roda desacelerando).
 * Retorna `{ stop }` para cancelar timers.
 */
export function startRoletaSpinTicks(durationMs) {
  const timeouts = [];
  let stopped = false;
  const startAt = performance.now();
  const minInterval = 52;
  const maxInterval = 360;
  const total = Math.max(500, Number(durationMs) || 5000);

  const stop = () => {
    stopped = true;
    timeouts.forEach((id) => window.clearTimeout(id));
    timeouts.length = 0;
  };

  const schedule = () => {
    if (stopped) return;
    const elapsed = performance.now() - startAt;
    if (elapsed >= total) return;

    const progress = Math.min(1, elapsed / total);
    const eased = 1 - (1 - progress) ** 2.4;
    const interval = minInterval + (maxInterval - minInterval) * eased;
    const volume = 0.22 * (1 - progress * 0.25);

    playRoletaTick(volume);
    const id = window.setTimeout(schedule, interval);
    timeouts.push(id);
  };

  try {
    const ctx = getAudioContext();
    if (ctx?.state === 'suspended') void ctx.resume();
  } catch {
    // ignore
  }

  playRoletaTick(0.24);
  const first = window.setTimeout(schedule, minInterval);
  timeouts.push(first);

  return { stop };
}

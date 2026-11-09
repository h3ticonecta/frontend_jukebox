let sharedCtx;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx) sharedCtx = new Ctx();
  return sharedCtx;
}

/** Som curto de “arranque” da roda (requer gesto do usuário — ex.: clique em Girar). */
export function playRoletaSpinStart() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const now = ctx.currentTime;
    const duration = 1.15;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.42, now);
    master.gain.exponentialRampToValueAtTime(0.001, now + duration);
    master.connect(ctx.destination);

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 1.4;
    band.frequency.setValueAtTime(280, now);
    band.frequency.exponentialRampToValueAtTime(2400, now + 0.12);
    band.frequency.exponentialRampToValueAtTime(520, now + duration * 0.85);

    noise.connect(band);
    band.connect(master);
    noise.start(now);
    noise.stop(now + duration);

    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(720, now);
    click.frequency.exponentialRampToValueAtTime(180, now + 0.07);
    clickGain.gain.setValueAtTime(0.22, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    click.connect(clickGain);
    clickGain.connect(master);
    click.start(now);
    click.stop(now + 0.1);
  } catch {
    // Ambiente sem Web Audio ou política do navegador
  }
}

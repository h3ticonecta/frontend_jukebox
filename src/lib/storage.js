const KEYS = {
  TOKEN: 'jukebox_maquina_token',
  INFO: 'jukebox_maquina_info',
  CREDITS: 'jukebox_credits_balance',
  VOLUME: 'jukebox_volume_percent',
};

export function getMaquinaToken() {
  const token = localStorage.getItem(KEYS.TOKEN);
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  return token;
}

export function setMaquinaSession({ token, ...info }) {
  if (!token || token === 'undefined' || token === 'null') {
    throw new Error('Token da máquina não recebido do servidor.');
  }
  localStorage.setItem(KEYS.TOKEN, token);
  localStorage.setItem(KEYS.INFO, JSON.stringify(info));
}

export function getMaquinaInfo() {
  const raw = localStorage.getItem(KEYS.INFO);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearMaquinaSession() {
  localStorage.removeItem(KEYS.TOKEN);
  localStorage.removeItem(KEYS.INFO);
}

export function getMaquinaTeclas() {
  return getMaquinaInfo()?.teclas || [];
}

export function updateMaquinaTeclas(teclas) {
  const token = getMaquinaToken();
  const info = getMaquinaInfo() || {};
  if (!token) return;
  setMaquinaSession({ token, ...info, teclas });
}

export function getCreditsBalance() {
  const raw = localStorage.getItem(KEYS.CREDITS);
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export function setCreditsBalance(balance) {
  localStorage.setItem(KEYS.CREDITS, String(Math.max(0, balance)));
}

export function addCredits(amount) {
  const next = getCreditsBalance() + amount;
  setCreditsBalance(next);
  return next;
}

export function deductCredits(amount) {
  const next = Math.max(0, getCreditsBalance() - amount);
  setCreditsBalance(next);
  return next;
}

export function getVolumePercent() {
  const raw = localStorage.getItem(KEYS.VOLUME);
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 100;
}

export function setVolumePercent(percent) {
  localStorage.setItem(KEYS.VOLUME, String(Math.max(0, Math.min(100, percent))));
}

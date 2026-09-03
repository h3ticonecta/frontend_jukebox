const KEYS = {
  TOKEN: 'jukebox_maquina_token',
  INFO: 'jukebox_maquina_info',
  CREDITS: 'jukebox_credits_balance',
};

export function getMaquinaToken() {
  return localStorage.getItem(KEYS.TOKEN);
}

export function setMaquinaSession({ token, ...info }) {
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

export const TECLAS_DISPLAY_ORDER = [
  'cima',
  'baixo',
  'esquerda',
  'direita',
  'credito',
  'hits',
  'fila',
  'pular',
  'vol_mais',
  'vol_menos',
  'cancelar',
];

const KEY_ALIASES = {
  Enter: 'Enter',
  PgUp: 'PageUp',
  PgDn: 'PageDown',
};

export function normalizeTecla(tecla) {
  return KEY_ALIASES[tecla] || tecla;
}

export function formatTeclaDisplay(tecla) {
  if (tecla === 'Enter') return '↵';
  return tecla;
}

export function eventMatchesTecla(event, tecla) {
  const normalized = normalizeTecla(tecla);

  if (normalized === 'Enter') return event.key === 'Enter';
  if (normalized === 'PageUp') return event.key === 'PageUp';
  if (normalized === 'PageDown') return event.key === 'PageDown';

  if (normalized.length === 1) {
    return event.key.toLowerCase() === normalized.toLowerCase();
  }

  return event.key === normalized;
}

export function buildTeclasMap(teclas = []) {
  const map = new Map();
  teclas.forEach((item) => {
    if (item?.acao && item?.tecla) {
      map.set(item.acao, item);
    }
  });
  return map;
}

export function sortTeclas(teclas = []) {
  const order = new Map(TECLAS_DISPLAY_ORDER.map((acao, index) => [acao, index]));
  return [...teclas].sort((a, b) => {
    const orderA = order.has(a.acao) ? order.get(a.acao) : 999;
    const orderB = order.has(b.acao) ? order.get(b.acao) : 999;
    return orderA - orderB;
  });
}

export function findAcaoByEvent(teclas, event) {
  return teclas.find((item) => eventMatchesTecla(event, item.tecla))?.acao || null;
}

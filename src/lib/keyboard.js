export const KNOWN_MACHINE_ACOES = new Set([
  'cima',
  'baixo',
  'esquerda',
  'direita',
  'credito',
  'pix',
  'hits',
  'fila',
  'pular',
  'tocar_cd',
  'vol',
  'vol_mais',
  'vol_menos',
  'cancelar',
]);

/** Aliases que o Django pode enviar além do slug canônico. */
const ACAO_ALIASES = {
  tocar: 'tocar_cd',
  tocar_musica: 'tocar_cd',
  tocar_faixa: 'tocar_cd',
  selecionar: 'tocar_cd',
  selecionar_faixa: 'tocar_cd',
  confirmar: 'tocar_cd',
  ok: 'tocar_cd',
};

export const TECLAS_DISPLAY_ORDER = [
  'cima',
  'baixo',
  'esquerda',
  'direita',
  'credito',
  'pix',
  'hits',
  'fila',
  'pular',
  'tocar_cd',
  'vol',
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
  const trimmed = typeof tecla === 'string' ? tecla.trim() : tecla;
  return KEY_ALIASES[trimmed] || trimmed;
}

export function normalizeMachineAcao(acao) {
  if (!acao) return null;
  const key = String(acao).trim().toLowerCase();
  return ACAO_ALIASES[key] || key;
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
  const matches = teclas.filter((item) => eventMatchesTecla(event, item.tecla));
  if (!matches.length) return null;

  const preferred = matches.find((item) =>
    KNOWN_MACHINE_ACOES.has(normalizeMachineAcao(item.acao))
  );
  const item = preferred || matches[0];
  return normalizeMachineAcao(item.acao);
}

/** Backend: migração `vol_mais` / `vol_menos` → `vol` (prioridade vol, vol_mais, vol_menos). */
export function resolveVolumeTecla(teclas = []) {
  const vol = teclas.find((item) => item?.acao === 'vol' && item?.tecla);
  if (vol) return vol.tecla;
  const mais = teclas.find((item) => item?.acao === 'vol_mais' && item?.tecla);
  if (mais) return mais.tecla;
  const menos = teclas.find((item) => item?.acao === 'vol_menos' && item?.tecla);
  return menos?.tecla || null;
}

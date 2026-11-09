/**
 * Contrato 12 — Roleta da jukebox: lógica do jogo (frontend).
 *
 * Regras (interpretação acordada com o operador — ver docs/contratos/12-roleta.md):
 * - Pulsos de crédito (R$ 1) acumulam numa sessão; 20s sem novo pulso fecha a sessão.
 * - A maior faixa com valor <= total inserido concede seus `giros_liberados`;
 *   participam do sorteio todas as faixas com valor <= total (cumulatividade).
 * - A roleta usa os prêmios da **faixa ativa** (`premios[]`) quando houver; senão os 5 setores globais.
 * - "+2 músicas": sorteia uma faixa participante e paga o prêmio CUMULATIVO
 *   (quantidade de música grátis da faixa sorteada + todas as inferiores).
 * - "+1 música": paga somente o prêmio da faixa sorteada (sem cumulatividade).
 * - "Bônus 50%": próxima sessão de inserção ganha floor(50%) créditos extras.
 * - "Tente novamente": giro devolvido. "Não foi dessa vez": giro consumido.
 * - Limite diário: prêmio +2 limitado a X% dos giros do dia (contador local);
 *   ao atingir, o peso do setor migra para "não foi dessa vez".
 */

const ROLETA_KEYS = {
  GIROS: 'jukebox_roleta_giros',
  FAIXAS: 'jukebox_roleta_faixas_participantes',
  BONUS: 'jukebox_roleta_bonus_recarga',
  DAILY: 'jukebox_roleta_daily',
};

/** Idle após o último pulso: aplica bônus 50% e zera a sessão (a overlay já abriu na hora). */
export const ROLETA_SESSION_MS = 20000;

/** Setores fixos da roleta global (ordem de exibição na roda). */
export const ROLETA_SETORES = [
  {
    key: 'premio_mais_2_musicas',
    tipo: 'premio2',
    label: '+2 músicas',
    rotulo: ['+2 músicas'],
    icone: '♪',
    cor: '#f59e0b',
    textoEscuro: true,
  },
  {
    key: 'premio_mais_1_musica',
    tipo: 'premio1',
    label: '+1 música',
    rotulo: ['+1 música'],
    icone: '♪',
    cor: '#8b5cf6',
    textoEscuro: false,
  },
  {
    key: 'bonus_recarga_50pct',
    tipo: 'bonus',
    label: 'Bônus 50% na recarga',
    rotulo: ['Bônus 50%'],
    icone: '✨',
    cor: '#ec4899',
    textoEscuro: false,
  },
  {
    key: 'tente_novamente',
    tipo: 'retry',
    label: 'Tente novamente',
    rotulo: ['Tente', 'novamente'],
    icone: '🎲',
    cor: '#3d4658',
    textoEscuro: false,
  },
  {
    key: 'nao_foi_dessa_vez',
    tipo: 'nada',
    label: 'Não foi dessa vez',
    rotulo: ['Não foi', 'dessa vez'],
    icone: '🚫',
    cor: '#2a3140',
    textoEscuro: false,
  },
];

// ---------------------------------------------------------------------------
// Persistência local

function readNumber(key) {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) ? value : 0;
}

export function getRoletaGiros() {
  return Math.max(0, readNumber(ROLETA_KEYS.GIROS));
}

export function setRoletaGiros(value) {
  const giros = Math.max(0, Math.floor(Number(value) || 0));
  localStorage.setItem(ROLETA_KEYS.GIROS, String(giros));
  if (giros === 0) {
    // Sem giros pendentes: cumulatividade da próxima sessão recomeça do zero
    localStorage.removeItem(ROLETA_KEYS.FAIXAS);
  }
  return giros;
}

export function addRoletaGiros(delta) {
  return setRoletaGiros(getRoletaGiros() + delta);
}

export function getRoletaFaixasParticipantes() {
  return Math.max(0, readNumber(ROLETA_KEYS.FAIXAS));
}

/** Acumula o maior número de faixas participantes enquanto houver giros. */
export function mergeRoletaFaixas(quantidade) {
  const atual = getRoletaFaixasParticipantes();
  const next = Math.max(atual, Math.floor(Number(quantidade) || 0));
  localStorage.setItem(ROLETA_KEYS.FAIXAS, String(next));
  return next;
}

export function hasRoletaBonusRecarga() {
  return localStorage.getItem(ROLETA_KEYS.BONUS) === '1';
}

export function setRoletaBonusRecarga(ativo) {
  if (ativo) {
    localStorage.setItem(ROLETA_KEYS.BONUS, '1');
  } else {
    localStorage.removeItem(ROLETA_KEYS.BONUS);
  }
}

function todayKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function readDaily() {
  try {
    const data = JSON.parse(localStorage.getItem(ROLETA_KEYS.DAILY) || 'null');
    if (data && data.date === todayKey()) {
      return { date: data.date, giros: Number(data.giros) || 0, premios2: Number(data.premios2) || 0 };
    }
  } catch {
    // JSON inválido → reinicia o contador do dia
  }
  return { date: todayKey(), giros: 0, premios2: 0 };
}

function writeDaily(daily) {
  localStorage.setItem(ROLETA_KEYS.DAILY, JSON.stringify(daily));
}

export function registerRoletaGiro() {
  const daily = readDaily();
  daily.giros += 1;
  writeDaily(daily);
}

export function registerRoletaPremio2() {
  const daily = readDaily();
  daily.premios2 += 1;
  writeDaily(daily);
}

/** Limite diário: o prêmio +2 só pode sair em até `limitePercent`% dos giros do dia. */
export function dailyPermitePremio2(limitePercent) {
  const pct = Number(limitePercent) || 0;
  if (pct <= 0) return true;
  const { giros, premios2 } = readDaily();
  return premios2 + 1 <= ((giros + 1) * pct) / 100;
}

// ---------------------------------------------------------------------------
// Configuração (API → modelo do jogo)

export function normalizeRoletaConfig(data) {
  if (!data || typeof data !== 'object') return null;
  const prob = data.probabilidades || {};
  const setores = ROLETA_SETORES.map((s) => ({
    ...s,
    peso: Math.max(0, Number(prob[s.key]) || 0),
  }));
  const faixas = (Array.isArray(data.faixas_valor) ? data.faixas_valor : [])
    .map((f) => {
      const premiosRaw = Array.isArray(f.premios) ? f.premios : [];
      const premioMusica = premiosRaw.find((p) => p.tipo === 'musica_gratis');
      const premios = premiosRaw.map((p) => ({
        tipo: p.tipo || 'sem_premio',
        quantidade: Math.max(1, Number(p.quantidade) || 1),
        peso: Math.max(0, Number(p.peso) || 0),
      }));
      return {
        valor: Number(f.valor_numero ?? f.valor) || 0,
        giros: Number(f.giros_liberados) || 0,
        premioMusicas: Number(premioMusica?.quantidade) || 0,
        premios,
      };
    })
    .filter((f) => f.valor > 0)
    .sort((a, b) => a.valor - b.valor);

  return {
    ativada: !!data.ativada,
    setores,
    regras: {
      creditosMinimos: Number(data.regras?.creditos_minimos_girar) || 0,
      limitePremio2Dia: Number(data.regras?.max_premio_mais_2_musicas_dia_percent) || 0,
    },
    faixas,
  };
}

// ---------------------------------------------------------------------------
// Regras do jogo

/**
 * Créditos desta sessão → giros a conceder (total absoluto, não o delta).
 *
 * Libera quando:
 * - o total atinge `creditos_minimos_girar` (texto do Django: "créditos comprados
 *   para liberar a roleta"), ou
 * - o total atinge alguma faixa de valor.
 *
 * Giros = `giros_liberados` da maior faixa `valor <= total`, ou 1 se não houver faixa.
 * Retorna null se a roleta estiver desligada ou o total ainda for insuficiente.
 */
export function resolveInsercaoRoleta(config, totalInserido) {
  if (!config?.ativada) return null;
  const total = Number(totalInserido) || 0;
  if (total <= 0) return null;

  const minimo = Number(config.regras?.creditosMinimos) || 0;
  const participantes = (config.faixas || []).filter((f) => f.valor <= total);
  const atingiuFaixa = participantes.length > 0;
  const atingiuMinimo = minimo > 0 ? total >= minimo : atingiuFaixa;
  if (!atingiuMinimo && !atingiuFaixa) return null;

  const maior = participantes[participantes.length - 1];
  const giros = maior?.giros > 0 ? maior.giros : 1;
  return { giros, faixasParticipantes: Math.max(1, participantes.length) };
}

/** Faixa de maior valor entre as participantes da sessão (define os prêmios da roda). */
export function getFaixaAtiva(config, faixasParticipantes) {
  const faixas = config?.faixas || [];
  if (faixas.length === 0) return null;
  const limite = Math.max(1, Number(faixasParticipantes) || 1);
  const participantes = faixas.slice(0, Math.min(limite, faixas.length));
  return participantes[participantes.length - 1] ?? faixas[0];
}

function visualForPremioFaixa(premio) {
  const q = Math.max(1, Number(premio.quantidade) || 1);
  if (premio.tipo === 'musica_gratis') {
    return {
      premioTipo: 'musica_gratis',
      quantidade: q,
      label: `+${q} música${q > 1 ? 's' : ''}`,
      rotulo: [`+${q} música${q > 1 ? 's' : ''}`],
      icone: '♪',
      cor: q >= 2 ? '#f59e0b' : '#8b5cf6',
      textoEscuro: q >= 2,
    };
  }
  if (premio.tipo === 'giro_extra') {
    return {
      premioTipo: 'giro_extra',
      quantidade: q,
      label: 'Giro extra',
      rotulo: ['Tente', 'novamente'],
      icone: '🎲',
      cor: '#3d4658',
      textoEscuro: false,
    };
  }
  return {
    premioTipo: 'sem_premio',
    quantidade: q,
    label: 'Sem prêmio',
    rotulo: ['Não foi', 'dessa vez'],
    icone: '🚫',
    cor: '#2a3140',
    textoEscuro: false,
  };
}

/**
 * Setores da roda: prêmios da faixa ativa (ordem do Django) ou fallback global.
 */
export function resolveWheelSetores(config, faixasParticipantes) {
  const faixa = getFaixaAtiva(config, faixasParticipantes);
  const premios = faixa?.premios;
  if (Array.isArray(premios) && premios.length > 0) {
    return premios.map((p, i) => ({
      key: `faixa_premio_${i}`,
      ...visualForPremioFaixa(p),
      peso: Math.max(0, Number(p.peso) || 0),
      origem: 'faixa',
    }));
  }
  return (config?.setores || []).map((s) => ({ ...s, origem: 'global' }));
}

function isSetorPremio2(setor) {
  return (
    setor.tipo === 'premio2' ||
    (setor.premioTipo === 'musica_gratis' && Math.max(1, Number(setor.quantidade) || 1) >= 2)
  );
}

function isSetorSemPremio(setor) {
  return setor.tipo === 'nada' || setor.premioTipo === 'sem_premio';
}

/** Sorteio ponderado; ao bloquear o +2 (limite diário), o peso migra para "não foi". */
export function pickRoletaSector(setores, { bloquearPremio2 = false } = {}) {
  const pool = setores.map((s) => ({ ...s }));
  if (bloquearPremio2) {
    const premio2 = pool.find(isSetorPremio2);
    const nada = pool.find(isSetorSemPremio);
    if (premio2 && nada) {
      nada.peso += premio2.peso;
      premio2.peso = 0;
    }
  }
  const total = pool.reduce((acc, s) => acc + s.peso, 0);
  if (total <= 0) return pool.find((s) => s.tipo === 'nada') || pool[0];
  let sorteio = Math.random() * total;
  for (const setor of pool) {
    sorteio -= setor.peso;
    if (sorteio <= 0) return setor;
  }
  return pool[pool.length - 1];
}

/**
 * Prêmio de músicas: sorteia uma faixa participante (uniforme).
 * premio2 → cumulativo (faixa sorteada + inferiores); premio1 → só a sorteada.
 */
export function calcularPremioMusicas(setor, config, faixasParticipantes) {
  const limite = Math.max(1, Number(faixasParticipantes) || 1);
  const faixas = config.faixas.slice(0, limite);
  if (faixas.length === 0) return { musicas: 0, faixaIndex: -1, cumulativo: false };
  const idx = Math.floor(Math.random() * faixas.length);
  if (setor.tipo === 'premio2') {
    const musicas = faixas.slice(0, idx + 1).reduce((acc, f) => acc + f.premioMusicas, 0);
    return { musicas, faixaIndex: idx, cumulativo: true };
  }
  return { musicas: faixas[idx].premioMusicas, faixaIndex: idx, cumulativo: false };
}

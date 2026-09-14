const EVENTS_KEY = 'jukebox_billing_events';

export const BILLING_PERIODS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes', label: 'Este mês' },
  { id: 'ano', label: 'Este ano' },
  { id: 'tudo', label: 'Todo período' },
];

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export function getWeekdayLabels() {
  return WEEKDAYS;
}

export function formatMonthTitle(year, monthIndex) {
  const name = MONTHS[monthIndex] || '';
  return `Mês ${name} Ano ${year}`;
}

export function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return startOfDay(new Date(year, month - 1, day));
}

export function formatDatePt(date) {
  if (!date) return '';
  return date.toLocaleDateString('pt-BR');
}

export function formatBRL(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function getPeriodBounds(periodId, customStart = null, customEnd = null) {
  const now = new Date();

  if (periodId === 'custom') {
    const start = customStart ? startOfDay(customStart) : startOfDay(now);
    const end = customEnd ? endOfDay(customEnd) : endOfDay(customStart || now);
    return { start, end };
  }

  if (periodId === 'hoje') {
    return { start: startOfDay(now), end: endOfDay(now) };
  }

  if (periodId === 'semana') {
    const start = startOfDay(now);
    const weekday = start.getDay() === 0 ? 6 : start.getDay() - 1;
    start.setDate(start.getDate() - weekday);
    return { start, end: endOfDay(now) };
  }

  if (periodId === 'mes') {
    return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), end: endOfDay(now) };
  }

  if (periodId === 'ano') {
    return { start: startOfDay(new Date(now.getFullYear(), 0, 1)), end: endOfDay(now) };
  }

  return { start: null, end: null };
}

export function buildMonthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    const date = new Date(year, monthIndex, -startOffset + i + 1);
    cells.push({ date, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, monthIndex, day), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }

  return cells;
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isDateInRange(date, start, end) {
  if (!date || !start || !end) return false;
  const time = startOfDay(date).getTime();
  return time >= startOfDay(start).getTime() && time <= startOfDay(end).getTime();
}

function readEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function addBillingEvent({ type, valor = 0, creditos = 0 }) {
  const events = readEvents();
  events.push({
    type,
    valor: Number(valor) || 0,
    creditos: Number(creditos) || 0,
    at: new Date().toISOString(),
  });
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function summarizeBillingEvents({ start, end }) {
  const events = readEvents();
  const inRange = events.filter((event) => {
    if (event.type !== 'credito') return false;
    const at = new Date(event.at);
    if (start && at < start) return false;
    if (end && at > end) return false;
    return true;
  });

  return {
    faturamento: inRange.reduce((sum, event) => sum + (Number(event.valor) || 0), 0),
    creditos: inRange.reduce((sum, event) => sum + (Number(event.creditos) || 0), 0),
    transacoes: inRange.length,
  };
}

export function normalizeLeituraResponse(data) {
  if (!data || typeof data !== 'object') return null;
  const faturamento = data.faturamento ?? data.total_faturamento ?? data.valor_total ?? data.valor;
  const creditos = data.creditos ?? data.total_creditos ?? data.creditos_inseridos;
  const transacoes = data.transacoes ?? data.total_transacoes ?? data.count ?? data.quantidade;
  if (faturamento == null && creditos == null && transacoes == null) return null;
  return {
    faturamento: Number(faturamento) || 0,
    creditos: Number(creditos) || 0,
    transacoes: Number(transacoes) || 0,
  };
}

export function formatCustomPeriodLabel(start, end) {
  if (!start) return 'Escolher período personalizado (dia, mês, ano...)';
  if (!end || isSameDay(start, end)) return formatDatePt(start);
  return `${formatDatePt(start)} – ${formatDatePt(end)}`;
}

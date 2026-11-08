import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Coins,
  Disc,
  DollarSign,
  FileDown,
  LayoutDashboard,
  LogOut,
  MonitorCog,
  Music,
  RefreshCw,
  Settings,
  Users,
} from 'lucide-react';
import { fetchPainelAdministrativo } from '../../api/painel';
import { formatBRL, formatCustomPeriodLabel, toIsoDate } from '../../lib/billing';
import { exportPainelPdf } from '../../lib/painelPrint';
import { getAdminUsername } from '../../lib/storage';
import { cn } from '../../lib/utils';
import PeriodCalendar from '../jukebox/PeriodCalendar';

const PERIOD_OPTIONS = [
  { id: 'tudo', label: 'Todo período' },
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes', label: 'Este mês' },
];

const STATUS_OPTIONS = [
  { id: 'todos', label: 'Todos os status' },
  { id: 'ativo', label: 'Ativas' },
  { id: 'inativo', label: 'Inativas' },
];

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, enabled: true },
  { id: 'maquinas', label: 'Máquinas', icon: MonitorCog, enabled: false },
  { id: 'configuracoes', label: 'Configurações', icon: Settings, enabled: false },
  { id: 'usuarios', label: 'Usuários', icon: Users, enabled: false },
];

function SummaryCard({ icon: Icon, label, value, tone }) {
  const tones = {
    amber: 'border-primary/30 bg-primary/5 text-primary',
    cyan: 'border-secondary/30 bg-secondary/5 text-secondary',
    pink: 'border-[hsl(var(--neon-pink)/0.3)] bg-[hsl(var(--neon-pink)/0.05)] text-[hsl(var(--neon-pink))]',
    green: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
  };
  return (
    <div className={cn('rounded-xl border px-4 py-3', tones[tone])}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold opacity-90">
        <Icon size={14} />
        {label}
      </div>
      <p className="text-2xl md:text-3xl font-display mt-2 tabular-nums">{value}</p>
    </div>
  );
}

function MachineRevenueCard({ item }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground truncate">{item.nome_jukebox}</p>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide shrink-0',
            item.is_active ? 'text-emerald-400' : 'text-muted-foreground'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              item.is_active ? 'bg-emerald-400' : 'bg-muted-foreground'
            )}
          />
          {item.is_active ? 'Ativa' : 'Inativa'}
        </span>
      </div>
      <p className="text-2xl font-display text-primary tabular-nums mt-2">
        {formatBRL(item.faturamento_numero ?? item.faturamento)}
      </p>
      <p className="text-xs text-muted-foreground mt-1 tabular-nums">
        {Number(item.creditos) || 0} crédito(s)
      </p>
    </div>
  );
}

function RevenueBarChart({ data }) {
  const maxValor = data.reduce((max, item) => Math.max(max, Number(item.valor) || 0), 0);

  if (!data.length) {
    return <p className="text-sm text-muted-foreground">Sem dados de faturamento no período.</p>;
  }

  return (
    <div className="space-y-2.5">
      {data.map((item) => {
        const valor = Number(item.valor) || 0;
        const width = maxValor > 0 ? Math.max(2, (valor / maxValor) * 100) : 0;
        return (
          <div key={item.maquina_id} className="flex items-center gap-3">
            <span className="w-28 md:w-36 truncate text-xs text-foreground/80" title={item.nome_jukebox}>
              {item.nome_jukebox}
            </span>
            <div className="flex-1 h-6 rounded-md bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-md bg-primary shadow-[0_0_12px_hsl(var(--neon-amber)/0.5)] transition-[width] duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="w-24 text-right text-xs text-primary tabular-nums shrink-0">
              {formatBRL(valor)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard({ token, onLogout }) {
  const now = new Date();
  const username = getAdminUsername();

  const [painel, setPainel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [periodId, setPeriodId] = useState('tudo');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const [pickingEnd, setPickingEnd] = useState(false);
  const [leftMonth, setLeftMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [maquinaId, setMaquinaId] = useState('');
  const [status, setStatus] = useState('todos');

  const load = useCallback(
    async (filters) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPainelAdministrativo(token, filters);
        setPainel(data);
      } catch (err) {
        if (err?.status === 401) {
          onLogout('Sessão do administrador expirada. Entre novamente.');
          return;
        }
        setError(err?.message || 'Erro ao carregar o painel');
      } finally {
        setLoading(false);
      }
    },
    [token, onLogout]
  );

  const currentFilters = useMemo(() => {
    if (periodId === 'custom' && customStart && customEnd) {
      return {
        dataInicio: toIsoDate(customStart),
        dataFim: toIsoDate(customEnd),
        maquinaId: maquinaId || undefined,
        status,
      };
    }
    return {
      periodo: periodId === 'custom' ? 'tudo' : periodId,
      maquinaId: maquinaId || undefined,
      status,
    };
  }, [periodId, customStart, customEnd, maquinaId, status]);

  useEffect(() => {
    if (periodId === 'custom' && !(customStart && customEnd)) return;
    load(currentFilters);
  }, [currentFilters, load, periodId, customStart, customEnd]);

  const selectPreset = (id) => {
    setPeriodId(id);
    setCalendarOpen(false);
    setCustomStart(null);
    setCustomEnd(null);
    setPickingEnd(false);
  };

  const handleSelectDate = (date) => {
    if (!pickingEnd || !customStart) {
      setCustomStart(date);
      setCustomEnd(date);
      setPickingEnd(true);
      return;
    }
    let start = customStart;
    let end = date;
    if (end < start) {
      start = date;
      end = customStart;
    }
    setCustomStart(start);
    setCustomEnd(end);
    setPickingEnd(false);
  };

  const resumo = painel?.resumo || {};
  const porMaquina = Array.isArray(painel?.faturamento_por_maquina) ? painel.faturamento_por_maquina : [];
  const grafico = Array.isArray(painel?.grafico_faturamento_por_maquina)
    ? painel.grafico_faturamento_por_maquina
    : [];
  const maquinasOpcoes = Array.isArray(painel?.maquinas_opcoes) ? painel.maquinas_opcoes : [];

  const periodoLabel =
    periodId === 'custom'
      ? formatCustomPeriodLabel(customStart, customEnd)
      : PERIOD_OPTIONS.find((p) => p.id === periodId)?.label || 'Todo período';
  const maquinaLabel = maquinaId
    ? maquinasOpcoes.find((m) => String(m.id) === String(maquinaId))?.nome_jukebox || `#${maquinaId}`
    : 'Todas as máquinas';
  const statusLabel = STATUS_OPTIONS.find((s) => s.id === status)?.label || 'Todos';

  const handleExportPdf = () => {
    if (!painel) return;
    exportPainelPdf(painel, { periodoLabel, maquinaLabel, statusLabel, usuario: username });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        <header className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <LayoutDashboard className="text-primary shrink-0" size={26} />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-display text-primary neon-glow-amber truncate">
                Painel Administrativo
              </h1>
              {username && <p className="text-xs text-muted-foreground truncate">Logado como {username}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => load(currentFilters)}
              disabled={loading}
              className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-50 transition-colors touch-manipulation"
              title="Atualizar dados"
              aria-label="Atualizar dados"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={!painel || loading}
              className="flex items-center gap-2 px-3 min-h-[44px] rounded-lg border border-primary/50 text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors touch-manipulation"
              title="Exportar PDF"
            >
              <FileDown size={16} />
              <span className="text-sm font-semibold">Exportar PDF</span>
            </button>
            <a
              href="#/"
              className="flex items-center px-3 min-h-[44px] rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors touch-manipulation"
            >
              Jukebox
            </a>
            <button
              type="button"
              onClick={() => onLogout()}
              className="flex items-center gap-2 px-3 min-h-[44px] rounded-lg border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors touch-manipulation"
              title="Sair do painel"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <nav className="flex items-center gap-2 border-b border-border pb-px overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              disabled={!tab.enabled}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm border-b-2 -mb-px transition-colors shrink-0 touch-manipulation',
                tab.enabled
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground/60 cursor-not-allowed'
              )}
              title={tab.enabled ? tab.label : `${tab.label} — em breve`}
            >
              <tab.icon size={15} />
              {tab.label}
              {!tab.enabled && (
                <span className="text-[9px] uppercase tracking-wide bg-muted rounded px-1 py-0.5">em breve</span>
              )}
            </button>
          ))}
        </nav>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {PERIOD_OPTIONS.map((period) => (
              <button
                key={period.id}
                type="button"
                onClick={() => selectPreset(period.id)}
                className={cn(
                  'h-10 px-3 rounded-xl text-sm font-medium transition-colors touch-manipulation border',
                  periodId === period.id
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                )}
              >
                {period.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setPeriodId('custom');
                setCalendarOpen((open) => !open);
                setPickingEnd(false);
                setCustomStart(null);
                setCustomEnd(null);
              }}
              className={cn(
                'h-10 px-3 rounded-xl border flex items-center gap-2 text-sm touch-manipulation',
                periodId === 'custom'
                  ? 'border-primary/50 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <CalendarDays size={15} className="shrink-0" />
              <span className="truncate max-w-[180px]">
                {periodId === 'custom' && customStart
                  ? formatCustomPeriodLabel(customStart, customEnd)
                  : 'Período personalizado'}
              </span>
            </button>

            <select
              value={maquinaId}
              onChange={(e) => setMaquinaId(e.target.value)}
              className="h-10 px-2.5 rounded-xl border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 max-w-[200px]"
              aria-label="Filtrar por máquina"
            >
              <option value="">Todas as máquinas</option>
              {maquinasOpcoes.map((maquina) => (
                <option key={maquina.id} value={maquina.id}>
                  {maquina.nome_jukebox}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 px-2.5 rounded-xl border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Filtrar por status"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {calendarOpen && periodId === 'custom' && (
            <PeriodCalendar
              leftYear={leftMonth.year}
              leftMonth={leftMonth.month}
              rangeStart={customStart}
              rangeEnd={customEnd}
              onSelectDate={handleSelectDate}
              onShift={(delta) => {
                const date = new Date(leftMonth.year, leftMonth.month + delta, 1);
                setLeftMonth({ year: date.getFullYear(), month: date.getMonth() });
              }}
            />
          )}
        </section>

        {error && (
          <p className="text-sm text-destructive border border-destructive/40 bg-destructive/10 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            icon={DollarSign}
            label="Faturamento Total"
            value={loading && !painel ? '—' : formatBRL(resumo.faturamento_total_numero ?? resumo.faturamento_total)}
            tone="amber"
          />
          <SummaryCard
            icon={Coins}
            label="Créditos Vendidos"
            value={loading && !painel ? '—' : Number(resumo.creditos_vendidos) || 0}
            tone="cyan"
          />
          <SummaryCard
            icon={Music}
            label="Músicas Tocadas"
            value={loading && !painel ? '—' : Number(resumo.musicas_tocadas) || 0}
            tone="pink"
          />
          <SummaryCard
            icon={Disc}
            label="Máquinas Ativas"
            value={loading && !painel ? '—' : Number(resumo.maquinas_ativas) || 0}
            tone="green"
          />
        </section>

        <section>
          <h2 className="text-sm font-display text-primary tracking-wider mb-3">Faturamento por Máquina</h2>
          {porMaquina.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">Nenhuma máquina com vendas no período.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {porMaquina.map((item) => (
                <MachineRevenueCard key={item.maquina_id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card/40 p-4">
          <h2 className="text-sm font-display text-primary tracking-wider mb-4">
            Gráfico — Faturamento por Máquina
          </h2>
          {loading && !painel ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <RevenueBarChart data={grafico} />
          )}
        </section>

        <p className="text-center text-[11px] text-muted-foreground pb-4">
          Filtros ativos: {periodoLabel} · {maquinaLabel} · {statusLabel}
        </p>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Coins, DollarSign, X } from 'lucide-react';
import { fetchLeitura } from '../../api/maquinas';
import {
  BILLING_PERIODS,
  formatBRL,
  formatCustomPeriodLabel,
  getPeriodBounds,
  normalizeLeituraResponse,
  summarizeBillingEvents,
  toIsoDate,
} from '../../lib/billing';
import { cn } from '../../lib/utils';
import PeriodCalendar from './PeriodCalendar';

const EMPTY_SUMMARY = { faturamento: 0, creditos: 0, transacoes: 0, tocadas: 0 };

export default function BillingModal({ token, machineName, onClose }) {
  const now = new Date();
  const [periodId, setPeriodId] = useState('hoje');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const [pickingEnd, setPickingEnd] = useState(false);
  const [leftMonth, setLeftMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [displayName, setDisplayName] = useState(machineName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSummary = useCallback(
    async (nextPeriodId, startDate, endDate) => {
      const bounds = getPeriodBounds(nextPeriodId, startDate, endDate);
      setLoading(true);
      setError(null);

      try {
        const data = await fetchLeitura(token, {
          dataInicio: bounds.start ? toIsoDate(bounds.start) : undefined,
          dataFim: bounds.end ? toIsoDate(bounds.end) : undefined,
        });
        const remote = normalizeLeituraResponse(data);
        if (remote) {
          setSummary(remote);
          if (remote.nome_jukebox) setDisplayName(remote.nome_jukebox);
        }
      } catch (err) {
        setSummary(summarizeBillingEvents(bounds));
        if (err?.status === 401) {
          setError(err.message || 'Token inválido ou ausente');
        }
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadSummary('hoje');
  }, [loadSummary]);

  const selectPreset = (id) => {
    setPeriodId(id);
    setCalendarOpen(false);
    setCustomStart(null);
    setCustomEnd(null);
    setPickingEnd(false);
    loadSummary(id);
  };

  const handleSelectDate = (date) => {
    setPeriodId('custom');

    if (!pickingEnd || !customStart) {
      setCustomStart(date);
      setCustomEnd(date);
      setPickingEnd(true);
      loadSummary('custom', date, date);
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
    loadSummary('custom', start, end);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-border bg-[#1e2128] shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="billing-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 id="billing-title" className="text-2xl font-display text-primary neon-glow-amber">
              Leitura de Faturamento
            </h2>
            {displayName && <p className="text-sm text-muted-foreground mt-1">{displayName}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground touch-manipulation"
            aria-label="Fechar leitura"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Período</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {BILLING_PERIODS.map((period) => (
            <button
              key={period.id}
              type="button"
              onClick={() => selectPreset(period.id)}
              className={cn(
                'h-11 rounded-xl text-sm font-medium transition-colors touch-manipulation border',
                periodId === period.id
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              )}
            >
              {period.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCalendarOpen((open) => !open)}
          className={cn(
            'w-full h-11 rounded-xl border px-3 flex items-center gap-2 text-sm touch-manipulation mb-4',
            periodId === 'custom'
              ? 'border-primary/50 text-foreground'
              : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <CalendarDays size={16} className="shrink-0" />
          <span className="truncate">{formatCustomPeriodLabel(customStart, customEnd)}</span>
        </button>

        {calendarOpen && (
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

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2 text-primary text-[11px] uppercase tracking-wider font-semibold">
              <DollarSign size={14} />
              Faturamento
            </div>
            <p className="text-3xl font-display text-primary mt-2">
              {loading ? '—' : formatBRL(summary.faturamento)}
            </p>
          </div>
          <div className="rounded-xl border border-secondary/30 bg-secondary/5 px-4 py-3">
            <div className="flex items-center gap-2 text-secondary text-[11px] uppercase tracking-wider font-semibold">
              <Coins size={14} />
              Créditos
            </div>
            <p className="text-3xl font-display text-secondary mt-2">
              {loading ? '—' : summary.creditos}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {summary.transacoes} transação(ões) no período
          {summary.tocadas > 0 ? ` · ${summary.tocadas} música(s) tocada(s)` : ''}
        </p>
        {error && <p className="text-center text-xs text-destructive mt-2">{error}</p>}
      </div>
    </div>
  );
}

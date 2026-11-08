import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dices, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { fetchPainelAdministrativo } from '../../api/painel';
import { fetchRoletaAdmin, saveRoletaAdmin } from '../../api/roleta';
import { cn } from '../../lib/utils';

const PESO_FIELDS = [
  { key: 'premio_mais_2_musicas', label: '+2 músicas', premio: true },
  { key: 'premio_mais_1_musica', label: '+1 música', premio: true },
  { key: 'bonus_recarga_50pct', label: 'Bônus 50% na recarga', premio: true },
  { key: 'tente_novamente', label: 'Tente novamente', premio: false },
  { key: 'nao_foi_dessa_vez', label: 'Não foi dessa vez', premio: false },
];

const PREMIO_TIPOS = [
  { id: 'musica_gratis', label: 'Música grátis' },
  { id: 'giro_extra', label: 'Giro extra' },
  { id: 'sem_premio', label: 'Sem prêmio' },
];

const EMPTY_FORM = {
  ativada: false,
  probabilidades: Object.fromEntries(PESO_FIELDS.map((f) => [f.key, 0])),
  regras: { creditos_minimos_girar: 0, max_premio_mais_2_musicas_dia_percent: 0 },
  faixas: [],
};

/** Response da API → estado editável (ignora `resumo`, `id` e `ordem`). */
function configToForm(data) {
  const prob = data?.probabilidades || {};
  const regras = data?.regras || {};
  return {
    ativada: !!data?.ativada,
    probabilidades: Object.fromEntries(
      PESO_FIELDS.map((f) => [f.key, Number(prob[f.key]) || 0])
    ),
    regras: {
      creditos_minimos_girar: Number(regras.creditos_minimos_girar) || 0,
      max_premio_mais_2_musicas_dia_percent:
        Number(regras.max_premio_mais_2_musicas_dia_percent) || 0,
    },
    faixas: (Array.isArray(data?.faixas_valor) ? data.faixas_valor : []).map((faixa) => ({
      valor: faixa.valor_numero ?? faixa.valor ?? '',
      giros_liberados: Number(faixa.giros_liberados) || 1,
      premios: (Array.isArray(faixa.premios) ? faixa.premios : []).map((p) => ({
        tipo: p.tipo || 'sem_premio',
        quantidade: Number(p.quantidade) || 1,
        peso: Number(p.peso) || 0,
      })),
    })),
  };
}

/** Estado editável → body do PUT (formato exato do contrato, sem id/ordem). */
function formToPayload(form) {
  return {
    ativada: form.ativada,
    probabilidades: Object.fromEntries(
      PESO_FIELDS.map((f) => [f.key, Math.max(0, Number(form.probabilidades[f.key]) || 0)])
    ),
    regras: {
      creditos_minimos_girar: Math.max(0, Number(form.regras.creditos_minimos_girar) || 0),
      max_premio_mais_2_musicas_dia_percent: Math.max(
        0,
        Number(form.regras.max_premio_mais_2_musicas_dia_percent) || 0
      ),
    },
    faixas_valor: form.faixas.map((faixa) => ({
      valor: Number(faixa.valor || 0).toFixed(2),
      giros_liberados: Math.max(0, Number(faixa.giros_liberados) || 0),
      premios: faixa.premios.map((p) => ({
        tipo: p.tipo,
        quantidade: Math.max(1, Number(p.quantidade) || 1),
        peso: Math.max(0, Number(p.peso) || 0),
      })),
    })),
  };
}

function NumberField({ label, value, onChange, min = 0, step = 1, suffix, className }) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 tabular-nums"
        />
        {suffix && <span className="text-xs text-muted-foreground shrink-0">{suffix}</span>}
      </div>
    </label>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card/40 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-display text-primary tracking-wider">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function AdminRoletaTab({ token, onAuthError }) {
  const [maquinas, setMaquinas] = useState([]);
  const [maquinaId, setMaquinaId] = useState('');
  const [meta, setMeta] = useState({ nome: '', updatedAt: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [loadingMaquinas, setLoadingMaquinas] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /** No carregamento (GET), 400/401 = token ausente/inválido → sessão expirada. */
  const handleLoadError = useCallback(
    (err) => {
      if (err?.status === 401 || err?.status === 400) {
        onAuthError?.();
        return true;
      }
      return false;
    },
    [onAuthError]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMaquinas(true);
      try {
        const data = await fetchPainelAdministrativo(token, {});
        if (cancelled) return;
        const lista = Array.isArray(data?.maquinas_opcoes) ? data.maquinas_opcoes : [];
        setMaquinas(lista);
        if (lista.length > 0) setMaquinaId(String(lista[0].id));
        else setError('Nenhuma máquina cadastrada.');
      } catch (err) {
        if (cancelled) return;
        if (!handleLoadError(err)) setError(err?.message || 'Erro ao carregar máquinas');
      } finally {
        if (!cancelled) setLoadingMaquinas(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, handleLoadError]);

  const loadConfig = useCallback(
    async (id) => {
      if (!id) return;
      setLoadingConfig(true);
      setError(null);
      setSuccess(null);
      try {
        const data = await fetchRoletaAdmin(token, id);
        setForm(configToForm(data));
        setMeta({ nome: data?.nome_jukebox || '', updatedAt: data?.updated_at || null });
      } catch (err) {
        if (!handleLoadError(err)) setError(err?.message || 'Erro ao carregar configuração da roleta');
      } finally {
        setLoadingConfig(false);
      }
    },
    [token, handleLoadError]
  );

  useEffect(() => {
    loadConfig(maquinaId);
  }, [maquinaId, loadConfig]);

  const resumo = useMemo(() => {
    const valores = PESO_FIELDS.map((f) => Math.max(0, Number(form.probabilidades[f.key]) || 0));
    const total = valores.reduce((acc, v) => acc + v, 0);
    const ganhar = PESO_FIELDS.reduce((acc, f, i) => acc + (f.premio ? valores[i] : 0), 0);
    const chance = total > 0 ? (ganhar / total) * 100 : 0;
    return { total, chance, vantagem: 100 - chance };
  }, [form.probabilidades]);

  const setPeso = (key, value) =>
    setForm((f) => ({ ...f, probabilidades: { ...f.probabilidades, [key]: value } }));
  const setRegra = (key, value) =>
    setForm((f) => ({ ...f, regras: { ...f.regras, [key]: value } }));
  const addFaixa = () =>
    setForm((f) => ({
      ...f,
      faixas: [
        ...f.faixas,
        {
          valor: '',
          giros_liberados: 1,
          premios: [
            { tipo: 'musica_gratis', quantidade: 1, peso: 10 },
            { tipo: 'sem_premio', quantidade: 1, peso: 10 },
          ],
        },
      ],
    }));
  const removeFaixa = (idx) =>
    setForm((f) => ({ ...f, faixas: f.faixas.filter((_, i) => i !== idx) }));
  const setFaixaField = (idx, field, value) =>
    setForm((f) => ({
      ...f,
      faixas: f.faixas.map((fx, i) => (i === idx ? { ...fx, [field]: value } : fx)),
    }));
  const addPremio = (idx) =>
    setForm((f) => ({
      ...f,
      faixas: f.faixas.map((fx, i) =>
        i === idx
          ? { ...fx, premios: [...fx.premios, { tipo: 'sem_premio', quantidade: 1, peso: 10 }] }
          : fx
      ),
    }));
  const removePremio = (idx, pidx) =>
    setForm((f) => ({
      ...f,
      faixas: f.faixas.map((fx, i) =>
        i === idx ? { ...fx, premios: fx.premios.filter((_, j) => j !== pidx) } : fx
      ),
    }));
  const setPremioField = (idx, pidx, field, value) =>
    setForm((f) => ({
      ...f,
      faixas: f.faixas.map((fx, i) =>
        i === idx
          ? { ...fx, premios: fx.premios.map((p, j) => (j === pidx ? { ...p, [field]: value } : p)) }
          : fx
      ),
    }));

  const handleSave = async () => {
    if (!maquinaId || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await saveRoletaAdmin(token, maquinaId, formToPayload(form));
      // Recarrega para refletir ids/resumo/updated_at gerados pelo backend
      await loadConfig(maquinaId);
      setSuccess('Configuração da roleta salva com sucesso.');
    } catch (err) {
      // No salvar, 400 pode ser validação de campos — exibir inline
      if (err?.status === 401) {
        onAuthError?.();
        return;
      }
      setError(err?.message || 'Erro ao salvar configuração da roleta');
    } finally {
      setSaving(false);
    }
  };

  const updatedLabel = meta.updatedAt ? new Date(meta.updatedAt).toLocaleString('pt-BR') : null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card/40 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Dices size={16} className="text-primary" />
          <span className="font-semibold">Máquina</span>
        </div>
        <select
          value={maquinaId}
          onChange={(e) => setMaquinaId(e.target.value)}
          disabled={loadingMaquinas || maquinas.length === 0}
          className="h-10 px-2.5 rounded-xl border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 max-w-[240px] disabled:opacity-50"
          aria-label="Selecionar máquina"
        >
          {maquinas.length === 0 && <option value="">—</option>}
          {maquinas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome_jukebox}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => loadConfig(maquinaId)}
          disabled={!maquinaId || loadingConfig}
          className="p-2.5 min-w-[40px] min-h-[40px] rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-50 transition-colors touch-manipulation"
          title="Recarregar configuração"
          aria-label="Recarregar configuração"
        >
          <RefreshCw size={15} className={loadingConfig ? 'animate-spin' : ''} />
        </button>
        <div className="ml-auto flex items-center gap-3">
          {updatedLabel && (
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Atualizado em {updatedLabel}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loadingConfig || !maquinaId}
            className="flex items-center gap-2 px-4 min-h-[40px] rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all touch-manipulation"
          >
            <Save size={15} />
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </section>

      {error && (
        <p className="text-sm text-destructive border border-destructive/40 bg-destructive/10 rounded-xl px-4 py-3">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-400 border border-emerald-500/40 bg-emerald-500/10 rounded-xl px-4 py-3">
          {success}
        </p>
      )}

      {loadingConfig ? (
        <p className="text-sm text-muted-foreground">Carregando configuração…</p>
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-card/40 p-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-display text-primary tracking-wider">Roleta ativada</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Quando ativa, a máquina libera giros conforme as faixas de valor inserido.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.ativada}
              onClick={() => setForm((f) => ({ ...f, ativada: !f.ativada }))}
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors shrink-0 touch-manipulation',
                form.ativada ? 'bg-primary' : 'bg-muted border border-border'
              )}
              title={form.ativada ? 'Desativar roleta' : 'Ativar roleta'}
            >
              <span
                className={cn(
                  'absolute top-1 w-5 h-5 rounded-full bg-white transition-all',
                  form.ativada ? 'left-6' : 'left-1'
                )}
              />
            </button>
          </section>

          <SectionCard
            title="Probabilidades (pesos)"
            description="Pesos dos setores da roleta global. A chance de prêmio é a soma dos pesos premiados dividida pelo total."
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {PESO_FIELDS.map((field) => (
                <NumberField
                  key={field.key}
                  label={field.label}
                  value={form.probabilidades[field.key]}
                  onChange={(v) => setPeso(field.key, v)}
                />
              ))}
            </div>
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>
                Total de pesos: <b className="text-foreground tabular-nums">{resumo.total}</b>
              </span>
              <span className="text-emerald-400">
                Chance de prêmio: <b className="tabular-nums">{resumo.chance.toFixed(1)}%</b>
              </span>
              <span className="text-primary">
                Vantagem do sistema: <b className="tabular-nums">{resumo.vantagem.toFixed(1)}%</b>
              </span>
            </div>
          </SectionCard>

          <SectionCard title="Regras" description="Condições para girar e limite diário de prêmio.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumberField
                label="Créditos mínimos para girar"
                value={form.regras.creditos_minimos_girar}
                onChange={(v) => setRegra('creditos_minimos_girar', v)}
                suffix="créditos"
              />
              <NumberField
                label="Limite diário de prêmio +2 músicas"
                value={form.regras.max_premio_mais_2_musicas_dia_percent}
                onChange={(v) => setRegra('max_premio_mais_2_musicas_dia_percent', v)}
                suffix="% ao dia"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Faixas por valor inserido"
            description="Cada faixa define quantos giros o valor libera e os prêmios ponderados. Ao salvar, a lista substitui as faixas anteriores."
          >
            {form.faixas.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma faixa cadastrada.</p>
            )}
            <div className="space-y-3">
              {form.faixas.map((faixa, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <NumberField
                      label="Valor inserido (R$)"
                      value={faixa.valor}
                      step="0.01"
                      onChange={(v) => setFaixaField(idx, 'valor', v)}
                      className="w-36"
                    />
                    <NumberField
                      label="Giros liberados"
                      value={faixa.giros_liberados}
                      onChange={(v) => setFaixaField(idx, 'giros_liberados', v)}
                      className="w-32"
                    />
                    <button
                      type="button"
                      onClick={() => removeFaixa(idx)}
                      className="ml-auto p-2.5 min-w-[40px] min-h-[40px] rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors touch-manipulation"
                      title="Remover faixa"
                      aria-label="Remover faixa"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_72px_72px_36px] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground px-0.5">
                      <span>Prêmio</span>
                      <span>Qtd</span>
                      <span>Peso</span>
                      <span />
                    </div>
                    {faixa.premios.map((premio, pidx) => (
                      <div key={pidx} className="grid grid-cols-[1fr_72px_72px_36px] gap-2 items-center">
                        <select
                          value={premio.tipo}
                          onChange={(e) => setPremioField(idx, pidx, 'tipo', e.target.value)}
                          className="h-9 px-2 rounded-lg border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          aria-label="Tipo de prêmio"
                        >
                          {PREMIO_TIPOS.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={premio.quantidade}
                          onChange={(e) => setPremioField(idx, pidx, 'quantidade', e.target.value)}
                          className="h-9 px-2 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 tabular-nums"
                          aria-label="Quantidade"
                        />
                        <input
                          type="number"
                          min={0}
                          value={premio.peso}
                          onChange={(e) => setPremioField(idx, pidx, 'peso', e.target.value)}
                          className="h-9 px-2 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 tabular-nums"
                          aria-label="Peso"
                        />
                        <button
                          type="button"
                          onClick={() => removePremio(idx, pidx)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors touch-manipulation"
                          title="Remover prêmio"
                          aria-label="Remover prêmio"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addPremio(idx)}
                      className="flex items-center gap-1.5 text-xs text-secondary hover:brightness-125 transition-all touch-manipulation"
                    >
                      <Plus size={13} />
                      Adicionar prêmio
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addFaixa}
              className="flex items-center gap-2 px-3 min-h-[40px] rounded-lg border border-secondary/50 text-secondary text-sm font-semibold hover:bg-secondary/10 transition-colors touch-manipulation"
            >
              <Plus size={15} />
              Adicionar faixa de valor
            </button>
          </SectionCard>
        </>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Plus, QrCode, RefreshCw, Save, Trash2 } from 'lucide-react';
import {
  createPixCreditoAdmin,
  deletePixCreditoAdmin,
  listPixCreditosAdmin,
  updatePixCreditoAdmin,
} from '../../api/pagamentos';
import { formatBRL } from '../../lib/billing';
import { cn } from '../../lib/utils';

const EMPTY_FORM = {
  valor_pix: '',
  quantidade_creditos: '',
  ordem: '',
  ativo: true,
};

function toPayload(form) {
  const valor = Number(form.valor_pix);
  return {
    valor_pix: Number.isFinite(valor) ? valor.toFixed(2) : String(form.valor_pix || ''),
    quantidade_creditos: Math.max(1, Math.round(Number(form.quantidade_creditos) || 0)),
    ordem: Math.max(0, Math.round(Number(form.ordem) || 0)),
    ativo: !!form.ativo,
  };
}

function RowFields({ form, onChange, disabled }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 min-w-0">
      <label className="block">
        <span className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
          Valor PIX (R$)
        </span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={form.valor_pix}
          disabled={disabled}
          onChange={(e) => onChange({ ...form, valor_pix: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 tabular-nums"
        />
      </label>
      <label className="block">
        <span className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
          Créditos
        </span>
        <input
          type="number"
          min="1"
          step="1"
          value={form.quantidade_creditos}
          disabled={disabled}
          onChange={(e) => onChange({ ...form, quantidade_creditos: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 tabular-nums"
        />
      </label>
      <label className="block">
        <span className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
          Ordem
        </span>
        <input
          type="number"
          min="0"
          step="1"
          value={form.ordem}
          disabled={disabled}
          onChange={(e) => onChange({ ...form, ordem: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 tabular-nums"
        />
      </label>
      <label className="flex items-end gap-2 pb-2">
        <input
          type="checkbox"
          checked={!!form.ativo}
          disabled={disabled}
          onChange={(e) => onChange({ ...form, ativo: e.target.checked })}
          className="rounded border-border"
        />
        <span className="text-sm text-foreground">Ativo no modal</span>
      </label>
    </div>
  );
}

export default function AdminPixCreditosTab({ token, onAuthError }) {
  const [itens, setItens] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [creating, setCreating] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  const handleSaveError = useCallback(
    (err) => {
      if (err?.status === 401) {
        onAuthError?.();
        return true;
      }
      return false;
    },
    [onAuthError]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lista = await listPixCreditosAdmin(token);
      setItens(lista);
      setDrafts(
        Object.fromEntries(
          lista.map((item) => [
            item.id,
            {
              valor_pix: item.valor_pix_numero,
              quantidade_creditos: item.quantidade_creditos,
              ordem: item.ordem,
              ativo: item.ativo,
            },
          ])
        )
      );
    } catch (err) {
      if (!handleLoadError(err)) setError(err?.message || 'Erro ao carregar opções de créditos PIX');
    } finally {
      setLoading(false);
    }
  }, [token, handleLoadError]);

  useEffect(() => {
    load();
  }, [load]);

  const saveItem = async (id) => {
    const form = drafts[id];
    if (!form) return;
    setSavingId(id);
    setError(null);
    setSuccess(null);
    try {
      await updatePixCreditoAdmin(token, id, toPayload(form));
      setSuccess('Opção atualizada.');
      await load();
    } catch (err) {
      if (!handleSaveError(err)) setError(err?.message || 'Erro ao salvar opção');
    } finally {
      setSavingId(null);
    }
  };

  const createItem = async () => {
    if (!creating.valor_pix || !creating.quantidade_creditos) {
      setError('Informe valor PIX e quantidade de créditos.');
      return;
    }
    setSavingId('new');
    setError(null);
    setSuccess(null);
    try {
      await createPixCreditoAdmin(token, toPayload({
        ...creating,
        ordem: creating.ordem === '' ? itens.length + 1 : creating.ordem,
      }));
      setCreating(EMPTY_FORM);
      setSuccess('Opção criada. Já aparece no modal da jukebox se estiver ativa.');
      await load();
    } catch (err) {
      if (!handleSaveError(err)) setError(err?.message || 'Erro ao criar opção');
    } finally {
      setSavingId(null);
    }
  };

  const removeItem = async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setSavingId(id);
    setError(null);
    setSuccess(null);
    try {
      await deletePixCreditoAdmin(token, id);
      setConfirmDeleteId(null);
      setSuccess('Opção removida.');
      await load();
    } catch (err) {
      if (!handleSaveError(err)) setError(err?.message || 'Erro ao excluir opção');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <QrCode className="text-secondary shrink-0" size={22} />
          <div>
            <h2 className="text-lg font-display text-secondary">Créditos PIX</h2>
            <p className="text-xs text-muted-foreground">
              Valores do modal da jukebox e créditos concedidos após o pagamento. Também editável no
              Django Admin → Pagamentos → créditos (configuração).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="ml-auto p-2.5 min-w-[44px] min-h-[44px] rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-50 touch-manipulation"
          title="Atualizar"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <p className="text-sm text-destructive border border-destructive/30 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-emerald-400 border border-emerald-500/30 rounded-lg px-3 py-2">{success}</p>
      )}

      <section className="rounded-2xl border border-border bg-card/40 p-4 space-y-3">
        <h3 className="text-sm font-display text-primary tracking-wider">Nova opção</h3>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <RowFields form={creating} onChange={setCreating} disabled={savingId === 'new'} />
          <button
            type="button"
            onClick={createItem}
            disabled={savingId === 'new'}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:brightness-110 disabled:opacity-50 touch-manipulation shrink-0"
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>
      </section>

      {loading && itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Carregando opções…</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma opção cadastrada. A jukebox usa os valores padrão da migração.</p>
      ) : (
        <div className="space-y-3">
          {itens.map((item) => {
            const form = drafts[item.id] || EMPTY_FORM;
            const busy = savingId === item.id;
            return (
              <div key={item.id} className="rounded-2xl border border-border bg-card/40 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-foreground">
                    <span className="font-display text-secondary tabular-nums">{formatBRL(item.valor_pix_numero)}</span>
                    <span className="text-muted-foreground"> → {item.quantidade_creditos} crédito(s)</span>
                    {!item.ativo && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                        inativo
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <RowFields
                    form={form}
                    disabled={busy}
                    onChange={(next) => setDrafts((prev) => ({ ...prev, [item.id]: next }))}
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => saveItem(item.id)}
                      disabled={busy}
                      className="flex items-center gap-2 h-10 px-3 rounded-lg border border-primary/50 text-primary hover:bg-primary/10 disabled:opacity-50 text-sm touch-manipulation"
                    >
                      <Save size={15} />
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={busy}
                      className={cn(
                        'flex items-center gap-2 h-10 px-3 rounded-lg border text-sm touch-manipulation disabled:opacity-50',
                        confirmDeleteId === item.id
                          ? 'border-destructive text-destructive bg-destructive/10'
                          : 'border-border text-muted-foreground hover:text-destructive hover:border-destructive/50'
                      )}
                    >
                      <Trash2 size={15} />
                      {confirmDeleteId === item.id ? 'Confirmar' : 'Excluir'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

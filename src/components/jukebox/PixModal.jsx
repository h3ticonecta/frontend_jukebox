import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Check, Copy, Loader2, QrCode, X } from 'lucide-react';
import {
  PIX_CREDITOS_PADRAO,
  criarPixQrCode,
  fetchPixCreditoOpcoes,
  mapPixError,
  pixQrImageSrc,
  pixStatusKind,
  resolvePixCreditosConcedidos,
  sincronizarPix,
} from '../../api/pagamentos';
import { formatBRL } from '../../lib/billing';
import { cn } from '../../lib/utils';

const POLL_MS = 3000;
const SUCCESS_MS = 1800;
const PRESET_COLS = 2;
const PASS_THROUGH = new Set(['credito', 'pular', 'vol_mais', 'vol_menos']);

function remainingLabel(expiresAt, now) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(ms)) return null;
  if (ms <= 0) return 'QR expirado';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `Expira em ${min}:${String(sec).padStart(2, '0')}`;
}

function presetNavId(index) {
  return `p-${index}`;
}

function hasSairSlot(count) {
  return count > 0 && count % PRESET_COLS === 1;
}

function moveValorNav(nav, acao, authFailed, count) {
  if (count <= 0) {
    if (nav === 'relogin' && acao === 'baixo') return 'gerar';
    if (nav === 'gerar' && acao === 'cima' && authFailed) return 'relogin';
    return nav === 'relogin' || nav === 'gerar' ? nav : 'gerar';
  }
  const last = count - 1;
  const afterPresets = authFailed ? 'relogin' : 'gerar';
  const oddSair = hasSairSlot(count);
  const lastValBeforeFooter = oddSair ? 'sair' : presetNavId(last);

  if (nav === 'sair') {
    if (acao === 'esquerda') return presetNavId(last);
    if (acao === 'cima') return last >= PRESET_COLS ? presetNavId(last - PRESET_COLS) : nav;
    if (acao === 'baixo') return afterPresets;
    return nav;
  }

  if (nav.startsWith('p-')) {
    const i = Number(nav.slice(2));
    const col = i % PRESET_COLS;
    if (acao === 'esquerda') return col > 0 ? presetNavId(i - 1) : nav;
    if (acao === 'direita') {
      if (col === 0 && i < last) return presetNavId(i + 1);
      if (oddSair && i === last) return 'sair';
      return nav;
    }
    if (acao === 'cima') return i >= PRESET_COLS ? presetNavId(i - PRESET_COLS) : nav;
    if (acao === 'baixo') {
      const down = i + PRESET_COLS;
      return down <= last ? presetNavId(down) : afterPresets;
    }
    return nav;
  }
  if (nav === 'relogin') {
    if (acao === 'cima') return lastValBeforeFooter;
    if (acao === 'baixo') return 'gerar';
    return nav;
  }
  if (nav === 'gerar') {
    if (acao === 'cima') return authFailed ? 'relogin' : lastValBeforeFooter;
    return nav;
  }
  return nav;
}

function moveQrNav(nav, acao, { hasCopy, hasRetry }) {
  const items = [];
  if (hasCopy) items.push('copy');
  if (hasRetry) items.push('retry');
  if (items.length < 2) return nav;
  if (acao !== 'cima' && acao !== 'baixo' && acao !== 'esquerda' && acao !== 'direita') return nav;
  const idx = items.indexOf(nav);
  if (idx < 0) return items[0];
  const next = acao === 'cima' || acao === 'esquerda' ? idx - 1 : idx + 1;
  if (next < 0 || next >= items.length) return nav;
  return items[next];
}

function navRing(active) {
  return active && 'ring-2 ring-primary ring-offset-2 ring-offset-[#1e2128]';
}

const PixModal = forwardRef(function PixModal({ token, onApproved, onClose, onReLogin }, ref) {
  const [step, setStep] = useState('valor');
  const [opcoes, setOpcoes] = useState([]);
  const [opcoesStatus, setOpcoesStatus] = useState('loading');
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cobranca, setCobranca] = useState(null);
  const [copied, setCopied] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [nav, setNav] = useState(presetNavId(0));

  const approvedRef = useRef(false);
  const onApprovedRef = useRef(onApproved);
  const onCloseRef = useRef(onClose);
  const onReLoginRef = useRef(onReLogin);
  const lastCreditosRef = useRef(0);
  onApprovedRef.current = onApproved;
  onCloseRef.current = onClose;
  onReLoginRef.current = onReLogin;

  const selected = opcoes.find((item) => String(item.id) === String(selectedId)) || opcoes[0] || null;
  const valor = selected?.valor_pix_numero ?? 0;
  const creditosOpcao = selected?.quantidade_creditos ?? 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setOpcoesStatus('loading');
      try {
        const lista = await fetchPixCreditoOpcoes(token);
        if (cancelled) return;
        if (lista.length === 0) {
          setOpcoes([]);
          setOpcoesStatus('empty');
          return;
        }
        setOpcoes(lista);
        setSelectedId(lista[0].id);
        setNav(presetNavId(0));
        setOpcoesStatus('ready');
      } catch (err) {
        if (cancelled) return;
        const auth = err?.status === 401 || err?.status === 403 || err?.data?.error?.code === 'UNAUTHORIZED';
        setAuthFailed(auth);
        if (auth) {
          setOpcoes([]);
          setOpcoesStatus('error');
          setError(mapPixError(err));
          return;
        }
        setOpcoes(PIX_CREDITOS_PADRAO);
        setSelectedId(PIX_CREDITOS_PADRAO[0].id);
        setNav(presetNavId(0));
        setOpcoesStatus('fallback');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const gerar = useCallback(
    async (amount, creditosHint) => {
      setLoading(true);
      setError(null);
      setAuthFailed(false);
      approvedRef.current = false;
      lastCreditosRef.current = Math.max(0, Math.round(Number(creditosHint) || 0));
      try {
        const data = await criarPixQrCode(token, {
          valor: Number(amount),
          descricao: 'Créditos jukebox',
        });
        const creditos = resolvePixCreditosConcedidos(data, lastCreditosRef.current);
        lastCreditosRef.current = creditos;
        setCobranca({ ...data, quantidade_creditos: creditos });
        setStep('qr');
      } catch (err) {
        setAuthFailed(err?.status === 401 || err?.status === 403 || err?.data?.error?.code === 'UNAUTHORIZED');
        setError(mapPixError(err));
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const id = cobranca?.id;
    if (step !== 'qr' || !id) return undefined;

    let cancelled = false;
    const tick = async () => {
      if (approvedRef.current) return;
      try {
        const data = await sincronizarPix(token, id);
        if (cancelled) return;
        const creditos = resolvePixCreditosConcedidos(data, lastCreditosRef.current);
        lastCreditosRef.current = creditos;
        setCobranca({ ...data, quantidade_creditos: creditos });
        const kind = pixStatusKind(data.status);
        if (kind === 'aprovado' && !approvedRef.current) {
          approvedRef.current = true;
          setStep('ok');
          onApprovedRef.current?.({ ...data, quantidade_creditos: creditos });
        }
      } catch {
        // Mantém o QR; tenta de novo no próximo ciclo
      }
    };

    tick();
    const poll = window.setInterval(tick, POLL_MS);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [step, cobranca?.id, token]);

  useEffect(() => {
    if (step !== 'ok') return undefined;
    const timer = window.setTimeout(() => onCloseRef.current?.(), SUCCESS_MS);
    return () => window.clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (step === 'qr') setNav('copy');
  }, [step]);

  const handleCopy = useCallback(async () => {
    const code = cobranca?.qr_code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Não foi possível copiar. Selecione o código manualmente.');
    }
  }, [cobranca?.qr_code]);

  const voltarAoValor = useCallback(() => {
    setCobranca(null);
    setStep('valor');
    setError(null);
    setNav(presetNavId(0));
  }, []);

  const selectOpcao = useCallback((opcao, index) => {
    if (!opcao) return;
    setSelectedId(opcao.id);
    setNav(presetNavId(index));
  }, []);

  const qrSrc = pixQrImageSrc(cobranca?.qr_code_base64);
  const expireText = remainingLabel(cobranca?.expires_at, now);
  const expired = expireText === 'QR expirado';
  const failed = pixStatusKind(cobranca?.status) === 'falhou';
  const hasRetry = expired || failed;
  const creditosQr = resolvePixCreditosConcedidos(cobranca, lastCreditosRef.current || creditosOpcao);

  useEffect(() => {
    if (step !== 'qr' || !hasRetry) return;
    setNav('retry');
  }, [step, hasRetry]);

  const handleAction = useCallback(
    (acao) => {
      if (PASS_THROUGH.has(acao)) return false;

      if (acao === 'cancelar') {
        onCloseRef.current?.();
        return true;
      }

      if (step === 'ok' || opcoesStatus === 'loading') return true;

      if (acao === 'cima' || acao === 'baixo' || acao === 'esquerda' || acao === 'direita') {
        if (step === 'valor') {
          const next = moveValorNav(nav, acao, authFailed, opcoes.length);
          setNav(next);
          if (next.startsWith('p-')) {
            const opcao = opcoes[Number(next.slice(2))];
            if (opcao) setSelectedId(opcao.id);
          }
        } else if (step === 'qr') {
          setNav((current) =>
            moveQrNav(current, acao, { hasCopy: Boolean(cobranca?.qr_code), hasRetry })
          );
        }
        return true;
      }

      if (acao === 'fila' || acao === 'tocar_cd' || acao === 'pix') {
        if (step === 'valor') {
          if (nav === 'sair') {
            onCloseRef.current?.();
          } else if (nav === 'relogin') {
            onReLoginRef.current?.();
          } else if (!loading && opcoes.length > 0) {
            const opcao = nav.startsWith('p-') ? opcoes[Number(nav.slice(2))] : selected;
            if (opcao) gerar(opcao.valor_pix_numero, opcao.quantidade_creditos);
          }
        } else if (step === 'qr') {
          if (nav === 'copy') handleCopy();
          else if (nav === 'retry') voltarAoValor();
        }
        return true;
      }

      return true;
    },
    [
      step,
      nav,
      authFailed,
      cobranca?.qr_code,
      hasRetry,
      loading,
      opcoes,
      opcoesStatus,
      selected,
      gerar,
      handleCopy,
      voltarAoValor,
    ]
  );

  useImperativeHandle(ref, () => ({ handleAction }), [handleAction]);

  useEffect(() => {
    document.querySelector('[data-pix-nav-active="true"]')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [nav]);

  return (
    <div
      className="fixed inset-0 z-[72] flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-[#1e2128] shadow-2xl p-7 sm:p-8 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="pix-title"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="text-secondary shrink-0" size={22} />
            <h2 id="pix-title" className="text-2xl font-display text-secondary neon-glow-cyan">
              Pagar com PIX
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground touch-manipulation"
            aria-label="Fechar PIX"
          >
            <X size={18} />
          </button>
        </div>

        {step === 'valor' && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Escolha o valor. Os créditos liberados seguem a tabela configurada no admin.
            </p>
            {opcoesStatus === 'loading' && (
              <div className="flex items-center justify-center gap-2 h-24 text-sm text-muted-foreground">
                <Loader2 size={18} className="animate-spin" />
                Carregando valores…
              </div>
            )}
            {opcoesStatus === 'empty' && (
              <p className="text-sm text-destructive mb-4">
                Nenhuma opção PIX ativa. Cadastre em Pagamentos → créditos (configuração).
              </p>
            )}
            {opcoesStatus === 'fallback' && (
              <p className="text-[11px] text-muted-foreground mb-3">
                Sem resposta da tabela do admin — usando os valores padrão.
              </p>
            )}
            {opcoes.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {opcoes.map((opcao, index) => {
                  const navId = presetNavId(index);
                  const focused = nav === navId;
                  const isSelected = String(opcao.id) === String(selected?.id);
                  return (
                    <button
                      key={opcao.id}
                      type="button"
                      data-pix-nav={navId}
                      data-pix-nav-active={focused ? 'true' : undefined}
                      onClick={() => selectOpcao(opcao, index)}
                      className={cn(
                        'min-h-[4rem] rounded-xl border px-2 py-2 touch-manipulation transition-colors flex flex-col items-center justify-center',
                        isSelected
                          ? 'bg-secondary/20 border-secondary text-secondary'
                          : 'bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30',
                        navRing(focused)
                      )}
                    >
                      <span className="text-lg font-display tabular-nums leading-tight">
                        {formatBRL(opcao.valor_pix_numero)}
                      </span>
                      <span className="text-[11px] tabular-nums opacity-80">
                        {opcao.quantidade_creditos} crédito{opcao.quantidade_creditos === 1 ? '' : 's'}
                      </span>
                    </button>
                  );
                })}
                {opcoes.length % PRESET_COLS === 1 && (
                  <button
                    type="button"
                    data-pix-nav="sair"
                    data-pix-nav-active={nav === 'sair' ? 'true' : undefined}
                    onClick={onClose}
                    className={cn(
                      'min-h-[4rem] rounded-xl border border-border px-2 py-2 touch-manipulation transition-colors flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30',
                      navRing(nav === 'sair')
                    )}
                  >
                    Sair
                  </button>
                )}
              </div>
            )}
            {error && <p className="text-xs text-destructive mb-3">{error}</p>}
            {authFailed && onReLogin && (
              <button
                type="button"
                data-pix-nav="relogin"
                data-pix-nav-active={nav === 'relogin' ? 'true' : undefined}
                onClick={onReLogin}
                className={cn(
                  'w-full h-11 mb-3 rounded-xl border border-destructive/40 text-sm text-destructive hover:bg-destructive/10 touch-manipulation',
                  navRing(nav === 'relogin')
                )}
              >
                Sair e entrar de novo
              </button>
            )}
            <button
              type="button"
              data-pix-nav="gerar"
              data-pix-nav-active={nav === 'gerar' ? 'true' : undefined}
              onClick={() => selected && gerar(selected.valor_pix_numero, selected.quantidade_creditos)}
              disabled={loading || !selected}
              className={cn(
                'w-full h-12 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:brightness-110 disabled:opacity-50 transition-all touch-manipulation flex items-center justify-center gap-2',
                navRing(nav === 'gerar')
              )}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
              {loading
                ? 'Gerando QR…'
                : selected
                  ? `Gerar QR de ${formatBRL(valor)}`
                  : 'Sem valor disponível'}
            </button>
          </>
        )}

        {step === 'qr' && cobranca && (
          <>
            <p className="text-center text-sm text-muted-foreground mb-1">
              Escaneie o QR ou copie o código
            </p>
            <p className="text-center text-2xl font-display text-secondary tabular-nums mb-1">
              {formatBRL(cobranca.valor_numero ?? cobranca.valor)}
            </p>
            <p className="text-center text-sm text-muted-foreground mb-3 tabular-nums">
              {creditosQr} crédito{creditosQr === 1 ? '' : 's'} na máquina
            </p>

            <div className="mx-auto w-56 h-56 rounded-xl bg-white p-2 mb-3 flex items-center justify-center">
              {qrSrc ? (
                <img src={qrSrc} alt="QR Code PIX" className="w-full h-full object-contain" />
              ) : (
                <p className="text-xs text-zinc-500 text-center px-2">QR indisponível — use o copia e cola</p>
              )}
            </div>

            <p className="text-center text-[11px] text-muted-foreground mb-3">
              {failed ? 'Pagamento não aprovado' : expired ? 'QR expirado' : expireText || 'Aguardando pagamento…'}
            </p>

            {cobranca.qr_code && (
              <div className="flex gap-2 mb-3">
                <p className="flex-1 min-w-0 text-[10px] text-muted-foreground bg-muted/50 border border-border rounded-lg px-2 py-2 font-mono break-all leading-snug max-h-16 overflow-y-auto">
                  {cobranca.qr_code}
                </p>
                <button
                  type="button"
                  data-pix-nav="copy"
                  data-pix-nav-active={nav === 'copy' ? 'true' : undefined}
                  onClick={handleCopy}
                  className={cn(
                    'shrink-0 px-3 rounded-lg border border-secondary/50 text-secondary hover:bg-secondary/10 touch-manipulation',
                    navRing(nav === 'copy')
                  )}
                  title="Copiar código PIX"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            )}

            {error && <p className="text-xs text-destructive mb-2">{error}</p>}

            {hasRetry && (
              <button
                type="button"
                data-pix-nav="retry"
                data-pix-nav-active={nav === 'retry' ? 'true' : undefined}
                onClick={voltarAoValor}
                className={cn(
                  'w-full h-11 rounded-xl border border-border text-sm text-foreground hover:border-foreground/30 touch-manipulation',
                  navRing(nav === 'retry')
                )}
              >
                Escolher outro valor
              </button>
            )}
          </>
        )}

        {step === 'ok' && (
          <div className="py-8 text-center space-y-2">
            <Check size={40} className="mx-auto text-emerald-400" />
            <p className="text-xl font-display text-emerald-400">PIX aprovado!</p>
            <p className="text-sm text-muted-foreground">
              {creditosQr} crédito(s) liberados
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default PixModal;

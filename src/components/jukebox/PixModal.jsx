import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Check, Copy, Loader2, QrCode, X } from 'lucide-react';
import {
  criarPixQrCode,
  mapPixError,
  pixQrImageSrc,
  pixStatusKind,
  sincronizarPix,
} from '../../api/pagamentos';
import { formatBRL } from '../../lib/billing';
import { cn } from '../../lib/utils';

export const PIX_PRESETS = [5, 10, 20, 50, 100];
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

function moveValorNav(nav, acao, authFailed) {
  const last = PIX_PRESETS.length - 1;
  const afterPresets = authFailed ? 'relogin' : 'gerar';
  if (nav.startsWith('p-')) {
    const i = Number(nav.slice(2));
    const col = i % PRESET_COLS;
    if (acao === 'esquerda') return col > 0 ? presetNavId(i - 1) : nav;
    if (acao === 'direita') return col === 0 && i < last ? presetNavId(i + 1) : nav;
    if (acao === 'cima') return i >= PRESET_COLS ? presetNavId(i - PRESET_COLS) : nav;
    if (acao === 'baixo') {
      const down = i + PRESET_COLS;
      return down <= last ? presetNavId(down) : afterPresets;
    }
    return nav;
  }
  if (nav === 'relogin') {
    if (acao === 'cima') return presetNavId(last);
    if (acao === 'baixo') return 'gerar';
    return nav;
  }
  if (nav === 'gerar') {
    if (acao === 'cima') return authFailed ? 'relogin' : presetNavId(last);
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
  const [valor, setValor] = useState(5);
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
  onApprovedRef.current = onApproved;
  onCloseRef.current = onClose;
  onReLoginRef.current = onReLogin;

  const gerar = useCallback(
    async (amount) => {
      setLoading(true);
      setError(null);
      setAuthFailed(false);
      approvedRef.current = false;
      try {
        const data = await criarPixQrCode(token, {
          valor: Number(amount),
          descricao: 'Créditos jukebox',
        });
        setCobranca(data);
        setValor(Number(data.valor_numero ?? amount));
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
        setCobranca(data);
        const kind = pixStatusKind(data.status);
        if (kind === 'aprovado' && !approvedRef.current) {
          approvedRef.current = true;
          setStep('ok');
          onApprovedRef.current?.(data);
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
    if (step === 'valor') {
      const idx = PIX_PRESETS.indexOf(valor);
      setNav(presetNavId(idx >= 0 ? idx : 0));
      return;
    }
    if (step === 'qr') {
      setNav('copy');
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps -- só ao mudar de etapa

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
  }, []);

  const qrSrc = pixQrImageSrc(cobranca?.qr_code_base64);
  const expireText = remainingLabel(cobranca?.expires_at, now);
  const expired = expireText === 'QR expirado';
  const failed = pixStatusKind(cobranca?.status) === 'falhou';
  const hasRetry = expired || failed;

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

      if (step === 'ok') return true;

      if (acao === 'cima' || acao === 'baixo' || acao === 'esquerda' || acao === 'direita') {
        if (step === 'valor') {
          const next = moveValorNav(nav, acao, authFailed);
          setNav(next);
          if (next.startsWith('p-')) {
            const amount = PIX_PRESETS[Number(next.slice(2))];
            if (amount) setValor(amount);
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
          if (nav === 'relogin') {
            onReLoginRef.current?.();
          } else if (!loading) {
            const amount = nav.startsWith('p-') ? PIX_PRESETS[Number(nav.slice(2))] : valor;
            if (amount) gerar(amount);
          }
        } else if (step === 'qr') {
          if (nav === 'copy') handleCopy();
          else if (nav === 'retry') voltarAoValor();
        }
        return true;
      }

      if (acao === 'hits') return true;
      return true;
    },
    [step, nav, authFailed, cobranca?.qr_code, hasRetry, loading, valor, gerar, handleCopy, voltarAoValor]
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
        className="w-full max-w-md rounded-2xl border border-border bg-[#1e2128] shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
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
              Escolha o valor. Cada R$ 1,00 vira 1 crédito na máquina.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PIX_PRESETS.map((amount, index) => {
                const navId = presetNavId(index);
                const focused = nav === navId;
                return (
                  <button
                    key={amount}
                    type="button"
                    data-pix-nav={navId}
                    data-pix-nav-active={focused ? 'true' : undefined}
                    onClick={() => {
                      setValor(amount);
                      setNav(navId);
                    }}
                    className={cn(
                      'h-14 rounded-xl border text-lg font-display tabular-nums touch-manipulation transition-colors',
                      valor === amount
                        ? 'bg-secondary/20 border-secondary text-secondary'
                        : 'bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30',
                      navRing(focused)
                    )}
                  >
                    {formatBRL(amount)}
                  </button>
                );
              })}
            </div>
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
              onClick={() => gerar(valor)}
              disabled={loading}
              className={cn(
                'w-full h-12 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:brightness-110 disabled:opacity-50 transition-all touch-manipulation flex items-center justify-center gap-2',
                navRing(nav === 'gerar')
              )}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
              {loading ? 'Gerando QR…' : `Gerar QR de ${formatBRL(valor)}`}
            </button>
          </>
        )}

        {step === 'qr' && cobranca && (
          <>
            <p className="text-center text-sm text-muted-foreground mb-1">
              Escaneie o QR ou copie o código
            </p>
            <p className="text-center text-2xl font-display text-secondary tabular-nums mb-3">
              {formatBRL(cobranca.valor_numero ?? cobranca.valor)}
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
              {Math.round(Number(cobranca?.valor_numero ?? valor) || 0)} crédito(s) liberados
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default PixModal;

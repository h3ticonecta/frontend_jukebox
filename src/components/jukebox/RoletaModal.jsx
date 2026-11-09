import { useEffect, useMemo, useRef, useState } from 'react';
import { Gift, Music, Sparkles, X } from 'lucide-react';
import {
  calcularPremioMusicas,
  dailyPermitePremio2,
  pickRoletaSector,
  registerRoletaGiro,
  registerRoletaPremio2,
  resolveWheelSetores,
} from '../../lib/roleta';
import { cn } from '../../lib/utils';

const SPIN_MS = 4800;
const CLOSE_AFTER_RESULT_MS = 2200;
const WHEEL_SIZE = 360;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = 168;

function polar(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180;
  return [CENTER + radius * Math.sin(rad), CENTER - radius * Math.cos(rad)];
}

function sectorPath(start, end) {
  const [x1, y1] = polar(start, RADIUS);
  const [x2, y2] = polar(end, RADIUS);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

const RESULT_TONES = {
  win: 'text-emerald-300 drop-shadow-[0_0_14px_rgba(52,211,153,0.7)]',
  retry: 'text-cyan-300 drop-shadow-[0_0_14px_rgba(34,211,238,0.6)]',
  nada: 'text-slate-300',
};

export default function RoletaModal({
  config,
  giros,
  credits,
  faixasParticipantes,
  onConsumeGiro,
  onRefundGiro,
  onPrizeMusicas,
  onPrizeBonus,
  onClose,
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [aviso, setAviso] = useState(null);
  const spinTimerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(
    () => () => {
      if (spinTimerRef.current) window.clearTimeout(spinTimerRef.current);
    },
    []
  );

  // Sem giros restantes: espera o resultado do último giro e fecha a overlay.
  useEffect(() => {
    if (spinning || giros > 0) return undefined;
    const delay = resultado ? CLOSE_AFTER_RESULT_MS : 400;
    const timer = window.setTimeout(() => onCloseRef.current?.(), delay);
    return () => window.clearTimeout(timer);
  }, [giros, spinning, resultado]);

  const setoresBase = useMemo(
    () => resolveWheelSetores(config, faixasParticipantes),
    [config, faixasParticipantes]
  );

  // Fatias visuais iguais; sorteio ponderado pelos pesos de cada setor.
  const setores = useMemo(() => {
    const n = setoresBase.length || 1;
    const step = 360 / n;
    return setoresBase.map((s, i) => {
      const start = i * step;
      const end = (i + 1) * step;
      return { ...s, start, end, mid: start + step / 2, span: step };
    });
  }, [setoresBase]);

  const finishSpin = (setor) => {
    spinTimerRef.current = null;
    setSpinning(false);

    if (setor.premioTipo === 'musica_gratis') {
      const musicas = Math.max(0, Number(setor.quantidade) || 0);
      if (musicas >= 2) registerRoletaPremio2();
      if (musicas > 0) {
        onPrizeMusicas(musicas);
        setResultado({ tone: 'win', texto: `+${musicas} MÚSICA${musicas > 1 ? 'S' : ''} GRÁTIS!` });
      } else {
        setResultado({ tone: 'nada', texto: 'FAIXA SEM PRÊMIO DE MÚSICAS' });
      }
      return;
    }
    if (setor.premioTipo === 'giro_extra') {
      onRefundGiro();
      setResultado({ tone: 'retry', texto: 'TENTE NOVAMENTE — GIRO DEVOLVIDO' });
      return;
    }
    if (setor.premioTipo === 'sem_premio') {
      setResultado({ tone: 'nada', texto: 'NÃO FOI DESSA VEZ' });
      return;
    }

    if (setor.tipo === 'premio2' || setor.tipo === 'premio1') {
      if (setor.tipo === 'premio2') registerRoletaPremio2();
      const { musicas } = calcularPremioMusicas(setor, config, faixasParticipantes);
      if (musicas > 0) {
        onPrizeMusicas(musicas);
        setResultado({ tone: 'win', texto: `+${musicas} MÚSICA${musicas > 1 ? 'S' : ''} GRÁTIS!` });
      } else {
        setResultado({ tone: 'nada', texto: 'FAIXA SEM PRÊMIO DE MÚSICAS' });
      }
      return;
    }
    if (setor.tipo === 'bonus') {
      onPrizeBonus();
      setResultado({ tone: 'win', texto: 'BÔNUS DE 50% NA PRÓXIMA RECARGA!' });
      return;
    }
    if (setor.tipo === 'retry') {
      onRefundGiro();
      setResultado({ tone: 'retry', texto: 'TENTE NOVAMENTE — GIRO DEVOLVIDO' });
      return;
    }
    setResultado({ tone: 'nada', texto: 'NÃO FOI DESSA VEZ' });
  };

  const handleSpin = () => {
    if (spinning || giros <= 0) return;
    if (credits < config.regras.creditosMinimos) {
      setAviso(`É preciso ter pelo menos ${config.regras.creditosMinimos} créditos para girar.`);
      return;
    }
    setAviso(null);
    setResultado(null);

    const setor = pickRoletaSector(setoresBase, {
      bloquearPremio2: !dailyPermitePremio2(config.regras.limitePremio2Dia),
    });
    const alvoSetor = setores.find((s) => s.key === setor.key) || setores[0];
    const margem = Math.min(alvoSetor.span * 0.2, 8);
    const alvo =
      alvoSetor.start + margem + Math.random() * Math.max(1, alvoSetor.span - margem * 2);

    setRotation((rot) => {
      const atual = ((rot % 360) + 360) % 360;
      const delta = (((360 - alvo - atual) % 360) + 360) % 360;
      return rot + 360 * 6 + delta;
    });

    setSpinning(true);
    onConsumeGiro();
    registerRoletaGiro();
    spinTimerRef.current = window.setTimeout(() => finishSpin(setor), SPIN_MS + 200);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/80 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-labelledby="roleta-title"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 touch-manipulation"
        aria-label="Fechar roleta"
      >
        <X size={22} />
      </button>

      <div className="flex items-center gap-3 mb-1">
        <Gift size={28} className="text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] shrink-0" />
        <h2
          id="roleta-title"
          className="text-3xl md:text-4xl font-display font-bold tracking-wide bg-gradient-to-r from-cyan-300 via-violet-400 to-pink-400 bg-clip-text text-transparent"
        >
          ROLETA DA SORTE
        </h2>
      </div>
      <p className="text-sm text-cyan-200/80 mb-6">Gire e ganhe músicas extras!</p>

      <div className="relative mx-auto" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-1 z-20"
          style={{
            width: 0,
            height: 0,
            borderLeft: '14px solid transparent',
            borderRight: '14px solid transparent',
            borderTop: '24px solid #22d3ee',
            filter: 'drop-shadow(0 0 8px #22d3ee)',
          }}
          aria-hidden
        />

        <div
          className="w-full h-full rounded-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.75, 0.08, 1)` : 'none',
            boxShadow:
              '0 0 0 3px #22d3ee, 0 0 28px rgba(139, 92, 246, 0.65), 0 0 60px rgba(34, 211, 238, 0.28)',
          }}
        >
          <svg viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`} className="w-full h-full block rounded-full">
            {setores.map((s) => (
              <path
                key={s.key}
                d={sectorPath(s.start, s.end)}
                fill={s.cor}
                stroke="#22d3ee"
                strokeWidth="1.5"
              />
            ))}
            {setores
              .filter((s) => s.span >= 18)
              .map((s) => (
                <text
                  key={`label-${s.key}`}
                  transform={`rotate(${s.mid} ${CENTER} ${CENTER})`}
                  x={CENTER}
                  y={CENTER - 92}
                  textAnchor="middle"
                  fill={s.textoEscuro ? '#0b0d12' : '#f8fafc'}
                  fontSize="13"
                  fontWeight="700"
                >
                  <tspan x={CENTER} dy="0">
                    {s.icone} {s.rotulo[0]}
                  </tspan>
                  {s.rotulo[1] && (
                    <tspan x={CENTER} dy="16">
                      {s.rotulo[1]}
                    </tspan>
                  )}
                </text>
              ))}
          </svg>
        </div>

        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#0b0d12] pointer-events-none"
          style={{ boxShadow: '0 0 0 3px #0b0d12, 0 0 0 5px #22d3ee55' }}
          aria-hidden
        />
      </div>

      <button
        type="button"
        onClick={handleSpin}
        disabled={spinning || giros <= 0}
        className={cn(
          'mt-8 min-h-[48px] px-10 rounded-full font-display tracking-[0.2em] text-white text-sm',
          'flex items-center gap-2 touch-manipulation',
          'hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
        )}
        style={{
          background: 'linear-gradient(90deg, #6d28d9 0%, #7c3aed 55%, #5b21b6 100%)',
          boxShadow:
            '0 0 0 2px #f59e0b, 0 0 18px rgba(245, 158, 11, 0.55), 0 0 28px rgba(124, 58, 237, 0.45)',
        }}
      >
        <Sparkles size={16} />
        {spinning ? 'GIRANDO…' : 'GIRAR ROLETA'}
      </button>

      <div className="h-10 flex items-center justify-center mt-3 px-4">
        {resultado ? (
          <p className={cn('text-lg font-display tracking-wide text-center', RESULT_TONES[resultado.tone])}>
            {resultado.texto}
          </p>
        ) : spinning ? (
          <p className="text-xs text-cyan-200/70">Girando…</p>
        ) : null}
      </div>

      {aviso && (
        <p className="text-xs text-primary border border-primary/40 bg-primary/10 rounded-lg px-3 py-2 text-center mt-1 max-w-sm">
          {aviso}
        </p>
      )}

      <div
        className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm text-cyan-100 tabular-nums"
        style={{
          border: '1px solid rgba(34, 211, 238, 0.65)',
          background: 'rgba(8, 12, 22, 0.7)',
          boxShadow: '0 0 14px rgba(34, 211, 238, 0.25)',
        }}
      >
        <Music size={14} className="text-cyan-300" />
        Giros disponíveis: {giros}
      </div>
    </div>
  );
}

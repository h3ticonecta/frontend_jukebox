# Contrato — Roleta da Sorte

Módulo de gamificação: girar roleta, prêmios em créditos/músicas/giros extras.  
Somente o que o frontend consome e exibe.

---

## Configuração da roleta

```ts
interface RouletteSettings {
  enabled: boolean;
  minCreditsToSpin: number;       // default: 3
  maxDailyBigPrize: number;       // default: 10

  // Pesos legados (fallback se prizesByValue vazio)
  weight2songs: number;           // default: 5
  weight1song: number;            // default: 15
  weightBonus: number;            // default: 10
  weightTryAgain: number;         // default: 40
  weightLose: number;             // default: 30

  // Giros por valor inserido
  spins5: number;                 // default: 3
  spins10: number;                // default: 6
  spins20: number;                // default: 13
  spins50: number;                // default: 35
  spins100: number;               // default: 75

  prizesByValue: RoulettePrizesByValue;
}
```

---

## Prêmios por faixa de valor

```ts
type RouletteValueKey = 'v5' | 'v10' | 'v20' | 'v50' | 'v100';

interface RoulettePrizesByValue {
  v5?: RoulettePrizeDefinition[];
  v10?: RoulettePrizeDefinition[];
  v20?: RoulettePrizeDefinition[];
  v50?: RoulettePrizeDefinition[];
  v100?: RoulettePrizeDefinition[];
}

type RoulettePrizeType = 'song' | 'spin' | 'lose' | 'bonus';

interface RoulettePrizeDefinition {
  id: string;
  type: RoulettePrizeType;
  amount: number;          // qtd músicas ou giros
  weight: number;          // probabilidade relativa
  label?: string;          // ex: "Tente novamente"
}
```

---

## Prêmio resolvido (para UI/canvas)

```ts
interface RoulettePrizeResult {
  id: string;
  label: string;
  icon: string;            // emoji
  color: string;           // hex para fatia do canvas
  credits: number;
  extraSpins: number;
  isBonus: boolean;
}
```

**Mapeamento `type` → UI:**

| type | label padrão | icon | credits | extraSpins |
|------|--------------|------|---------|------------|
| `song` | `+{n} música(s)` | 🎵 | `amount` | 0 |
| `spin` | `+{n} giro(s)` | 🎰 | 0 | `amount` |
| `lose` | `Não foi dessa vez` | 😅 | 0 | 0 |
| `bonus` | `50% bônus` | 💰 | 0 | 0 (isBonus: true) |

**Cores das fatias (rotação):**
`#8b5cf6`, `#06b6d4`, `#10b981`, `#f59e0b`, `#ef4444`, `#ec4899`, `#14b8a6`, `#6366f1`

---

## Estado da roleta

```ts
interface RouletteState {
  open: boolean;
  isSpinning: boolean;
  rotationAngle: number;
  lastResult: RoulettePrizeResult | null;
  showResult: boolean;
  availableSpins: number;
  credits: number;
  canSpin: boolean;
}
```

**Regra `canSpin`:**
- Se `availableSpins` é número → `availableSpins > 0`
- Senão → `credits >= minCreditsToSpin`

---

## Props do modal

```ts
interface RouletteModalProps {
  open: boolean;
  onClose: () => void;
  credits: number;
  availableSpins?: number;
  minCreditsToSpin: number;
  prizeConfig: RouletteSettings;
  customPrizes?: RoulettePrizeDefinition[];
  navigationKeys?: NavigationKeyMap;
  onWinCredits: (amount: number) => void;
  onWinSpins: (amount: number) => void;
  onSpinResult: (prize: RoulettePrizeResult) => void;
  onConsumeSpin?: () => void;
}
```

---

## Canvas

```ts
interface RouletteCanvasProps {
  prizes: RoulettePrizeResult[];
  rotationAngle: number;
  isSpinning: boolean;
  size?: number;   // default: 500
}
```

| Propriedade | Valor |
|-------------|-------|
| Tamanho | 500×500 px |
| Duração rotação | 4.5s |
| Easing | `cubic-bezier(0.17, 0.67, 0.12, 0.99)` |
| Ângulo por fatia | `360 / prizes.length` |

---

## Log de giros

```ts
interface RouletteLogEntry {
  prize: string;
  credits: number;
  isBonus: boolean;
  timestamp: TimestampISO;
}
```

---

## Callbacks pós-giro

```ts
// Créditos ganhos
onWinCredits(amount) → toast: `+{amount} crédito(s) adicionado(s)!`

// Giros extras
onWinSpins(amount) → toast: `🎰 +{amount} giro(s) extra(s)!`
```

---

## Botões do modal de resultado

| Botão | Ação |
|-------|------|
| Girar Novamente | Novo giro (se permitido) |
| Sair | Fecha modal |
| Fechar | Fecha após prêmio especial |
| Girar Agora | CTA em sub-modal de confirmação |

---

## Mensagens de alerta

| Condição | Mensagem |
|----------|----------|
| Sem giros e créditos insuficientes | `⚠️ Mínimo de {n} créditos para girar` |
| Sem giros disponíveis | `⚠️ Sem giros disponíveis — insira valor na máquina` |
| Girando | `Girando...` |
| Perdeu | `Tente novamente na próxima vez!` |
| Ganhou créditos extras | `Parabéns pelos seus créditos adicionais \o/` |

---

## Eventos emitidos pela UI

```ts
type RouletteUIEvent =
  | { type: 'ROULETTE_SPUN'; prizeId: string; credits: number }
  | { type: 'ROULETTE_WIN_CREDITS'; amount: number }
  | { type: 'ROULETTE_WIN_SPINS'; amount: number }
  | { type: 'ROULETTE_BONUS_ACTIVE'; durationSeconds: number };
```

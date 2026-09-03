# Contrato — Créditos e faturamento

Módulo de saldo de créditos, conversão de valor inserido e leitura de faturamento.  
Somente o que o frontend consome e exibe.

---

## Saldo de créditos

```ts
interface CreditsState {
  credits: number;
  availableSpins?: number;   // giros de roleta (quando separado do saldo)
}
```

**Exibição na UI:**
- Header/player: ícone `Coins` + número em `font-display text-primary`
- Roleta (rodapé): `Créditos: {n}` ou `Giros disponíveis: {n}`

---

## Conversão valor → créditos

```ts
interface CreditConversionConfig {
  creditsFor1: number;    // R$ 1,00
  creditsFor2: number;    // R$ 2,00
  creditsFor5: number;    // R$ 5,00
  creditsFor10: number;   // R$ 10,00
  creditsFor20: number;   // R$ 20,00
  creditsFor50: number;   // R$ 50,00
  creditsFor100: number;  // R$ 100,00
}
```

**Defaults:**

| Valor (R$) | Créditos |
|------------|----------|
| 1 | 1 |
| 2 | 3 |
| 5 | 7 |
| 10 | 16 |
| 20 | 34 |
| 50 | 90 |
| 100 | 180 |

---

## Registro de faturamento

```ts
interface BillingRecord {
  id?: string;
  machineId?: string;
  nomeMaquina: string;
  valorReais: number;
  creditosAdicionados: number;
  createdAt: TimestampISO;
}
```

---

## Modal de leitura de faturamento

```ts
interface BillingModalProps {
  open: boolean;
  onClose: () => void;
  machineId?: string;
  nomeMaquina: string;
}

interface BillingSummary {
  period: BillingPeriodKey;
  customRange?: DateRange;
  records: BillingRecord[];
  totalReais: number;
  totalCreditos: number;
  isLoading: boolean;
}
```

**Períodos disponíveis:** `today`, `week`, `month`, `year`, `all`, `custom`.

---

## Dialog créditos insuficientes

```ts
interface InsufficientCreditsDialogProps {
  open: boolean;
  onClose: () => void;
}
```

**Conteúdo fixo:**
- Título: `Créditos Insuficientes`
- Mensagem: `Insira créditos para tocar músicas!`
- Ícone: 💰

---

## Regras de débito ao tocar

```ts
interface PlayCreditRules {
  freeCredits: boolean;
  freeSongs: number;
  doubleCreditVideoke: boolean;
  costPerSong: number;
}
```

**Fluxo:**
1. Usuário seleciona música
2. Se `credits < cost` → abrir `InsufficientCreditsDialog`
3. Se OK → debitar e chamar `playSong`
4. Emitir evento `SONG_PLAYED`

---

## Inserção de crédito

O frontend acumula pulsos da tecla configurada como `credit` e, ao confirmar, dispara:

```ts
interface CreditInsertEvent {
  machineId: string;
  valorReais: number;
  creditosAdicionados: number;
  nomeMaquina: string;
}
```

**Toast de confirmação:** `+{n} crédito(s) adicionado(s)!`

---

## Giros da roleta vinculados a valor

| Valor inserido (R$) | Giros liberados (default) |
|---------------------|---------------------------|
| 5 | 3 |
| 10 | 6 |
| 20 | 13 |
| 50 | 35 |
| 100 | 75 |

Definidos em `RouletteSettings.spins5` … `spins100`.

---

## Eventos emitidos pela UI

```ts
type CreditsUIEvent =
  | { type: 'CREDITS_CHANGED'; credits: number }
  | { type: 'CREDIT_INSERTED'; valorReais: number; creditos: number }
  | { type: 'INSUFFICIENT_CREDITS'; required: number; current: number };
```

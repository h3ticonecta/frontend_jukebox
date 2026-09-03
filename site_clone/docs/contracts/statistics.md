# Contrato — Estatísticas

Módulo de métricas de uso exibidas no painel administrativo.  
Somente o que o frontend consome e exibe.

---

## Contadores agregados (estado UI)

```ts
interface StatisticsState {
  playedSongs: number;
  genreCounts: Record<string, number>;    // gênero → quantidade
  songStats: Record<string, number>;      // songId → plays
  albumStats: Record<string, number>;     // albumId → plays
}
```

**Uso na UI:**
- `Gêneros Mais Tocados` — ordenar `genreCounts` desc
- `Qtd Cd Mais Tocado` — max de `albumStats`
- `Qtd Músicas em espera` — `queue.length`

---

## Registro de música tocada

```ts
interface SongPlayStat {
  songId: string;
  title: string;
  artist: string;
  album: string;
  machineId: string;
  playedAt: TimestampISO;
  durationSeconds?: number;
}
```

O frontend emite este evento ao tocar uma música; persistência fica a cargo do backend.

---

## Log da roleta

```ts
interface RouletteLogEntry {
  prize: string;
  credits: number;
  isBonus: boolean;
  timestamp: TimestampISO;
}
```

**Ações admin:**
- Zerar estatísticas → limpa contadores
- Zerar roleta → limpa log

---

## Dashboard — métricas derivadas

```ts
interface DashboardMetrics {
  faturamentoTotal: number;
  creditosTotais: number;
  maquinasAtivas: number;
  maquinasInativas: number;
  transacoesRecentes: BillingRecord[];
}
```

**Filtros de período:** `today`, `week`, `month`, `year`, `all`, `custom` — ver [shared.md](./shared.md).

---

## Relatório de faturamento por máquina

```ts
interface MachineRevenueReport {
  machineId: string;
  nomeMaquina: string;
  records: BillingRecord[];
  totalReais: number;
  totalCreditos: number;
}
```

**Seção UI:** `Faturamento por Máquina`

---

## Eventos emitidos pela UI

```ts
type StatisticsUIEvent =
  | { type: 'SONG_PLAYED'; stat: SongPlayStat }
  | { type: 'STATS_RESET'; machineId: string }
  | { type: 'ROULETTE_LOG_RESET'; machineId: string };
```

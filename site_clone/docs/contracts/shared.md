# Contrato — Tipos compartilhados

Tipos e enums usados em múltiplos módulos de UI.  
Somente o que o frontend precisa conhecer.

---

## Identificadores

```ts
type ID = string;
type TimestampISO = string; // ISO 8601
```

---

## Categorias de álbum

```ts
type AlbumCategory = 'HITS' | 'OUTRAS';
```

| Valor | Uso na UI |
|-------|-----------|
| `HITS` | Gêneros principais (Sertanejo, Rock, etc.) |
| `OUTRAS` | Álbuns compilados / mistos |

---

## Papéis de usuário admin

```ts
type AdminRole = 'usuario' | 'admin';
```

| Role | Acesso na UI |
|------|--------------|
| `usuario` | Máquinas + Configurações |
| `admin` | Dashboard + Máquinas + Configurações |

---

## Tipos de mídia

```ts
type MediaType = 'audio' | 'video';
```

---

## Períodos de faturamento

```ts
type BillingPeriodKey = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';
```

| Key | Label UI |
|-----|----------|
| `today` | Hoje |
| `week` | Esta semana |
| `month` | Este mês |
| `year` | Este ano |
| `all` | Todo período |
| `custom` | Personalizado |

```ts
interface DateRange {
  from: Date;
  to: Date;
}
```

---

## Estado de carregamento

```ts
interface Loadable<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
```

---

## Formatação

```ts
/** Duração em segundos → "m:ss" */
function formatDuration(seconds: number): string;

/** Classes Tailwind de gradiente para capa */
type CoverGradient = string; // ex: "from-amber-500 to-orange-700"
```

---

## Gradientes de referência por gênero

| Gênero | `coverColor` |
|--------|--------------|
| Sertanejo | `from-amber-500 to-orange-700` |
| Forró | `from-yellow-400 to-amber-600` |
| Rock | `from-red-700 to-gray-900` |
| Hip Hop | `from-purple-600 to-blue-500` |
| Pagode | `from-green-500 to-teal-600` |
| Country | `from-orange-500 to-red-600` |
| Reggae | `from-emerald-500 to-green-700` |
| Flashback | `from-pink-500 to-violet-600` |
| Eletrônica | `from-indigo-500 to-purple-700` |
| Jazz & Blues | `from-slate-600 to-zinc-800` |
| Pop Internacional | `from-rose-400 to-pink-600` |

---

## Eventos emitidos pela UI

Eventos que o frontend dispara e o backend/consulta pode ouvir:

```ts
type JukeboxUIEvent =
  | { type: 'CREDITS_CHANGED'; credits: number }
  | { type: 'SONG_PLAYED'; songId: string }
  | { type: 'SONG_QUEUED'; songId: string }
  | { type: 'ROULETTE_SPUN'; prizeId: string }
  | { type: 'BILLING_INSERTED'; valorReais: number; creditos: number }
  | { type: 'SETTINGS_SAVED'; machineId: string };
```

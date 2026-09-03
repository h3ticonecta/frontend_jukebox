# Jukebox Online — Documentação Frontend React

Documentação para replicar **somente a interface** em outro projeto React, com backend independente.  
Organizada por **partes visuais**, sem referência a rotas.

---

## Stack recomendada

| Camada | Tecnologia |
|--------|------------|
| Framework | React 18+ |
| Estilo | Tailwind CSS 3.x |
| Componentes base | shadcn/ui (Button, Input, Dialog, Tabs, Label, etc.) |
| Ícones | lucide-react |
| Utilitário de classes | `clsx` + `tailwind-merge` (`cn()`) |
| Animações | Tailwind + keyframes customizados |
| Fontes | Google Fonts: **Righteous** (display) + **Inter** (body) |

---

## 1. Design Tokens

### 1.1 CSS Variables (`:root`)

```css
:root {
  --background: 220 20% 8%;
  --foreground: 40 20% 92%;
  --card: 220 18% 12%;
  --card-foreground: 40 20% 92%;
  --popover: 220 18% 14%;
  --popover-foreground: 40 20% 92%;
  --primary: 38 95% 55%;           /* âmbar/dourado */
  --primary-foreground: 220 20% 8%;
  --secondary: 185 85% 50%;        /* ciano */
  --secondary-foreground: 220 20% 8%;
  --muted: 220 15% 16%;
  --muted-foreground: 220 10% 55%;
  --accent: 38 90% 45%;
  --accent-foreground: 220 20% 8%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 15% 20%;
  --input: 220 15% 18%;
  --ring: 38 95% 55%;
  --radius: 0.75rem;

  /* Neon */
  --neon-amber: 38 95% 55%;
  --neon-cyan: 185 85% 50%;
  --neon-pink: 330 85% 60%;
  --surface-glass: 220 18% 12%;

  /* Layout do browser de álbuns */
  --browser-pad-x: 1.5rem;
  --browser-pad-y: 1rem;
  --browser-header-mb: 1rem;
  --browser-scroll-pad: 0.75rem;
  --browser-scroll-bottom: 8rem;
  --browser-grid-gap-x: 1.5rem;
  --browser-grid-gap-y: 2rem;
}
```

### 1.2 Classes utilitárias customizadas

```css
.neon-border-amber {
  box-shadow:
    0 0 5px hsl(var(--neon-amber) / 0.5),
    0 0 15px hsl(var(--neon-amber) / 0.2),
    inset 0 0 5px hsl(var(--neon-amber) / 0.1);
}

.neon-glow-amber {
  text-shadow:
    0 0 7px hsl(var(--neon-amber)),
    0 0 20px hsl(var(--neon-amber) / 0.5),
    0 0 40px hsl(var(--neon-amber) / 0.3);
}

.neon-glow-cyan {
  text-shadow:
    0 0 7px hsl(var(--neon-cyan)),
    0 0 20px hsl(var(--neon-cyan) / 0.5),
    0 0 40px hsl(var(--neon-cyan) / 0.3);
}

.glass-surface {
  background: hsl(var(--surface-glass) / 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.font-display {
  font-family: 'Righteous', cursive;
}

@keyframes spin-vinyl {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes equalizer-bar {
  0%   { height: 20%; }
  50%  { height: 100%; }
  100% { height: 40%; }
}

@keyframes pulse-neon {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.7; }
}

.animate-spin-vinyl { animation: spin-vinyl 3s linear infinite; }
.animate-spin-vinyl-slow { animation: spin-vinyl 8s linear infinite; }
```

### 1.3 Body global

```css
body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: Inter, system-ui, sans-serif;
  overflow: hidden;
  user-select: none;
}
```

### 1.4 Tailwind config (extend)

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        display: ['Righteous', 'cursive'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
};
```

---

## 2. Componente base: Button (shadcn)

```tsx
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);
```

---

## 3. Tipos TypeScript (contratos de dados)

```ts
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;        // segundos
  category?: string;       // ex: "HITS", "OUTRAS"
  coverColor?: string;     // ex: "from-amber-500 to-orange-700"
  coverImage?: string;
  fileUrl?: string;        // URL do áudio/vídeo
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  category: string;
  coverColor: string;      // classes Tailwind gradient
  coverImage?: string;
  songs: Song[];
}

export interface Genre {
  id: string;
  name: string;
  coverColor: string;
  albums: Album[];
}

export interface QueueItem extends Song {}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;        // 0–100
  volume: number;          // 0–100
  queue: QueueItem[];
  credits: number;
}

export interface RoulettePrize {
  label: string;
  icon: string;
  credits: number;
  extraSpins?: number;
  isBonus?: boolean;
  weight: number;
}
```

---

## 4. Partes da interface

---

### PARTE A — Shell principal (`JukeboxShell`)

**Função:** container fullscreen que organiza header + conteúdo + fila + player.

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER (Parte B)                                            │
├──────────────────────────────────┬───────────────────────────┤
│  BROWSER DE ÁLBUNS (Parte C)     │  FILA DE ESPERA (Parte E) │
│  + painel músicas (Parte D)      │  (360px, direita)         │
├──────────────────────────────────┴───────────────────────────┤
│  PLAYER BAR (Parte F) — fixed bottom                         │
└──────────────────────────────────────────────────────────────┘
```

```tsx
interface JukeboxShellProps {
  children: React.ReactNode;       // browser + overlays
  header: React.ReactNode;
  queuePanel: React.ReactNode;
  playerBar: React.ReactNode;
}

export function JukeboxShell({ header, children, queuePanel, playerBar }: JukeboxShellProps) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {header}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0 flex flex-col min-h-0">{children}</div>
        {queuePanel}
      </div>
      {playerBar}
    </div>
  );
}
```

---

### PARTE B — Header do Jukebox (`JukeboxHeader`)

**Elementos:**
- Ícone de disco (`Disc`) com `animate-spin-vinyl` quando tocando
- Título **"JUKEBOX"** — `text-2xl font-display text-primary neon-glow-amber tracking-wider`
- Badge **"Leitura"** — abre modal de faturamento
- Botão teclas configuradas (dropdown)
- Botão atualizar biblioteca (ícone refresh, spinner quando loading)
- Banner de erro (opcional) — `bg-destructive/20 border-b border-destructive/30`

```tsx
interface JukeboxHeaderProps {
  isPlaying: boolean;
  isSyncing: boolean;
  errorMessage?: string;
  onOpenBilling: () => void;
  onSyncLibrary: () => void;
  navigationKeys: NavigationKeys;
}

export function JukeboxHeader({ isPlaying, isSyncing, errorMessage, onOpenBilling, onSyncLibrary, navigationKeys }: JukeboxHeaderProps) {
  return (
    <>
      <header className="relative z-10 px-4 py-3 flex items-center gap-3 border-b border-border">
        <Disc className={cn('text-primary', isPlaying && 'animate-spin-vinyl')} size={32} />
        <h1 className="text-2xl font-display text-primary neon-glow-amber tracking-wider">
          JUKEBOX
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onOpenBilling}
            className="px-2.5 py-1 rounded-md border border-primary/40 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider hover:bg-primary/20 transition-colors"
          >
            Leitura
          </button>
          <KeysDropdown keys={navigationKeys} />
          <button
            onClick={onSyncLibrary}
            disabled={isSyncing}
            className="p-1.5 text-muted-foreground hover:text-secondary transition-colors"
            title="Atualizar Biblioteca"
          >
            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>
      </header>
      {errorMessage && (
        <div className="relative z-10 px-4 py-2 bg-destructive/20 border-b border-destructive/30">
          <p className="text-xs text-destructive">{errorMessage}</p>
        </div>
      )}
    </>
  );
}
```

---

### PARTE C — Browser de álbuns/pastas (`AlbumBrowser`)

**Layout:** grid 2 colunas (mobile) / 3 colunas (md+), com scroll vertical.

**Header da seção:**
- Ícone + **"ARTISTAS / BANDAS"** (`font-display text-secondary neon-glow-cyan`)
- Contador `(N)`

**Estado vazio:** ícone `FolderOpen` + "Nenhuma pasta encontrada"

**Grid item:** wrapper com ring quando selecionado ou focado por teclado:
```tsx
className={cn(
  'w-full aspect-square rounded-lg relative transition-all duration-200',
  isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_18px_hsl(var(--primary)/0.5)]',
  '[&>button]:!w-full [&>button]:!h-full [&>button]:!max-w-none'
)}
```

```tsx
interface AlbumBrowserProps {
  albums: Album[];
  selectedAlbumId: string | null;
  focusedIndex: number;
  onSelectAlbum: (album: Album, index: number) => void;
}

export function AlbumBrowser({ albums, selectedAlbumId, focusedIndex, onSelectAlbum }: AlbumBrowserProps) {
  return (
    <div
      className="flex-1 flex min-h-0 gap-4"
      style={{
        paddingLeft: 'var(--browser-pad-x)',
        paddingRight: 'var(--browser-pad-x)',
        paddingTop: 'var(--browser-pad-y)',
      }}
    >
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <div
          className="flex items-center gap-2"
          style={{
            marginBottom: 'var(--browser-header-mb)',
            paddingLeft: 'var(--browser-scroll-pad)',
            paddingRight: 'var(--browser-scroll-pad)',
          }}
        >
          <Users className="text-secondary" size={20} />
          <h2 className="text-sm font-display text-secondary neon-glow-cyan whitespace-nowrap">
            ARTISTAS / BANDAS
          </h2>
          <span className="text-xs text-muted-foreground ml-2">({albums.length})</span>
        </div>

        <div
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide"
          style={{
            paddingLeft: 'var(--browser-scroll-pad)',
            paddingRight: 'var(--browser-scroll-pad)',
            paddingTop: 'var(--browser-scroll-pad)',
            paddingBottom: 'var(--browser-scroll-bottom)',
          }}
        >
          {albums.length === 0 ? (
            <EmptyState icon={FolderOpen} message="Nenhuma pasta encontrada" />
          ) : (
            <div
              className="grid grid-cols-2 md:grid-cols-3 auto-rows-fr"
              style={{
                columnGap: 'var(--browser-grid-gap-x)',
                rowGap: 'var(--browser-grid-gap-y)',
              }}
            >
              {albums.map((album, index) => (
                <AlbumCard
                  key={album.id}
                  gradientClass={album.coverColor}
                  albumName={album.name}
                  artistName={`${album.songs.length} músicas`}
                  coverImage={album.coverImage}
                  size="md"
                  isSelected={album.id === selectedAlbumId}
                  isFocused={index === focusedIndex}
                  onClick={() => onSelectAlbum(album, index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### PARTE D — Card de álbum (`AlbumCard`)

Dois modos: **quadrado** (`md`) e **vinil circular** (`lg`).

#### Modo `md` (grid)
```tsx
interface AlbumCardProps {
  gradientClass: string;
  albumName: string;
  artistName: string;
  coverImage?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const SIZES = {
  sm: 'w-12 h-12',
  md: 'w-32 h-32 md:w-40 md:h-40',
  lg: 'w-44 h-44 md:w-52 md:h-52',
};

export function AlbumCard({ gradientClass, albumName, artistName, coverImage, size = 'md', onClick }: AlbumCardProps) {
  const [imgOk, setImgOk] = useState(true);
  const hasImage = !!coverImage && imgOk;

  if (size === 'lg') {
    return <VinylCard /* ver abaixo */ />;
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        SIZES[size],
        'rounded-lg flex flex-col items-center justify-center gap-1',
        'transition-all duration-300 hover:scale-105 active:scale-95',
        'neon-border-amber cursor-pointer shrink-0 overflow-hidden relative group'
      )}
    >
      {hasImage ? (
        <img src={coverImage} alt={albumName} className="absolute inset-0 w-full h-full object-cover" onError={() => setImgOk(false)} />
      ) : (
        <div className={cn('absolute inset-0 bg-gradient-to-br', gradientClass, 'flex items-center justify-center')}>
          <Disc className="text-foreground/80" size={32} />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent z-10">
        <p className="text-foreground text-sm font-display truncate">{albumName}</p>
        <p className="text-foreground/70 text-xs truncate">{artistName}</p>
      </div>
    </button>
  );
}
```

#### Modo `lg` (vinil)
- Botão circular `rounded-full`
- Anéis concêntricos em zinc
- Capa central 60% com borda
- Furo central `w-3 h-3 rounded-full bg-zinc-900`
- Hover: `group-hover:animate-spin-vinyl-slow`
- Box-shadow: `0 0 15px rgba(251,236,63,0.3), inset 0 0 30px rgba(0,0,0,0.4)`

---

### PARTE E — Painel lateral de músicas (`SongSidePanel`)

**Largura:** `380px`, visível apenas `md:flex`, borda esquerda `border-l-2 border-primary/30`.

**Header do painel:** capa 48×48 + nome do álbum + contagem de músicas.

**Item de música:**
```tsx
<div className={cn(
  'flex items-center gap-2 p-2 rounded-lg cursor-pointer group transition-colors',
  isPlaying && 'bg-primary/15 border border-primary/30',
  isFocused && 'bg-primary/15 border border-primary/40 ring-1 ring-primary/60',
  !isPlaying && !isFocused && 'hover:bg-muted/50'
)}>
  <span className="text-xs w-5 text-center text-muted-foreground">{index + 1}</span>
  <div className="flex-1 min-w-0">
    <p className={cn('text-sm truncate', isPlaying && 'text-primary font-semibold')}>{song.title}</p>
    <p className="text-xs text-muted-foreground truncate">{formatDuration(song.duration)}</p>
  </div>
  {/* hover only */}
  <button title="Adicionar à fila" className="p-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-secondary">
    <ListPlus size={14} />
  </button>
  <button title="Tocar" className="p-1.5 text-primary hover:text-primary/80">
    <Play size={14} fill="currentColor" />
  </button>
</div>
```

**Estado vazio:** "Selecione uma pasta" centralizado.

---

### PARTE F — Fila de espera (`WaitQueuePanel`)

**Largura:** `360px`, painel direito com `border-l-2 border-primary/30`.

```tsx
interface WaitQueuePanelProps {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  focusedIndex: number;
  onPlaySong: (song: Song) => void;
}

export function WaitQueuePanel({ currentSong, isPlaying, queue, focusedIndex, onPlaySong }: WaitQueuePanelProps) {
  return (
    <div className="w-[360px] h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListMusic className="text-secondary" size={18} />
          <span className="text-sm font-display text-secondary tracking-wide">FILA DE ESPERA</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-bold">
          {queue.length}
        </span>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ padding: 'var(--browser-scroll-pad)' }}>
        {/* Tocando agora */}
        {currentSong && (
          <div className="rounded-lg ring-2 ring-primary shadow-[0_0_18px_hsl(var(--primary)/0.5)] bg-primary/10 flex items-center justify-between px-3 py-2 gap-3 mb-1">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-primary font-bold">Tocando agora</span>
              <p className="text-sm text-foreground font-semibold truncate">{currentSong.title}</p>
            </div>
            <EqualizerBars isPlaying={isPlaying} barCount={5} />
          </div>
        )}

        {queue.length === 0 ? (
          <EmptyState icon={Music} message="Nenhuma música na fila" size="sm" />
        ) : (
          queue.map((song, i) => (
            <QueueRow key={`${song.id}-${i}`} song={song} index={i} isFocused={focusedIndex === i} onPlay={() => onPlaySong(song)} />
          ))
        )}
      </div>
    </div>
  );
}
```

**`EqualizerBars`:** barras verticais com `animate-[equalizer-bar_0.8s_ease-in-out_infinite]` e delays escalonados.

---

### PARTE G — Player bar (`PlayerBar`)

**Posição:** `fixed bottom-0 left-0 right-0`, `z-40`, `glass-surface`, `neon-border-amber`, altura ~72px.

#### Estado com música

```
[💰 créditos] [capa disco] [título/artista]     [◀◀] [▶/⏸] [▶▶] [🔊]
────────────────── barra de progresso ──────────────────────────────
```

```tsx
interface PlayerBarProps {
  currentSong: Song;
  isPlaying: boolean;
  progress: number;       // 0-100
  credits: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onProgressChange: (pct: number) => void;
  queue: Song[];
  onPlaySong: (song: Song) => void;
  onClearQueue?: () => void;
}

export function PlayerBar(props: PlayerBarProps) {
  const [showQueue, setShowQueue] = useState(false);

  return (
    <>
      {/* Popup fila (opcional) */}
      {showQueue && <QueuePopup {...props} onClose={() => setShowQueue(false)} />}

      <div className="fixed bottom-0 left-0 right-0 glass-surface border-t border-primary/20 neon-border-amber z-40">
        {/* Progress bar */}
        <div
          className="w-full h-1 bg-muted cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            props.onProgressChange(((e.clientX - rect.left) / rect.width) * 100);
          }}
        >
          <div className="h-full bg-primary transition-all duration-150" style={{ width: `${props.progress}%` }} />
        </div>

        <div className="flex items-center gap-3 px-4 py-2 h-[72px]">
          {/* Créditos */}
          <div className="flex items-center gap-2 shrink-0 mr-2">
            <Coins className="text-primary" size={26} />
            <span className="text-xl font-display text-primary neon-glow-amber font-bold">{props.credits}</span>
          </div>

          {/* Capa disco */}
          <VinylThumb song={props.currentSong} isSpinning={props.isPlaying} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{props.currentSong.title}</p>
            <p className="text-xs text-muted-foreground truncate">{props.currentSong.artist}</p>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-1">
            <button onClick={props.onPrev} className="p-2 text-foreground hover:text-primary active:scale-90 transition-colors">
              <SkipBack size={22} fill="currentColor" />
            </button>
            <button
              onClick={props.onTogglePlay}
              className="p-3 rounded-full bg-primary text-primary-foreground hover:brightness-110 active:scale-90 neon-border-amber transition-all"
            >
              {props.isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            </button>
            <button onClick={props.onNext} className="p-2 text-foreground hover:text-primary active:scale-90 transition-colors">
              <SkipForward size={22} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

#### Estado vazio (sem música)
```tsx
<div className="fixed bottom-0 left-0 right-0 h-20 glass-surface border-t border-border flex items-center justify-between z-40 px-4">
  <div className="flex items-center gap-2">
    <Coins size={28} className="text-primary" />
    <span className="text-2xl font-display text-primary neon-glow-amber font-bold">{credits}</span>
    <span className="text-sm text-muted-foreground">créditos</span>
  </div>
  <p className="text-muted-foreground text-sm font-display">Selecione uma música para começar</p>
  <div className="flex items-center gap-2">
    <ListMusic size={28} className="text-secondary" />
    <span className="text-2xl font-display text-secondary font-bold">{queueLength}</span>
    <span className="text-sm text-muted-foreground">em espera</span>
  </div>
</div>
```

**`QueuePopup`:** `fixed bottom-20 right-4 w-80`, `glass-surface`, header "Fila de Reprodução" + botão limpar fila.

---

### PARTE H — Overlay HITS / busca por gênero (`HitsOverlay`)

Fullscreen `fixed inset-0 z-50 flex flex-col bg-background`.

**Header com gradiente do gênero:**
- Botões circulares: Home (`House`) e Voltar (`ArrowLeft`)
- Capa + nome do gênero + artista + contagem

**Campo de busca:**
```tsx
<div className="relative px-4 py-3">
  <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
  <input
    placeholder="Buscar música no álbum..."
    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
  />
</div>
```

**Lista de músicas:** scroll com `pb-32`, itens com ações por teclado (navegar, tocar, adicionar à fila).

**Botões de navegação circular:**
```tsx
const navBtnClass = 'p-2 rounded-full bg-background/30 hover:bg-background/50 transition-all';
// quando focado:
'ring-2 ring-primary scale-110 shadow-[0_0_12px_hsl(var(--primary)/0.35)]'
```

---

### PARTE I — Filtro alfabético A–Z (`AlphabetFilter`)

Barra horizontal com botão **ALL** + letras.

```tsx
<button className={cn(
  'px-2 h-7 text-[11px] font-semibold rounded transition-colors',
  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
)}>
  {letter}
</button>
```

Letras individuais: `w-7 h-7`.

---

### PARTE J — Roleta da Sorte (`RouletteModal`)

**Overlay fullscreen** com fundo escuro + blobs blur violet/cyan.

**Estrutura:**
```
[× Fechar]
     🎰 ROLETA DA SORTE
   Gire e ganhe músicas extras!
        ▼ (ponteiro ciano)
      [canvas 500×500]
   [GIRAR ROLETA] ou [Girando...]
   Créditos: N  /  Giros disponíveis: N
```

**Botão GIRAR ROLETA — estados:**

| Estado | Classes |
|--------|---------|
| Habilitado | `bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:scale-105 ring-4 ring-orange-500 animate-pulse shadow-[0_0_25px_rgba(249,115,22,0.7)]` |
| Girando | `bg-slate-700 text-slate-400 cursor-wait` + spinner |
| Desabilitado | `bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed` |

**Resultado do prêmio:**
- Card `bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/50`
- Título com gradient text `from-emerald-400 to-cyan-400`
- Botões: **Girar Novamente** (`bg-violet-500`) + **Sair** (`bg-slate-700`)
- Badge de créditos: `bg-slate-800/80 px-5 py-2 rounded-full border border-cyan-500/30`

```tsx
interface RouletteModalProps {
  open: boolean;
  onClose: () => void;
  credits: number;
  availableSpins: number;
  minCreditsToSpin: number;
  prizes: RoulettePrize[];
  onSpin: () => Promise<RoulettePrize>;
  onWinCredits: (amount: number) => void;
  onWinSpins: (amount: number) => void;
}
```

**Canvas:** rotação via `transform: rotate(${angle}deg)` com `transitionDuration: 4.5s` e easing `cubic-bezier(0.17, 0.67, 0.12, 0.99)`.

---

### PARTE K — Player de vídeo / Karaokê (`VideoPlayer`)

Três modos: `hidden` | `fullscreen` | `pip` (mini-player).

#### Fullscreen
```tsx
<div className="fixed inset-0 z-[80] bg-black flex items-center justify-center">
  <video className="w-full h-full object-contain" autoPlay playsInline />
  {/* Top bar com gradiente */}
  <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center gap-3 bg-gradient-to-b from-black/80 to-transparent">
    <div className="flex-1 min-w-0">
      <p className="text-white text-sm font-semibold truncate">{title}</p>
      <p className="text-white/70 text-xs truncate">{artist}</p>
    </div>
    <button
      onClick={onMinimize}
      className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white"
      title="Reduzir para mini-player"
    >
      <Minimize2 size={18} />
    </button>
  </div>
</div>
```

#### Mini-player (PIP)
- `fixed bottom-24 right-4 z-[80] w-72 sm:w-80`
- Controles no hover: Play/Pause, Fullscreen, Close
- Botões: `p-1.5 rounded bg-black/70 text-white hover:bg-black/90`

---

### PARTE L — Modal: Créditos insuficientes (`InsufficientCreditsDialog`)

```tsx
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="sm:max-w-md text-center">
    <DialogTitle className="text-xl font-display text-primary">
      Créditos Insuficientes
    </DialogTitle>
    <div className="py-6 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-3xl">💰</span>
      </div>
      <p className="text-foreground text-base">Insira créditos para tocar músicas!</p>
    </div>
  </DialogContent>
</Dialog>
```

---

### PARTE M — Modal: Acesso administrador (`AdminPasswordDialog`)

```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="sm:max-w-[340px] bg-background border-border">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-primary font-display">
        <Lock size={20} /> Acesso Administrador
      </DialogTitle>
      <DialogDescription>Digite a senha para acessar as configurações.</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
      <Input type="password" placeholder="Senha" maxLength={20} className={hasError ? 'border-destructive' : ''} />
      {hasError && <p className="text-destructive text-xs">Senha incorreta. Tente novamente.</p>}
      <Button type="submit" className="w-full">Entrar</Button>
    </form>
  </DialogContent>
</Dialog>
```

---

### PARTE N — Modal: Configurações do Jukebox (`JukeboxSettingsDialog`)

**Container:** `max-w-4xl max-h-[90vh]`, fundo `bg-slate-950 border-slate-800`.

**Seções do formulário:**
- Registro (Empresa, Nº Série, Código, Serial HD — readonly)
- Botão **Desbloquear** — `border-cyan-500/50 bg-cyan-950/20 text-cyan-400`
- Alterar senha (Senha Antiga, Nova, Confirmar)
- Abas: Geral, Créditos, Botões, Roleta, Pastas

**Footer fixo:**
```tsx
<div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-center gap-4">
  <Button className="w-32 bg-primary shadow-[0_0_15px_rgba(255,165,0,0.3)] font-bold">
    <Save size={18} className="mr-2" /> SALVAR
  </Button>
  <Button variant="outline" className="w-32 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200">
    <LogOut size={18} className="mr-2" /> SAIR
  </Button>
</div>
```

**Campos comuns nas abas:** Label + Input/Select/Toggle para resolução, fonte, touch screen, créditos mínimos, probabilidades da roleta, pastas de mídia, etc.

---

### PARTE O — Tela de login da máquina (`MachineLoginCard`)

Card centralizado `max-w-md`, `bg-card border border-border rounded-2xl shadow-2xl p-8`.

**Modos:** Login ↔ Registrar (toggle).

```tsx
<div className="flex items-center gap-3 mb-6">
  <Settings className="text-primary" size={32} />
  <h1 className="text-2xl font-display text-primary">
    {isRegister ? 'Registrar Máquina' : 'Login da Máquina'}
  </h1>
</div>

<form className="space-y-4">
  <Input placeholder="Nome da máquina" />
  <Input type="password" placeholder="Senha" />
  {error && <p className="text-destructive text-xs">{error}</p>}
  <Button type="submit" className="w-full">Entrar</Button>
  <button type="button" className="text-sm text-primary hover:underline w-full text-center">
    {isRegister ? 'Já tenho conta' : 'Registrar nova máquina'}
  </button>
</form>
```

**Após login (Setup Técnico):** exibe email logado, campo "Nome da Máquina", botões **Salvar Nome** e **Sair da Sessão**.

---

### PARTE P — Painel administrativo (`AdminPanel`)

**Header:**
- Botão voltar (ghost icon)
- Título **"Painel Administrativo"** — `text-2xl font-display text-primary`
- "Logado como **Admin**"
- Botão **Sair** (outline sm)

**Abas principais:**
| Aba | Ícone | Conteúdo |
|-----|-------|----------|
| Dashboard | BarChart | Cards de estatísticas, gráficos |
| Máquinas | Monitor | Tabela de gestão |
| Configurações | Settings | Formulários por máquina |

#### Card de estatística (`StatCard`)
```tsx
<div className="bg-card border border-border rounded-xl p-5">
  <div className="flex items-center gap-3">
    <Icon className={colorClass} size={20} />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-display text-foreground">{value}</p>
    </div>
  </div>
</div>
```

#### Tabela de máquinas (`MachineTable`)
Colunas: Nome, E-mail, Cadastrada em, Ativa (toggle), Ações (Editar/Excluir ghost icons `h-7 w-7`).

**Dialog excluir:** título "Excluir máquina?" + botões **Cancelar** (outline) / **Excluir** (destructive).

**Dialog usuários:** **Novo Usuário** (default + ícone Plus), lista com Editar/Excluir ghost sm.

---

### PARTE Q — Modal de faturamento (`BillingModal`)

```tsx
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="max-w-3xl">
    <DialogTitle className="text-primary font-display tracking-wider text-xl">
      Leitura de Faturamento
    </DialogTitle>

    {/* Filtro de período — botões toggle */}
    <button className={cn(
      'px-3 py-2 rounded-md border text-sm transition-colors',
      isActive ? 'bg-primary/20 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'
    )}>
      Hoje
    </button>

    {/* Resumo + tabela de transações */}
  </DialogContent>
</Dialog>
```

---

### PARTE R — Dropdown de teclas (`KeysDropdown`)

Botão trigger: ícone `Keyboard`, `p-1.5 text-muted-foreground hover:text-primary`.

**Popover:** lista de `{ label, key }` com `<kbd>` estilizado:
```tsx
<kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono text-[10px] border border-border min-w-[28px] text-center">
  {keyLabel}
</kbd>
```

**Teclas mapeadas típicas:** setas (navegar), Enter (escolher), Espaço (tocar), Esc (voltar), etc.

---

### PARTE S — Componentes auxiliares

#### `EmptyState`
```tsx
<div className="text-center py-12 text-muted-foreground">
  <Icon size={48} className="mx-auto mb-3 opacity-30" />
  <p className="text-sm">{message}</p>
</div>
```

#### `LoadingSpinner`
```tsx
<div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
```

#### `MarqueeText` (título longo)
Usa `animate-scroll-left` com CSS variables `--scroll-distance` e `--scroll-duration`.

#### `formatDuration(seconds)`
```ts
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
```

---

## 5. Mapa de componentes React sugerido

```
src/
├── components/
│   ├── ui/                    # shadcn (Button, Input, Dialog, Tabs...)
│   ├── jukebox/
│   │   ├── JukeboxShell.tsx
│   │   ├── JukeboxHeader.tsx
│   │   ├── AlbumBrowser.tsx
│   │   ├── AlbumCard.tsx
│   │   ├── SongSidePanel.tsx
│   │   ├── WaitQueuePanel.tsx
│   │   ├── PlayerBar.tsx
│   │   ├── QueuePopup.tsx
│   │   ├── HitsOverlay.tsx
│   │   ├── AlphabetFilter.tsx
│   │   ├── EqualizerBars.tsx
│   │   └── VideoPlayer.tsx
│   ├── roulette/
│   │   ├── RouletteModal.tsx
│   │   └── RouletteCanvas.tsx
│   ├── dialogs/
│   │   ├── InsufficientCreditsDialog.tsx
│   │   ├── AdminPasswordDialog.tsx
│   │   ├── JukeboxSettingsDialog.tsx
│   │   └── BillingModal.tsx
│   ├── admin/
│   │   ├── AdminPanel.tsx
│   │   ├── StatCard.tsx
│   │   ├── MachineTable.tsx
│   │   └── UserDialog.tsx
│   ├── auth/
│   │   └── MachineLoginCard.tsx
│   └── shared/
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       └── KeysDropdown.tsx
├── hooks/
│   ├── usePlayer.ts           # estado do player (sem backend)
│   ├── useQueue.ts
│   ├── useKeyboardNav.ts      # navegação por teclado
│   └── useCredits.ts
├── types/
│   └── index.ts
└── styles/
    ├── globals.css            # tokens + neon + glass
    └── animations.css
```

---

## 6. Props que vêm do seu backend (contrato sugerido)

Substitua as chamadas Supabase/API originais por seus endpoints:

| Dado | Uso na UI |
|------|-----------|
| `Album[]` | Grid de pastas/álbuns |
| `Song[]` | Listas e fila |
| `Genre[]` | Overlay HITS |
| `credits: number` | Header, player, roleta |
| `queue: Song[]` | Fila de espera |
| `playerState` | Player bar |
| `machineConfig` | Modal de configurações |
| `machines[]` | Painel admin |
| `billingRecords[]` | Modal faturamento |
| `roulettePrizes[]` | Roleta |
| `navigationKeys` | Dropdown de teclas |

**O frontend não precisa saber como os dados são persistidos** — apenas recebe props/callbacks:

```tsx
// Exemplo de página principal
<JukeboxShell
  header={<JukeboxHeader isPlaying={player.isPlaying} credits={credits} ... />}
  queuePanel={<WaitQueuePanel queue={queue} currentSong={player.currentSong} ... />}
  playerBar={<PlayerBar currentSong={player.currentSong} onTogglePlay={player.toggle} ... />}
>
  <AlbumBrowser albums={albums} onSelectAlbum={handleSelectAlbum} />
</JukeboxShell>
```

---

## 7. Gradientes de capa por gênero (referência)

| Gênero | Classes Tailwind |
|--------|------------------|
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

## 8. Checklist de implementação

- [ ] Configurar Tailwind + tokens CSS
- [ ] Instalar shadcn/ui + lucide-react
- [ ] Criar `Button` e componentes base
- [ ] Implementar `AlbumCard` (md + lg)
- [ ] Montar `JukeboxShell` com layout 3 colunas
- [ ] Implementar `PlayerBar` (com e sem música)
- [ ] Implementar `WaitQueuePanel` + `EqualizerBars`
- [ ] Implementar `SongSidePanel` com ações hover
- [ ] Implementar `HitsOverlay` com busca
- [ ] Implementar `RouletteModal` + canvas
- [ ] Implementar `VideoPlayer` (fullscreen + PIP)
- [ ] Implementar dialogs (créditos, admin, config, faturamento)
- [ ] Implementar `MachineLoginCard`
- [ ] Implementar `AdminPanel` com abas
- [ ] Conectar hooks de estado ao seu backend via API

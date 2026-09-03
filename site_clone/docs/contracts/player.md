# Contrato — Player e fila

Módulo de reprodução de áudio/vídeo, barra inferior e fila de espera.  
Somente o que o frontend controla e exibe.

---

## Estado do player

```ts
interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;        // 0–100 (%)
  volume: number;          // 0–100 (%)
  queue: Song[];
  credits: number;
}
```

---

## Ações do player

```ts
interface PlayerActions {
  playSong: (song: Song) => void;
  playQueuedSong: (song: Song) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  addToQueue: (song: Song) => void;
  clearQueue: () => void;
  setProgress: (percent: number) => void;
  setVolume: (percent: number) => void;
  setCredits: (credits: number | ((prev: number) => number)) => void;
}
```

---

## Regras de UI

| Regra | Comportamento |
|-------|---------------|
| Sem créditos | Exibir dialog `Créditos Insuficientes` ao tentar tocar |
| Música grátis | Config `freeCredits: true` ignora débito |
| Karaokê com vídeo | Abrir `VideoPlayer` em fullscreen automaticamente |
| Fila vazia | Mensagem `Nenhuma música na fila` / `Fila vazia` |
| Sem música atual | Player bar em modo idle (só créditos + contagem da fila) |

---

## Item da fila

```ts
type QueueItem = Song;

interface QueueRowProps {
  song: QueueItem;
  index: number;           // 0-based
  isFocused: boolean;
  isNowPlaying: boolean;
  onPlay: () => void;
  onSelect: () => void;
}
```

**Exibição:**
- Posição formatada: `String(index + 1).padStart(2, '0')` → `"01"`, `"02"`…
- Duração via `formatDuration(song.duration)`

---

## Player bar — props

```ts
interface PlayerBarProps {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  credits: number;
  queue: Song[];
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onProgressChange: (percent: number) => void;
  onVolumeChange?: (percent: number) => void;
  onPlaySong: (song: Song) => void;
  onClearQueue?: () => void;
}
```

---

## Fila de espera — props

```ts
interface WaitQueuePanelProps {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  focusedIndex: number;
  onPlaySong: (song: Song) => void;
}
```

**Bloco "Tocando agora":** exibido quando `currentSong !== null`, com equalizer animado.

---

## Video player — modos

```ts
type VideoPlayerMode = 'hidden' | 'fullscreen' | 'pip';

interface VideoPlayerProps {
  song: Song | null;
  isPlaying: boolean;
  mode: VideoPlayerMode;
  onModeChange: (mode: VideoPlayerMode) => void;
  onEnded: () => void;
  onProgress: (percent: number) => void;
  onTogglePlay: () => void;
}
```

| Modo | Comportamento |
|------|---------------|
| `fullscreen` | `fixed inset-0 z-[80]`, vídeo `object-contain` |
| `pip` | `fixed bottom-24 right-4`, `w-72 sm:w-80` |
| `hidden` | Áudio continua, vídeo oculto |

**Timeout PIP:** após 2 min sem interação, volta para `fullscreen`.

---

## Popup lateral de fila

```ts
interface QueuePopupProps {
  open: boolean;
  queue: Song[];
  onPlaySong: (song: Song) => void;
  onClearQueue: () => void;
  onClose: () => void;
}
```

---

## Navegação por teclado

```ts
interface NavigationKeyMap {
  up: string;
  down: string;
  left: string;
  right: string;
  play: string;
  choose: string;
  volume?: string;
  cancel?: string;
  skip?: string;
  queue?: string;
  credit?: string;
  number?: string;
}
```

**Defaults usados na interface:**
`up:"q"`, `down:"w"`, `left:"e"`, `right:"r"`, `play:"o"`, `choose:"i"`.

---

## Eventos emitidos pela UI

```ts
type PlayerUIEvent =
  | { type: 'SONG_PLAYED'; songId: string }
  | { type: 'SONG_QUEUED'; songId: string }
  | { type: 'SONG_ENDED'; songId: string }
  | { type: 'QUEUE_CLEARED' }
  | { type: 'VOLUME_CHANGED'; percent: number }
  | { type: 'PROGRESS_CHANGED'; percent: number };
```

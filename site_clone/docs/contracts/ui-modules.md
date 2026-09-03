# Contrato — Módulos de UI (props React)

Contratos de **props e callbacks** por componente React.  
Somente o frontend — sem referência a backend, tabelas ou rotas.

Para classes Tailwind e estrutura visual detalhada, ver [`FRONTEND_REACT.md`](../../FRONTEND_REACT.md).

---

## Shell e layout

### `JukeboxShell`

```ts
interface JukeboxShellProps {
  header: React.ReactNode;
  children: React.ReactNode;
  queuePanel: React.ReactNode;
  playerBar: React.ReactNode;
}
```

---

## Header e navegação

### `JukeboxHeader`

```ts
interface JukeboxHeaderProps {
  isPlaying: boolean;
  isSyncing: boolean;
  errorMessage?: string;
  navigationKeys: NavigationKeyMap;
  onOpenBilling: () => void;
  onSyncLibrary: () => void;
}
```

### `KeysDropdown`

```ts
interface KeysDropdownProps {
  keys: NavigationKeyMap;
}
```

### `AlphabetFilter`

```ts
interface AlphabetFilterProps {
  activeLetter: AlphabetFilter;
  letters: AlphabetFilter[];
  onChange: (letter: AlphabetFilter) => void;
}
```

---

## Catálogo

### `AlbumBrowser`

```ts
interface AlbumBrowserProps {
  albums: Album[];
  selectedAlbumId: string | null;
  focusedIndex: number;
  onSelectAlbum: (album: Album, index: number) => void;
}
```

### `AlbumCard`

```ts
interface AlbumCardProps {
  gradientClass: string;
  albumName: string;
  artistName: string;
  coverImage?: string;
  size?: 'sm' | 'md' | 'lg';
  isSelected?: boolean;
  isFocused?: boolean;
  onClick?: () => void;
}
```

### `SongSidePanel`

```ts
interface SongSidePanelProps {
  album: Album | null;
  selectedSongId: string | null;
  focusedSongIndex: number;
  onSelectSong: (song: Song, index: number) => void;
  onPlaySong: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
}
```

### `HitsOverlay`

```ts
interface HitsOverlayProps {
  open: boolean;
  genre: Genre;
  searchQuery: string;
  focusedSongIndex: number;
  onClose: () => void;
  onGoHome: () => void;
  onGoBack: () => void;
  onSearchChange: (query: string) => void;
  onSelectSong: (song: Song, index: number) => void;
  onPlaySong: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
}
```

---

## Player e fila

### `WaitQueuePanel`

```ts
interface WaitQueuePanelProps {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  focusedIndex: number;
  onPlaySong: (song: Song) => void;
}
```

### `PlayerBar`

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

### `EqualizerBars`

```ts
interface EqualizerBarsProps {
  isPlaying: boolean;
  barCount?: number;   // default: 5
}
```

### `VideoPlayer`

```ts
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

### `QueuePopup`

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

## Roleta

### `RouletteModal`

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

### `RouletteCanvas`

```ts
interface RouletteCanvasProps {
  prizes: RoulettePrizeResult[];
  rotationAngle: number;
  isSpinning: boolean;
  size?: number;   // default: 500
}
```

---

## Dialogs

### `InsufficientCreditsDialog`

```ts
interface InsufficientCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### `AdminPasswordDialog`

```ts
interface AdminPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

### `JukeboxSettingsDialog`

```ts
interface JukeboxSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  machineId: string;
  settings: JukeboxSettings;
  onSave: (settings: JukeboxSettings) => Promise<void>;
}
```

### `BillingModal`

```ts
interface BillingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineId?: string;
  nomeMaquina: string;
}
```

---

## Auth

### `MachineLoginCard`

```ts
interface MachineLoginCardProps {
  mode: 'login' | 'register';
  isLoading: boolean;
  error?: string;
  onSubmit: (data: MachineLoginRequest) => Promise<void>;
  onToggleMode: () => void;
}
```

### `SetupTecnicoCard`

```ts
interface SetupTecnicoCardProps {
  session: MachineSession;
  onSaveMachineName: (nome: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}
```

---

## Admin

### `AdminPanel`

```ts
interface AdminPanelProps {
  user: AdminUser;
  onSignOut: () => void;
  onNavigateHome: () => void;
}
```

### `MachineTable`

```ts
interface MachineTableProps {
  machines: Machine[];
  onToggleActive: (id: string, ativa: boolean) => Promise<void>;
  onEdit: (machine: Machine) => void;
  onDelete: (id: string) => void;
}
```

### `StatCard`

```ts
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  colorClass?: string;
}
```

### `UserDialog`

```ts
interface UserDialogProps {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSave: (data: { nome: string; senha: string; role: AdminRole }) => Promise<void>;
}
```

---

## Shared

### `EmptyState`

```ts
interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  size?: 'sm' | 'md';
}
```

### `LoadingSpinner`

```ts
interface LoadingSpinnerProps {
  className?: string;
}
```

---

## Hook agregador sugerido (`useJukebox`)

```ts
interface UseJukeboxReturn {
  // Estado
  player: PlayerState;
  settings: JukeboxSettings;
  albums: Album[];
  session: MachineSession | null;

  // Ações player
  playSong: (song: Song) => void;
  addToQueue: (song: Song) => void;
  togglePlay: () => void;
  clearQueue: () => void;

  // UI
  openRoulette: () => void;
  openSettings: () => void;
  openBilling: () => void;

  // Loading
  isLoading: boolean;
  error: string | null;
}
```

Este hook **orquestra** os dados de entrada e emite eventos da UI, sem expor detalhes de origem.

---

## Mapa módulo → componentes

| Módulo de dados | Componentes UI |
|-----------------|----------------|
| [catalog.md](./catalog.md) | AlbumBrowser, AlbumCard, SongSidePanel, HitsOverlay |
| [player.md](./player.md) | PlayerBar, WaitQueuePanel, VideoPlayer, EqualizerBars |
| [credits-billing.md](./credits-billing.md) | BillingModal, InsufficientCreditsDialog |
| [roulette.md](./roulette.md) | RouletteModal, RouletteCanvas |
| [settings.md](./settings.md) | JukeboxSettingsDialog, KeysDropdown |
| [auth.md](./auth.md) | MachineLoginCard, SetupTecnicoCard, AdminPasswordDialog |
| [admin.md](./admin.md) | AdminPanel, MachineTable, StatCard, UserDialog |
| [statistics.md](./statistics.md) | StatCard, Dashboard (interno ao AdminPanel) |

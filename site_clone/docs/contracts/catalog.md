# Contrato — Catálogo de mídia

Módulo de dados que o browser principal consome para exibir álbuns, pastas, músicas e karaokê.  
Sem mapeamento de backend — apenas o que o frontend recebe e exibe.

---

## Entidades de UI

### `Song`

```ts
interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;              // segundos
  category?: AlbumCategory;
  coverColor?: string;           // classes Tailwind gradient
  coverImage?: string;           // URL da capa
  fileUrl?: string;              // URL do áudio/vídeo
  fileName?: string;             // nome do arquivo (karaokê)
  type?: MediaType;
  genre?: string;
}
```

**Exemplo:**
```json
{
  "id": "s25",
  "title": "Binary Sunset",
  "artist": "DJ Byte",
  "album": "Eletrônica Mix",
  "duration": 320,
  "category": "OUTRAS",
  "coverColor": "from-indigo-500 to-purple-700"
}
```

---

### `Album`

```ts
interface Album {
  id: string;
  name: string;
  artist: string;
  category: AlbumCategory;
  coverColor: string;
  coverImage?: string;
  songs: Song[];
}
```

**Exemplo:**
```json
{
  "id": "a1",
  "name": "Sertanejo",
  "artist": "Vários Artistas",
  "category": "HITS",
  "coverColor": "from-amber-500 to-orange-700",
  "songs": []
}
```

---

### `Genre` (overlay HITS)

```ts
interface Genre {
  id: string;
  name: string;
  coverColor: string;
  coverImage?: string;
  albums: Album[];
}
```

---

### Karaokê

```ts
interface KaraokeItem {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  type: MediaType;
  genre: string;
}

interface KaraokeGenre {
  name: string;
  items: KaraokeItem[];
  coverUrl?: string;
}
```

---

## Props dos componentes

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

## Callbacks emitidos pela UI

```ts
interface CatalogCallbacks {
  onSelectAlbum: (album: Album, index: number) => void;
  onSelectSong: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onPlaySong: (song: Song) => void;
  onSyncLibrary: () => void;
}
```

---

## Estados vazios (mensagens UI)

| Situação | Mensagem |
|----------|----------|
| Sem pastas | `Nenhuma pasta encontrada` |
| Pasta sem músicas | `Nenhuma música nesta pasta` |
| Nenhuma pasta selecionada | `Selecione uma pasta` |
| Gênero sem artistas | `Nenhum artista encontrado neste gênero` |
| Busca sem resultado | `Nenhuma música encontrada` |

---

## Filtro alfabético

```ts
type AlphabetFilter = 'ALL' | 'A' | 'B' | 'C' | /* … */ 'Z';

interface AlphabetFilterState {
  activeLetter: AlphabetFilter;
  onChange: (letter: AlphabetFilter) => void;
}
```

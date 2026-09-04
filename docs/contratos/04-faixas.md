# Contrato 04 — Faixas (Músicas)

## Componentes frontend

- `src/components/jukebox/SongSidePanel.jsx`
- `src/components/jukebox/PlayerBar.jsx` — barra fixa inferior
- `src/hooks/useAudioPlayer.js` — reprodução
- `src/hooks/useLibrary.js` → `loadAlbumTracks()`
- `src/lib/library.js` → `mapTrackFromApi()`, `buildPlayerSubtitle()`

## Descrição

Lista numerada de faixas do artista/álbum selecionado. Ao tocar, registra evento no backend, debita crédito e reproduz via `media_url`.

## Status

| Funcionalidade | Status |
|----------------|--------|
| Listagem via API | ✅ |
| Título sem duplicação | ✅ |
| Subtítulo = pasta pai (`folder_path`) | ✅ |
| Play + POST tocadas | ✅ |
| Player fixo inferior customizado | ✅ |
| Tempo atual / duração (`duration_seconds` da API) | ✅ |
| Volume 0–100% + `localStorage` | ✅ |
| Anterior / Próximo (fila ou `tracks`) | ✅ |
| Teclas `pular`, `vol_mais`, `vol_menos` | ✅ |
| Player com `media_url` direto | ✅ |
| Duração na lista lateral (`duration_seconds`) | ✅ |

---

## Endpoint

### `GET /api/v1/musicas/?prefix=Musicas/{Categoria}/{Artista}/`

```
Authorization: Maquina <token>
```

#### Item em `musicas` / `musicas_list`

```json
{
  "name": "Yesterday.mp3",
  "title": "Yesterday",
  "key": "Musicas/Beatles/Yesterday.mp3",
  "folder_path": "Musicas/Beatles/",
  "media_type": "audio",
  "media_url": "https://pub-xxxxx.r2.dev/Musicas/Beatles/Yesterday.mp3",
  "cover_url": "https://pub-xxxxx.r2.dev/Musicas/Beatles/cover.jpg",
  "duration_seconds": 261
}
```

---

## Mapeamento API → UI

| Campo API | Estado React | UI |
|-----------|--------------|-----|
| `title` | `track.title` | Linha principal (uma vez só) |
| `name` | fallback sem extensão | — |
| `folder_path` | `track.artist` | Subtítulo (última pasta, ex: `Beatles`) |
| `key` | `track.key` | ID + envio em tocadas |
| `media_url` | `track.media_url` | `<audio src>` |
| `cover_url` | `track.cover_url` | Capa no player/fila |
| `duration_seconds` | `track.duration_seconds` | Duração na lista e player (`4:21`); `null` → `--:--` |

### Regras de exibição

1. Título: `title` (ou `name` sem extensão) — **nunca repetir** o nome do álbum no título.
2. Subtítulo: artista extraído de `folder_path` — só exibe se diferente do título.
3. **Não** usar nome da pasta selecionada como artista (evita textos incorretos como "(Na Na Na)").

```javascript
// src/lib/library.js
getArtistFromFolderPath("Musicas/Beatles/") → "Beatles"
```

---

## Endpoint: registrar música tocada

### `POST /api/v1/maquinas/tocadas/`

```
Authorization: Maquina <token>
```

```json
{
  "musica_key": "Musicas/Beatles/Yesterday.mp3",
  "musica_nome": "Yesterday",
  "titulo": "Yesterday",
  "pasta": "Musicas/Beatles/",
  "media_type": "audio",
  "media_url": "https://...",
  "cover_url": "https://...",
  "valor": 1.00
}
```

Chamado em `handlePlay()` (`src/App.jsx`) antes de iniciar o áudio.

---

## Reprodução

Elemento `<audio>` oculto em `PlayerBar.jsx`; controles na barra customizada.

```javascript
audio.play({ ...track, media_url })
// Player usa media_url direto — sem proxy backend
```

### Barra fixa (`PlayerBar`)

Visual original do jukebox (`glass-surface`, vinil girando, barra de progresso no topo) com controles adicionais:

| Região | Conteúdo |
|--------|----------|
| Topo | Barra de progresso (`currentTime / duration_seconds`) |
| Esquerda | Créditos + vinil + título / subtítulo (`buildPlayerSubtitle()`) |
| Centro | Espaço flexível |
| Direita | Anterior · Play/Pause · Próximo · tempo · volume · `ListMusic` · `Clock` + contagem em espera |

### Navegação

- **Próximo / pular / fim da faixa:** próxima na fila local ou em `library.tracks`
- **Anterior:** reinicia se `currentTime > 3s`; senão faixa anterior na playlist
- **Volume:** persiste em `localStorage`; teclas `vol_mais` / `vol_menos` ajustam ±10%

## Regras de negócio

1. Tocar consome `CREITS_PER_SONG` (1) crédito local.
2. Se saldo insuficiente, exibe erro no header.
3. Faixa tocada é adicionada à fila local (contrato 05).

### `duration_seconds`

- Inteiro em segundos (`261` → `4:21` via `formatDuration()` em `src/lib/utils.js`)
- Pode ser `null` se a duração não foi extraída — UI exibe `--:--` no total do player
- Presente apenas em `media_type: "audio"` ou `"video"`
- **Não** ler duração do arquivo no front; usar só o valor da API

Listas de faixas: `musicas`, `musicas_list`, `files` ou `files_list` (`getTracksFromResponse`).

## Pendências

- [ ] Suporte a vídeo (`.mp4`) no player

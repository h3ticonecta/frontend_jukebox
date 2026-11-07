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
| Teclas `pular` e `vol` (botão único; legado vol_mais/menos migra) | ✅ |
| Player com `media_url` direto | ✅ |
| Duração na lista lateral (`duration_seconds`) | ✅ |
| Linha inteira clicável (touch/mouse) | ✅ |
| Botões da fila visíveis em touch | ✅ |
| Skeleton ao carregar faixas (`TrackListSkeleton`) | ✅ |

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
| `key` / `path` | `track.key` via `resolveTrackKey()` | ID + `musica_key` em tocadas (`path`, `file_key`, ou `name`+pasta) |
| `media_url` | `track.media_url` | `<audio src>` |
| `cover_url` | `track.cover_url` | Capa no player/fila |
| `duration_seconds` | `track.duration_seconds` | Segunda linha do item em `SongSidePanel` (`4:21`); `null` → `--:--`; player no rodapé |

### Regras de exibição

1. Título: `title` (ou `name` sem extensão) — **nunca repetir** o nome do álbum no título.
2. Abaixo do título: **duração original** da faixa (`formatDuration`), não o nome da pasta/álbum.
3. Subtítulo por artista (`folder_path`) não é exibido na lista lateral (evita repetir “SELEÇÃO …” como segunda linha).

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

Montado com `buildMusicaTocadaPayload()` (`src/lib/library.js`) em `playTrack()` antes do áudio. `pasta` com barra final; `cover_url` nunca `null` (cascade faixa → álbum → SUCESSO, senão `""`). Erros `400` exibem campos da API (`formatApiErrorMessage` em `client.js`).

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
| Topo | Linha do tempo em âmbar (`PlaybackTimeline`) em toda a largura do rodapé enquanto toca; brilho no preenchimento; arraste para buscar quando a duração é conhecida (API ou `loadedmetadata`) |
| Esquerda | Créditos + vinil + título / subtítulo (`buildPlayerSubtitle()`) |
| Centro | Espaço flexível |
| Direita | Anterior · Play/Pause · Próximo · tempo · volume · `Clock` + contagem em espera |

### Navegação

- **Próximo / pular / fim da faixa:** próxima na fila local (com débito); sem fila, para o player
- **Anterior:** reinicia se `currentTime > 3s`; senão faixa anterior na playlist
- **Volume:** persiste em `localStorage`; tecla `vol` ajusta ±10% (`useVolumeShortcuts`); legado `vol_mais` / `vol_menos` usado como tecla de fallback

## Regras de negócio

1. Tocar consome `CREITS_PER_SONG` (1) crédito local.
2. Se saldo insuficiente, exibe erro no header.
3. Fila de espera é independente do play imediato (contrato 05).

### `duration_seconds`

- Inteiro em segundos (`261` → `2:44` via `formatDuration()` em `src/lib/utils.js`)
- API: `resolveDurationSecondsFromTrack()` tenta `duration_seconds`, `duration`, `length`, `duracao`, ms, etc.
- Lista lateral: `resolveMediaUrlFromTrack()` (vários campos de URL); `enrichTracksWithDurations()` lê metadados do áudio (com/sem `crossOrigin`); ao tocar, `onDurationKnown` grava a duração do player na lista (`patchTrackDuration`)
- Cache de faixas sem `media_url` força novo `GET` do álbum (não usa `silent`)
- Player: `loadedmetadata` / `timeupdate` no `<audio>` principal
- Ausente em todos os fallbacks → `--:--` na lista e no total do player
- Presente apenas em `media_type: "audio"` ou `"video"`

Navegação por `prefix` (artista/categoria): `getNavigationTracksFromResponse` — `musicas`, `musicas_list` ou `files` (`files_list` vazio fora da busca).

Busca (`?q=`): `getTracksFromResponse` também considera `files_list`.

## Pendências

- [ ] Suporte a vídeo (`.mp4`) no player

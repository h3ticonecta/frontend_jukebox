# Contrato 04 — Faixas (Músicas)

## Componentes frontend

- `src/components/jukebox/SongSidePanel.jsx`
- `src/hooks/useAudioPlayer.js` — reprodução
- `src/hooks/useLibrary.js` → `loadAlbumTracks()`
- `src/lib/library.js` → `mapTrackFromApi()`

## Descrição

Lista numerada de faixas do artista/álbum selecionado. Ao tocar, registra evento no backend, debita crédito e reproduz via `media_url`.

## Status

| Funcionalidade | Status |
|----------------|--------|
| Listagem via API | ✅ |
| Título sem duplicação | ✅ |
| Subtítulo = pasta pai (`folder_path`) | ✅ |
| Play + POST tocadas | ✅ |
| Player com `media_url` direto | ✅ |
| Duração da faixa | ❌ Backend não envia |

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
  "cover_url": "https://pub-xxxxx.r2.dev/Musicas/Beatles/cover.jpg"
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

```javascript
audio.play({ ...track, media_url })
// Player usa media_url direto — sem proxy backend
```

## Regras de negócio

1. Tocar consome `CREITS_PER_SONG` (1) crédito local.
2. Se saldo insuficiente, exibe erro no header.
3. Faixa tocada é adicionada à fila local (contrato 05).

## Pendências

- [ ] `duration_seconds` na API para exibir duração na lista
- [ ] Suporte a vídeo (`.mp4`) no player

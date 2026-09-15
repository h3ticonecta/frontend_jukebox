# Contrato 07 — Mídias (Cloudflare R2)

## Componentes que consomem mídia

| Componente | Tipo | Campo API |
|------------|------|-----------|
| `GenreCarousel` / `AlbumCard` (vinil) | Capa | `cover_url` |
| `AlbumBrowser` / `AlbumCard` (grid) | Capa | `cover_url` |
| `SongSidePanel` | Capa do álbum | `cover_url` |
| `PlayerBar` / `WaitQueuePanel` | Capa da faixa | `cover_url` |
| `useAudioPlayer` | Áudio/vídeo | `media_url` |

## Descrição

Arquivos ficam no **Cloudflare R2**. O backend indexa no PostgreSQL no sync e retorna URLs públicas. O frontend **não** passa mídia pelo Django.

## Status

| Funcionalidade | Status |
|----------------|--------|
| Capas via `cover_url` | ✅ |
| Áudio via `media_url` direto | ✅ |
| Fallback gradiente sem capa | ✅ |
| CORS para `<audio src>` | ✅ (domínio R2 separado) |
| Cache Storage de capas R2 (Service Worker) | ✅ |
| Pré-cache de capas do catálogo (botão download no header) | ✅ |
| Pré-cache de áudio só da fila (próximas 5 + atual) | ✅ |

---

## Campos na API de músicas

```json
{
  "cover_url": "https://pub-xxxxx.r2.dev/Musicas/Beatles/cover.jpg",
  "cover": {
    "name": "cover.jpg",
    "key": "Musicas/Beatles/cover.jpg",
    "media_url": "https://..."
  },
  "media_url": "https://pub-xxxxx.r2.dev/Musicas/Beatles/song.mp3",
  "audio_url": "https://..."
}
```

O front usa: `cover_url || cover.media_url` e `media_url || audio_url`.

---

## Regra de capa da pasta (backend)

Ordem de prioridade no sync (documentado no backend):

1. Arquivos nomeados: `cover`, `folder`, `album`, `artwork`, `front`, `capa`
2. Primeira imagem da pasta (`.jpg`, `.jpeg`, `.png`)

Para categorias sem capa própria, ver **contrato 10** (herança do primeiro artista filho).

---

## Player

```javascript
// src/hooks/useAudioPlayer.js
audio.src = track.media_url;
audio.play();
```

Sem token, sem proxy. O Service Worker (`public/sw.js`) intercepta GET de áudio/capa:

- **Capas** (`jpg/png/webp…` fora da origem): cache-first no `jukebox-covers-v1`
- **Áudio da fila**: cache-first no `jukebox-queue-audio-v1` **somente** se a página pediu pré-cache (`JUKEBOX_SYNC_QUEUE_MEDIA`). Faixas que não estão na fila vão direto à rede, sem gravar o MP3.

`syncQueueMediaCache` envia a faixa atual + as próximas 5 da fila (`QUEUE_PRECACHE_COUNT`). Áudios que saíram da fila são removidos do cache.

### Pré-cache do catálogo (botão download)

Ícone `Download` no `JukeboxHeader`, ao lado do refresh. Dispara `runCatalogPrefetch` (`src/lib/catalogPrefetch.js`):

1. Percorre `Musicas/` → cada SUCESSO → cada artista/banda → lista de faixas (metadados JSON no IndexedDB).
2. Baixa só **imagens** de capa de SUCESSOS e artistas (`jpg/png/webp…`); ignora `media_url` e extensões de áudio/vídeo.
3. **Não** baixa `media_url` em lote — áudio continua limitado à fila.

Progresso em `PrefetchBanner` (fases: SUCESSOS → artistas → músicas → capas). Enquanto roda, download e refresh ficam desabilitados.

---

## Fallback no frontend

Quando `cover_url` é `null`:

- Vinil (SUCESSOS): gradiente colorido + ícone `Disc`
- Cards de artista: gradiente + ícone `Disc`

---

## Formatos suportados (backend)

| Tipo | Extensões |
|------|-----------|
| Áudio | `.mp3`, `.wav`, `.ogg`, `.m4a`, `.flac` |
| Vídeo | `.mp4` |
| Capa | `.jpg`, `.jpeg`, `.png` |

---

## Pendências

- [ ] Player de vídeo para `.mp4`
- [ ] Capas herdadas no sync (contrato 10)

# Contrato 07 — Mídias (Cloudflare R2)

## Componentes frontend que consomem mídia

| Componente | Tipo de mídia | Campo |
|------------|---------------|-------|
| `ArtistsGrid` | Capa de álbum | `cover_url` |
| `TrackList` | Thumbnail do álbum | `cover_url` |
| `GenreCarousel` | Imagem do gênero (futuro) | `cover_url` |

## Descrição

Arquivos de áudio e imagens são armazenados no **Cloudflare R2**. O backend Django é responsável por gerar URLs de acesso; o frontend apenas consome as URLs retornadas pela API.

## Status atual no frontend

- ✅ Exibe imagens via URL (`cover` nos mocks)
- ❌ Usa placeholders (`picsum.photos`)
- ❌ Sem integração com R2

---

## Responsabilidades

| Camada | Responsabilidade |
|--------|------------------|
| **R2** | Armazenar arquivos (áudio, capas, imagens de gênero) |
| **Backend Django** | Upload, metadados, geração de URL, controle de acesso |
| **Frontend React** | Exibir URLs recebidas da API |

---

## Estrutura sugerida de paths no R2

```
jukebox/
├── audio/
│   └── {artist_id}/
│       └── {album_id}/
│           └── {track_id}.mp3
├── covers/
│   └── {album_id}.jpg
└── genres/
    └── {genre_id}.jpg
```

---

## Formato de URLs na API

O backend deve retornar URLs prontas para uso no frontend:

```json
{
  "cover_url": "https://media.jukebox.example.com/covers/as-20-mais.jpg"
}
```

### Opções de entrega

| Método | Prós | Contras |
|--------|------|---------|
| **URL pública via CDN** | Simples para o frontend | Menos controle de acesso |
| **URL assinada (presigned)** | Mais seguro | Expira; frontend precisa renovar |
| **Proxy via Django** | Controle total | Mais carga no backend |

**Recomendação para capas:** URL pública via CDN (Cloudflare).

**Recomendação para áudio:** URL assinada ou proxy — o frontend público pode não precisar do `audio_url` (ver contrato 04).

---

## Schema de mídia (metadados no backend)

```json
{
  "id": "media-001",
  "type": "cover",
  "entity_type": "album",
  "entity_id": "as-20-mais",
  "storage_key": "covers/as-20-mais.jpg",
  "url": "https://media.jukebox.example.com/covers/as-20-mais.jpg",
  "mime_type": "image/jpeg",
  "size_bytes": 245760,
  "created_at": "2026-09-01T10:00:00Z"
}
```

---

## Requisitos para o frontend

1. **Imagens de capa**
   - Formato: JPEG ou WebP
   - Tamanho recomendado: 300×300px (mínimo)
   - Proporção: 1:1 (quadrada)

2. **Fallback**
   - Se `cover_url` for `null`, o frontend deve exibir imagem placeholder (a implementar).

3. **CORS**
   - O domínio do R2/CDN deve permitir requisições do domínio do frontend.

---

## Endpoint administrativo (backend only)

Estes endpoints **não são consumidos pelo frontend** do jukebox, mas documentados para referência:

### `POST /api/v1/admin/media/upload`

Upload de arquivo para o R2.

### `GET /api/v1/admin/media/{entity_type}/{entity_id}`

Consultar mídia vinculada a uma entidade.

---

## Campos de mídia por contrato

| Contrato | Campo | Tipo de arquivo |
|----------|-------|-----------------|
| 02-generos | `cover_url` | Imagem |
| 03-artistas-albuns | `cover_url` | Imagem |
| 04-faixas | `audio_url` | Áudio (MP3/FLAC) |

## Pendências para alinhamento

- [ ] Domínio público do CDN (ex.: `media.jukebox.com`)
- [ ] Política de URLs assinadas para áudio
- [ ] Tamanho máximo de upload
- [ ] Formatos de áudio aceitos

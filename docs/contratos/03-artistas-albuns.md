# Contrato 03 — Artistas e Álbuns

## Componente frontend

- `src/components/ArtistsGrid.jsx`
- Dados mock: `src/data/mockData.js` → `artists`

## Descrição

Exibe um grid 2 colunas com cards de artistas/álbuns. Cada card mostra capa, nome do artista, nome do álbum e quantidade de músicas. Ao selecionar um card, a lista de faixas é carregada (contrato 04).

## Status atual no frontend

- ✅ UI e seleção implementadas
- ❌ Não filtra por gênero selecionado
- ❌ Sem chamada à API

---

## Endpoint: listar artistas por gênero

### `GET /api/v1/genres/{genre_id}/artists`

Retorna artistas/álbuns de um gênero específico.

#### Path params

| Param | Tipo | Descrição |
|-------|------|-----------|
| `genre_id` | `string` | ID do gênero (ex.: `forro`) |

#### Query params

| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `page` | `integer` | `1` | Página atual |
| `per_page` | `integer` | `20` | Itens por página |
| `search` | `string` | — | Busca por nome de artista ou álbum |

#### Response `200 OK`

```json
{
  "data": [
    {
      "id": "14bis-as-20-mais",
      "artist_id": "14bis",
      "artist_name": "14 Bis",
      "album_id": "as-20-mais",
      "album_name": "As 20 Mais",
      "songs_count": 20,
      "cover_url": "https://r2.example.com/covers/14bis-as-20-mais.jpg",
      "genre_id": "mpb"
    }
  ],
  "meta": {
    "total": 189,
    "page": 1,
    "per_page": 20,
    "total_pages": 10
  }
}
```

#### Schema: `ArtistAlbum` (card do grid)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | `string` | Sim | ID composto ou do álbum para seleção |
| `artist_id` | `string` | Sim | ID do artista |
| `artist_name` | `string` | Sim | Nome exibido no card |
| `album_id` | `string` | Sim | ID do álbum |
| `album_name` | `string` | Sim | Nome do álbum |
| `songs_count` | `integer` | Sim | Total de faixas no álbum |
| `cover_url` | `string` | Sim | URL da capa (R2 ou CDN) |
| `genre_id` | `string` | Sim | Gênero principal |

#### Mapeamento na UI

| Campo API | Elemento UI |
|-----------|-------------|
| `cover_url` | Imagem do card |
| `artist_name` | Linha principal do overlay |
| `album_name` + `songs_count` | Texto "Álbum - X músicas" |
| `meta.total` | Contador no header "(X)" |

---

## Endpoint alternativo: listar álbuns

### `GET /api/v1/albums`

Útil se o backend modelar álbuns como entidade principal.

#### Query params

| Param | Tipo | Descrição |
|-------|------|-----------|
| `genre_id` | `string` | Filtrar por gênero |
| `artist_id` | `string` | Filtrar por artista |

#### Response

Mesmo schema de `ArtistAlbum`.

---

## Comportamento esperado no frontend (após integração)

```javascript
// Ao selecionar gênero
const { data, meta } = await fetch(`/api/v1/genres/${genreId}/artists`);

// Ao selecionar card
onSelectArtist(artistAlbum) → GET /api/v1/albums/${album_id}/tracks
```

## Regras de negócio

1. Um artista pode ter múltiplos álbuns; cada álbum é um card separado no grid.
2. `songs_count` deve refletir apenas faixas disponíveis para reprodução.
3. Álbuns sem faixas disponíveis não devem aparecer (ou aparecer desabilitados — a definir).
4. A capa deve ter proporção quadrada (o frontend usa `aspect-ratio: 1`).

## Erros

| Código | Situação |
|--------|----------|
| `404` | Gênero não encontrado |

```json
{
  "error": {
    "code": "GENRE_NOT_FOUND",
    "message": "Gênero 'xyz' não encontrado."
  }
}
```

## Dados mock de referência

```json
[
  {
    "id": "14bis",
    "artist_name": "14 Bis",
    "album_name": "As 20 Mais",
    "songs_count": 20,
    "cover_url": "https://picsum.photos/seed/14bis/300/300"
  }
]
```

> **Nota:** o mock atual usa `name` e `album` como campos separados. Na API, preferir `artist_name` e `album_name` para clareza.

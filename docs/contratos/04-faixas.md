# Contrato 04 — Faixas (Músicas)

## Componente frontend

- `src/components/TrackList.jsx`
- Dados mock: `src/data/mockData.js` → `tracks`

## Descrição

Exibe a lista numerada de faixas do álbum selecionado. Cada faixa possui botão de play que adiciona a música à fila de espera (contrato 05).

## Status atual no frontend

- ✅ UI implementada
- ✅ Botão play adiciona à fila local
- ❌ Faixas não mudam ao trocar de álbum (sempre exibe o mesmo mock)
- ❌ Sem chamada à API

---

## Endpoint: listar faixas de um álbum

### `GET /api/v1/albums/{album_id}/tracks`

#### Path params

| Param | Tipo | Descrição |
|-------|------|-----------|
| `album_id` | `string` | ID do álbum selecionado |

#### Response `200 OK`

```json
{
  "data": {
    "album": {
      "id": "as-20-mais",
      "name": "As 20 Mais",
      "artist_name": "14 Bis",
      "cover_url": "https://r2.example.com/covers/14bis-as-20-mais.jpg",
      "songs_count": 20
    },
    "tracks": [
      {
        "id": "track-001",
        "number": "01",
        "title": "Planeta Sonho",
        "duration_seconds": 245,
        "available": true
      },
      {
        "id": "track-002",
        "number": "02",
        "title": "Caçador de Mim",
        "duration_seconds": 198,
        "available": true
      }
    ]
  }
}
```

#### Schema: `Track`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | `string` | Sim | ID único da faixa |
| `number` | `string` | Sim | Número da faixa formatado (ex.: `"01"`) |
| `title` | `string` | Sim | Título da música |
| `duration_seconds` | `integer` | Não | Duração em segundos |
| `available` | `boolean` | Sim | Se a faixa pode ser adicionada à fila |

#### Mapeamento na UI

| Campo API | Elemento UI |
|-----------|-------------|
| `album.artist_name` + `album.name` | Header "Artista - Álbum" |
| `album.cover_url` | Thumbnail do header |
| `album.songs_count` | Texto "X músicas" |
| `number` | Número à esquerda da faixa |
| `title` | Título da faixa |
| `available: false` | Botão play desabilitado (a implementar) |

---

## Endpoint: obter detalhe de uma faixa

### `GET /api/v1/tracks/{track_id}`

Útil para validação antes de adicionar à fila.

#### Response `200 OK`

```json
{
  "id": "track-001",
  "number": "01",
  "title": "Planeta Sonho",
  "duration_seconds": 245,
  "available": true,
  "album": {
    "id": "as-20-mais",
    "name": "As 20 Mais",
    "cover_url": "https://r2.example.com/covers/14bis-as-20-mais.jpg"
  },
  "artist": {
    "id": "14bis",
    "name": "14 Bis"
  },
  "audio_url": "https://r2.example.com/audio/track-001.mp3"
}
```

> **Importante:** `audio_url` é para uso interno do player/sistema de reprodução do jukebox, **não** deve ser exposta diretamente ao usuário final no frontend público, se houver restrição de acesso. Avaliar se o frontend precisa deste campo ou se apenas o backend da fila o utiliza.

---

## Comportamento esperado no frontend (após integração)

```javascript
// Ao selecionar álbum
const { data } = await fetch(`/api/v1/albums/${albumId}/tracks`);
setTracks(data.tracks);
setSelectedAlbum(data.album);

// Ao clicar em play
onPlay(track) → POST /api/v1/queue (contrato 05)
```

## Regras de negócio

1. Faixas devem ser retornadas ordenadas por `number`.
2. Faixas indisponíveis (`available: false`) não podem ser adicionadas à fila.
3. O campo `number` deve ser string com zero à esquerda (`"01"`, `"02"`).
4. `songs_count` no header deve bater com o tamanho do array `tracks` retornado.

## Erros

| Código | Situação |
|--------|----------|
| `404` | Álbum não encontrado |

## Dados mock de referência

```json
[
  { "id": 1, "number": "01", "title": "Planeta Sonho" },
  { "id": 2, "number": "02", "title": "Caçador de Mim" },
  { "id": 3, "number": "03", "title": "Bola de Meia, Bola de Gude" }
]
```

# Contrato 02 — Gêneros Musicais

## Componente frontend

- `src/components/GenreCarousel.jsx`
- Dados mock: `src/data/mockData.js` → `genres`

## Descrição

Exibe o carrossel horizontal **SUCESSOS** com discos de vinil representando categorias/gêneros musicais. Ao selecionar um gênero, o frontend deve carregar os artistas correspondentes (contrato 03).

## Status atual no frontend

- ✅ UI implementada
- ✅ Seleção de gênero funcional (estado local)
- ❌ Não filtra artistas por gênero (todos os mocks são exibidos)
- ❌ Sem chamada à API

---

## Endpoint: listar gêneros

### `GET /api/v1/genres`

Retorna todos os gêneros disponíveis no catálogo.

#### Query params

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `featured` | `boolean` | Não | Se `true`, retorna apenas gêneros da seção "SUCESSOS" |

#### Response `200 OK`

```json
{
  "data": [
    {
      "id": "forro",
      "name": "FORRÓ",
      "artists_count": 102,
      "color": "#e85d2a",
      "cover_url": "https://r2.example.com/genres/forro.jpg",
      "sort_order": 1
    },
    {
      "id": "sertanejo",
      "name": "SERTANEJO",
      "artists_count": 207,
      "color": "#c9a227",
      "cover_url": null,
      "sort_order": 2
    }
  ],
  "meta": {
    "total": 8
  }
}
```

#### Schema: `Genre`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | `string` | Sim | Identificador único (slug) |
| `name` | `string` | Sim | Nome exibido no carrossel |
| `artists_count` | `integer` | Sim | Quantidade de artistas no gênero |
| `color` | `string` | Não | Cor hexadecimal para o disco de vinil |
| `cover_url` | `string \| null` | Não | Imagem do centro do vinil (R2) |
| `sort_order` | `integer` | Não | Ordem de exibição |

#### Mapeamento na UI

| Campo API | Elemento UI |
|-----------|-------------|
| `name` | Texto abaixo do vinil |
| `artists_count` | Texto "X artistas" |
| `color` | Gradiente do label central do disco |
| `cover_url` | Imagem no centro do vinil (futuro) |

---

## Comportamento esperado no frontend (após integração)

```javascript
// Ao montar a tela
const { data } = await fetch('/api/v1/genres?featured=true');

// Ao selecionar gênero
onSelectGenre(genre.id) → GET /api/v1/genres/{id}/artists
```

## Regras de negócio

1. Gêneros devem ser ordenados por `sort_order`.
2. `artists_count` deve ser calculado dinamicamente pelo backend.
3. Apenas gêneros com pelo menos 1 artista ativo devem ser exibidos (opcional, a confirmar).
4. A seção "SUCESSOS" pode ser um subconjunto marcado como `featured: true` no banco.

## Erros

| Código | Situação |
|--------|----------|
| `500` | Erro interno ao buscar catálogo |

## Dados mock de referência

```json
[
  { "id": "forro", "name": "FORRÓ", "artists_count": 102, "color": "#e85d2a" },
  { "id": "sertanejo", "name": "SERTANEJO", "artists_count": 207, "color": "#c9a227" },
  { "id": "mpb", "name": "MPB", "artists_count": 189, "color": "#2a8f6e" },
  { "id": "samba", "name": "SAMBA - PAGODE", "artists_count": 156, "color": "#8b4513" },
  { "id": "pais", "name": "PAIS", "artists_count": 94, "color": "#4a7c59" },
  { "id": "rap", "name": "RAP - REGGAE", "artists_count": 78, "color": "#6b3fa0" },
  { "id": "anos", "name": "ANOS 60 70 80 e 90", "artists_count": 312, "color": "#b8860b" },
  { "id": "internacional", "name": "INTERNACIONAL", "artists_count": 245, "color": "#3d5a80" }
]
```

# Contrato 02 — Gêneros / Categorias (SUCESSOS)

## Componentes frontend

- `src/components/jukebox/GenreCarousel.jsx`
- `src/hooks/useLibrary.js` → `loadGenres()`
- `src/lib/library.js` → `mapFolderFromApi()`, `formatFolderCountLabel()`

## Descrição

Carrossel horizontal **SUCESSOS** com discos de vinil em tamanho grande (~180px). Cada disco representa uma **categoria** (pasta de primeiro nível abaixo de `Musicas/`).

O carrossel rola **automaticamente da direita para a esquerda** em loop infinito. A animação pausa ao passar o mouse para permitir seleção.

## Status

| Funcionalidade | Status |
|----------------|--------|
| Listagem via API | ✅ |
| Seleção de categoria | ✅ |
| Contagem "N artistas" | ✅ |
| Capa no centro do vinil | ✅ (depende de `cover_url` — ver contrato 10) |
| Discos grandes (`size="xl"`, 180px) | ✅ |
| Carrossel infinito automático | ✅ |
| Pausa no hover | ✅ |
| Rotação ao selecionar | ✅ |
| Rotação lenta no hover | ✅ |

---

## Endpoint

### `GET /api/v1/musicas/?prefix=Musicas/`

```
Authorization: Maquina <token>
```

#### Item relevante em `folders[]`

```json
{
  "name": "Pop",
  "path": "Musicas/Pop/",
  "subfolders_count": 2,
  "files_count": 34,
  "cover_url": "https://pub-xxxxx.r2.dev/Musicas/Pop/cover.jpg",
  "cover": {
    "name": "cover.jpg",
    "media_url": "https://..."
  }
}
```

---

## Mapeamento API → UI

| Campo API | Estado React | UI |
|-----------|--------------|-----|
| `path` | `genre.id` | Chave de seleção |
| `name` | `genre.name` | Texto abaixo do vinil |
| `subfolders_count` | `genre.subfoldersCount` | — |
| `files_count` | `genre.filesCount` | — |
| `cover_url` | `genre.cover` | Imagem no círculo interno do vinil |
| — | `genre.countLabel` | `"N artistas"` se `subfolders_count > 0` |

### Regra de contagem (subtítulo)

```
subfolders_count > 0  →  "{N} artista(s)"
subfolders_count === 0 →  "{files_count} música(s)"
```

Implementado em `formatFolderCountLabel()` (`src/lib/library.js`).

---

## Carrossel infinito

Implementado em `GenreCarousel.jsx`:

| Aspecto | Detalhe |
|---------|---------|
| Tamanho do disco | `AlbumCard` com `size="xl"` → **180×180px** |
| Largura do item | 200px (disco + labels) |
| Loop | Lista duplicada (`[...genres, ...genres]`) |
| Animação | `animate-genre-marquee` — `translateX(0)` → `translateX(-50%)` |
| Direção | Direita → esquerda |
| Duração | 45s, linear, infinito |
| Hover | `animation-play-state: paused` |
| Bordas | Fade lateral via `.genre-marquee-mask` (`index.css`) |

### Componentes envolvidos

- `src/components/jukebox/GenreCarousel.jsx` — track duplicado e animação
- `src/components/jukebox/AlbumCard.jsx` — tamanho `xl` do vinil
- `tailwind.config.js` — keyframe `genre-marquee`
- `src/index.css` — máscara de fade nas bordas

---

## Comportamento do vinil

| Estado | Animação |
|--------|----------|
| Selecionado | `animate-spin-vinyl` |
| Hover (não selecionado) | `animate-spin-vinyl-slow` |
| Sem `cover_url` | Gradiente colorido + ícone `Disc` |

---

## Ao selecionar categoria

```javascript
selectGenre(genre) → loadAlbums(genre)
// GET /api/v1/musicas/?prefix={genre.path}
```

Ver contrato 03.

## Banner de sync

Se `needs_sync === true` na response, `SyncBanner` exibe aviso para o admin sincronizar a biblioteca.

## Pendências

- [ ] `cover_url` herdado do primeiro artista quando categoria não tem capa (contrato 10 — backend)

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
| Skeleton ao carregar (`GenreCarouselSkeleton`, largura total) | ✅ |
| Listagem via API | ✅ |
| Seleção de categoria | ✅ |
| Cancela fetch anterior ao trocar SUCESSO | ✅ |
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
| Espaço do brilho | `pt-8` na faixa do carrossel — o `overflow-y-hidden` não corta o glow/`box-shadow` acima dos vinis |
| Largura do item | 200px (disco + labels) |
| Loop | Lista duplicada (`[...genres, ...genres]`); junção medida em `children[itemCount].offsetLeft` (não `scrollWidth/2`, evita salto por `pr-8`); `ResizeObserver` recalibra ao carregar capas |
| Animação | `useInfiniteMarquee` — modo **auto**: `translate3d` contínuo; modo **manual** (arraste/touch/wheel): `scrollLeft` nativo com `touch-pan-x`; troca transparente entre modos após 5s |
| Direção | Direita → esquerda |
| Arrastar | Mouse e touch; inicia também sobre o disco. Só vira arraste após **>8px**; `setPointerCapture` só nesse momento, para o clique do vinil não ser engolido |
| Imagens | `draggable={false}` + `img-no-drag` — evita arrastar fantasma da capa |
| Pausa | Durante arraste, toque, rolagem manual ou wheel |
| Retomada | **5s** após soltar (`pointerup`) ou clique em gênero (`MARQUEE_RESUME_DELAY_MS`) |
| Clique | Disco, nome e contagem selecionam gênero e carregam artistas/bandas; pausam o carrossel por 5s. Após um arraste, o clique fantasma é ignorado (~400ms) |
| Centralizar seleção | Ao mudar `selectedGenre` (clique ou tecla), `scrollToItemIndex` centraliza o disco na faixa visível |
| Bordas | Fade lateral via `.genre-marquee-mask` (`index.css`) |

### Componentes envolvidos

- `src/components/jukebox/GenreCarousel.jsx` — track duplicado e scroll infinito
- `src/hooks/useInfiniteMarquee.js` — auto-scroll, drag e delay de retomada
- `src/components/jukebox/AlbumCard.jsx` — tamanho `xl` do vinil
- `src/index.css` — máscara de fade nas bordas

---

## Comportamento do vinil

| Estado | Animação |
|--------|----------|
| Selecionado | Anel primário em **ambas** as cópias; giro da capa só na primeira (`spinWhenSelected` no clone desligado — evita duplo giro/tremor) |
| Hover (não selecionado) | `animate-spin-vinyl-slow` |
| Sem `cover_url` | Gradiente colorido + ícone `Disc` |
| Sulcos do vinil | Anéis concêntricos + textura radial em `AlbumCard` (`VinylCard`) |

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

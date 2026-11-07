# Contrato 03 — Artistas e Bandas

## Componentes frontend

- `src/components/jukebox/AlbumBrowser.jsx`
- `src/components/jukebox/AlbumCard.jsx` (tamanho `md`)
- `src/hooks/useLibrary.js` → `loadAlbums()`

## Descrição

Grid fixo de **3 colunas** com cards quadrados de **artistas/bandas** dentro da categoria selecionada. Cada card é uma subpasta do gênero.

## Status

| Funcionalidade | Status |
|----------------|--------|
| Listagem filtrada por categoria | ✅ |
| Capa no card | ✅ |
| Contagem "N músicas" | ✅ |
| Seleção carrega faixas | ✅ |
| Marcação amarela no artista selecionado (anel `ring-primary`, igual SUCESSOS) | ✅ |
| Skeleton ao carregar (`AlbumGridSkeleton`) | ✅ |
| Cancelamento de requisição ao trocar categoria | ✅ |
| Cache em memória por SUCESSO (sem áudio) | ✅ |
| Persistência IndexedDB do catálogo | ✅ |

### Troca rápida de SUCESSOS

`useLibrary` cancela (`AbortController`) a requisição anterior de `albums` ao selecionar outro gênero. Respostas obsoletas são ignoradas (sequência + abort + `selectedGenrePathRef`), evitando flicker entre listas e liberando banda só para o último clique. `selectGenre` sempre dispara nova carga (`genreSelectionKey`), inclusive ao re-clicar o mesmo SUCESSO.

### Cache de listas (`libraryCache.js`)

- **Por gênero** (`genre.path`): artistas/bandas, faixas “flat” (quando o SUCESSO não tem subpastas) e álbum virtual selecionado.
- **Por álbum** (`album.path`): lista de faixas (somente metadados da API — `title`, `key`, `duration_seconds`, `cover_url`; **não** baixa `media_url`).
- Ao voltar a um SUCESSO já visitado, a grade aparece **na hora** a partir do cache; a API é consultada em **segundo plano** (`silent`) para atualizar se necessário.
- Cache de memória é hidratado do **IndexedDB** (`src/lib/idbCatalog.js`) no boot — sobrevive a F5.
- Cache é limpo ao trocar token/logout ou ao sincronizar biblioteca (`refreshLibrary`).

Último SUCESSO e artista ficam no `localStorage` (`jukebox_last_genre_path`, `jukebox_last_album_path`) para reabrir a mesma pasta.

---

## Endpoint

### `GET /api/v1/musicas/?prefix=Musicas/{Categoria}/`

Exemplo: `GET /api/v1/musicas/?prefix=Musicas/Pop/`

```
Authorization: Maquina <token>
```

#### Item em `folders[]` (artista/banda)

```json
{
  "name": "Beatles",
  "path": "Musicas/Pop/Beatles/",
  "subfolders_count": 0,
  "files_count": 64,
  "cover_url": "https://pub-xxxxx.r2.dev/Musicas/Pop/Beatles/cover.jpg"
}
```

---

## Mapeamento API → UI

| Campo API | UI |
|-----------|-----|
| `name` | Título do overlay no card |
| `cover_url` | Imagem de fundo do card |
| `countLabel` | Subtítulo: `"64 músicas"` (quando `subfolders_count === 0`) |
| `totals.current_folders` | Contagem no header `ARTISTAS / BANDAS (N)` (`albumsFolderTotal`); fallback `folders.length` |
| Lista na troca de SUCESSO | `folders[]` — **não** usar `files_list` (vem vazio fora da busca) |

### Header da seção

```
ARTISTAS / BANDAS (N)
```

---

## Parsing (`buildAlbumsStateFromApi` / `parseAlbumsPayload`)

1. Se `folders[]` tiver itens → grade de artistas.
2. Se `folders[]` vazio mas `totals.current_folders > 0` → grade vazia temporária (não cair no modo “flat” por `files_list` vazio).
3. Modo flat (faixas direto na categoria) só quando `current_folders === 0` e há faixas em `musicas` / `musicas_list` / `files`.

Helpers em `src/api/musicas.js`: `getFoldersFromResponse`, `getFolderTotalFromResponse`, `getNavigationTracksFromResponse`.

## Caso especial: faixas direto na categoria

Se `folders[]` estiver vazio, `totals.current_folders === 0`, mas houver faixas em `musicas` / `musicas_list` / `files`:

- O front cria um álbum sintético com o nome da categoria
- Carrega as faixas diretamente (sem grid de artistas)

---

## Seleção visual

O card selecionado (`selectedAlbum`) usa o mesmo padrão do vinil SUCESSOS: `ring-2 ring-primary`, `ring-offset-2` e brilho âmbar. O anel fica no botão externo (sem `overflow-hidden`) para não ser cortado. Foco por teclado sem seleção ativa usa anel ciano (`ring-secondary`).

## Ao selecionar artista

```javascript
selectAlbum(album) → loadAlbumTracks(album)
// GET /api/v1/musicas/?prefix={album.path}
```

Ver contrato 04.

## Navegação por teclado

| Ação | Comportamento |
|------|---------------|
| `esquerda` / `direita` | Navega entre artistas no grid |
| `cima` / `baixo` | Navega entre categorias no carrossel |

Configurável via teclas do backend (contrato 09).

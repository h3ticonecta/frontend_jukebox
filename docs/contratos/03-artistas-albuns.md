# Contrato 03 — Artistas e Bandas

## Componentes frontend

- `src/components/jukebox/AlbumBrowser.jsx`
- `src/components/jukebox/AlbumCard.jsx` (tamanho `md`)
- `src/hooks/useLibrary.js` → `loadAlbums()`

## Descrição

Grid 2–3 colunas com cards quadrados de **artistas/bandas** dentro da categoria selecionada. Cada card é uma subpasta do gênero.

## Status

| Funcionalidade | Status |
|----------------|--------|
| Listagem filtrada por categoria | ✅ |
| Capa no card | ✅ |
| Contagem "N músicas" | ✅ |
| Seleção carrega faixas | ✅ |

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
| `meta.total` equivalente | `({albums.length})` no header da seção |

### Header da seção

```
ARTISTAS / BANDAS (N)
```

---

## Caso especial: faixas direto na categoria

Se `folders[]` estiver vazio mas houver faixas em `musicas` / `musicas_list`:

- O front cria um álbum sintético com o nome da categoria
- Carrega as faixas diretamente (sem grid de artistas)

---

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

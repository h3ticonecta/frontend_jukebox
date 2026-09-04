# Contrato 10 — Capas de Pastas (pré-cálculo no sync)

## Status

| Item | Frontend | Backend |
|------|----------|---------|
| Usar `cover_url` da API | ✅ | Parcial |
| Capa herdada do primeiro artista | ⏳ Fallback gradiente | ⏳ Pendente |

## Descrição

Discos de SUCESSOS e cards de artistas exibem imagem no círculo interno / card. O front usa **apenas** `folder.cover_url` retornado pela API — **sem requisições extras**.

Quando uma categoria não tem capa própria, o backend deve resolver no **sync** e persistir no PostgreSQL.

---

## Regra de resolução (backend)

Para cada pasta do catálogo, calcular `cover_url` nesta ordem:

1. **Capa direta** — arquivos `cover`, `folder`, `album`, `artwork`, `front`, `capa`; senão primeira imagem da pasta.
2. **Herança** — se a pasta não tem capa e tem subpastas, usar `cover_url` do **primeiro subfolder** (primeiro artista/banda) que possua capa.
3. **Nenhuma** — `cover_url: null` (front exibe gradiente).

---

## Response esperada

```json
{
  "name": "Pop",
  "path": "Musicas/Pop/",
  "subfolders_count": 2,
  "files_count": 34,
  "cover_url": "https://pub-xxxxx.r2.dev/Musicas/Pop/Beatles/cover.jpg"
}
```

O front mapeia em `src/lib/library.js`:

```javascript
cover: folder.cover_url || folder.cover?.media_url || null
```

---

## Por que no sync e não no GET

| Abordagem | Problema |
|-----------|----------|
| Front buscar subpastas | N+1 requests — lento |
| GET calcular em tempo real | Latência em toda navegação |
| **Sync pré-calcular** | 1 request, rápido, consistente |

O front **removeu** a lógica `resolveFolderCover` que fazia requisições extras por pasta sem capa.

---

## Componentes afetados

| Componente | Comportamento sem `cover_url` |
|------------|-------------------------------|
| `GenreCarousel` (vinil) | Gradiente + ícone Disc |
| `AlbumBrowser` (card) | Gradiente + ícone Disc |

Quando o backend implementar, as capas aparecem automaticamente sem alteração no front.

---

## Checklist backend

- [ ] Coluna/campo `cover_url` resolvido no sync para todas as pastas
- [ ] Herança do primeiro filho para categorias sem capa
- [ ] `GET /musicas/` retorna `cover_url` já preenchido em `folders[]`
- [ ] Novo sync atualiza capas existentes

## Referência

Prompt enviado ao backend em mar/2026. Documentação canônica: `docs_para_front/contratos/06-musicas-listar.md`.

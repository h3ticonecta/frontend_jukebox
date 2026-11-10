# Contrato 08 — Convenções da API

## Base URL

| Ambiente | Configuração |
|----------|--------------|
| Desenvolvimento | `VITE_API_BASE_URL=https://backendjukebox-dev.up.railway.app` |
| Produção | `VITE_API_BASE_URL` no Railway |

Definido em `src/api/config.js` → `API_BASE_URL`.

---

## Autenticação

### App jukebox (este frontend)

```
Authorization: Maquina <token>
```

Token obtido em `POST /api/v1/maquinas/auth/`.

Implementado em `src/api/client.js` (`tokenType: 'Maquina'` por padrão).

### Admin Django (não usar no app jukebox)

```
Authorization: Token <jwt>
```

---

## Formato de erro

```json
{
  "error": {
    "message": "Descrição legível do erro."
  }
}
```

Ou campos Django REST padrão: `detail`, `non_field_errors`.

O client lança `ApiError` com `message`, `status` e `data`.

---

## Códigos HTTP

| Código | Uso no app |
|--------|------------|
| `200` | Sucesso |
| `201` | Criado (QR PIX) |
| `400` | Credenciais inválidas, body incorreto |
| `401` | Token inválido |
| `402` | Créditos insuficientes (futuro) |
| `404` | Recurso não encontrado |
| `500` | Erro interno |

---

## Endpoints utilizados pelo frontend

| Método | Endpoint | Contrato | Auth |
|--------|----------|----------|------|
| `POST` | `/api/v1/maquinas/auth/` | 01 | Público |
| `GET` | `/api/v1/maquinas/config/` | 01, 09 | Maquina |
| `GET` | `/api/v1/musicas/?prefix=...` | 02–04 | Maquina |
| `GET` | `/api/v1/maquinas/leitura/` | 06 | Maquina |
| `POST` | `/api/v1/maquinas/creditos/` | 06 | Maquina |
| `POST` | `/api/v1/maquinas/tocadas/` | 04 | Maquina |
| `GET` | `/api/v1/pagamentos/pix-creditos/opcoes/` | 14 | Maquina |
| `GET/POST/PATCH/DELETE` | `/api/v1/pagamentos/pix-creditos/` | 14 | Token admin |

### Máquinas (`/api/v1/maquinas/`) — escopo do app

| Token | Uso |
|-------|-----|
| **Maquina** `<token>` | App jukebox: biblioteca, config, créditos, tocadas, leitura |
| **Token** `<jwt>` admin | CRUD de máquinas no backoffice — **não** usado neste repo |

Eventos de crédito e música tocada: contratos [06](./06-creditos.md) e [04](./04-faixas.md). Cadastro/login/teclas: [01](./01-sessao-dispositivo.md) e [09](./09-teclas-maquina.md).

### Não utilizados (legado dos contratos antigos)

Estes endpoints **não existem** na integração atual:

- `GET /api/v1/session`
- `GET /api/v1/genres`
- `GET /api/v1/genres/{id}/artists`
- `GET /api/v1/albums/{id}/tracks`
- `GET /api/v1/queue`

A biblioteca é navegada exclusivamente via `GET /musicas/?prefix=...`.

### Corpo de `GET /musicas/` (navegação)

| Campo | Uso no front |
|-------|----------------|
| `folders[]` | SUCESSOS (raiz) e **ARTISTAS / BANDAS** ao trocar categoria |
| `totals.current_folders` | Contagem `(N)` no header de artistas (`albumsFolderTotal`) |
| `musicas` / `files` | Faixas no prefixo do artista ou categoria “flat” |
| `files_list` | **Somente busca** (`?q=`); vazio de propósito na navegação normal |

---

## CORS

O backend deve incluir a URL do frontend em `CORS_ALLOWED_ORIGINS`.

Áudio/imagem do R2 (`media_url`, `cover_url`) é domínio diferente; `<audio src>` e `<img src>` funcionam sem CORS extra no fetch.

---

## Variáveis de ambiente (frontend)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_API_BASE_URL` | Sim | URL base do backend Django |

---

## Versionamento

- Prefixo atual: `/api/v1/`
- Contratos deste repo: `docs/contratos/`

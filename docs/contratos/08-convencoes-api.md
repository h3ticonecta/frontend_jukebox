# Contrato 08 — Convenções da API

## Base URL

| Ambiente | URL |
|----------|-----|
| Desenvolvimento | `http://localhost:8000/api/v1` |
| Produção | `https://api.jukebox.example.com/api/v1` |

No frontend, em desenvolvimento o Vite faz proxy de `/api` para `localhost:8000` (ver `vite.config.js`).

---

## Formato de resposta padrão

### Sucesso com lista

```json
{
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

### Sucesso com objeto único

```json
{
  "data": { ... }
}
```

### Erro

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição legível do erro.",
    "details": {}
  }
}
```

---

## Headers padrão

### Request

| Header | Obrigatório | Descrição |
|--------|-------------|-----------|
| `Content-Type` | Sim (POST/PUT) | `application/json` |
| `Accept` | Não | `application/json` |
| `X-Device-Id` | Sim* | Identificador do terminal jukebox |
| `Authorization` | Condicional | `Bearer {token}` após registro |

### Response

| Header | Descrição |
|--------|-----------|
| `Content-Type` | `application/json; charset=utf-8` |

---

## Códigos HTTP

| Código | Uso |
|--------|-----|
| `200` | Sucesso (GET, PUT) |
| `201` | Recurso criado (POST) |
| `204` | Sucesso sem corpo (DELETE) |
| `400` | Request inválido |
| `401` | Não autenticado |
| `402` | Créditos insuficientes |
| `403` | Sem permissão |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex.: faixa indisponível) |
| `422` | Validação falhou |
| `500` | Erro interno |

---

## Paginação

Query params padrão:

| Param | Tipo | Default |
|-------|------|---------|
| `page` | `integer` | `1` |
| `per_page` | `integer` | `20` |

Response `meta`:

```json
{
  "total": 189,
  "page": 1,
  "per_page": 20,
  "total_pages": 10
}
```

---

## Identificadores

- IDs devem ser **strings** (slugs ou UUIDs).
- Preferir slugs legíveis para entidades de catálogo (`forro`, `14bis`, `as-20-mais`).
- Preferir UUIDs para entidades transacionais (`queue-item`, transações de crédito).

---

## Datas

- Formato: **ISO 8601** em UTC (`2026-09-01T19:30:00Z`).
- Timezone de exibição: responsabilidade do frontend.

---

## CORS (produção)

O backend Django deve permitir:

```
Access-Control-Allow-Origin: https://jukebox.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Device-Id
```

Em desenvolvimento, permitir `http://localhost:5173`.

---

## Versionamento

- Prefixo atual: `/api/v1/`
- Mudanças breaking devem incrementar para `/api/v2/`.
- Campos novos em responses são retrocompatíveis.

---

## Resumo de endpoints

| Método | Endpoint | Contrato |
|--------|----------|----------|
| `GET` | `/api/v1/session` | 01 |
| `POST` | `/api/v1/session/register` | 01 |
| `GET` | `/api/v1/genres` | 02 |
| `GET` | `/api/v1/genres/{id}/artists` | 03 |
| `GET` | `/api/v1/albums/{id}/tracks` | 04 |
| `GET` | `/api/v1/tracks/{id}` | 04 |
| `GET` | `/api/v1/queue` | 05 |
| `POST` | `/api/v1/queue` | 05 |
| `DELETE` | `/api/v1/queue/{id}` | 05 |
| `GET` | `/api/v1/credits` | 06 |
| `POST` | `/api/v1/credits/recharge` | 06 |

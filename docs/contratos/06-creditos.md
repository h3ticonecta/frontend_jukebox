# Contrato 06 — Créditos

## Componente frontend

- `src/components/StatusBar.jsx`
- Estado: `src/App.jsx` → `credits` (valor fixo `7`)

## Descrição

Créditos representam a moeda do jukebox para adicionar músicas à fila. Exibidos no rodapé da tela.

## Status atual no frontend

- ✅ Exibição de créditos no rodapé
- ❌ Valor fixo, sem integração
- ❌ Sem fluxo de recarga

---

## Endpoint: consultar saldo de créditos

### `GET /api/v1/credits`

#### Headers

| Header | Descrição |
|--------|-----------|
| `X-Device-Id` | Identificador do terminal |

#### Response `200 OK`

```json
{
  "data": {
    "balance": 7,
    "cost_per_song": 1,
    "currency_label": "créditos"
  }
}
```

#### Schema

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `balance` | `integer` | Saldo atual |
| `cost_per_song` | `integer` | Custo por música adicionada à fila |
| `currency_label` | `string` | Label exibido na UI ("créditos") |

#### Mapeamento na UI

| Campo API | Elemento UI |
|-----------|-------------|
| `balance` | "**7** créditos" no rodapé |

---

## Endpoint: recarregar créditos

### `POST /api/v1/credits/recharge`

Fluxo futuro (pagamento, código promocional, etc.).

#### Request body

```json
{
  "device_id": "jb-terminal-001",
  "amount": 10,
  "payment_method": "pix",
  "payment_reference": "pix-tx-abc123"
}
```

#### Response `200 OK`

```json
{
  "data": {
    "balance": 17,
    "recharged": 10
  }
}
```

---

## Endpoint: histórico de créditos

### `GET /api/v1/credits/history`

#### Response `200 OK`

```json
{
  "data": [
    {
      "id": "tx-001",
      "type": "debit",
      "amount": -1,
      "description": "Planeta Sonho - 14 Bis",
      "created_at": "2026-09-01T19:30:00Z"
    },
    {
      "id": "tx-002",
      "type": "credit",
      "amount": 10,
      "description": "Recarga via PIX",
      "created_at": "2026-09-01T18:00:00Z"
    }
  ]
}
```

---

## Regras de negócio

1. Saldo nunca pode ser negativo.
2. Ao adicionar música à fila, debitar `cost_per_song` créditos (ver contrato 05).
3. Se `balance < cost_per_song`, bloquear adição à fila.
4. O saldo também é retornado em `POST /api/v1/queue` via `meta.credits_remaining`.

## Integração sugerida

O frontend pode obter créditos de duas formas:

1. **Dedicado:** `GET /api/v1/credits` ao carregar a tela.
2. **Embutido:** campo `credits` em `GET /api/v1/session` (contrato 01).

Recomendação: usar o contrato 01 para carga inicial e atualizar via respostas da fila.

## Pendências para alinhamento

- [ ] Créditos são por dispositivo ou por estabelecimento?
- [ ] Existe tempo de expiração dos créditos?
- [ ] Qual o fluxo de pagamento/recarga?

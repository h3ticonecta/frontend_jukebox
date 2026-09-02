# Contrato 05 — Fila de Espera

## Componente frontend

- `src/components/QueuePanel.jsx`
- `src/components/StatusBar.jsx` (contador "em espera")
- Lógica: `src/App.jsx` → `handleAddToQueue`

## Descrição

Gerencia a fila de músicas aguardando reprodução no jukebox. Hoje a fila existe apenas no estado React e é perdida ao recarregar a página.

## Status atual no frontend

- ✅ UI da fila implementada (vazia e com itens)
- ✅ Adicionar música localmente via botão play
- ❌ Fila não persiste
- ❌ Não sincroniza com outros terminais
- ❌ Sem validação de créditos ao adicionar

---

## Endpoint: consultar fila

### `GET /api/v1/queue`

Retorna a fila atual do dispositivo/estabelecimento.

#### Headers

| Header | Descrição |
|--------|-----------|
| `X-Device-Id` | Identificador do terminal |

#### Response `200 OK`

```json
{
  "data": [
    {
      "id": "queue-item-001",
      "position": 1,
      "track_id": "track-001",
      "title": "Planeta Sonho",
      "artist_name": "14 Bis",
      "album_name": "As 20 Mais",
      "added_at": "2026-09-01T19:30:00Z",
      "status": "waiting"
    }
  ],
  "meta": {
    "total": 1,
    "currently_playing": null
  }
}
```

#### Schema: `QueueItem`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | `string` | Sim | ID do item na fila |
| `position` | `integer` | Sim | Posição na fila (1-based) |
| `track_id` | `string` | Sim | ID da faixa |
| `title` | `string` | Sim | Título da música |
| `artist_name` | `string` | Sim | Nome do artista |
| `album_name` | `string` | Não | Nome do álbum |
| `added_at` | `string` (ISO 8601) | Sim | Data/hora de inclusão |
| `status` | `string` | Sim | `waiting` \| `playing` \| `played` \| `cancelled` |

#### Mapeamento na UI

| Campo API | Elemento UI |
|-----------|-------------|
| `position` | Número à esquerda do item |
| `title` | Título na fila |
| `artist_name` | Subtítulo na fila |
| `meta.total` | Badge no header e "X em espera" no rodapé |

---

## Endpoint: adicionar música à fila

### `POST /api/v1/queue`

Acionado ao clicar no botão play de uma faixa.

#### Request body

```json
{
  "track_id": "track-001",
  "device_id": "jb-terminal-001"
}
```

#### Response `201 Created`

```json
{
  "data": {
    "id": "queue-item-001",
    "position": 3,
    "track_id": "track-001",
    "title": "Planeta Sonho",
    "artist_name": "14 Bis",
    "album_name": "As 20 Mais",
    "added_at": "2026-09-01T19:30:00Z",
    "status": "waiting"
  },
  "meta": {
    "credits_remaining": 6,
    "queue_total": 3
  }
}
```

#### Response `402 Payment Required` (sem créditos)

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Créditos insuficientes para adicionar música à fila."
  }
}
```

#### Response `409 Conflict` (faixa indisponível)

```json
{
  "error": {
    "code": "TRACK_UNAVAILABLE",
    "message": "Esta faixa não está disponível no momento."
  }
}
```

---

## Endpoint: remover item da fila

### `DELETE /api/v1/queue/{queue_item_id}`

Permite cancelar uma música aguardando (funcionalidade futura no frontend).

#### Response `204 No Content`

---

## Endpoint: limpar fila

### `DELETE /api/v1/queue`

Remove todos os itens com status `waiting`.

#### Response `204 No Content`

---

## Comportamento esperado no frontend (após integração)

```javascript
// Substituir handleAddToQueue atual
async function handleAddToQueue(track) {
  const response = await fetch('/api/v1/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
    body: JSON.stringify({ track_id: track.id, device_id: deviceId }),
  });

  if (response.status === 402) {
    // Exibir erro de créditos insuficientes
    return;
  }

  const { data, meta } = await response.json();
  setQueue(await fetchQueue());
  setCredits(meta.credits_remaining);
}
```

## Regras de negócio

1. Adicionar uma música consome **1 crédito** (confirmar com produto).
2. A fila é por estabelecimento ou por dispositivo — **definir com backend**.
3. Música em reprodução (`playing`) não conta como "em espera".
4. O frontend deve atualizar a fila periodicamente ou via WebSocket (futuro).
5. Posição na fila é recalculada ao remover itens.

## Estado vazio

Quando `data` é array vazio, exibir:

> "Nenhuma música na fila"

(conforme já implementado em `QueuePanel.jsx`)

## Pendências para alinhamento

- [ ] Fila é global do bar ou por terminal?
- [ ] Quantos créditos custa cada música?
- [ ] Polling ou WebSocket para atualização em tempo real?
- [ ] Usuário pode remover músicas da fila?

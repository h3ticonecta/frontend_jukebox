# Contrato 06 — Créditos

## Componentes frontend

- `src/components/jukebox/PlayerBar.jsx` — saldo + botão inserir
- `src/components/shared/CreditToast.jsx` — confirmação "+1 crédito inserido"
- `src/App.jsx` — `handleInsertCredit()`
- `src/lib/storage.js` — saldo em `localStorage`

## Descrição

Créditos são a moeda para tocar músicas. O backend **registra inserções**; o saldo exibido é **gerenciado no frontend** (`localStorage`).

## Status

| Funcionalidade | Status |
|----------------|--------|
| Exibição no rodapé | ✅ |
| Inserir 1 crédito (botão) | ✅ |
| Inserir via tecla configurada | ✅ |
| Toast de confirmação | ✅ |
| Débito ao tocar (1 crédito) | ✅ |
| Débito ao adicionar à fila (1 crédito por item) | ✅ |
| `GET` saldo no backend | ❌ Não existe |

---

## Endpoint: registrar crédito

### `POST /api/v1/maquinas/creditos/`

```
Authorization: Maquina <token>
```

#### Request

```json
{
  "valor": 1.00,
  "origem": "moeda"
}
```

#### Response `200 OK`

Registro criado no backend. O front incrementa o saldo local:

```javascript
addCredits(1)  // localStorage: jukebox_credits_balance
showCreditToast()  // "+1 crédito inserido"
```

---

## Fluxos de inserção

| Origem | Comportamento |
|--------|---------------|
| Clique no ícone de moedas (`PlayerBar`) | Insere R$ 1,00 (1 crédito) direto |
| Tecla `credito` (padrão K) | Mesmo fluxo |
| Modal de valor | ❌ Removido — sempre 1 crédito |

---

## Débito ao tocar

```javascript
// src/api/config.js
CREDITS_PER_SONG = 1

handlePlay(track)
  → botão sempre clicável; if (credits < 1) mensagem "Créditos insuficientes" no header
  → POST /maquinas/tocadas/
  → deductCredits(1)

handleAddToQueue(track)
  → botão sempre clicável; if (credits < 1) mensagem "Créditos insuficientes"
  → deductCredits(1) ao adicionar (crédito já reservado — não debita de novo ao tocar da fila)
```

---

## Persistência local

| Chave | Conteúdo |
|-------|----------|
| `jukebox_credits_balance` | Saldo numérico |

Funções: `getCreditsBalance()`, `addCredits()`, `deductCredits()` em `src/lib/storage.js`.

---

## Mapeamento na UI

| Estado | Elemento |
|--------|----------|
| `credits` | Número ao lado do ícone `Coins` no rodapé |
| Toast visível | Canto inferior esquerdo, 3 segundos |

---

## Leitura de faturamento

- `src/components/jukebox/BillingModal.jsx`
- `src/components/jukebox/PeriodCalendar.jsx`
- `src/api/maquinas.js` → `fetchLeitura()`
- Botão **Leitura** no `JukeboxHeader`

### `GET /api/v1/maquinas/leitura/?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD`

```
Authorization: Maquina <token>
```

Não enviar `maquina_id` — o backend filtra pela máquina do token.

| Query | Uso |
|-------|-----|
| `data_inicio` + `data_fim` | Presets e período personalizado (datas **inclusive**) |
| Omitir as duas | **Todo período** |

Aliases aceitos pelo backend: `inicio` / `fim` — o front envia **`data_inicio` / `data_fim`**.

#### Response `200`

```json
{
  "maquina_id": 1,
  "nome_jukebox": "Bar Central",
  "data_inicio": "2026-09-10",
  "data_fim": "2026-09-14",
  "faturamento": "45.00",
  "faturamento_total": "45.00",
  "valor": "45.00",
  "creditos": 9,
  "total_creditos": 9,
  "transacoes": 9,
  "count": 9,
  "tocadas": 32
}
```

| UI | Campo |
|----|--------|
| Faturamento (R$) | `faturamento` / `faturamento_total` / `valor_total` / `valor` (`parseFloat`) |
| Créditos | `creditos` / `total_creditos` / `creditos_inseridos` |
| Transações | `transacoes` / `total_transacoes` / `count` / `quantidade` (fallback: `creditos`) |
| Nome da máquina | `nome_jukebox` |
| Músicas tocadas (informativo) | `tocadas` — **não** entra no faturamento |

Faturamento = soma em reais dos `POST /creditos/` no período. Créditos/transações = quantidade de inserções (1 POST = 1).

`401` `{ "error": { "code": "UNAUTHORIZED", "message": "..." } }` — modal exibe a mensagem.

Se a rede falhar (exceto 401), fallback local `jukebox_billing_events`.

---

## Pendências

- [ ] Endpoint `GET` de saldo sincronizado com backend
- [ ] Valores de crédito configuráveis por máquina
- [x] Fluxo LEITURA / faturamento (`GET /api/v1/maquinas/leitura/`)

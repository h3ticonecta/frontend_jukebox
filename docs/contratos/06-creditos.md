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
  → if (credits < 1) erro
  → POST /maquinas/tocadas/
  → deductCredits(1)
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
- Botão **Leitura** no `JukeboxHeader`

### `GET /api/v1/maquinas/leitura/?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD`

```
Authorization: Maquina <token>
```

Campos aceitos: `faturamento` / `total_faturamento`, `creditos` / `total_creditos`, `transacoes` / `count`.

Se a API não responder, o modal soma o histórico local `jukebox_billing_events` (cada inserção de crédito).

Presets: Hoje, Esta semana, Este mês, Este ano, Todo período. Período personalizado abre calendário de **dois meses** (intervalo: 1º toque = início, 2º = fim).

---

## Pendências

- [ ] Endpoint `GET` de saldo sincronizado com backend
- [ ] Valores de crédito configuráveis por máquina
- [x] Fluxo LEITURA / faturamento (UI; API `GET /leitura/` se o backend responder)

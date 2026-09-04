# Contrato 09 — Teclas da Máquina

## Componentes frontend

- `src/components/jukebox/KeysPanel.jsx` — painel read-only TECLAS
- `src/components/jukebox/JukeboxHeader.jsx` — botão ícone teclado
- `src/hooks/useKeyboardShortcuts.js` — listener global `keydown`
- `src/lib/keyboard.js` — normalização e mapeamento
- `src/context/AuthContext.jsx` — persistência de `teclas`

## Descrição

Atalhos físicos do jukebox são configurados **somente no admin Django**. O app lê, exibe e reage — **não permite editar**.

## Status

| Funcionalidade | Status |
|----------------|--------|
| Painel TECLAS (label + tecla) | ✅ |
| Dados no login | ✅ |
| Refresh via `GET /maquinas/config/` | ✅ |
| Listener global | ✅ |
| Tecla crédito → inserir 1 crédito | ✅ |

---

## Origem dos dados

### No login

`POST /api/v1/maquinas/auth/` → campo `teclas`:

```json
[
  { "acao": "cima", "label": "Cima", "tecla": "Q" },
  { "acao": "baixo", "label": "Baixo", "tecla": "W" },
  { "acao": "esquerda", "label": "Esquerda", "tecla": "E" },
  { "acao": "direita", "label": "Direita", "tecla": "R" },
  { "acao": "credito", "label": "Crédito", "tecla": "K" },
  { "acao": "hits", "label": "HITS", "tecla": "I" },
  { "acao": "fila", "label": "Fila", "tecla": "F" },
  { "acao": "pular", "label": "Pular", "tecla": "P" },
  { "acao": "vol_mais", "label": "Vol+", "tecla": "PgUp" },
  { "acao": "vol_menos", "label": "Vol-", "tecla": "PgDn" },
  { "acao": "cancelar", "label": "Cancelar", "tecla": "Enter" }
]
```

### Atualizar sem relogar

`GET /api/v1/maquinas/config/` — chamado ao abrir o painel TECLAS e no mount do app.

---

## UI do painel TECLAS

| Esquerda | Direita |
|----------|---------|
| `label` (Cima, Crédito…) | `tecla` (Q, K, PgUp, ↵) |

Ordenação fixa em `TECLAS_DISPLAY_ORDER` (`src/lib/keyboard.js`).

Valores especiais de exibição:

| `tecla` API | Exibido |
|-------------|---------|
| `Enter` | ↵ |
| `PgUp` | PgUp |
| `PgDn` | PgDn |

---

## Mapeamento `acao` → comportamento

| `acao` | Comportamento no front |
|--------|------------------------|
| `cima` | Categoria anterior (carrossel) |
| `baixo` | Próxima categoria |
| `esquerda` | Artista anterior |
| `direita` | Próximo artista |
| `credito` | `handleInsertCredit()` → POST créditos + toast |
| `hits` | Scroll até seção SUCESSOS |
| `fila` | Destaca painel da fila (2s) |
| `pular` | Pula faixa e toca próxima da fila |
| `vol_mais` | Volume +10% |
| `vol_menos` | Volume −10% |
| `cancelar` | Fecha painéis e limpa erros |

---

## Normalização de teclas

```javascript
// src/lib/keyboard.js
"Enter"  → event.key === "Enter"
"PgUp"   → event.key === "PageUp"
"PgDn"   → event.key === "PageDown"
"Q"      → case insensitive
```

Teclas são ignoradas quando o foco está em `input`, `textarea` ou `select`.

---

## Código de referência

```javascript
useKeyboardShortcuts({ teclas, onAction: handleKeyboardAction });
```

Implementado em `src/App.jsx`.

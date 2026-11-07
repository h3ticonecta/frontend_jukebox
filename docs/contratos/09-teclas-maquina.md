# Contrato 09 — Teclas da Máquina

> **Backend:** ações e teclas padrão definidas no contrato **`09-maquinas`** (`teclas[]` no login e em `GET /config/`). Ver também [01-sessao-dispositivo.md](./01-sessao-dispositivo.md).

## Componentes frontend

- `src/components/jukebox/KeysPanel.jsx` — painel read-only TECLAS
- `src/components/jukebox/JukeboxHeader.jsx` — botão ícone teclado
- `src/hooks/useKeyboardShortcuts.js` — listener global `keydown`
- `src/hooks/useJukeboxKeyboard.js` — zonas de foco e ativação pela tecla fila
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
| Navegação estilo TAB (foco visual) | ✅ |
| Tecla crédito → inserir 1 crédito | ✅ |
| Tecla `tocar_cd` (Tocar CD) | ✅ |
| Tecla `vol` (botão único de volume) | ✅ |
| `comportamento_volume` persistido no login/config | ✅ |

---

## Ações padrão (backend)

| `acao` | Label padrão | Tecla padrão |
|--------|--------------|--------------|
| `cima` | Cima | `Q` |
| `baixo` | Baixo | `W` |
| `esquerda` | Esquerda | `E` |
| `direita` | Direita | `R` |
| `credito` | Crédito | `K` |
| `hits` | HITS | `I` |
| `fila` | Fila | `F` |
| `pular` | Pular | `P` |
| `tocar_cd` | Tocar CD | `C` |
| `vol` | Vol | `V` |
| `cancelar` | Cancelar | `Enter` |

`vol_mais` / `vol_menos` são **legado** — migram para `vol` (prioridade: tecla de `vol`, senão `vol_mais`, senão `vol_menos`). O admin remapeia só `tecla`; `label` vem do backend.

### `comportamento_volume` (API)

Login e `GET /config/` incluem:

```json
{
  "comportamento_volume": {
    "modo": "unico_botao",
    "clique_unico": "aumentar",
    "cliques_repetidos": "diminuir",
    "pressionar_segurar": "diminuir_continuo"
  }
}
```

| Gestão | Efeito no app (`useVolumeShortcuts`) |
|--------|--------------------------------------|
| Um clique na tecla `vol` | +10% ao soltar (após debounce ~400 ms) |
| Cliques em sequência (ou tecla repetida pelo OS) | −10% por sequência |
| Manter pressionado | −10% a cada ~140 ms (início ~520 ms) |

O front usa a **tecla** de `vol` (ou legado); o JSON só documenta o comportamento esperado.

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
  { "acao": "tocar_cd", "label": "Tocar CD", "tecla": "C" },
  { "acao": "vol", "label": "Vol", "tecla": "V" },
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
| `cima` | Sobe no fluxo vertical: faixa anterior, linha anterior de artistas (mesma coluna) ou, na 1ª linha de artistas, volta ao SUCESSO focado |
| `baixo` | Desce no fluxo vertical: do SUCESSO para o 1º artista; entre linhas do grid (mesma coluna); da última linha de artistas para a lista de músicas |
| `esquerda` | No **carrossel SUCESSOS**: gênero anterior (loop infinito). No **grid de artistas**: célula à esquerda; no início da linha, última célula da linha de cima; no 1º artista, volta ao SUCESSO |
| `direita` | No **carrossel SUCESSOS**: próximo gênero (loop infinito). No **grid de artistas**: célula à direita; no fim da linha, primeira célula da linha de baixo |
| `credito` | `handleInsertCredit()` → POST créditos + toast |
| `hits` | Foco na seção SUCESSOS + scroll |
| `fila` | **Ativa** o item focado: destaca fila (2s) e, se o foco está em uma faixa, adiciona à fila local |
| `pular` | Pula faixa e toca próxima da fila |
| `tocar_cd` | **Zona `genres`:** foco no 1º artista. **Zona `albums`:** só desce o foco para a lista de músicas (não toca). **Zona `tracks`:** toca **somente** a faixa focada (ou a 1ª) — não enfileira o álbum inteiro; use `fila` para cada música escolhida |
| `vol` | Um clique +10%; cliques repetidos / segurar −10% (ver `useVolumeShortcuts`) |
| `cancelar` | Fecha painéis e limpa erros |

### Zonas de foco (`useJukeboxKeyboard`)

| Zona | Destaque visual | Teclas que movem |
|------|-----------------|------------------|
| `genres` | Moldura laranja em volta de **toda a faixa** do carrossel (`.genre-carousel-focus`) + anel ciano no vinil do gênero focado (cópia do meio) | `esquerda` / `direita` (loop no carrossel); `baixo` → 1º artista |
| `albums` | Anel ciano no card do artista | `esquerda` / `direita` (grid 3 col., quebra de linha); `cima` / `baixo` (mesma coluna) |
| `tracks` | Linha ciano na lista de músicas | `cima` / `baixo`; `cima` no topo volta aos artistas |

As setas **não disparam clique** (não tocam música). Toque/mouse continuam com o comportamento anterior. Somente `fila` confirma a faixa focada (adiciona à fila).

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
const keyboard = useJukeboxKeyboard({ library, onAddToQueue, ... });
useKeyboardShortcuts({ teclas, onAction: keyboard.handleKeyboardAction });
```

Implementado em `src/App.jsx` + `src/hooks/useJukeboxKeyboard.js`.

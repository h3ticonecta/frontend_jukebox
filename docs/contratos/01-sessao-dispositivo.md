# Contrato 01 — Autenticação da Máquina

> **Alinhamento backend:** contrato `09-maquinas` (`/api/v1/maquinas/`). O app jukebox usa apenas **auth**, **config**, **créditos**, **tocadas** e **leitura** — não o CRUD admin.

## Componentes frontend

- `src/components/auth/MachineLoginCard.jsx` — tela de login
- `src/context/AuthContext.jsx` — estado de sessão
- `src/components/jukebox/JukeboxHeader.jsx` — badge com nome da jukebox, download (cache) e sync
- `src/lib/storage.js` — persistência no `localStorage`
- `src/api/auth.js` — `POST /maquinas/auth/`
- `src/api/maquinas.js` — `GET /maquinas/config/`, créditos, tocadas, leitura

## Descrição

Cada jukebox física autentica com **usuário e senha** cadastrados no admin Django. O backend devolve um **token próprio da máquina** (diferente do token admin `POST /api/v1/auth/token/`).

Header nas rotas do app:

```
Authorization: Maquina <token>
```

A senha **nunca** é persistida no dispositivo — só no formulário de login.

## Status

| Elemento | Status |
|----------|--------|
| Tela de login | ✅ |
| Persistência token + dados da máquina | ✅ |
| Badge com `nome_jukebox` | ✅ |
| Logout | ✅ |
| Refresh `GET /maquinas/config/` (teclas + nome) | ✅ |
| Erros `INVALID_CREDENTIALS` / `MACHINE_INACTIVE` | ✅ |

---

## `POST /api/v1/maquinas/auth/` (público)

### Request

```json
{
  "usuario": "jukebox01",
  "senha": "senha-da-maquina"
}
```

### Response `200 OK`

```json
{
  "id": 1,
  "nome_jukebox": "Bar Central",
  "usuario": "jukebox01",
  "token": "a1b2c3d4e5f6...",
  "teclas": [
    { "acao": "cima", "label": "Cima", "tecla": "Q" },
    { "acao": "credito", "label": "Crédito", "tecla": "K" },
    { "acao": "vol", "label": "Vol", "tecla": "V" }
  ],
  "comportamento_volume": {
    "modo": "unico_botao",
    "clique_unico": "aumentar",
    "cliques_repetidos": "diminuir",
    "pressionar_segurar": "diminuir_continuo"
  }
}
```

O front grava `id`, `nome_jukebox`, `usuario`, `token`, `teclas` e `comportamento_volume` (`setMaquinaSession`).

### Erros

| HTTP | Código API | Mensagem no app |
|------|------------|-----------------|
| `400` | `INVALID_CREDENTIALS` | Usuário ou senha inválidos |
| `403` | `MACHINE_INACTIVE` | Máquina inativa. Contate o administrador |
| — | `error.message` / `detail` | Texto do backend ou fallback genérico |

Implementado em `mapLoginErrorMessage()` (`AuthContext.jsx`).

---

## `GET /api/v1/maquinas/config/`

```
Authorization: Maquina <token>
```

### Response `200 OK`

```json
{
  "id": 1,
  "nome_jukebox": "Bar Central",
  "usuario": "jukebox01",
  "teclas": [
    { "acao": "credito", "label": "Crédito", "tecla": "K" },
    { "acao": "vol", "label": "Vol", "tecla": "V" }
  ],
  "comportamento_volume": { "...": "..." }
}
```

Chamado ao montar o app (se há token) e ao abrir o painel TECLAS (`refreshConfig`). Atualiza `teclas`, `comportamento_volume` e, se presentes, `nome_jukebox` / `usuario` / `id` no estado e no `localStorage`.

**Somente o admin** altera teclas (Django ou API com token admin); o app **exibe** e **reage**.

---

## Persistência no dispositivo

| Campo | Chave localStorage |
|-------|-------------------|
| `token` | `jukebox_maquina_token` |
| `id`, `nome_jukebox`, `usuario`, `teclas`, `comportamento_volume` | `jukebox_maquina_info` |
| Último SUCESSO (`genre.path`) | `jukebox_last_genre_path` |
| Último artista/banda (`album.path`) | `jukebox_last_album_path` |
| `needs_sync` da última resposta | `jukebox_needs_sync` |
| Timestamp da última consulta à biblioteca | `jukebox_library_fetched_at` |
| Volume | `jukebox_volume_percent` |
| Créditos locais | `jukebox_credits_balance` |

Logout (`clearMaquinaSession`) remove token, info, último foco e flags de sync. O catálogo IndexedDB também é apagado (`idbClearCatalog`).

---

## Mapeamento na UI

| Campo API | Elemento UI |
|-----------|-------------|
| `nome_jukebox` | Badge verde no header |
| Token ausente | Tela `MachineLoginCard` |
| `teclas` | Painel TECLAS + listener global (contrato 09) |

---

## CRUD admin (não usado neste frontend)

| Método | Path | Auth |
|--------|------|------|
| `GET/POST` | `/api/v1/maquinas/` | Token **admin** |
| `GET/PATCH/DELETE` | `/api/v1/maquinas/{id}/` | Token **admin** |

Cadastro e edição de teclas: Django Admin → **Máquinas** → seção **Teclas**.

---

## Código de referência

```javascript
// src/api/auth.js
loginMaquina(usuario, senha) → POST /api/v1/maquinas/auth/

// src/api/maquinas.js
fetchMaquinaConfig(token) → GET /api/v1/maquinas/config/

// src/api/client.js
Authorization: Maquina <token>
```

## Pendências

- [x] Botão LEITURA — modal de faturamento (`BillingModal`)
- [ ] Renovação automática de token (hoje estático até admin alterar senha)

## Relacionados

- Teclas e `acao` → [09-teclas-maquina.md](./09-teclas-maquina.md)
- Créditos / tocadas → [06-creditos.md](./06-creditos.md), [04-faixas.md](./04-faixas.md)

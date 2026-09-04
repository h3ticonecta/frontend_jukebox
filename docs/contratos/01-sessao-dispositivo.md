# Contrato 01 — Autenticação da Máquina

## Componentes frontend

- `src/components/auth/MachineLoginCard.jsx` — tela de login
- `src/context/AuthContext.jsx` — estado de sessão
- `src/components/jukebox/JukeboxHeader.jsx` — badge com nome da jukebox
- `src/lib/storage.js` — persistência no `localStorage`

## Descrição

Cada jukebox físico autentica com **usuário e senha** configurados no admin Django. O backend retorna um token estático usado em todas as requisições subsequentes.

> **Não usar** `Authorization: Token` (esse é só para admin Django).

## Status

| Elemento | Status |
|----------|--------|
| Tela de login | ✅ |
| Persistência token + dados da máquina | ✅ |
| Badge "Registrado" com `nome_jukebox` | ✅ |
| Logout | ✅ |
| Refresh de config (`GET /maquinas/config/`) | ✅ |

---

## Endpoint: login

### `POST /api/v1/maquinas/auth/`

Público (sem header de auth).

#### Request

```json
{
  "usuario": "jukebox01",
  "senha": "senha123"
}
```

#### Response `200 OK`

```json
{
  "id": 1,
  "nome_jukebox": "Bar Central",
  "usuario": "jukebox01",
  "token": "abc123...",
  "teclas": [
    { "acao": "cima", "label": "Cima", "tecla": "Q" },
    { "acao": "credito", "label": "Crédito", "tecla": "K" }
  ]
}
```

#### Persistência no dispositivo

| Campo | Chave localStorage |
|-------|-------------------|
| `token` | `jukebox_maquina_token` |
| `id`, `nome_jukebox`, `usuario`, `teclas` | `jukebox_maquina_info` |

---

## Endpoint: configuração (sem relogar)

### `GET /api/v1/maquinas/config/`

#### Headers

```
Authorization: Maquina <token>
```

#### Response `200 OK`

```json
{
  "teclas": [ ... ]
}
```

Chamado ao montar o app (se já autenticado) e ao abrir o painel TECLAS.

---

## Mapeamento na UI

| Campo API | Elemento UI |
|-----------|-------------|
| `nome_jukebox` | Badge verde no header |
| Token ausente | Tela `MachineLoginCard` |
| `teclas` | Painel TECLAS + listener global (contrato 09) |

---

## Código de referência

```javascript
// src/api/auth.js
loginMaquina(usuario, senha) → POST /api/v1/maquinas/auth/

// src/api/client.js — todas as requisições autenticadas
Authorization: Maquina <token>
```

## Erros

| Código | Situação |
|--------|----------|
| `400` | Credenciais inválidas |
| `401` | Token expirado/inválido (em rotas protegidas) |

## Pendências

- [ ] Botão LEITURA — endpoint de faturamento não definido
- [ ] Renovação automática de token (hoje é estático)

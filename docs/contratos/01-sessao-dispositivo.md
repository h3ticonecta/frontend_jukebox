# Contrato 01 — Sessão e Status do Dispositivo

## Componente frontend

- `src/components/Header.jsx`
- `src/components/StatusBar.jsx` (parcialmente)

## Descrição

O jukebox opera em um **dispositivo físico ou terminal** que precisa se identificar no sistema. O header exibe o status de registro e o rodapé exibe créditos disponíveis.

## Status atual no frontend

| Elemento | Valor mockado | Integrado com API |
|----------|---------------|-------------------|
| Badge "Não registrado" | Texto fixo | ❌ |
| Botão LEITURA | Sem ação | ❌ |
| Botão mensagens | Sem ação | ❌ |
| Botão atualizar | Sem ação | ❌ |
| Créditos | `7` fixo em `App.jsx` | ❌ |

---

## Endpoint: obter sessão do dispositivo

### `GET /api/v1/session`

Retorna o estado atual do terminal conectado.

#### Headers

| Header | Obrigatório | Descrição |
|--------|-------------|-----------|
| `X-Device-Id` | Sim* | Identificador único do terminal |
| `Authorization` | Não** | Token de sessão, se aplicável |

> \* Em produção, o dispositivo deve ser identificado. Mecanismo exato a definir com o backend.
> \** Pode ser necessário após registro.

#### Response `200 OK`

```json
{
  "device_id": "jb-terminal-001",
  "registered": false,
  "registration_status": "unregistered",
  "credits": 7,
  "queue_count": 0,
  "message": "Selecione uma música para começar"
}
```

#### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `device_id` | `string` | ID do terminal |
| `registered` | `boolean` | Se o dispositivo está registrado no sistema |
| `registration_status` | `string` | `unregistered` \| `pending` \| `active` \| `suspended` |
| `credits` | `integer` | Créditos disponíveis para tocar músicas |
| `queue_count` | `integer` | Quantidade de músicas na fila global do terminal |
| `message` | `string` | Mensagem de status exibida no rodapé |

#### Mapeamento na UI

| Campo API | Elemento UI |
|-----------|-------------|
| `registered: false` | Badge vermelho "Não registrado" |
| `registered: true` | Badge verde "Registrado" (a implementar no frontend) |
| `credits` | `StatusBar` → "X créditos" |
| `queue_count` | `StatusBar` → "X em espera" |
| `message` | `StatusBar` → texto central |

---

## Endpoint: registrar dispositivo

### `POST /api/v1/session/register`

Acionado futuramente pelo fluxo de registro (botão LEITURA ou onboarding).

#### Request body

```json
{
  "device_id": "jb-terminal-001",
  "activation_code": "ABC123",
  "location_name": "Bar do Zé"
}
```

#### Response `201 Created`

```json
{
  "device_id": "jb-terminal-001",
  "registered": true,
  "registration_status": "active",
  "credits": 0,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Endpoint: atualizar dados da sessão

### `GET /api/v1/session/refresh`

Acionado pelo botão de atualizar (ícone refresh no header).

#### Response `200 OK`

Mesmo formato de `GET /api/v1/session`.

---

## Regras de negócio esperadas

1. Cada terminal possui uma sessão independente.
2. Créditos são vinculados ao dispositivo ou à conta do estabelecimento.
3. `queue_count` deve refletir a fila real do backend, não apenas a fila local do browser.
4. Dispositivos não registrados podem ter acesso limitado (ex.: apenas visualizar catálogo).

## Erros

| Código | Situação |
|--------|----------|
| `401` | Dispositivo não autorizado |
| `404` | Dispositivo não encontrado |
| `403` | Dispositivo suspenso |

```json
{
  "error": {
    "code": "DEVICE_SUSPENDED",
    "message": "Este terminal foi suspenso. Contate o suporte."
  }
}
```

## Pendências para alinhamento

- [ ] Definir mecanismo de identificação do dispositivo (`X-Device-Id`, cookie, token).
- [ ] Definir fluxo do botão LEITURA.
- [ ] Definir se mensagens (ícone envelope) terão endpoint próprio.

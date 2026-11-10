# Contrato 14 — Configuração de créditos PIX

> **ID:** `14-pix-creditos-config`  
> **Base path:** `/api/v1/pagamentos/pix-creditos/`

## Componentes frontend

- `src/api/pagamentos.js` — `fetchPixCreditoOpcoes()`, CRUD admin, `resolvePixCreditosConcedidos()`
- `src/components/jukebox/PixModal.jsx` — botões a partir de `GET .../opcoes/` (`R$ X → N créditos`)
- `src/App.jsx` — `handlePixApproved()` credita `quantidade_creditos` (não o valor em reais)
- `src/components/admin/AdminPixCreditosTab.jsx` — aba **PIX créditos** no painel `#/admin`
- `src/components/admin/AdminDashboard.jsx` — navegação da aba

## Descrição

Define os **valores PIX** oferecidos no modal da jukebox (ex.: R$ 5, R$ 10, …) e a **quantidade de créditos** concedida na máquina quando o pagamento é aprovado.

Editável no painel `#/admin` (aba **PIX créditos**) e no **Django Admin** → **Pagamentos** → **créditos (configuração)** (item abaixo de *Contas Mercado Pago*).

A relação **R$ 1 = 1 crédito não é fixa** neste fluxo — só a tabela do backend vale. Moedas físicas continuam 1:1 (contrato [06](./06-creditos.md)).

### PostgreSQL (backend)

| Modelo | Uso |
|---|---|
| `PixCreditoOpcao` | `valor_pix` (único), `quantidade_creditos`, `ordem`, `ativo` |
| `PixCobranca.creditos_concedidos` | Congelado ao gerar o QR |

Ao aprovar o PIX, o crédito em `maquinas.Credito` usa `creditos_concedidos` (não o valor em reais pago). O front faz o mesmo no saldo local.

## Status

| Funcionalidade | Status |
|----------------|--------|
| `GET /pix-creditos/opcoes/` na jukebox | ✅ |
| Modal: `R$ X → N créditos` + POST `valor_pix_numero` | ✅ |
| Aprovação: `addCredits(quantidade_creditos)` | ✅ |
| Fallback para valores da migração se a API falhar | ✅ |
| CRUD no painel `#/admin` (Token admin) | ✅ |
| Django Admin (`PixCreditoOpcao`) | ✅ Backend |

---

## 1. Jukebox — listar opções ativas

```
GET /api/v1/pagamentos/pix-creditos/opcoes/
Authorization: Maquina <token>
```

### Response `200`

```json
{
  "opcoes": [
    {
      "id": 1,
      "valor_pix": "5.00",
      "valor_pix_numero": 5.0,
      "quantidade_creditos": 5,
      "ordem": 1
    },
    {
      "id": 2,
      "valor_pix": "10.00",
      "valor_pix_numero": 10.0,
      "quantidade_creditos": 12,
      "ordem": 2
    }
  ]
}
```

O front aceita `{ opcoes }`, `{ results }` ou array cru. Ordena por `ordem`, depois por valor.

| Campo | Uso na UI |
|---|---|
| `valor_pix_numero` | Rótulo `formatBRL`, body do `POST /pix/qrcode/` |
| `quantidade_creditos` | Subtítulo do botão e créditos após aprovação |
| `id` | Seleção / teclado no modal |

Lista vazia → aviso para cadastrar opções. Erro de rede (exceto 401) → presets da migração (R$ 5/10/20/50/100 com 1:1).

---

## 2. Admin — CRUD completo

```
GET    /api/v1/pagamentos/pix-creditos/
POST   /api/v1/pagamentos/pix-creditos/
GET    /api/v1/pagamentos/pix-creditos/{id}/
PUT    /api/v1/pagamentos/pix-creditos/{id}/
PATCH  /api/v1/pagamentos/pix-creditos/{id}/
DELETE /api/v1/pagamentos/pix-creditos/{id}/
Authorization: Token <token-admin>
```

A jukebox também pode chamar `GET /api/v1/pagamentos/pix-creditos/` (somente `ativo`) com header `Maquina`; o modal usa **`/opcoes/`**.

### Body (criar/atualizar)

```json
{
  "valor_pix": "5.00",
  "quantidade_creditos": 8,
  "ordem": 1,
  "ativo": true
}
```

| Situação | Tratamento no painel |
|---|---|
| 400/401 no GET | Sessão expirada → volta ao login |
| 400 no POST/PATCH (ex.: `valor_pix` duplicado) | Mensagem inline |
| 401 no salvar/excluir | Sessão expirada |
| `204` no DELETE | Sucesso; recarrega a lista |

---

## 3. Valores padrão (migração)

| Valor PIX | Créditos iniciais |
|---|---|
| R$ 5,00 | 5 |
| R$ 10,00 | 10 |
| R$ 20,00 | 20 |
| R$ 50,00 | 50 |
| R$ 100,00 | 100 |

Usados pelo backend na migração e pelo front só se `GET .../opcoes/` falhar.

---

## Fluxo na jukebox

```
1. Abre o modal PIX → GET /pagamentos/pix-creditos/opcoes/
2. Botões: formatBRL(valor_pix_numero) + "N créditos"
3. POST /pagamentos/pix/qrcode/ { valor: valor_pix_numero }
4. QR / sincronizar traz quantidade_creditos (congelado em creditos_concedidos)
5. status=aprovado → addCredits(quantidade_creditos) + toast
6. Roleta: session.total soma o valor pago em R$ (faixas da roleta são por valor inserido)
```

Não há `POST /maquinas/creditos/` neste fluxo — o backend já lançou `origem: pix` com `creditos_concedidos`.

## Regras de negócio no front

1. Carregar as opções **ao abrir** o modal; o POST do QR usa `valor_pix_numero`.
2. Saldo local e toast usam `quantidade_creditos` / `creditos_concedidos` da cobrança — nunca assumir R$ 1 = 1 crédito.
3. Fallback 1:1 só se a API de opções estiver fora (máquina offline).
4. Evento local de faturamento: `valor` = reais pagos, `creditos` = quantidade concedida.

## Pendências

- [ ] Conta Mercado Pago no painel `#/admin` (continua só no Django Admin — contrato 13)

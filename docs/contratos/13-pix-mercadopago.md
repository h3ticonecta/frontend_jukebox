# Contrato 13 — PIX (QR Code) via Mercado Pago

## Componentes frontend

- `src/api/pagamentos.js` — `criarPixQrCode()`, `consultarPix()`, `sincronizarPix()`
- `src/components/jukebox/PixModal.jsx` — escolha de valor, QR, copia e cola, polling
- `src/components/jukebox/JukeboxHeader.jsx` — botão **PIX**
- `src/components/jukebox/PlayerBar.jsx` — atalho PIX ao lado dos créditos
- `src/App.jsx` — `handlePixApproved()` (saldo local + roleta; **não** chama `POST /creditos/`)

## Descrição

Gera **QR Code PIX** (imagem base64 + copia e cola) na conta Mercado Pago do backend. Quando o pagamento é aprovado, o backend registra o **crédito** (`origem: pix`) e o frontend credita o saldo local (R$ 1,00 = 1 crédito).

## Status

| Funcionalidade | Status |
|----------------|--------|
| Botão PIX (header + rodapé) | ✅ |
| Escolha de valor (R$ 5 / 10 / 20 / 50 / 100) | ✅ |
| `POST /pagamentos/pix/qrcode/` | ✅ |
| Exibir QR (`qr_code_base64`) + copia e cola (`qr_code`) | ✅ |
| Polling `POST /pagamentos/pix/{id}/sincronizar/` a cada 3s | ✅ |
| `status=aprovado` → créditos locais + toast + roleta | ✅ |
| Não reenviar `POST /maquinas/creditos/` (backend já lançou) | ✅ |
| CRUD conta MP no SPA `#/admin` | ❌ Django Admin (`Pagamentos → Contas Mercado Pago`) |

---

## Autenticação

| Endpoint | Auth |
|---|---|
| `POST /api/v1/pagamentos/pix/qrcode/` | `Authorization: Maquina <token>` |
| `GET /api/v1/pagamentos/pix/{id}/` | Máquina ou Token admin |
| `POST /api/v1/pagamentos/pix/{id}/sincronizar/` | Máquina |
| `POST /api/v1/pagamentos/webhook/mercadopago/` | Sem auth (Mercado Pago → backend) |

---

## Endpoints usados pelo app

### Gerar QR

```
POST /api/v1/pagamentos/pix/qrcode/
Authorization: Maquina <token>
```

```json
{ "valor": 5.00, "descricao": "Créditos jukebox" }
```

Response `201` — campos na UI:

| Campo | Uso |
|---|---|
| `id` | Polling / sincronizar |
| `valor` / `valor_numero` | Rótulo e quantidade de créditos (`Math.round`) |
| `qr_code` | PIX copia e cola |
| `qr_code_base64` | `<img src="data:image/png;base64,…">` (prefixo `data:` acrescentado se ausente) |
| `status` | `pendente` enquanto paga |
| `expires_at` | Countdown "Expira em M:SS" |

### Sincronizar (polling)

```
POST /api/v1/pagamentos/pix/{id}/sincronizar/
```

A cada **3 s** enquanto o modal do QR está aberto. `status=aprovado` (ou `approved`) encerra o poll.

---

## Fluxo na jukebox

```
1. Toque em PIX (header ou rodapé)
2. Escolhe valor (presets R$ 5, 10, 20, 50, 100)
3. POST /pagamentos/pix/qrcode/ { valor }
4. Exibe QR + copia e cola; poll sincronizar a cada 3s
5. status=aprovado → backend já criou Credito (origem: pix)
6. Front: addCredits(valor) + toast "+N créditos via PIX" + sessão da roleta
7. Overlay de sucesso ~1,8s e fecha (a roleta pode abrir em seguida)
```

Não há `POST /maquinas/creditos/` neste fluxo — o crédito já foi lançado pelo webhook/sincronizar.

## Erros

| Código | Mensagem na UI |
|---|---|
| `MP_NOT_CONFIGURED` | PIX não configurado. Cadastre a conta Mercado Pago no Admin. |
| `MP_API_ERROR` | Mensagem do backend ou "Mercado Pago recusou a cobrança." |
| `401` | Sessão da máquina inválida. |

QR expirado ou status recusado/cancelado → botão "Escolher outro valor".

## Regras de negócio no front

1. R$ 1,00 = 1 crédito (igual à inserção por moeda).
2. Valor do PIX entra de uma vez na sessão da roleta (`session.total += N`), não pulso a pulso.
3. Tecla cancelar fecha o modal PIX.
4. Configuração da conta MP permanece no **Django Admin** (access token não circula no SPA).

## Pendências

- [ ] Tecla física da máquina para abrir o PIX
- [ ] CRUD da conta Mercado Pago no painel `#/admin`
- [ ] Valores de PIX configuráveis por máquina (hoje presets fixos)

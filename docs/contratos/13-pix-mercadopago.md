# Contrato 13 — PIX (QR Code) via Mercado Pago

## Componentes frontend

- `src/api/pagamentos.js` — `criarPixQrCode()`, `consultarPix()`, `sincronizarPix()`
- `src/components/jukebox/PixModal.jsx` — escolha de valor, QR, copia e cola, polling e navegação por teclas (`handleAction`)
- `src/components/jukebox/PlayerBar.jsx` — CTA **Pagar com PIX** centralizado no rodapé
- `src/hooks/useJukeboxKeyboard.js` — zona de foco `pix` (seta para baixo na última faixa)
- `src/App.jsx` — `handlePixApproved()` (saldo local + roleta; **não** chama `POST /creditos/`); com o modal aberto, teclas vão para o PIX

## Descrição

Gera **QR Code PIX** (imagem base64 + copia e cola) na conta Mercado Pago do backend. Quando o pagamento é aprovado, o backend registra o **crédito** (`origem: pix`) e o frontend credita o saldo local (R$ 1,00 = 1 crédito).

## Status

| Funcionalidade | Status |
|----------------|--------|
| CTA **Pagar com PIX** centralizado no rodapé | ✅ |
| Navegação por teclas até o PIX (zona `pix`) | ✅ |
| Navegação por teclas **dentro** do modal (valores / Gerar QR / copiar) | ✅ |
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
{
  "valor": 5.00,
  "descricao": "Créditos jukebox",
  "email": "jukebox-3@h3ti.com.br",
  "payer_email": "jukebox-3@h3ti.com.br"
}
```

O Mercado Pago exige `payer.email` válido. O usuário da máquina (ex.: `Macgustavo`) **não** é e-mail — o front envia `jukebox-{id}@h3ti.com.br` (ou o `usuario` se já for um e-mail). O backend deve repassar esse campo ao MP; se ignorar e usar o login da máquina, a API devolve `payer.email must be a valid email`.

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
1. Toque no CTA **Pagar com PIX** (centro do rodapé) ou navegue até ele com `baixo` e confirme com `fila` / `tocar_cd`
2. O foco das teclas entra no modal (o anel do CTA some). Setas escolhem o valor; `fila` / `tocar_cd` gera o QR do valor focado
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
| `MP_API_ERROR` / `payer.email` | Mercado Pago exige e-mail válido do pagador (não usar o usuário da máquina). |
| `401` / `UNAUTHORIZED` | Mensagem do backend (ex.: token inválido). Botão para sair e entrar de novo. |

QR expirado ou status recusado/cancelado → botão "Escolher outro valor".

## Regras de negócio no front

1. R$ 1,00 = 1 crédito (igual à inserção por moeda).
2. Valor do PIX entra de uma vez na sessão da roleta (`session.total += N`), não pulso a pulso.
3. Tecla cancelar fecha o modal PIX. Com o modal aberto, setas e `fila`/`tocar_cd` navegam só o diálogo — não a biblioteca nem o CTA do rodapé.
4. Configuração da conta MP permanece no **Django Admin** (access token não circula no SPA).

## Pendências

- [ ] Tecla física dedicada `acao: pix` no admin (hoje chega pelas setas + `fila`/`tocar_cd`; se o backend enviar `pix`, o atalho abre o modal)
- [ ] CRUD da conta Mercado Pago no painel `#/admin`
- [ ] Valores de PIX configuráveis por máquina (hoje presets fixos)
- [ ] Backend: usar `email` / `payer_email` do POST (ou um default `jukebox-{id}@dominio`) em `payer.email` do Mercado Pago — não o `usuario` da máquina

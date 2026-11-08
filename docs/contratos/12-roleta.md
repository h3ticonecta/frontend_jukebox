# Contrato 12 — Configuração da Roleta (por máquina)

## Componentes frontend

- `src/api/roleta.js` — `fetchRoletaAdmin()`, `saveRoletaAdmin()` (admin) e `fetchRoletaMaquina()` (jukebox)
- `src/components/admin/AdminRoletaTab.jsx` — editor da roleta no painel `#/admin` (aba **Roleta**)
- `src/components/admin/AdminDashboard.jsx` — navegação por abas (`activeTab`: `dashboard` | `roleta`)

## Descrição

Cada **máquina** tem uma configuração de roleta independente:

1. **Ativação** — toggle "Roleta ativada"
2. **Probabilidades (pesos)** — setores da roleta global (+2 músicas, +1 música, bônus 50% na recarga, tente novamente, não foi dessa vez)
3. **Regras** — créditos mínimos para girar; limite diário de prêmio +2 músicas (%)
4. **Faixas por valor inserido** — R$ 5 / 10 / 20 / … com giros liberados e prêmios ponderados (`musica_gratis` / `giro_extra` / `sem_premio`)

Também editável no Django Admin (bloco "Configuração da Roleta" em Modificar máquina).

## Status

| Funcionalidade | Status |
|----------------|--------|
| API admin `GET /maquinas/{id}/roleta/` | ✅ Integrado |
| API admin `PUT /maquinas/{id}/roleta/` (salvar) | ✅ Integrado |
| Aba Roleta no painel: seleção de máquina, toggle, pesos, regras, faixas | ✅ |
| Resumo de probabilidades calculado no front (total, chance %, vantagem %) | ✅ |
| API jukebox `GET /maquinas/roleta/` (`fetchRoletaMaquina`) | ✅ Pronto (sem UI ainda) |
| Jogo da roleta na jukebox (giro, animação, aplicação de prêmios) | ❌ Pendente — aguardando definição de UX/regras |

---

## Autenticação

| Endpoint | Auth |
|---|---|
| `GET/PUT/PATCH /api/v1/maquinas/{id}/roleta/` | `Authorization: Token <token-admin>` (login do contrato 11) |
| `GET /api/v1/maquinas/roleta/` | `Authorization: Maquina <token>` |

| Situação | Tratamento no front |
|---|---|
| 400/401 no **carregamento** (GET) | Sessão do admin expirada → volta ao login com aviso |
| 400 no **salvar** (PUT) | Erros de validação de campos → exibidos inline |
| 401 no **salvar** | Sessão expirada → volta ao login |

---

## Endpoints

### Admin — ler

```
GET /api/v1/maquinas/{id}/roleta/
Authorization: Token <token-admin>
```

Response `200` (campos consumidos pelo front):

| Campo | Uso na UI |
|---|---|
| `maquina_id`, `nome_jukebox` | Contexto da máquina selecionada |
| `ativada` | Toggle "Roleta ativada" |
| `probabilidades.premio_mais_2_musicas` … `nao_foi_dessa_vez` | 5 inputs numéricos de peso |
| `probabilidades.resumo` | **Ignorado** — o resumo é recalculado no front |
| `regras.creditos_minimos_girar` | Input "Créditos mínimos para girar" |
| `regras.max_premio_mais_2_musicas_dia_percent` | Input "Limite diário de prêmio +2 músicas" |
| `faixas_valor[]` | Cards de faixa: `valor`/`valor_numero`, `giros_liberados`, `premios[]` (`tipo`, `quantidade`, `peso`) |
| `updated_at` | Rodapé "Atualizado em …" |

### Admin — gravar

```
PUT /api/v1/maquinas/{id}/roleta/
Authorization: Token <token-admin>
```

Body enviado pelo front (`formToPayload` em `AdminRoletaTab.jsx`) — **sem** `id`/`ordem`, no formato exato do contrato:

```json
{
  "ativada": true,
  "probabilidades": {
    "premio_mais_2_musicas": 1,
    "premio_mais_1_musica": 5,
    "bonus_recarga_50pct": 1,
    "tente_novamente": 40,
    "nao_foi_dessa_vez": 30
  },
  "regras": { "creditos_minimos_girar": 5, "max_premio_mais_2_musicas_dia_percent": 10 },
  "faixas_valor": [
    {
      "valor": "5.00",
      "giros_liberados": 1,
      "premios": [
        { "tipo": "musica_gratis", "quantidade": 2, "peso": 10 },
        { "tipo": "giro_extra", "quantidade": 1, "peso": 10 },
        { "tipo": "sem_premio", "quantidade": 1, "peso": 10 }
      ]
    }
  ]
}
```

Após salvar, o front faz **novo GET** para refletir `id`/`resumo`/`updated_at` gerados pelo backend.

### Jukebox — consulta

```
GET /api/v1/maquinas/roleta/
Authorization: Maquina <token>
```

- `ativada: false` → resumo mínimo
- `ativada: true` → mesmo JSON do admin

Pronto em `fetchRoletaMaquina()` (`src/api/roleta.js`), ainda **sem UI** na jukebox.

---

## Regras de negócio no front

1. Aba própria **Roleta** no painel admin (ícone `Dices`); a lista de máquinas vem de `maquinas_opcoes` do painel (contrato 11), buscada ao abrir a aba com `periodo=tudo`.
2. `faixas_valor` é enviada **completa** no PUT e **substitui** as faixas anteriores (comportamento do backend); por isso o body omite `id` e `ordem`.
3. Resumo de probabilidades calculado no client: `chance = (premio_mais_2_musicas + premio_mais_1_musica + bonus_recarga_50pct) / total_pesos`; `vantagem = 100 − chance`. Exibido com 1 casa decimal (igual ao `resumo` do backend).
4. `valor` da faixa é serializado com 2 casas decimais (`"5.00"`).
5. `sem_premio` com `quantidade: 1` deve ser exibido como **"-"** na roleta da jukebox (quando implementada).
6. Prêmios **cumulativos** por faixa maior: regra aplicada no app da jukebox (o backend só armazena as faixas) — **aguardando o print da regra** para implementação.

## Pendências

- [ ] UI do jogo na jukebox: gatilho do giro (botão vs. automático após inserção), animação da roleta, aplicação de prêmios (créditos grátis, giros extras, bônus de recarga)
- [ ] Regra de cumulatividade por faixa maior (aguardando print/especificação)
- [ ] Controle diário do limite de prêmio +2 músicas (`max_premio_mais_2_musicas_dia_percent`) — definir onde o contador vive (local vs. backend)
- [ ] Avaliar `PATCH` parcial (hoje o front usa sempre `PUT` completo)

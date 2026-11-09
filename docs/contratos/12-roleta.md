# Contrato 12 — Configuração da Roleta (por máquina)

## Componentes frontend

- `src/api/roleta.js` — `fetchRoletaAdmin()`, `saveRoletaAdmin()` (admin) e `fetchRoletaMaquina()` (jukebox)
- `src/components/admin/AdminRoletaTab.jsx` — editor da roleta no painel `#/admin` (aba **Roleta**)
- `src/components/admin/AdminDashboard.jsx` — navegação por abas (`activeTab`: `dashboard` | `roleta`)
- `src/lib/roleta.js` — lógica do jogo: sessão de inserção, sorteio ponderado, cumulatividade, limite diário, persistência
- `src/components/jukebox/RoletaModal.jsx` — roda da roleta (SVG) + animação de giro
- `src/components/jukebox/RoletaFab.jsx` — atalho flutuante "Roleta ×N" quando há giros pendentes
- `src/App.jsx` — gatilho automático na inserção de créditos, concessão de giros, aplicação de prêmios

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
| API jukebox `GET /maquinas/roleta/` (`fetchRoletaMaquina`) | ✅ Integrado |
| Jogo da roleta na jukebox (overlay **ROULETA DA SORTE**, gatilho automático, prêmios) | ✅ Implementado (regras abaixo; UI alinhada ao print) |
| Registro de prêmios da roleta no backend | ❌ Local — prêmios não geram `POST /creditos/` |

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

Consumido por `fetchRoletaMaquina()` no boot da jukebox (falha silenciosa = roleta desligada até o próximo boot).

---

## Jogo na jukebox (regras implementadas no front)

Definidas com o operador: **gatilho automático** após inserção de valor e roda com os **5 setores globais**; cumulatividade conforme print da regra.

### Gatilho — sessão de inserção

- O aceitador pulsa R$ 1 por vez (`handleInsertCredit`); cada pulso soma em uma **sessão** (`roletaSessionRef` em `App.jsx`).
- A overlay **abre no pulso que atinge o limiar** — não espera o idle. Limiar = `creditos_minimos_girar` (texto do Django: "créditos comprados para liberar a roleta") **ou** a menor faixa de valor, o que ocorrer primeiro.
- Giros = `giros_liberados` da **maior faixa** com `valor <= total` da sessão; se não houver faixa, concede **1 giro**. Pulsos seguintes na mesma sessão só somam o **delta**.
- **20s sem novo pulso** (`ROLETA_SESSION_MS`) encerram a sessão: aplicam o bônus 50% pendente e zeram o acumulado (os giros já estão na overlay/localStorage).
- Roleta desativada na **máquina logada**, config não carregada ou total abaixo do mínimo → nada acontece.
- Se o GET da config falhou no boot, a inserção tenta de novo (`fetchRoletaMaquina`).

### Roda e sorteio (UI = print **ROULETA DA SORTE**)

- Overlay tela cheia: título em degradê ciano→rosa, subtítulo "Gire e ganhe músicas extras!", ponteiro ciano no topo, miolo escuro, botão **GIRAR ROLETA** abaixo da roda, pill "Giros disponíveis: N".
- Roda SVG com os **5 setores globais** em fatias **iguais** (72° cada, ordem fixa de `ROLETA_SETORES`). Os **pesos** do admin só afetam o sorteio (`pickRoletaSector`), não o tamanho visual da fatia (evita prêmios espremidos no topo quando peso de “não foi” / “tente novamente” é alto).
- Sorteio ponderado no client (`pickRoletaSector`), animação de ~4,8s até o setor sorteado sob o ponteiro.

### Resultados

| Setor | Efeito |
|---|---|
| **+2 músicas** | Sorteia uma faixa participante (uniforme) e paga o prêmio **cumulativo**: `musica_gratis.quantidade` da faixa sorteada **+ todas as inferiores** (ex.: faixa C com A–E → 2+4+6 = 12 músicas) |
| **+1 música** | Paga somente o `musica_gratis.quantidade` da **faixa sorteada** (sem cumulatividade) |
| **Bônus 50% na recarga** | Flag `jukebox_roleta_bonus_recarga`; a **próxima sessão de inserção** ganha `floor(total × 50%)` créditos extras (toast "Bônus +50%: +N créditos") |
| **Tente novamente** | Giro **devolvido** (não consome) |
| **Não foi dessa vez** | Giro consumido, sem prêmio |

### Regras e limites

- **Créditos mínimos**: saldo `>= regras.creditos_minimos_girar` para girar (aviso no modal; giros são mantidos).
- **Limite diário do +2**: contador local por dia (`jukebox_roleta_daily`); permitido enquanto `premios2 + 1 <= (giros + 1) × pct / 100`. Ao atingir o limite, **o peso do setor +2 migra para "não foi dessa vez"** naquele dia.
- **Prêmio de músicas = créditos locais** (`addCredits`, 1 música = 1 crédito). Não há `POST /creditos/` nem evento de faturamento — prêmio não é venda.

### Persistência local (`src/lib/roleta.js`)

| Chave | Conteúdo |
|---|---|
| `jukebox_roleta_giros` | Giros pendentes (ao zerar, limpa as faixas participantes) |
| `jukebox_roleta_faixas_participantes` | Maior nº de faixas acumuladas enquanto houver giros |
| `jukebox_roleta_bonus_recarga` | Flag do bônus 50% pendente |
| `jukebox_roleta_daily` | `{ date, giros, premios2 }` do dia (limite diário) |

### Abertura da UI

- Automática ao conceder giros; no **boot** se houver giros pendentes e roleta ativada.
- **FAB** "Roleta ×N" (canto inferior esquerdo) quando fechada com giros pendentes.
- **Fecha sozinha** quando `giros disponíveis = 0` (depois de ~2s mostrando o resultado do último giro; "Tente novamente" devolve o giro e a overlay permanece).
- Fechar no meio do giro **não perde o prêmio** (o giro conclui em background e aplica o resultado).

---

## Regras de negócio no front

1. Aba própria **Roleta** no painel admin (ícone `Dices`); a lista de máquinas vem de `maquinas_opcoes` do painel (contrato 11), buscada ao abrir a aba com `periodo=tudo`.
2. `faixas_valor` é enviada **completa** no PUT e **substitui** as faixas anteriores (comportamento do backend); por isso o body omite `id` e `ordem`.
3. Resumo de probabilidades calculado no client: `chance = (premio_mais_2_musicas + premio_mais_1_musica + bonus_recarga_50pct) / total_pesos`; `vantagem = 100 − chance`. Exibido com 1 casa decimal (igual ao `resumo` do backend).
4. `valor` da faixa é serializado com 2 casas decimais (`"5.00"`).
5. `sem_premio` com `quantidade: 1` não vira fatia da roda (a roda usa os 5 setores globais). Na lista de prêmios da **faixa** no admin, continua cadastrável.
6. Prêmios **cumulativos** por faixa maior (print da regra): a maior faixa `valor <= total inserido` concede os giros; no prêmio **+2 músicas** o app soma `musica_gratis` da faixa sorteada **+ todas as inferiores** participantes da sessão. O backend só armazena as faixas.

## Pendências

- [ ] Endpoint backend para **registrar prêmios/giros** da roleta (hoje tudo local: giros, contadores, prêmios em créditos)
- [ ] Prêmios de faixa `giro_extra` / `sem_premio`: não sorteados por faixa nesta versão — os setores globais "tente novamente"/"não foi dessa vez" cobrem esses papéis
- [ ] Tecla física da máquina para girar/abrir a roleta (hoje só toque/clique)
- [ ] Som de giro/prêmio
- [ ] Validar em campo a janela de idle de 20s (aceitador real) — a overlay em si abre no pulso do mínimo, não no idle
- [ ] Avaliar `PATCH` parcial no editor admin (hoje o front usa sempre `PUT` completo)

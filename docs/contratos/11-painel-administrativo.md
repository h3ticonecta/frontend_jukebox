# Contrato 11 — Painel Administrativo (Dashboard)

## Componentes frontend

- `src/components/admin/AdminPage.jsx` — gate de autenticação da rota `#/admin`
- `src/components/admin/AdminLoginCard.jsx` — login do administrador
- `src/components/admin/AdminDashboard.jsx` — dashboard (cards, filtros, gráfico) + navegação por abas
- `src/components/admin/AdminRoletaTab.jsx` — aba **Roleta** (editor do contrato 12)
- `src/components/admin/AdminPixCreditosTab.jsx` — aba **PIX créditos** (editor do contrato 14)
- `src/api/painel.js` — `fetchPainelAdministrativo()`
- `src/api/auth.js` — `loginAdmin()` (POST `/api/v1/auth/token/`)
- `src/lib/storage.js` — `getAdminToken()`, `setAdminSession()`, `clearAdminSession()`
- `src/lib/painelPrint.js` — `exportPainelPdf()` (relatório via diálogo de impressão)
- `src/App.jsx` — `useHashRoute()` (roteamento hash da SPA)

## Descrição

Página **Painel Administrativo** acessível pela rota SPA `/#/admin`, com autenticação **independente** do login da máquina: token de usuário admin do Django (`Authorization: Token <token-admin>`). Exibe cards de resumo, faturamento por máquina, gráfico de barras e filtros de período/máquina/status, além de exportação em PDF gerada no frontend.

## Status

| Funcionalidade | Status |
|----------------|--------|
| Rota SPA `#/admin` (hash router em `App.jsx`) | ✅ |
| Login admin (`POST /api/v1/auth/token/`) + sessão local | ✅ |
| Cards de resumo (faturamento, créditos, tocadas, máquinas ativas) | ✅ |
| Cards "Faturamento por Máquina" (+ status ativa/inativa) | ✅ |
| Gráfico de barras (divs, sem lib externa) | ✅ |
| Filtros: período preset / personalizado / máquina / status | ✅ |
| Exportar PDF (frontend, `window.print()` em HTML limpo) | ✅ |
| Logout + tratamento de 401 (sessão expirada) | ✅ |
| Aba **Roleta** (editor de configuração da roleta por máquina) | ✅ — contrato [12](./12-roleta.md) |
| Aba **PIX créditos** (valores PIX → créditos) | ✅ — contrato [14](./14-pix-creditos-config.md) |
| Abas Máquinas / Usuários | ⏳ Em breve (badge na UI) |

---

## Autenticação

| Etapa | Detalhe |
|-------|---------|
| Login | `POST /api/v1/auth/token/` com `{ "username", "password" }` → `{ "token" }` (`loginAdmin()` em `src/api/auth.js`) |
| Header | `Authorization: Token <token-admin>` (`tokenType: 'Token'` no `apiRequest`) |
| Sessão local | `localStorage`: `jukebox_admin_token` + `jukebox_admin_user` |
| 400/401 na API (token ausente/inválido) | Limpa sessão e volta ao login com aviso "Sessão expirada" |
| Erro de login | `non_field_errors` do DRF → "Usuário ou senha inválidos." |

---

## Endpoint

### `GET /api/v1/maquinas/painel-administrativo/`

Query enviada pelo front (`fetchPainelAdministrativo`):

| Filtro da UI | Query | Observação |
|---|---|---|
| Todo período / Hoje / Esta semana / Este mês | `periodo=tudo\|hoje\|semana\|mes` | `tudo` omitido (padrão do backend) |
| Período personalizado (`PeriodCalendar`) | `data_inicio` + `data_fim` (`YYYY-MM-DD`) | Só dispara o GET quando **as duas** datas estão escolhidas; ignora o preset |
| Combo máquinas | `maquina_id=<id>` | "Todas" → omitido |
| Combo status | `status=ativo\|inativo` | "Todos" → omitido |

## Mapeamento API → UI

| Campo (`response`) | Elemento |
|---|---|
| `resumo.faturamento_total_numero` (fallback `faturamento_total`) | Card "Faturamento Total" em R$ (`formatBRL`) |
| `resumo.creditos_vendidos` | Card "Créditos Vendidos" |
| `resumo.musicas_tocadas` | Card "Músicas Tocadas" |
| `resumo.maquinas_ativas` | Card "Máquinas Ativas" |
| `faturamento_por_maquina[]` | Cards por máquina: `nome_jukebox`, `faturamento_numero` em R$, `creditos`, ponto de status `is_active` |
| `grafico_faturamento_por_maquina[]` | Barras horizontais: rótulo `nome_jukebox`, largura proporcional a `valor` / máx, valor em R$ à direita |
| `maquinas_opcoes[]` | Opções do combo de máquinas (`id` + `nome_jukebox`) |

## Exportar PDF

- Somente frontend: `exportPainelPdf()` monta HTML limpo (fundo branco, tabelas) com resumo + faturamento por máquina + filtros ativos, abre em janela nova e chama `window.print()` ("Salvar como PDF" do navegador)
- Sem biblioteca externa de PDF

## Regras de negócio no front

1. A rota `#/admin` é renderizada **antes** do gate de login da máquina — o painel não exige nem interfere na sessão da jukebox.
2. Filtro de período personalizado só consulta a API após início **e** fim escolhidos (mesmo padrão do `BillingModal`).
3. Gráfico usa `grafico_faturamento_por_maquina[]` (pré-agregado do backend); largura mínima de barra de 2% para valores > 0.
4. Navegação por abas com estado `activeTab` (`dashboard` | `roleta` | `pix-creditos`): botões de atualizar/exportar PDF e os filtros só aparecem na aba Dashboard.
5. Abas "Máquinas" e "Usuários" aparecem desabilitadas com badge "em breve" (contratos futuros).

## Pendências

- [ ] Aba Máquinas (CRUD `/api/v1/maquinas/`)
- [ ] Aba Usuários (gestão de usuários admin)

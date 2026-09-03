# Jukebox Online — Contratos de Frontend

Contratos de dados e módulos de **UI apenas**, extraídos do site [Jukebox Online](https://jukeboxonline.lovable.app/), para implementação do frontend React.

**Não contêm mapeamento de backend, tabelas ou rotas.**  
O backend será fornecido separadamente; os contratos definem apenas o que o frontend consome e emite.

---

## Como usar

1. Leia os contratos em [`contracts/`](./contracts/) — definem **tipos de dados e interfaces de props/callbacks**.
2. Consulte [`FRONTEND_REACT.md`](../FRONTEND_REACT.md) na raiz — define **classes Tailwind, layout e JSX** de cada parte visual.

---

## Índice de contratos

| Módulo | Arquivo | Conteúdo |
|--------|---------|----------|
| Tipos compartilhados | [shared.md](./contracts/shared.md) | Enums, IDs, gradientes, eventos UI |
| Catálogo de mídia | [catalog.md](./contracts/catalog.md) | Song, Album, Genre, Karaokê |
| Player | [player.md](./contracts/player.md) | Estado, fila, vídeo, teclado |
| Créditos e faturamento | [credits-billing.md](./contracts/credits-billing.md) | Saldo, conversão, leitura |
| Roleta | [roulette.md](./contracts/roulette.md) | Prêmios, giros, canvas, log |
| Configurações | [settings.md](./contracts/settings.md) | Geral, teclas, pastas |
| Autenticação | [auth.md](./contracts/auth.md) | Máquina, admin, sessão |
| Administração | [admin.md](./contracts/admin.md) | Painel, máquinas, usuários |
| Estatísticas | [statistics.md](./contracts/statistics.md) | Métricas de uso |
| UI (props) | [ui-modules.md](./contracts/ui-modules.md) | Props por componente React |

---

## Princípios

- **Sem backend** — os contratos descrevem dados de entrada/saída, não origem.
- **Sem rotas** — os módulos são funcionais, não vinculados a URLs.
- **Frontend consome props e emite callbacks/eventos** — integração com seu backend fica para depois.

---

## Stack frontend sugerida

React 18+ · Tailwind CSS · shadcn/ui · lucide-react · TypeScript

---

## Fluxo de trabalho

1. **Implementar frontend** usando estes contratos + `FRONTEND_REACT.md`.
2. **Depois**, quando seu backend estiver pronto, envie os contratos do backend para mapear as chamadas de API.

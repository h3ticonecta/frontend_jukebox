# Documentação de Contratos — JUKE-BOX Frontend

Esta pasta contém os contratos de integração entre o **frontend React** e o **backend Django**, baseados nas implementações já existentes na interface.

## Objetivo

Cada documento descreve:

- qual tela/componente do frontend depende do contrato;
- quais endpoints o backend deve expor;
- formatos de request/response;
- regras de negócio esperadas;
- status atual da integração.

## Índice de contratos

| # | Contrato | Arquivo | Prioridade |
|---|----------|---------|------------|
| 00 | Visão geral e arquitetura | [00-visao-geral.md](./contratos/00-visao-geral.md) | — |
| 01 | Sessão e status do dispositivo | [01-sessao-dispositivo.md](./contratos/01-sessao-dispositivo.md) | Alta |
| 02 | Gêneros (carrossel SUCESSOS) | [02-generos.md](./contratos/02-generos.md) | Alta |
| 03 | Artistas e álbuns | [03-artistas-albuns.md](./contratos/03-artistas-albuns.md) | Alta |
| 04 | Faixas (músicas) | [04-faixas.md](./contratos/04-faixas.md) | Alta |
| 05 | Fila de espera | [05-fila-espera.md](./contratos/05-fila-espera.md) | Alta |
| 06 | Créditos | [06-creditos.md](./contratos/06-creditos.md) | Média |
| 07 | Mídias (Cloudflare R2) | [07-midias-r2.md](./contratos/07-midias-r2.md) | Alta |
| 08 | Convenções da API | [08-convencoes-api.md](./contratos/08-convencoes-api.md) | — |

## Status geral

| Área | Frontend | Backend |
|------|----------|---------|
| Layout da página inicial | ✅ Implementado | ⏳ Pendente |
| Dados mockados | ✅ `src/data/mockData.js` | ⏳ Substituir por API |
| Chamadas HTTP reais | ❌ Não iniciado | ⏳ Pendente |
| Autenticação/sessão | ❌ UI estática | ⏳ Pendente |
| Fila persistente | ❌ Estado local React | ⏳ Pendente |

## Como usar

1. Leia [00-visao-geral.md](./contratos/00-visao-geral.md) para entender o contexto.
2. Implemente os contratos na ordem de prioridade (02 → 05).
3. Quando um endpoint estiver pronto, o frontend substituirá os mocks correspondentes.

## Referência rápida de base URL

| Ambiente | Base URL |
|----------|----------|
| Desenvolvimento (proxy Vite) | `/api` → `http://localhost:8000` |
| Produção | `VITE_API_URL` (a definir no frontend) |

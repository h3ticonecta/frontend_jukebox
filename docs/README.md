# Documentação de Contratos — JUKE-BOX Frontend

Contratos de integração entre o **frontend React** (este repo) e o **backend Django** (`backend_jukebox`).

A documentação canônica da API está no repositório do backend (`docs_para_front/`, branch `dev`). Os arquivos aqui descrevem **como o frontend consome** essa API e o status de cada área.

## Objetivo

Cada contrato documenta:

- componentes React envolvidos;
- endpoints reais utilizados;
- mapeamento request/response → UI;
- regras de negócio no client;
- status da integração.

## Índice

| # | Contrato | Arquivo | Status |
|---|----------|---------|--------|
| 00 | Visão geral | [00-visao-geral.md](./contratos/00-visao-geral.md) | — |
| 01 | Autenticação da máquina | [01-sessao-dispositivo.md](./contratos/01-sessao-dispositivo.md) | ✅ Integrado |
| 02 | Gêneros (SUCESSOS) | [02-generos.md](./contratos/02-generos.md) | ✅ Integrado |
| 03 | Artistas / bandas | [03-artistas-albuns.md](./contratos/03-artistas-albuns.md) | ✅ Integrado |
| 04 | Faixas (músicas) | [04-faixas.md](./contratos/04-faixas.md) | ✅ Integrado |
| 05 | Fila de espera | [05-fila-espera.md](./contratos/05-fila-espera.md) | ⚠️ Local |
| 06 | Créditos | [06-creditos.md](./contratos/06-creditos.md) | ✅ Integrado |
| 07 | Mídias (R2) | [07-midias-r2.md](./contratos/07-midias-r2.md) | ✅ Integrado |
| 08 | Convenções da API | [08-convencoes-api.md](./contratos/08-convencoes-api.md) | — |
| 09 | Teclas da máquina | [09-teclas-maquina.md](./contratos/09-teclas-maquina.md) | ✅ Integrado |
| 10 | Capas de pastas | [10-capas-pastas.md](./contratos/10-capas-pastas.md) | ⏳ Backend |

## Status geral (atualizado)

| Área | Frontend | Backend |
|------|----------|---------|
| Login máquina + token | ✅ | ✅ |
| Biblioteca (`GET /musicas/`) | ✅ | ✅ |
| Contagens (`subfolders_count`, `files_count`) | ✅ | ✅ |
| Player (`media_url` direto do R2) | ✅ | ✅ |
| Créditos (`POST /maquinas/creditos/`) | ✅ | ✅ |
| Música tocada (`POST /maquinas/tocadas/`) | ✅ | ✅ |
| Teclas configuráveis | ✅ | ✅ |
| Fila persistente / API | ❌ Local | ⏳ Pendente |
| Capas herdadas no sync | ⏳ Usa `cover_url` direto | ⏳ Pendente |

## Base URL

| Ambiente | Variável | Valor |
|----------|----------|-------|
| Desenvolvimento | `VITE_API_BASE_URL` | `https://backendjukebox-dev.up.railway.app` |
| Produção | `VITE_API_BASE_URL` | URL do deploy Railway |

## Código-fonte principal

| Área | Arquivos |
|------|----------|
| API client | `src/api/client.js`, `src/api/config.js` |
| Auth | `src/api/auth.js`, `src/context/AuthContext.jsx` |
| Biblioteca | `src/api/musicas.js`, `src/hooks/useLibrary.js`, `src/lib/library.js` |
| Eventos | `src/api/maquinas.js` |
| Teclas | `src/lib/keyboard.js`, `src/hooks/useKeyboardShortcuts.js` |
| UI | `src/components/jukebox/*` |

## Referência backend

- `docs_para_front/contratos/06-musicas-listar.md` — biblioteca
- `docs_para_front/contratos/09-maquinas.md` — login, teclas, config
- `docs_para_front/contratos/10-maquinas-eventos.md` — créditos, tocadas

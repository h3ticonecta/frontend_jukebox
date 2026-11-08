# Documentação de Contratos — JUKE-BOX Frontend

Contratos de integração entre o **frontend React** (este repo) e o **backend Django**.

A pasta `docs/contratos/` é a **documentação canônica** deste projeto: endpoints, mapeamento UI e status da integração.

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
| 11 | Painel Administrativo | [11-painel-administrativo.md](./contratos/11-painel-administrativo.md) | ✅ Integrado |
| 12 | Roleta (config + jogo) | [12-roleta.md](./contratos/12-roleta.md) | ✅ Integrado |

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
| Painel Administrativo (`#/admin`) | ✅ | ✅ |
| Roleta — editor no painel admin | ✅ | ✅ |
| Roleta — jogo na jukebox | ✅ | ✅ (prêmios ainda locais) |

## Base URL

| Ambiente | Variável | Valor |
|----------|----------|-------|
| Desenvolvimento | `VITE_API_BASE_URL` | `https://backendjukebox-dev.up.railway.app` |
| Produção | `VITE_API_BASE_URL` | `https://paineljukebox.h3ti.com.br` (domínio customizado do backend) |

> **Host check do Django (corrigido no backend em nov/2026):** `backendjukebox-dev.up.railway.app` agora está fixo no `ALLOWED_HOSTS`/`CSRF_TRUSTED_ORIGINS` — chamadas diretas funcionam sem `400 DisallowedHost`. Domínios customizados (ex.: `paineljukebox.h3ti.com.br`) entram via variável de ambiente `EXTRA_ALLOWED_HOSTS` no Railway. Superusuário do admin é criado/sincronizado a cada deploy via `DJANGO_SUPERUSER_USERNAME`/`DJANGO_SUPERUSER_PASSWORD`/`DJANGO_SUPERUSER_EMAIL` — são as credenciais do **Painel Administrativo** (`#/admin`). Health check: `GET /health/` deve responder `{"status":"ok","database":"postgresql","persistent":true}`.

> **Bancos separados por ambiente:** dev (`backendjukebox-dev.up.railway.app`) e produção (`paineljukebox.h3ti.com.br`) são **serviços Railway distintos, cada um com seu PostgreSQL**. O superusuário `admin` precisa ser criado/sincronizado **em cada serviço** (definir `DJANGO_SUPERUSER_*` nas Variables do serviço correspondente + redeploy). Criar o usuário só no dev **não** faz o login funcionar no `#/admin` de produção — e vice-versa.

## Código-fonte principal

| Área | Arquivos |
|------|----------|
| API client | `src/api/client.js`, `src/api/config.js` |
| Auth | `src/api/auth.js`, `src/context/AuthContext.jsx` |
| Biblioteca | `src/api/musicas.js`, `src/hooks/useLibrary.js`, `src/lib/library.js` |
| Eventos | `src/api/maquinas.js` |
| Teclas | `src/lib/keyboard.js`, `src/hooks/useKeyboardShortcuts.js` |
| UI | `src/components/jukebox/*` |

## Contratos por área

| Área | Contrato |
|------|----------|
| Biblioteca / pastas / faixas | [02](./contratos/02-generos.md), [03](./contratos/03-artistas-albuns.md), [04](./contratos/04-faixas.md) |
| Login, teclas, config | [01](./contratos/01-sessao-dispositivo.md), [09](./contratos/09-teclas-maquina.md) |
| Créditos e tocadas | [06](./contratos/06-creditos.md), [04](./contratos/04-faixas.md) |
| Capas no sync | [10](./contratos/10-capas-pastas.md) |
| Painel Administrativo | [11](./contratos/11-painel-administrativo.md) |
| Roleta (configuração + jogo) | [12](./contratos/12-roleta.md) |

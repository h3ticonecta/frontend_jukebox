# Contrato 05 — Fila de Espera

## Componentes frontend

- `src/components/jukebox/WaitQueuePanel.jsx`
- `src/components/jukebox/PlayerBar.jsx` — contador "em espera"
- `src/App.jsx` — `queue` (estado React + `localStorage`)
- `src/lib/storage.js` — `getSessionQueue()`, `setSessionCurrentSong()`
- `src/lib/queueMediaCache.js` — pré-cache das próximas 5 faixas
- `public/sw.js` — Cache Storage (áudios da fila + capas R2)

## Descrição

Exibe músicas aguardando reprodução e a faixa **tocando agora** com equalizador animado.

## Status

| Funcionalidade | Status |
|----------------|--------|
| UI da fila | ✅ |
| Adicionar via tecla/botão "fila" | ✅ |
| Destaque ao pressionar tecla "fila" | ✅ |
| Pular faixa (tecla + player) | ✅ |
| Persistência / API backend | ❌ |
| Fila persistida (`localStorage`, sobrevive reboot) | ✅ |
| Retomada automática após religar a máquina | ✅ |
| Pré-cache das próximas 5 faixas (Cache Storage) | ✅ |
| Sincronização entre terminais | ❌ |

> A fila **não** está no backend. Metadados ficam em `localStorage` (`jukebox_session_queue`). A faixa **em reprodução** permanece na posição 0 da fila (`playbackStarted: true`), para não perder a música se a máquina desligar no meio. `jukebox_session_current_song` é espelho auxiliar para reboot. Ao reiniciar, a fila inteira é restaurada e o app retoma `fila[0]` sem remover itens. O áudio das próximas **5** faixas (+ a que está tocando) é pré-baixado no Cache Storage via Service Worker — **não** a biblioteca inteira.

---

## Estrutura local de um item

```javascript
{
  id: track.key,           // chave R2
  key: "Musicas/.../song.mp3",
  title: "Yesterday",
  artist: "Beatles",       // de folder_path (contrato 04)
  cover: "https://...",    // cover_url ou capa do álbum
  media_url: "https://..."
}
```

---

## Mapeamento na UI

| Campo | Elemento |
|-------|----------|
| `title` | Título na fila |
| `artist` | Subtítulo (se ≠ título) |
| `queue.length - 1` (com faixa tocando) | Badge "em espera" no rodapé |
| `queue[0]` | Faixa em reprodução — bloco "Tocando agora" |
| `queue.slice(1)` | Lista numerada de espera na UI |

---

## Fluxo atual

```javascript
handlePlay(track)
  → POST /maquinas/tocadas/ + debita 1 crédito
  → coloca a faixa em fila[0] (`playbackStarted: true`) e reproduz

handleAddToQueue(track)  // tecla "fila" / botão na lista
  → botão sempre clicável; exige saldo ≥ 1 × CREDITS_PER_SONG
  → se insuficiente: mensagem "Créditos insuficientes" no header (sem adicionar)
  → debita 1 crédito e acrescenta ao final da fila (sem tocar)

handlePlayNext()  // fim da faixa, botão próximo ou tecla "pular"
  → remove fila[0] (faixa que acabou)
  → se ainda houver itens: toca novo fila[0] (POST tocadas, sem novo débito)
  → senão: para o player

// Ao religar a máquina (boot do app com token válido)
  → restaura fila completa do localStorage (faixa tocando permanece em fila[0])
  → retoma fila[0]: se `playbackStarted`, só áudio; senão POST tocadas (sem débito)
  → não remove itens da fila no boot
```

---

## Endpoints futuros (não implementados no backend)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/v1/maquinas/fila/` | Consultar fila |
| `POST` | `/api/v1/maquinas/fila/` | Adicionar à fila |
| `DELETE` | `/api/v1/maquinas/fila/{id}/` | Remover item |

Quando disponíveis, o front deve substituir o `useState` local por sincronização com a API.

---

## Tecla "fila"

Ação configurável no backend (`acao: "fila"`). Destaca o painel da fila por 2 segundos (borda ciano).

## Pendências

- [ ] Definir se fila é por máquina ou por estabelecimento
- [ ] Endpoints de fila no backend
- [ ] Remover item da fila pela UI

# Contrato 05 — Fila de Espera

## Componentes frontend

- `src/components/jukebox/WaitQueuePanel.jsx`
- `src/components/jukebox/PlayerBar.jsx` — contador "em espera"
- `src/App.jsx` — `queue` (estado React)

## Descrição

Exibe músicas aguardando reprodução e a faixa **tocando agora** com equalizador animado.

## Status

| Funcionalidade | Status |
|----------------|--------|
| UI da fila | ✅ |
| Adicionar ao tocar | ✅ |
| Destaque ao pressionar tecla "fila" | ✅ |
| Pular faixa (tecla + player) | ✅ |
| Persistência / API backend | ❌ |
| Sincronização entre terminais | ❌ |

> A fila existe **apenas no estado React** e é perdida ao recarregar a página. O backend ainda não expõe endpoints de fila.

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
| `queue.length` | Badge no header + rodapé |
| Faixa atual | Bloco "Tocando agora" com `EqualizerBars` |

---

## Fluxo atual

```javascript
handlePlay(track)
  → POST /maquinas/tocadas/
  → audio.play(song)
  → handleAddToQueue(track)  // adiciona à fila local

handleSkip()  // tecla "pular"
  → audio.skip()
  → remove primeiro da fila
  → toca próximo se houver
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

# Contrato — Configurações do Jukebox

Módulo de configurações gerais, teclas, pastas, créditos e roleta.  
Somente o que o frontend consome e exibe.

---

## Objeto raiz

```ts
interface JukeboxSettings {
  keys: NavigationKeyMap;
  general: GeneralSettings;
  roulette: RouletteSettings;
  folders: FolderSettings;
}
```

---

## Teclas (`keys`)

```ts
interface NavigationKeyMap {
  right: string;
  left: string;
  up: string;
  down: string;
  number: string;        // abre HITS
  credit: string;        // insere crédito
  cancel: string;
  skip: string;
  eraser: string;
  queue: string;
  volUp: string;
  volDown: string;
  direct?: string;
  num0: string;
  num1: string;
  num2: string;
  num3: string;
  num4: string;
  num5: string;
  num6: string;
  num7: string;
  num8: string;
  num9: string;
  correct?: string;
  preSelect?: string;
  erasePreSelect?: string;
}
```

**Defaults:**

```json
{
  "right": "r", "left": "e", "up": "q", "down": "w",
  "number": "i", "credit": "k", "cancel": "Enter",
  "skip": "p", "eraser": "Escape", "queue": "f",
  "volUp": "PageUp", "volDown": "PageDown",
  "num0": "0", "num1": "1", "num2": "2", "num3": "3",
  "num4": "4", "num5": "5", "num6": "6", "num7": "7",
  "num8": "8", "num9": "9",
  "correct": "Backspace", "preSelect": "s", "erasePreSelect": "a"
}
```

**Labels exibidos no dropdown:**

| key | Label UI |
|-----|----------|
| up | ⬆ Cima |
| down | ⬇ Baixo |
| left | ⬅ Esquerda |
| right | ➡ Direita |
| credit | 💰 Crédito |
| number | 🔢 HITS |
| queue | 📋 Fila |
| skip | ⏭ Pular |
| volUp | 🔊 Vol+ |
| volDown | 🔉 Vol- |
| cancel | ❌ Cancelar |

---

## Configurações gerais (`general`)

```ts
interface GeneralSettings {
  numeric: boolean;
  freeCredits: boolean;
  repeatSong: boolean;
  randomSongMin: number;
  fullScreenTimer: number;        // segundos
  freeSongs: number;
  autoPlay: boolean;
  mostPlayedCds: number;
  karaoke: boolean;
  queueSize: number;
  game: boolean;
  audioChannel: string;
  prizeActive: boolean;
  prizeValue: number;
  prizeProbability: number;
  creditsFor1: number;
  creditsFor2: number;
  creditsFor5: number;
  creditsFor10: number;
  creditsFor20: number;
  creditsFor50: number;
  creditsFor100: number;
  tv: boolean;
  fontColor: string;              // hex
  fontSize: number;
  cdEffects: boolean;
  resolution: string;
  cdNavigation: boolean;
  coversAmount: number;
  doubleCreditVideoke: boolean;
  controlVolumeWithArrows: boolean;
  touchScreen: boolean;
  cdNameFontSize: number;
}
```

**Defaults principais:**

| Campo | Default |
|-------|---------|
| repeatSong | `true` |
| randomSongMin | `20` |
| fullScreenTimer | `25` |
| freeSongs | `10` |
| mostPlayedCds | `15` |
| karaoke | `true` |
| game | `true` |
| resolution | `"1024x768"` |
| coversAmount | `3` |
| fontColor | `"#FBEC3F"` |
| fontSize | `15` |
| cdNameFontSize | `18` |

---

## Pastas (`folders`)

```ts
interface FolderSettings {
  genre: string;
  ads: string;
  randomVideos: string;
  randomSongs: string;
  companyCard: string;
  bgImage: string;
  prizeImage: string;
}
```

**Defaults:**

| Campo | Path default |
|-------|--------------|
| genre | `Musicas/` |
| ads | `Propaganda/` |
| randomVideos | `Videosaleatorios/` |
| randomSongs | `Musicasaleatorias/` |
| companyCard | `Cartaodaempresa/` |
| bgImage | `imagemfundo/` |
| prizeImage | `Imagempremio/` |

**Labels na UI:**

| Campo | Label |
|-------|-------|
| genre | Gênero |
| ads | Propaganda |
| randomVideos | Vídeos Aleatórios |
| randomSongs | Músicas Aleatórias |
| companyCard | Cartão da Empresa |
| bgImage | Imagem de Fundo |
| prizeImage | Imagem do Prêmio |

---

## Roleta (`roulette`)

Ver contrato completo em [roulette.md](./roulette.md).

---

## Modal de configurações — props

```ts
interface JukeboxSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  machineId: string;
  settings: JukeboxSettings;
  onSave: (settings: JukeboxSettings) => Promise<void>;
}
```

**Abas internas:**

| Aba | Conteúdo |
|-----|----------|
| Geral | GeneralSettings |
| Créditos | CreditConversionConfig |
| Botões | NavigationKeyMap |
| Roleta | RouletteSettings |
| Pastas | FolderSettings |
| Sincronização | Status de sync de mídia |

**Campos readonly no bloco Registro:**
- Empresa
- Número de Série da Máquina
- Código Empresa
- Serial HD
- Versão Web: `1.0`

**Footer:** botões `SALVAR` e `SAIR`

---

## Hook de configurações (contrato frontend)

```ts
interface UseSettingsResult {
  settings: JukeboxSettings;
  isLoaded: boolean;
  saveSettings: (settings: JukeboxSettings) => Promise<void>;
  reload: () => Promise<void>;
}

function useSettings(machineId: string | null): UseSettingsResult;
```

---

## Alterar senha de administrador

```ts
interface ChangeAdminPasswordRequest {
  senhaAntiga: string;
  senhaNova: string;
  confirmarSenha: string;
}
```

**Validações:**
- Senha antiga incorreta → `Senha antiga incorreta.`
- Nova senha < 4 chars → `A nova senha deve ter pelo menos 4 caracteres.`
- Confirmação diferente → `As senhas não coincidem.`
- Falha ao salvar → `Não foi possível salvar a nova senha. Tente novamente.`

---

## Eventos emitidos pela UI

```ts
type SettingsUIEvent =
  | { type: 'SETTINGS_SAVED'; settings: JukeboxSettings }
  | { type: 'ADMIN_PASSWORD_CHANGED' }
  | { type: 'FOLDERS_UPDATED'; folders: FolderSettings };
```

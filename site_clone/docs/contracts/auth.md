# Contrato — Autenticação e sessão

Módulos de login da máquina, setup técnico e acesso administrador.  
Somente o que o frontend consome e exibe.

---

## Sessão da máquina

```ts
interface MachineSession {
  userId: string;
  email: string;
  nomeMaquina: string;
  machineId: string | null;
  isActive: boolean;
}
```

---

## Login da máquina

```ts
interface MachineLoginRequest {
  nomeMaquina: string;
  senha: string;
}

interface MachineRegisterRequest {
  nomeMaquina: string;
  senha: string;
}

interface MachineAuthResponse {
  session: MachineSession;
  token?: string;
}
```

**Validações UI:**
- Nome duplicado no registro → `Já existe uma máquina com esse nome. Escolha outro.`
- Credenciais inválidas → `Nome ou senha incorretos.`

**Toasts:**
- Login OK → `Login realizado com sucesso!`
- Registro OK → `Máquina registrada e logada com sucesso!`

---

## Setup técnico (pós-login)

```ts
interface SetupTecnicoCardProps {
  session: MachineSession;
  onSaveMachineName: (nome: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}
```

**Campos:**
- Exibição: email logado, nome da máquina atual
- Input: `Nome da Máquina` (placeholder: `Ex: Bar do Zé`)
- Botão: `Salvar Nome` → toast `Nome da máquina atualizado!`
- Botão: `Sair da Sessão`

**Nota exibida:** sessão persistente; nome aparece no painel administrativo.

---

## Acesso administrador (senha local)

```ts
interface AdminPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Fluxo:**
1. Usuário digita senha (max 20 chars)
2. Se válida → `onSuccess()` e fecha
3. Se inválida → `Senha incorreta. Tente novamente.`

---

## Usuários do painel admin

```ts
type AdminRole = 'usuario' | 'admin';

interface AdminUser {
  id: string;
  nome: string;
  senha: string;
  role: AdminRole;
  createdAt?: TimestampISO;
}
```

**Props do dialog de usuário:**

```ts
interface UserDialogProps {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSave: (data: { nome: string; senha: string; role: AdminRole }) => Promise<void>;
}
```

**Erros exibidos:**
- Nome duplicado → `Nome já existe`
- Campos vazios → `Preencha todos os campos`

---

## Máquina (entidade de UI)

```ts
interface Machine {
  id: string;
  nomeMaquina: string;
  email: string;
  ativa: boolean;
  createdAt: TimestampISO;
}
```

---

## Estados de autenticação

```ts
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  session: MachineSession | null;
  adminUser: AdminUser | null;
}
```

---

## Eventos emitidos pela UI

```ts
type AuthUIEvent =
  | { type: 'MACHINE_LOGGED_IN'; session: MachineSession }
  | { type: 'MACHINE_LOGGED_OUT' }
  | { type: 'MACHINE_NAME_UPDATED'; nome: string }
  | { type: 'ADMIN_ACCESS_GRANTED' }
  | { type: 'ADMIN_USER_SAVED'; user: AdminUser };
```

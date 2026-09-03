# Contrato — Painel administrativo

Módulo de gestão de máquinas, dashboard e configurações centralizadas.  
Somente o que o frontend consome e exibe.

---

## Layout do painel

```ts
interface AdminPanelProps {
  user: AdminUser;
  onSignOut: () => void;
  onNavigateHome: () => void;
}
```

**Header:**
- Botão voltar (ghost icon)
- Título: `Painel Administrativo`
- Texto: `Logado como {nome}`
- Botão: `Sair` (outline sm)

---

## Abas

```ts
type AdminTab = 'dashboard' | 'maquinas' | 'configuracoes';

interface AdminTabsConfig {
  visibleTabs: AdminTab[];
  defaultTab: AdminTab;
}
```

| Aba | Visível para | Ícone |
|-----|--------------|-------|
| Dashboard | `admin` | BarChart |
| Máquinas | todos | Monitor |
| Configurações | todos | Settings |

---

## Dashboard

```ts
interface DashboardData {
  totalMachines: number;
  activeMachines: number;
  totalRevenue: number;
  totalCredits: number;
  topGenres: GenreStat[];
  recentTransactions: BillingRecord[];
}

interface GenreStat {
  genre: string;
  count: number;
}
```

**Card de estatística (`StatCard`):**

```ts
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  colorClass?: string;
}
```

**Estados vazios:**
- `Nenhum dado de estatísticas`
- `Nenhum dado de faturamento`
- `Sem registros`

---

## Gestão de máquinas

```ts
interface MachineTableProps {
  machines: Machine[];
  onToggleActive: (id: string, ativa: boolean) => Promise<void>;
  onEdit: (machine: Machine) => void;
  onDelete: (id: string) => void;
}
```

**Colunas da tabela:**

| Coluna | Campo |
|--------|-------|
| Nome | `nomeMaquina` |
| E-mail | `email` |
| Cadastrada em | `createdAt` (formatado) |
| Ativa | toggle boolean |
| Ações | Editar / Excluir |

**Header da seção:**
- Título: `Gestão de Máquinas`
- Subtítulo: `{n} cadastrada(s)`

**Dialog excluir:**
- Título: `Excluir máquina?`
- Botões: `Cancelar` (outline) / `Excluir` (destructive)

**Estado vazio:** `Nenhuma máquina cadastrada.`

---

## Configurações por máquina

```ts
interface MachineConfigSelectorProps {
  machines: Machine[];
  selectedMachineId: string | null;
  onSelectMachine: (machine: Machine) => void;
}
```

**Label:** `Selecione a máquina para configurar:`

Sub-modais abertos a partir da aba Configurações:
- Configurações Gerais
- Configuração de Créditos
- Configuração de Botões (teclas)
- Configuração da Roleta
- Configuração de Pastas

Cada um segue os contratos em [settings.md](./settings.md).

---

## Faturamento por máquina

```ts
interface MachineBillingSummary {
  machineId: string;
  nomeMaquina: string;
  totalReais: number;
  totalCreditos: number;
  period: BillingPeriodKey;
}
```

Ver modal completo em [credits-billing.md](./credits-billing.md).

---

## Usuários do painel

```ts
interface UserManagementProps {
  users: AdminUser[];
  onCreate: () => void;
  onEdit: (user: AdminUser) => void;
  onDelete: (id: string) => void;
}
```

**Dialog criar/editar:**
- Título: `Novo Usuário` / `Editar Usuário`
- Campos: Nome, Senha, Tipo de Acesso (role)
- Botão trigger: `Novo Usuário` (default + ícone Plus)

**Lista:** ações Editar (ghost sm) / Excluir (ghost sm, text-destructive)

**Estado vazio:** `Nenhum usuário cadastrado`

---

## Permissões por role

| Ação | `usuario` | `admin` |
|------|-----------|---------|
| Ver dashboard | ❌ | ✅ |
| Listar máquinas | ✅ | ✅ |
| Editar máquina | ✅ | ✅ |
| Excluir máquina | conforme regra | ✅ |
| Configurar máquina | ✅ | ✅ |
| Gerenciar usuários | ❌ | ✅ |

---

## Eventos emitidos pela UI

```ts
type AdminUIEvent =
  | { type: 'MACHINE_TOGGLED'; id: string; ativa: boolean }
  | { type: 'MACHINE_DELETED'; id: string }
  | { type: 'USER_SAVED'; user: AdminUser }
  | { type: 'USER_DELETED'; id: string }
  | { type: 'ADMIN_TAB_CHANGED'; tab: AdminTab };
```

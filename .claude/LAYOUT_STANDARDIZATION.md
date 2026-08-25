# Especificação: Padronização de Layout & Sidebar Retrátil (45 Páginas)

**Status:** Planejamento  
**Prioridade:** Alta  
**Escopo:** Portal completo SOMA Mentoria  

---

## 1. Objetivo

Padronizar o layout global de todas as 45 páginas implementando:
- **Sidebar Retrátil Global** (Collapsible Sidebar)
- **Módulo "Dica Rápida"** (QuickTip) contextualizado por página
- **Persistência de estado** do usuário (localStorage + Context)
- **Sem quebra de funcionalidades críticas** (Mercado Pago, Google OAuth, Magic Link)

---

## 1.1 Guardrails & Regras Invioláveis de Engenharia

**CRÍTICO - Não violar sob nenhuma circunstância:**

- ❌ **Zero Break em Autenticação & Checkout:** Mercado Pago, checkout, gestão de planos, Google Social Login e Magic Link são invioláveis.

- ❌ **Preservação de Design System:** 
  - Consultar obrigatoriamente `tailwind.config.ts` e `globals.css`
  - Proibido hardcode de estilos ou CSS redundante
  - Manter tipografia: serifa em H1/títulos, sans-serif em corpo/menus

- ❌ **Tratamento de Exceções:** Manter layouts customizados intactos (PDI, 90 Dias) sem aplicar App Shell

---

## 2. Arquitetura Proposta: App Shell Pattern

```
app/layout.tsx (Root Layout)
 ├── SidebarProvider (Context Global)
 ├── AppShell (Client Component)
 │   ├── Sidebar (Global & Retrátil)
 │   ├── Main Content Area
 │   │   └── {children} (45 páginas)
 │   └── Quick Tips (Renderizado dinamicamente)
 └── Gates (AcessoGate, TermosGate, PostHogInit)
```

---

## 3. Componentes a Serem Criados

### 3.1 SidebarContext (`lib/contexts/SidebarContext.tsx`)

```typescript
// Controla estado global da Sidebar (expandida/recolhida)
type SidebarContextType = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
};

export const useSidebar = () => useContext(SidebarContext);
```

**Comportamento:**
- Armazena em `localStorage` com chave `sidebar_state`
- Hidrata no cliente durante `useEffect`
- Persiste entre navegações

### 3.2 CollapsibleSidebar (`components/CollapsibleSidebar.tsx`)

```typescript
// Sidebar Retrátil Global
export default function CollapsibleSidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  return (
    <aside className={`transition-all duration-300 ${isCollapsed ? 'w-72px' : 'w-260px'}`}>
      {/* Logo, Toggle Button, Menu, User Footer */}
    </aside>
  );
}
```

**Requisitos:**
- Toggle button visível (ícone ChevronLeft/ChevronRight)
- Atalho teclado: `Cmd+B` / `Ctrl+B` para colapsar/expandir
- **Estados:**
  - Expandido (260px): Logo, textos completos, perfil do usuário
  - Recolhido (72px): Apenas ícones + Tooltips no hover
- Transição CSS suave (`transition-all duration-300`)
- Responsive: Mobile (`< 768px`) → Drawer overlay

### 3.3 AppShell (`components/AppShell.tsx`)

```typescript
// Wrapper que combina Sidebar + conteúdo + Quick Tips
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <CollapsibleSidebar />
      <main className="flex-1 overflow-y-auto transition-all duration-300">
        {children}
        <QuickTipRenderer />
      </main>
    </div>
  );
}
```

**Responsabilidades:**
- Gerenciar layout Flex (`min-h-screen`)
- Renderizar CollapsibleSidebar global
- Renderizar QuickTip dinâmico baseado em `usePathname()`
- Garantir scroll fluido no conteúdo principal

### 3.3 QuickTip (`components/QuickTip.tsx`)

```typescript
interface QuickTipProps {
  title: string;
  content: string;
  icon?: React.ReactNode;
}

export default function QuickTip({ title, content, icon }: QuickTipProps) {
  // Card reutilizável com estilos do Design System
}
```

**Variações:**
- Sidebar mode: Recolhe junto com a sidebar
- Page mode: Fixado na área principal

### 3.4 Quick Tips Config (`lib/data/quickTipsConfig.ts`)

```typescript
export const QUICK_TIPS: Record<string, QuickTipProps> = {
  '/dashboard': {
    title: 'Dica Rápida',
    content: 'Comece preenchendo seu perfil para personalizar sua experiência.',
  },
  '/pdi': {
    title: 'Estruture seu PDI',
    content: 'Responda com cuidado. Seus dados ajudam a personalizar sua mentoria.',
  },
  '/primeiros-90-dias': {
    title: 'Planeje seus 90 Dias',
    content: 'Selecione seu contexto STARS para receber estratégia personalizada.',
  },
  // ... 42 páginas adicionais
};

export function getQuickTipForPath(pathname: string): QuickTipProps | null {
  return QUICK_TIPS[pathname] || null;
}
```

---

## 4. Plano de Rollout Seguro (Faseado)

### Fase 1: Fundação & Isolamento
**Objetivo:** Criar componentes base sem impacto em produção

- [ ] Criar `SidebarContext` + Provider com `localStorage`
- [ ] Criar `CollapsibleSidebar` component
- [ ] Criar `AppShell` wrapper
- [ ] Criar `QuickTip` component
- [ ] Criar `quickTipsConfig.ts` com 45 páginas mapeadas
- [ ] **NÃO aplicar** no Root Layout ainda

**Validação Obrigatória:**
- ✅ Build sem erros
- ✅ Testes unitários para SidebarContext
- ✅ localStorage funciona corretamente
- ✅ Componentes isolados renderizam sem dependências

### Fase 2: Piloto (6 Páginas Simples)
**Objetivo:** Validar em rotas de menor risco

- [ ] Aplicar `AppShell` **APENAS** em:
  - `/dashboard`
  - `/vagas`
  - `/entrevista`
  - `/exercicios`
  - `/diario`
  - `/perfil`

**Validação Obrigatória:**
- ✅ Sidebar colapsa/expande corretamente
- ✅ Estado persiste entre navegações
- ✅ QuickTip renderiza contextuado
- ✅ Layout responsivo (mobile/tablet/desktop)
- ✅ Sem quebra em scroll ou interações

### Fase 3: Validação de Integrações Críticas
**Objetivo:** Garantir zero regressão em fluxos sensíveis

- [ ] Testar fluxo completo Google OAuth Login
- [ ] Testar fluxo completo Magic Link
- [ ] Testar fluxo completo Mercado Pago Checkout
- [ ] Testar atualização/downgrade de planos
- [ ] Testar Supabase queries/updates em todas as 6 páginas
- [ ] Testar PostHog analytics capture

**Validação Obrigatória - Lighthouse:**
- ✅ Performance >= 80
- ✅ Accessibility >= 90
- ✅ Best Practices >= 90
- ✅ SEO >= 90

### Fase 4: Expansão Gradual
**Objetivo:** Aplicar em lotes conforme validação passa

- [ ] Testar grupo 1: Admin + Painel de Gestão (3-5 páginas)
- [ ] Testar grupo 2: Onboarding + Inicial (5-7 páginas)
- [ ] Testar grupo 3: Recursos (5-7 páginas)
- [ ] Testar grupo 4: Páginas Auxiliares (5-10 páginas)
- [ ] **MANTER INTACTAS:** PDI, 90 Dias, MeuPDI (estruturas customizadas)

**Validação por Lote:**
- ✅ Build sem erros
- ✅ Nenhuma regressão em rotas anteriores
- ✅ Funcionalidades específicas da página funcionam

### Fase 5: Refinamento & Production
**Objetivo:** UX melhorada e release final

- [ ] Atalhos teclado (Cmd+B / Ctrl+B)
- [ ] Tooltips no estado recolhido
- [ ] Transições CSS otimizadas
- [ ] Drawer overlay para mobile
- [ ] Testes E2E em staging
- [ ] Deploy para production

---

## 5. Integração no Root Layout (Fase 2)

```typescript
// app/layout.tsx
import { SidebarProvider } from '@/lib/contexts/SidebarContext';
import AppShell from '@/components/AppShell';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SidebarProvider>
          <AppShell>
            {children}
          </AppShell>
        </SidebarProvider>
        <PostHogInit />
        <AcessoGate />
        <TermosGate />
      </body>
    </html>
  );
}
```

---

## 6. Exceções & Páginas Customizadas

### PDI (`/pdi/PdiClient.tsx`)
- **Motivo:** Tem sidebar interno com navegação de seções
- **Ação:** Manter layout 100% intacto, sem AppShell

### Primeiros 90 Dias (`/primeiros-90-dias/Primeiros90DiasClient.tsx`)
- **Motivo:** Tem Sidebar retrátil customizado + blocos laterais de navegação
- **Ação:** Manter layout 100% intacto, sem AppShell

### Páginas de Login, Auth, Landing
- **Motivo:** Layouts radicalmente diferentes
- **Ação:** Não aplicar AppShell; avaliar caso a caso

---

## 7. Validações Críticas (Não Quebrar)

Antes de mergear qualquer mudança:

- [ ] **Mercado Pago:** Checkout flow funciona end-to-end
- [ ] **Google OAuth:** Login social sem erros
- [ ] **Magic Link:** Autenticação por link continua funcionando
- [ ] **Supabase:** Todas as queries/upserts funcionam
- [ ] **PostHog:** Analytics capturam eventos corretamente
- [ ] **Responsividade:** Mobile, tablet, desktop sem issues
- [ ] **Performance:** Lighthouse >= 80 em todas as métricas

---

## 8. Commits Recomendados

```
1. feat: Create SidebarContext and AppShell components
2. feat: Add QuickTip component and tips configuration
3. feat: Apply AppShell to 6 core pages (dashboard, vagas, entrevista, exercicios, diario, perfil)
4. test: Validate no breakage on integrations and auth flows
5. refactor: Expand AppShell to additional pages (incremental)
```

---

## 9. Roadmap

| Semana | Ação | Status |
|--------|------|--------|
| Week 1 | Setup componentes + contexto | 🟡 Planejado |
| Week 2 | Aplicar em 6 páginas simples | 🟡 Planejado |
| Week 3 | Testes + validações críticas | 🟡 Planejado |
| Week 4 | Expandir para mais páginas | 🟡 Planejado |
| Week 5 | Refinamento final (UX/animações) | 🟡 Planejado |

---

## 10. Notas

- **Não forçar mudanças:** Se uma página tem layout customizado, deixar como está. Ganho marginal não vale o risco.
- **Testar incrementalmente:** Mergear pequenas mudanças e validar antes de próximas.
- **Documentar exceções:** Manter claro quais páginas não usam AppShell e por quê.
- **Preservar funcionalidades:** Integração Mercado Pago, auth flows e dados do usuário são invioláveis.

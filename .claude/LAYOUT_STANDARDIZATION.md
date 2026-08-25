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

### 3.2 AppShell (`components/AppShell.tsx`)

```typescript
// Wrapper que combina Sidebar + conteúdo + Quick Tips
export default function AppShell({ children }: { children: React.ReactNode }) {
  // Renderiza Sidebar global + main content + QuickTip contextuada
}
```

**Responsabilidades:**
- Gerenciar layout Flex (`w-full h-screen`)
- Aplicar classes Tailwind para Sidebar (expandida/recolhida)
- Renderizar QuickTip baseado na rota atual (`usePathname()`)
- Garantir scroll no conteúdo principal

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

## 4. Implementação por Fase

### Fase 1: Setup (Seguro & Isolado)
- [ ] Criar `SidebarContext` + Provider
- [ ] Criar `AppShell` component
- [ ] Criar `QuickTip` component
- [ ] Criar `quickTipsConfig.ts`
- [ ] **Não aplicar** no Root Layout ainda

**Validação:**
- Testes unitários para Context
- Testes de componentes isolados
- Build sem erros

### Fase 2: Aplicação Gradual (Páginas Simples Primeiro)
- [ ] Aplicar `AppShell` **APENAS** para:
  - `/dashboard`
  - `/vagas`
  - `/entrevista`
  - `/exercicios`
  - `/diario`
  - `/perfil`

**NÃO aplicar para** (páginas com estrutura customizada):
- `/pdi` → Manter layout com sidebar interno + seções
- `/primeiros-90-dias` → Manter Sidebar retrátil customizado + blocos laterais
- `/meu-pdi` → Manter tabs e estrutura atual
- Páginas de admin, onboarding, etc. → Avaliar caso a caso

### Fase 3: Expansão Incremental
- [ ] Testar cada grupo de páginas
- [ ] Adicionar mais páginas conforme confirmado sem quebras
- [ ] Documentar exceções

### Fase 4: Refinamento
- [ ] Atalhos de teclado (Cmd+B / Ctrl+B para toggle)
- [ ] Tooltips no estado recolhido
- [ ] Responsividade mobile (drawer overlay)
- [ ] Animações suaves CSS

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

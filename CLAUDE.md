# SOMA Mentoria - Rules & Architecture Lock

## 🛑 STRICTLY FROZEN FILES (READ-ONLY)

**NEVER modify, refactor, edit, or touch these files under ANY circumstances:**

- `app/(dashboard)/layout.tsx`
- `app/layout.tsx`
- `components/AppShell.tsx`
- `app/globals.css`
- `tailwind.config.js` / `tailwind.config.ts`
- `next.config.ts`
- `vercel.json`

Violating this rule breaks the entire dashboard layout and sidebar behavior.

## 🔒 LAYOUT & STRUCTURE RESTRICTIONS

**MANDATORY RULES:**

1. **DO NOT add layout classes to child components**
   - ❌ `w-screen`, `vw`, `fixed`, `absolute` positioning
   - ❌ Custom `padding`, `margin` on containers that override page structure
   - ❌ `overflow-y-auto`, `overflow-x-auto` on page wrappers
   - ❌ Rewriting `flex`, `grid`, or `width` props of parent containers

2. **Scope ALL changes strictly inside the target component**
   - Example: fixing `/admin/feedbacks` → edit ONLY `app/(dashboard)/admin/feedbacks/page.tsx`
   - Example: adding a feature to `/simulador-cv` → edit ONLY `app/(dashboard)/simulador-cv/SimuladorCVClient.tsx`
   - **DO NOT touch any parent layout files**

3. **Before committing: MANDATORY verification**
   ```bash
   git diff --stat
   ```
   If ANY of the frozen files appear in the diff, **IMMEDIATELY discard changes**:
   ```bash
   git checkout -- <frozen-file>
   ```

## 📋 Codebase Architecture

- **Layout Shell**: `components/AppShell.tsx` handles all sidebar/main-content structure
- **Page Container**: Each page inherits safe padding from AppShell
- **Styling System**: Tailwind config is locked — no custom CSS modifications
- **Component Boundaries**: Each page/component manages ONLY its own internal layout

## ✅ Safe Patterns

✅ Adding features inside a component
✅ Styling elements within `<div>` containers of a component
✅ Adjusting margins/padding INSIDE component content (not the root)
✅ Creating new components that DON'T modify layout structure

## ⚙️ Next.js Version Note

@AGENTS.md

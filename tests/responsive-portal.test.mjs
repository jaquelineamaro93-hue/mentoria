// Regressões estruturais da experiência responsiva SOMA.
 // Testes de largura, toque, foco, acessibilidade e composição básica.
 // Complementar com QA visual real em Safari, Chrome, Firefox e Edge.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('sidebar desktop/tablet compartilham breakpoint responsivo', () => {
  const css = src('components/PortalShell.module.css');
  const js = src('lib/contexts/SidebarContext.tsx');
  assert.match(css, /@media \(max-width: 1199px\) \{/);
  assert.match(js, /matchMedia\('\(max-width: 1199px\)'\)/);
  assert.match(css, /\.sidebar \{ width: min\(310px, calc\(100vw - 32px\)\); transform: translateX\(-100%\)/);
  assert.match(css, /\.mobileToggle \{ display: grid/);
});

test('layout define viewport e safe area para celular e tablet', () => {
  const layout = src('app/layout.tsx');
  const css = src('components/PortalShell.module.css');
  assert.match(layout, /width: 'device-width'/);
  assert.match(layout, /viewportFit: 'cover'/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@media \(max-width: 639px\)/);
});

test('Íris adapta painel para celular e notebook, sem ocultar compositor', () => {
  const ui = src('components/IrisCopiloto.tsx');
  assert.match(ui, /matchMedia\('\(max-width: 639px\)'\)/);
  assert.match(ui, /window\.visualViewport/);
  assert.match(ui, /viewport\.addEventListener\('resize'/);
  assert.match(ui, /role=\{mobile \? 'dialog' : 'region'\}/);
  assert.match(ui, /aria-modal=\{mobile \? true : undefined\}/);
  assert.match(ui, /env\(safe-area-inset-bottom\)/);
  assert.match(ui, /text-base text-\[#312b27\]/);
  assert.match(ui, /min-h-0 flex-1/);
});

test('Copiloto suporta navegação com teclado e confirma ações', () => {
  const ui = src('components/IrisCopiloto.tsx');
  assert.match(ui, /event\.key === 'Escape'/);
  assert.match(ui, /event\.key !== 'Tab'/);
  assert.match(ui, /acionador\.current\?\.focus/);
  assert.match(ui, /Confirmar e salvar/);
  assert.match(ui, /Cancelar/);
});

test('PDI permite rolar abas e mantém alvos de toque acessíveis', () => {
  const pdi = src('app/(dashboard)/meu-pdi/MeuPdiClient.tsx');
  assert.match(pdi, /overflow-x-auto/);
  assert.match(pdi, /snap-x/);
  assert.match(pdi, /min-h-11/);
  assert.match(pdi, /min-w-0 w-full/);
});

test('cards do dashboard priorizam leitura em notebooks', () => {
  const dash = src('app/(dashboard)/dashboard/DashboardClient.tsx');
  assert.match(dash, /sm:grid-cols-2 2xl:grid-cols-4/);
});

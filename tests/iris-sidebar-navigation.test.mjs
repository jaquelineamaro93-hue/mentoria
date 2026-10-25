import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Menu lateral possui seção própria Íris Copiloto com acesso ao plano', () => {
  const nav = read('lib/config/portalNavigation.ts');
  const sidebar = read('components/CollapsibleSidebar.tsx');
  const grupo = nav.match(/id: 'iris-copiloto',[\s\S]*?items:\s*\[([\s\S]*?)\],/);
  assert.ok(grupo, 'Seção de navegação Íris Copiloto ausente');
  assert.match(nav, /label: 'Íris Copiloto'/);
  assert.match(grupo[1], /href: '\/plano-acoes-iris', label: 'Plano de Ação Íris', icon: ClipboardList/);
  assert.match(sidebar, /portalNavGroups\.map\(group =>/);
  assert.match(sidebar, /aria-expanded=\{open\}/);
  assert.match(sidebar, /containsActive \|\| !closedGroups\[group\.id\]/);
  assert.match(sidebar, /group\.items\.map\(navLink\)/);
  assert.match(sidebar, /const active = isPortalRouteActive\(pathname, item\.href, currentSearch\)/);
  assert.match(sidebar, /onClick=\{closeMobileSidebar\}/);
});

test('O Plano de Ação Íris abre a página existente, com histórico próprio e sem substituir o PDI', () => {
  const page = read('app/(dashboard)/plano-acoes-iris/page.tsx');
  const client = read('app/(dashboard)/plano-acoes-iris/PlanoAcoesIrisClient.tsx');
  const api = read('app/api/copiloto/plano-acoes/route.ts');
  const analytics = read('lib/product-analytics.ts');
  const tips = read('lib/config/tipsConfig.ts');

  assert.match(page, /title: 'Plano de Ação Íris \| SOMA Mentoria'/);
  assert.match(page, /return <PlanoAcoesIrisClient \/>/);
  assert.match(page, /redirect\('\/login'\)/);
  assert.match(client, /<LocalizedText text=\{"Plano de Ação Íris"\} \/>/);
  assert.match(client, /Meus planos salvos/);
  assert.match(client, /Confirmar e salvar meu plano/);
  assert.match(client, /aria-valuenow=\{percentual\}/);
  assert.match(client, /sem mexer no PDI/);
  assert.match(api, /\.from\('iris_action_plans'\)/);
  assert.doesNotMatch(api, /\.from\('pdi_(?:planos|acoes)'\)/);
  assert.match(analytics, /key: 'iris_plano_acao', label: 'Plano de Ação Íris', group: 'Íris Copiloto'/);
  assert.match(tips, /'\/plano-acoes-iris': \{/);
});

test('A inclusão da Íris não remove os demais grupos de navegação', () => {
  const nav = read('lib/config/portalNavigation.ts');
  for (const id of ['jornada', 'empresa', 'mercado', 'experiencia', 'comunidade', 'espaco']) {
    assert.ok(nav.includes("id: '" + id + "'"), 'Grupo anterior ausente: ' + id);
  }
  assert.match(nav, /href: '\/meu-pdi', label: 'Plano de desenvolvimento'/);
  assert.match(nav, /href: '\/carreira\?etapa=vagas'/);
});

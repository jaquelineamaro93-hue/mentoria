/* Permission and input validation regression checks, no network or user data. */
const { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } = require('node:fs');
const { join, dirname, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = resolve(__dirname, '..');
const temp = mkdtempSync(join(tmpdir(), 'soma-help-test-'));
let checks = 0;
function check(label, fn) { fn(); checks++; console.log('PASS', label); }
try {
  for (const file of ['lib/saas-access.ts', 'lib/help-center/types.ts', 'lib/help-center/access.ts', 'lib/help-center/validation.ts', 'lib/help-center/intent.ts', 'lib/help-center/navigation.ts']) {
    const out = join(temp, file.replace(/\.ts$/, '.js'));
    mkdirSync(dirname(out), { recursive: true });
    const source = readFileSync(join(root, file), 'utf8').replace(/@\/lib\/saas-access/g, join(temp, 'lib/saas-access.js'));
    writeFileSync(out, ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText);
  }
  const { canReadArticle, canOpenFeature, searchHelpArticles } = require(join(temp, 'lib/help-center/access.js'));
  const { safeHelpPath } = require(join(temp, 'lib/help-center/types.js'));
  const { parseHelpArticle, parseHelpRelease, isHelpId } = require(join(temp, 'lib/help-center/validation.js'));
  const { saasCanVisit } = require(join(temp, 'lib/saas-access.js'));
  const { helpIntent } = require(join(temp, 'lib/help-center/intent.js'));
  const { helpHeadings, helpReadingMinutes, relatedHelpArticles } = require(join(temp, 'lib/help-center/navigation.js'));
  check('heading anchors normalize accents and remove inline markup', () => assert.deepEqual(helpHeadings('## Como usar o **Diário**?').map(h => h.id), ['ajuda-como-usar-o-diario']));
  check('duplicate headings get unique stable IDs', () => assert.deepEqual(helpHeadings('## Passos\n### Passos').map(h => h.id), ['ajuda-passos','ajuda-passos-2']));
  check('fenced code headings do not create broken TOC links', () => assert.deepEqual(helpHeadings('```md\n## Exemplo\n```\n## Real').map(h => [h.title,h.line]), [['Real',4]]));
  check('estimated reading time remains at least one minute', () => assert.equal(helpReadingMinutes('Breve tutorial'), 1));
  const current = { id:'current', title:'PDI com a Íris', category:'Jornada' };
  const candidates = [current,{ id:'other', title:'Outro recurso', category:'Conta' },{ id:'related', title:'Suas metas', category:'Jornada' }];
  check('related articles prefer the same collection', () => assert.equal(relatedHelpArticles(candidates,current)[0].id, 'related'));
  check('related articles exclude the current guide and honor limits', () => assert.deepEqual(relatedHelpArticles(candidates,current,1).map(a=>a.id), ['related']));
  check('leadership job search keeps career coaching', () => assert.equal(helpIntent('Como encontrar vagas de liderança?'), null));
  check('salary negotiation keeps career coaching', () => assert.equal(helpIntent('Quero um passo a passo para negociar meu salário'), null));
  check('interview preparation keeps career coaching', () => assert.equal(helpIntent('Quero um tutorial para me preparar para uma entrevista'), null));
  check('market news keeps career coaching', () => assert.equal(helpIntent('Quais são as novidades do mercado de trabalho?'), null));
  check('external platform questions keep career coaching', () => assert.equal(helpIntent('Como encontrar vagas na plataforma LinkedIn?'), null));
  check('PDI how-to uses documentation', () => assert.equal(helpIntent('Como usar o PDI?'), 'tutorial'));
  check('explicit portal help uses documentation', () => assert.equal(helpIntent('Onde encontro minhas ferramentas no portal da SOMA?'), 'tutorial'));
  check('SOMA updates use release feed', () => assert.equal(helpIntent('O que há de novo na SOMA?'), 'news'));
  const base = { userId: 'account-a', admin: false, access: { saas: true, mentorship: false, iris: false, modules: ['curriculo-ats'], whatsapp: false, trialEndsAt: null } };
  const article = { status: 'published', published_at: '2026-01-01T00:00:00Z', audience: 'all', requires_iris: false };
  check('general guide visible to authenticated SaaS account', () => assert.equal(canReadArticle(article, base), true));
  check('draft hidden from normal account', () => assert.equal(canReadArticle({ ...article, status: 'draft' }, base), false));
  check('archived hidden from normal account', () => assert.equal(canReadArticle({ ...article, status: 'archived' }, base), false));
  check('future publication hidden', () => assert.equal(canReadArticle({ ...article, published_at: '2099-01-01T00:00:00Z' }, base), false));
  check('admin-only hidden', () => assert.equal(canReadArticle({ ...article, audience: 'admin' }, base), false));
  check('mentorship guide hidden from SaaS account', () => assert.equal(canReadArticle({ ...article, audience: 'mentorship' }, base), false));
  check('purchased module guide visible', () => assert.equal(canReadArticle({ ...article, audience: 'curriculo-ats' }, base), true));
  check('unowned module guide hidden', () => assert.equal(canReadArticle({ ...article, audience: 'desenvolvimento' }, base), false));
  check('Iris guide hidden without Iris', () => assert.equal(canReadArticle({ ...article, requires_iris: true }, base), false));
  check('Iris alone does not unlock PDI documentation', () => assert.equal(canReadArticle({ ...article, audience: 'desenvolvimento', requires_iris: true }, { ...base, access: { ...base.access, iris: true } }), false));
  check('module and Iris together unlock PDI guide', () => assert.equal(canReadArticle({ ...article, audience: 'desenvolvimento', requires_iris: true }, { ...base, access: { ...base.access, iris: true, modules: ['desenvolvimento'] } }), true));
  check('mentorship unlocks mentorship documentation', () => assert.equal(canReadArticle({ ...article, audience: 'mentorship' }, { ...base, access: { ...base.access, mentorship: true } }), true));
  check('admin can preview draft', () => assert.equal(canReadArticle({ ...article, status: 'draft' }, { ...base, admin: true }), true));
  check('PDI feature remains locked for CV-only account', () => assert.equal(canOpenFeature('/meu-pdi', base), false));
  check('purchased CV feature opens', () => assert.equal(canOpenFeature('/carreira?etapa=cv', base), true));
  check('help route accessible without mentorship', () => assert.equal(saasCanVisit(base.access, '/ajuda/pdi'), true));
  check('shared help routes do not unlock tools', () => assert.equal(saasCanVisit(base.access, '/meu-pdi'), false));
  for (const path of ['https://evil.example', '//evil.example', '/admin/usuarios', '/api/admin/delete-user', '/meu-pdi#unsafe', '/\\evil.example', '/meu-pdi/../admin']) {
    check('reject unsafe feature URL ' + path, () => assert.equal(safeHelpPath(path), null));
  }
  check('accept known internal feature', () => assert.equal(safeHelpPath('/carreira?etapa=cv'), '/carreira?etapa=cv'));
  const form = { title: 'Como usar o PDI', slug: 'como-usar-o-pdi', summary: 'Passo a passo do PDI.', body: '## Passos\n1. Abra o PDI e preencha suas respostas.', category: 'Jornada', audience: 'desenvolvimento', status: 'draft', feature_path: '/meu-pdi' };
  check('valid draft accepted', () => assert.equal(parseHelpArticle(form).status, 'draft'));
  check('unknown audience rejected', () => assert.throws(() => parseHelpArticle({ ...form, audience: 'public' })));
  check('invalid state rejected', () => assert.throws(() => parseHelpArticle({ ...form, status: 'deleted' })));
  check('external feature rejected', () => assert.throws(() => parseHelpArticle({ ...form, feature_path: 'https://evil.example' })));
  check('invalid article ID rejected in release', () => assert.throws(() => parseHelpRelease({ title: 'Novidade', summary: 'Confira este tutorial.', article_id: 'other-user' })));
  check('UUID traversal rejected', () => assert.equal(isHelpId('../private'), false));
  check('accent-insensitive help search', () => assert.equal(searchHelpArticles([{ ...form, title: 'Íris no PDI' }], 'iris')[0].title, 'Íris no PDI'));
  console.log(`${checks} help center checks passed`);
} finally { rmSync(temp, { recursive: true, force: true }); }

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function validadorReal() {
  const src = read('lib/gupy-public-job.ts');
  const match = src.match(/export function validarLinkPublicoGupy\(valor: string\): string \{([\s\S]*?)\n\}/);
  assert.ok(match, 'Validador precisa estar presente');
  return new Function('valor', match[1].replace('let url: URL;', 'let url;'));
}

test('O validador aceita links HTTPS individuais Gupy e remove trackers', () => {
  const validate = validadorReal();
  assert.equal(validate('https://topaz.gupy.io/jobs/123456?utm_source=share'),
    'https://topaz.gupy.io/jobs/123456');
  assert.equal(validate('https://portal.gupy.io/job/12345?src=abc#etapas'),
    'https://portal.gupy.io/job/12345');
});

test('O validador rejeita SSRF, credenciais, portas, redirects relativos e listagens', () => {
  const validate = validadorReal();
  for (const link of [
    'http://topaz.gupy.io/jobs/123',
    'https://127.0.0.1/jobs/1',
    'https://localhost/jobs/1',
    'https://topaz.gupy.io.evil.org/jobs/1',
    'https://api.gupy.io/jobs/1',
    'https://developers.gupy.io/jobs/1',
    'https://topaz.gupy.io:8443/jobs/1',
    'https://user:pass@topaz.gupy.io/jobs/1',
    'https://portal.gupy.io/vagas',
    'https://portal.gupy.io/job-search/term%3Dcrm',
    'file:///etc/passwd',
    '/jobs/1',
  ]) assert.throws(() => validate(link), undefined, 'deveria rejeitar ' + link);
});

test('Servidor limita 3 links, sessão, acesso ao módulo e respostas externas', () => {
  const route = read('app/api/ferramentas-soma/gupy-vagas-publicas/route.ts');
  const helper = read('lib/gupy-public-job.ts');
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /soma_has_module/);
  assert.match(route, /p_slug: 'curriculo-ats'/);
  assert.match(route, /urls\.length > 3/);
  assert.match(route, /consumeIdentifierRateLimit/);
  assert.match(route, /Promise\.all/);
  assert.match(helper, /redirect: 'manual'/);
  assert.match(helper, /credentials: 'omit'/);
  assert.match(helper, /AbortSignal\.timeout\(7000\)/);
  assert.match(helper, /550_000/);
  assert.ok(helper.includes('application\\/ld\\+json'), 'JSON-LD deve ser identificado');
  assert.doesNotMatch(route, /\.from\('soma_analises'\)\.insert/);
  assert.doesNotMatch(route, /serviceRole|authorization:\s*Bearer/i);
});

test('Interface importa vagas automaticamente ao auditar e permite fallback de cópia', () => {
  const ui = read('app/(dashboard)/gupy/GupyAuditClient.tsx');
  assert.match(ui, /links, setLinks/);
  assert.match(ui, /Buscar descrições/);
  assert.match(ui, /buscarLinksPublicos\(\)/);
  assert.match(ui, /vagasExtraidas/);
  assert.match(ui, /vagasParaAnalise/);
  assert.match(ui, /Cole a descrição/);
  assert.match(ui, /lib\/gupy-public-job/);
});

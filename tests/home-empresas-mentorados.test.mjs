import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const empresas = src('components/public/SomaEmpresasMentorados.tsx');
const home = src('app/(public)/page.tsx');

test('LP mantém seções atuais e adiciona empresas depois do hero', () => {
  assert.match(home, /import SomaEmpresasMentorados/);
  assert.match(home, /<SomaEmpresasMentorados \/>/);
  assert.match(home, /<SomaSuccessStories \/>/);
  assert.match(home, /<SomaProductShowcase \/>/);
  assert.ok(home.indexOf('<SomaEmpresasMentorados />') < home.indexOf('{/* Para qual momento */}'));
  assert.ok(home.indexOf('<SomaEmpresasMentorados />') > home.indexOf('{/* Hero'));
});

test('As 13 empresas informadas aparecem com site institucional sem tracking', () => {
  const nomes = ['Porte','credsystem','Lojas Torra','Whirlpool','O Boticário','Monks','Cielo','Samsung','LWSA','Embraer','Gupy','PicPay','Loft'];
  for (const nome of nomes) assert.ok(empresas.includes("nome: '" + nome + "'"), 'Empresa ausente: ' + nome);
  assert.equal((empresas.match(/\s+nome: '/g) || []).length, 13);
  assert.doesNotMatch(empresas, /[?&](srsltid|gclid|gbraid|gad_source|utm_source)=/i);
  assert.match(empresas, /EMPRESAS_MENTORADOS\.map/);
});

test('Logos reais possuem carregamento leve e fallback para imagem ausente', () => {
  assert.match(empresas, /loading="lazy"/);
  assert.match(empresas, /decoding="async"/);
  assert.match(empresas, /onError=\{\(\) => setFalhaLogo\(true\)\}/);
  assert.match(empresas, /onError=\{\(\) => setFalhaIcone\(true\)\}/);
  assert.match(empresas, /google\.com\/s2\/favicons/);
  assert.match(empresas, /alt=\{'Logotipo ' \+ empresa\.nome\}/);
  assert.match(empresas, /referrerPolicy="no-referrer"/);
});

test('Padrão SOMA responsivo sem fingir patrocínio ou parceria comercial', () => {
  assert.match(empresas, /grid-cols-2/);
  assert.match(empresas, /sm:grid-cols-3/);
  assert.match(empresas, /md:grid-cols-4/);
  assert.match(empresas, /lg:grid-cols-5/);
  assert.match(empresas, /xl:grid-cols-6/);
  assert.match(empresas, /Onde nossos mentorados estão hoje/);
  assert.match(empresas, /Não representam patrocínio, parceria comercial ou endosso/);
  assert.doesNotMatch(empresas, /Aprovados em empresas como|Nossas empresas parceiras|Nossos clientes corporativos/);
  assert.match(empresas, /noopener noreferrer/);
});

test('Página de depoimentos conserva os três LinkedIn e exibe o carrossel de histórias', () => {
  const page = src('app/(public)/depoimentos/page.tsx');
  assert.match(page, /import SomaSuccessStories from/);
  assert.match(page, /<SomaSuccessStories \/>/);
  for (const name of ['Maria Laura Soares','Giulia Gomes','Rita Alecrim']) {
    assert.ok(page.includes(name), name + ' deve permanecer publicado');
  }
  assert.match(page, /mentorias e comunidades/);
});

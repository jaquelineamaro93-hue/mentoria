import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Gupy uses its own SOMA layout, preserving LinkedIn generic report', () => {
  const gupy = src('app/(dashboard)/gupy/GupyAuditClient.tsx');
  const linkedin = src('app/(dashboard)/linkedin/LinkedinAuditClient.tsx');
  assert.match(gupy, /import GupyAnalysisOutput from/);
  assert.match(gupy, /<GupyAnalysisOutput[\s\S]*?atual=\{atual\}/);
  assert.match(linkedin, /<SomaAnalysisOutput atual=\{atual\}/);
});

test('All information remains accessible in the full report and copy actions', () => {
  const view = src('components/GupyAnalysisOutput.tsx');
  assert.match(view, /Relatório completo/);
  assert.match(view, /atual\.resultado_markdown/);
  assert.match(view, /<CorpoDeSecao secao=\{secao\}/);
  assert.match(view, /secao\.markdown\.split/);
  assert.match(view, /markdown=\{introducao\}/);
  assert.match(view, /Copiar relatório/);
  assert.match(view, /Copiar versão/);
  assert.match(view, /Análises anteriores/);
});

test('Gupy uses SOMA design tokens and accessible mobile table cards', () => {
  const view = src('components/GupyAnalysisOutput.tsx');
  assert.match(view, /font-display/);
  assert.match(view, /bg-mint-light/);
  assert.match(view, /border-gray-faint/);
  assert.match(view, /xl:hidden/);
  assert.match(view, /xl:block/);
  assert.match(view, /role="tablist"/);
  assert.match(view, /aria-selected/);
  assert.match(view, /TabelaLegivel/);
  assert.match(view, /role="tabpanel"/);
});

test('Legends use own estimated score, never assert a Gupy internal score', () => {
  const view = src('components/GupyAnalysisOutput.tsx');
  assert.match(view, /não é o score interno da Gupy/);
  assert.match(view, /extrairNotaSoma/);
  assert.match(view, /extrairVagasGupy/);
});

test('Parser recognizes numbered old/new headings with a non-lossy fallback', () => {
  const parser = src('lib/gupy-report-parser.ts');
  assert.match(parser, /relat[oó]rios legados/);
  assert.match(parser, /secoes\.push\(/);
  assert.match(parser, /markdown: markdown\.trim\(\)/);
  assert.match(parser, /capitulos\[index \+ 1\]/);
});

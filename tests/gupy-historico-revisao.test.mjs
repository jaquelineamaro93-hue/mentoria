import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('As análises históricas são preservadas e há opção de comparar o original', () => {
  const view = read('components/GupyAnalysisOutput.tsx');
  assert.ok(view.includes('mostrarOriginal ? atual.resultado_markdown : leituraCorrigida.texto'));
  assert.ok(view.includes('Consultar texto original'));
  assert.ok(view.includes('Voltar à leitura atualizada'));
  assert.ok(view.includes("copiar(markdownExibido, 'total')"));
});

test('As duas afirmações indevidas recebem revisão limitada e explícita', () => {
  const parser = read('lib/gupy-report-parser.ts');
  assert.ok(parser.includes('function revisarOrientacoesLegadasGupy'));
  assert.ok(parser.includes('descurtidas de perfil'));
  assert.ok(parser.includes('automaticamente desclassificad'));
  assert.ok(parser.includes('Histórico de curtidas e descurtidas (Guia GUPY da SOMA)'));
  assert.ok(parser.includes('Histórico de candidaturas (Guia GUPY da SOMA)'));
  assert.ok(parser.includes('revisoes++'));
  assert.ok(parser.includes('return linha'));
});

test('A apresentação não cria um cartão para um título solitário', () => {
  const view = read('components/GupyAnalysisOutput.tsx');
  const parser = read('lib/gupy-report-parser.ts');
  assert.ok(!view.includes('Apresentação da análise'));
  assert.ok(view.includes('contextoIntroducao &&'));
  assert.ok(view.includes('Contexto da análise'));
  assert.ok(view.includes('tituloIntroducao'));
  assert.ok(parser.includes('function separarIntroducaoGupy'));
  assert.ok(parser.includes('if (!titulo && /^#{1,6}'));
});

test('A revisão não adiciona consultas ao banco nem altera a ferramenta LinkedIn', () => {
  const view = read('components/GupyAnalysisOutput.tsx');
  const parser = read('lib/gupy-report-parser.ts');
  assert.ok(!view.includes('supabase.from('));
  assert.ok(!view.includes('fetch('));
  assert.ok(!parser.includes('supabase.from('));
});

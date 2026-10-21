import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('As notas históricas permanecem como referência, sem fingir recálculo', () => {
  const view = read('components/GupyAnalysisOutput.tsx');
  const page = read('app/(dashboard)/gupy/page.tsx');
  const types = read('components/SomaAnalysisOutput.tsx');
  assert.match(page, /resultado_markdown, created_at, entradas/);
  assert.match(types, /analiseOrigemId\?: string/);
  assert.match(view, /notaReferencia/);
  assert.match(view, /fonte\.resultado_markdown/);
  assert.match(view, /Aderência da análise original/);
  assert.match(view, /não é uma nova pontuação/);
  assert.match(view, /Notas da auditoria original, sem recálculo/);
});

test('A reanálise não permite cadeia de análises nem botão repetitivo', () => {
  const view = read('components/GupyAnalysisOutput.tsx');
  const route = read('app/api/ferramentas-soma/reanalisar-gupy/route.ts');
  assert.match(view, /const isReanalise/);
  assert.match(view, /Gerar versão completa/);
  assert.match(view, /Nova auditoria com currículo e vagas/);
  assert.match(view, /relatorioParcial && fonte/);
  assert.match(route, /entradasOrigem\.origem === 'reanalise_relatorio_salvo'/);
  assert.match(route, /reanalises não podem ser usadas como fonte|Reanálises não podem ser usadas como fonte/);
  assert.match(view, /#auditoria-gupy-form/);
});

test('Nova versão rejeita relatório truncado e mantém audit original', () => {
  const route = read('app/api/ferramentas-soma/reanalisar-gupy/route.ts');
  assert.match(route, /capitulosFaltantes/);
  assert.match(route, /length: 8/);
  assert.match(route, /Nenhum novo relatório foi salvo/);
  assert.match(route, /notaReferenciaSoma: notaReferencia/);
  assert.match(route, /vagasReferenciaSoma: vagasReferencia/);
  assert.match(route, /analiseOrigemId: anterior\.id/);
  assert.match(route, /user_id: user\.id/);
  assert.match(route, /soma_has_module/);
  assert.doesNotMatch(route, /delete\(|update\(/);
});

test('UI identifica reanálise parcial sem marcar a nota como não informada', () => {
  const view = read('components/GupyAnalysisOutput.tsx');
  assert.match(view, /Leitura parcial: o checklist não foi concluído/);
  assert.match(view, /Esta reanálise ficou incompleta/);
  assert.match(view, /Não recalculada/);
});

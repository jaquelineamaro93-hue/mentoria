import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('PDI permite regeneração mesmo quando há plano ativo e exige confirmação', () => {
  const ui = read('components/pdi/PlanoGerado.tsx');
  assert.match(ui, /Atualizar meu PDI com minhas novas metas/);
  assert.match(ui, /Confirmar atualização/);
  assert.match(ui, /setConfirmarAtualizacao/);
  assert.match(ui, /versoesAnteriores/);
  assert.match(ui, /\.eq\("mentorado_id", mentoradoId\)/);
});

test('geração preserva plano anterior até novas ações estarem salvas', () => {
  const api = read('app/api/pdi/gerar-plano/route.ts');
  const stage = api.indexOf('status: "arquivado"');
  const insertActions = api.indexOf('insert(acoesParaInserir)');
  const archivePrevious = api.indexOf('.update({ status: "arquivado" })');
  const activate = api.indexOf('.update({ status: "ativo" })');
  assert.ok(stage > 0 && insertActions > stage && archivePrevious > insertActions && activate > archivePrevious);
  assert.match(api, /acoesConcluidas/);
  assert.match(api, /planoAnterior\.id/);
  assert.match(api, /requireProductAccess\('desenvolvimento'\)/);
  assert.match(api, /mentoradoId !== user\.id/);
});

test('novas metas têm prioridade e tarefas concluídas não são recicladas', () => {
  const prompt = read('lib/prompts-pdi.ts');
  assert.match(prompt, /metas SMART, metas semanais/);
  assert.match(prompt, /RevOps/);
  assert.match(prompt, /NÃO replique essas ações como pendências/);
  assert.match(prompt, /1 e 5 pilares/);
});

test('regeneração com plano ativo não bloqueia usuários com guia parcialmente preenchido', () => {
  const api = read('app/api/pdi/gerar-plano/route.ts');
  const ui = read('components/pdi/PlanoGerado.tsx');
  assert.match(api, /!planoAnterior && !permitePdiParcial && totalSecoes/);
  assert.match(api, /planoAnterior && totalSecoes && respostasRaw.length < totalSecoes/);
  assert.match(ui, /disabled=\{gerando \|\| respondidas === 0\}/);
  assert.match(api, /\.eq\("concluida", true\)/);
  assert.match(api, /\.order\("concluida_em"/);
});

test('marcação de ações só altera a UI quando o servidor confirma o salvamento', () => {
  const ui = read('components/pdi/AcaoItem.tsx');
  assert.match(ui, /if \(!resposta.ok\)/);
  assert.match(ui, /setConcluida\(novoValor\)/);
  assert.ok(ui.indexOf('setConcluida(novoValor)') > ui.indexOf('if (!resposta.ok)'));
  assert.match(ui, /role="alert"/);
  assert.match(ui, /disabled=\{salvando\}/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('Íris distingue perguntas-guia de criação de ação no PDI', () => {
  const route = read('app/api/copiloto/route.ts');
  const guided = read('lib/iris-pdi-guided.ts');
  assert.match(route, /querPreencherPdi/);
  assert.match(route, /executarPdiGuiado/);
  assert.ok(route.indexOf('const acaoPdiGuiado') < route.indexOf("body.acao === 'confirmar_pdi'"));
  assert.match(guided, /preencher\|responder\|revisar\|atualizar/);
  assert.match(guided, /pdi_iniciar/);
  assert.match(guided, /pdi_preparar/);
  assert.match(guided, /pdi_confirmar/);
});

test('gravação de resposta exige confirmação assinada e autorização de módulo', () => {
  const guided = read('lib/iris-pdi-guided.ts');
  assert.match(guided, /soma_has_module/);
  assert.match(guided, /desenvolvimento/);
  assert.match(guided, /crypto\.createHmac\('sha256'/);
  assert.match(guided, /crypto\.timingSafeEqual/);
  assert.match(guided, /verificar\(userId, rascunho/);
  assert.match(guided, /rascunho\.anterior !== hash\(textoAtual\(codigo\)\)/);
  assert.match(guided, /user_id: userId, secao: codigo/);
  assert.match(guided, /onConflict: 'user_id,secao'/);
  assert.ok(guided.indexOf("if (acao === 'pdi_confirmar')") < guided.indexOf(".upsert({"));
});

test('chat exibe pergunta, prévia, edição e confirmação antes de salvar', () => {
  const ui = read('components/IrisCopiloto.tsx');
  assert.match(ui, /perguntaAtiva/);
  assert.match(ui, /rascunhoPendente/);
  assert.match(ui, /Revisão antes de salvar no PDI/);
  assert.match(ui, /Confirmar e salvar resposta/);
  assert.match(ui, /Editar resposta/);
  assert.match(ui, /Pular esta pergunta/);
  assert.match(ui, /Revisar minhas respostas/);
  assert.match(ui, /Encerrar preenchimento/);
  assert.match(ui, /'pdi_preparar'/);
  assert.match(ui, /'pdi_confirmar'/);
  assert.match(ui, /'pdi_proxima'/);
});

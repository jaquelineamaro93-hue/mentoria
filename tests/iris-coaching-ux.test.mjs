import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const api = read('app/api/copiloto/route.ts');
const ui = read('components/IrisCopiloto.tsx');
const history = read('lib/iris-web-history.ts');
const voice = read('lib/iris-mentoria-voz.ts');

// Executa somente os classificadores locais, sem segredo, conta, IA nem chamada remota.
function localClassifier(name) {
  const start = api.indexOf('function ' + name + '(pedido: string) {');
  assert.ok(start !== -1, 'Classificador ausente: ' + name);
  const end = api.indexOf('\n}\n', start);
  assert.ok(end > start, 'Função não fechada: ' + name);
  const source = api.slice(start, end + 2).replace('(pedido: string)', '(pedido)');
  return new Function(source + '\nreturn ' + name + ';')();
}

test('Pedidos de mentoria recebem orientação, sem criar tarefas PDI automaticamente', () => {
  const criar = localClassifier('querCriarAcaoPdi');
  const orientar = localClassifier('pedeOrientacao');
  assert.equal(criar('Quero um plano de ação para minha recolocação profissional'), false);
  assert.equal(orientar('Quero um plano de ação para minha recolocação profissional'), true);
  assert.equal(criar('Me oriente no próximo passo da carreira'), false);
  assert.equal(criar('Crie uma ação para meu PDI'), true);
  assert.equal(criar('Adicione uma tarefa no meu PDI'), true);
  assert.equal(criar('Me ajude a estruturar um plano de carreira'), false);
  assert.match(api, /classificada === 'pdi' \? 'orientacao'/);
  assert.match(api, /orientacao \? 'orientacao'/);
});

test('Especialista entrega ação concreta, preserva contexto e não repete perguntas', () => {
  assert.match(voice, /não apenas reproduzir dados|não pergunte de novo/);
  assert.match(voice, /não faça questionários/i);
  assert.match(voice, /primeiro responda de verdade/);
  assert.match(voice, /evite promessas|sem garantias/i);
  assert.match(voice, /duas? ou três|2 a 3|2 ou 3/);
  assert.match(voice, /Se a pessoa corrigir ou disser/);
  assert.match(history, /limit\(12\)/);
  assert.match(api, /primeiras_acoes_pendentes: pendentes/);
  assert.match(api, /objetivo_registrado:/);
  assert.match(api, /data_atual_sp: hojeSP/);
  assert.match(api, /contextoTemporarioNaoSalvo\(body\.contexto_temporario\)/);
  assert.match(ui, /contexto_temporario:/);
  assert.match(api, /return responderComHistorico/);
});

test('Íris oferece continuidade clicável e não empurra link genérico para dashboard', () => {
  assert.match(ui, /Próximos passos sugeridos pela Íris/);
  assert.match(ui, /onClick=\{\(\) => void enviar\(sugestao\)\}/);
  assert.match(ui, /indice === mensagens\.length - 1/);
  assert.match(api, /sugestoes\?: string\[\]/);
  assert.match(api, /intencao === 'vaga' \? LINKS\.vaga : undefined/);
  assert.doesNotMatch(api, /href: LINKS\[intencao\].*\n.*\}\);\s*\} catch/);
  assert.match(ui, /Monte um plano prático de 7 dias/);
});

test('Janela pode expandir e reduzir no desktop mantendo mobile em tela cheia', () => {
  assert.match(ui, /const \[expandido, setExpandido\] = useState\(false\)/);
  assert.match(ui, /aria-label=\{expandido \? 'Reduzir janela da Íris' : 'Expandir janela da Íris'\}/);
  assert.match(ui, /Maximize2/);
  assert.match(ui, /Minimize2/);
  assert.match(ui, /aberto && \(mobile \|\| expandido\)/);
  assert.match(ui, /max-w-\[1200px\]/);
  assert.match(ui, /aria-modal=\{mobile \|\| expandido \? true : undefined\}/);
  assert.match(ui, /\(!mobile && !expandido\)/);
  assert.match(ui, /visualViewport/);
});

test('Privacidade continua opcional e as ações do PDI exigem confirmação', () => {
  assert.match(ui, /persistir_historico: permitirHistorico/);
  assert.match(ui, /Sem marcar, a Íris continua funcionando sem histórico salvo/);
  assert.match(api, /const manterHistorico = !!conversationId \|\| body\.persistir_historico === true/);
  assert.match(api, /if \(body\.acao === 'confirmar_pdi'\)/);
  assert.match(api, /autenticarAcao/);
  assert.match(api, /ownsIrisConversation\(user\.id, conversationId\)/);
  assert.doesNotMatch(ui, /Notification\.requestPermission/);
});

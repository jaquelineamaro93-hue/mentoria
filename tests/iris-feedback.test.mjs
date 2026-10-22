import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Avaliacao por resposta com joinha, nao joinha e justificativa acessivel', () => {
  const ui = read('components/IrisCopiloto.tsx');
  assert.match(ui, /ThumbsUp/);
  assert.match(ui, /ThumbsDown/);
  assert.match(ui, /Gostei desta resposta/);
  assert.match(ui, /Não gostei desta resposta/);
  assert.match(ui, /O que não funcionou nesta resposta/);
  assert.match(ui, /salvarFeedback\(indice, 'negativo', m\.motivoFeedback/);
  assert.match(ui, /minLength=\{8\}/);
  assert.match(ui, /maxLength=\{800\}/);
  assert.match(ui, /disabled=\{m\.feedbackSalvando/);
  assert.match(ui, /role="alert"/);
  assert.match(ui, /mensagens\.length, ocupada, visualHeight/);
  assert.match(ui, /sem treinar automaticamente modelos externos/);
});

test('Feedback so acompanha respostas emitidas pelo backend e nao erros da conversa', () => {
  const ui = read('components/IrisCopiloto.tsx');
  const api = read('app/api/copiloto/route.ts');
  assert.match(ui, /feedbackToken: resposta\.ok \? dados\.feedbackToken : undefined/);
  assert.match(ui, /feedbackToken: res\.ok \? data\.feedbackToken : undefined/);
  assert.match(ui, /m\.tipo === 'iris' && m\.feedbackToken/);
  assert.match(api, /gerarComprovanteFeedback\(user\.id, feedbackIntent\)/);
  assert.match(api, /feedbackIntent = intencao;/);
  assert.match(api, /feedbackIntent = 'pdi';/);
  assert.match(api, /return responder\(\{/);
});

test('Resposta de progresso diferencia mapeamento de execucao e prioriza proxima acao', () => {
  const route = read('app/api/copiloto/route.ts');
  assert.match(route, /Seu Mapa Quem Sou Eu está concluído/);
  assert.match(route, /Você já concluiu as/);
  assert.match(route, /ações cadastradas, mas nenhuma foi marcada como realizada/);
  assert.match(route, /Quer que eu te ajude a priorizar/);
  assert.match(route, /destaque até dois fatos relevantes e proponha um próximo passo/);
  assert.doesNotMatch(route, /Próximas ações sugeridas:.*pendentes\.join/);
});

test('Token de feedback assinado e amarrado a resposta, usuario e tipo de intencao', () => {
  const token = read('lib/iris-feedback-token.ts');
  assert.match(token, /crypto\.randomUUID\(\)/);
  assert.match(token, /soma-iris-feedback-v1/);
  assert.match(token, /userId, responseId, intent, expiry/);
  assert.match(token, /timingSafeEqual/);
  assert.match(token, /MAX_IDADE_MS/);
  assert.doesNotMatch(token, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
});

test('Endpoint autenticado, com restricoes de limite, avaliacao e dados enviados', () => {
  const route = read('app/api/copiloto/feedback/route.ts');
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /origin !== new URL\(request\.url\)\.origin/);
  assert.match(route, /validarComprovanteFeedback\(user\.id, token\)/);
  assert.match(route, /reason\.length < 8 \|\| reason\.length > 800/);
  assert.match(route, /consumeIdentifierRateLimit/);
  assert.match(route, /scope: 'iris_copilot_feedback'/);
  assert.match(route, /user_id: user\.id/);
  assert.match(route, /response_id: resposta\.responseId/);
  assert.match(route, /onConflict: 'user_id,response_id'/);
  assert.doesNotMatch(route, /from\('profiles'\)\.select\('\*'\)/);
  assert.doesNotMatch(route, /raw_resume|curriculo_texto|serviceRole\s*:/);
});

test('Tabela SOMA possui RLS por dono, sem anon e sem conversa integral', () => {
  const sql = read('docs/iris-feedback-schema-aplicado.sql');
  assert.match(sql, /soma_copilot_feedback/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on public\.soma_copilot_feedback from anon/);
  assert.match(sql, /auth\.uid\(\)\) = user_id/g);
  assert.match(sql, /unique \(user_id, response_id\)/);
  assert.doesNotMatch(sql, /conversation_text|prompt_text|cv_content/);
});

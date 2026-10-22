import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('Íris restaura conversas da conta após reload e suporta nova conversa ou exclusão', () => {
  const ui = read('components/IrisCopiloto.tsx');
  assert.match(ui, /fetch\('\/api\/copiloto\/historico'/);
  assert.match(ui, /GET|fetch\('\/api\/copiloto\/historico/);
  assert.match(ui, /conversation_id: conversationId/);
  assert.match(ui, /setMensagens\(converterMensagens\(d\.mensagens/);
  assert.match(ui, /aria-label="Ver histórico da Íris"/);
  assert.match(ui, /aria-label="Nova conversa com a Íris"/);
  assert.match(ui, /method: 'DELETE'/);
  assert.match(ui, /aria-label=\{'Excluir conversa '/);
  assert.match(ui, /feedback_rating/);
  assert.match(ui, /response_ref/);
  assert.match(ui, /Historico|Histórico/i);
});

test('API não consulta histórico ou conversas de outro usuário', () => {
  const api = read('app/api/copiloto/historico/route.ts');
  const helper = read('lib/iris-web-history.ts');
  assert.match(api, /db\.auth\.getUser\(\)/);
  assert.match(api, /\.eq\('user_id', user\.id\)/);
  assert.match(api, /\.eq\('conversation_id', selected\)/);
  assert.match(api, /Cache-Control': 'private, no-store'/);
  assert.match(api, /if \(!conversa\) return json\(/);
  assert.match(helper, /\.eq\('id', conversationId\)\.eq\('user_id', userId\)/);
  assert.match(helper, /role: 'assistant'/);
  assert.match(helper, /response_ref: responseRef/);
  assert.match(helper, /recentIrisContext/);
  assert.doesNotMatch(helper, /raw_resume|SUPABASE_SERVICE_ROLE_KEY\s*\+/);
});

test('Banco tem RLS owner-only, sem leitura anon e com registro de auditoria', () => {
  const sql = read('supabase/sql/iris_web_historico_20261022.sql');
  for (const table of ['iris_web_conversations','iris_web_messages','iris_web_admin_audit']) {
    assert.match(sql, new RegExp('alter table public\\.' + table + ' enable row level security'));
  }
  assert.match(sql, /grant select on public\.iris_web_conversations, public\.iris_web_messages to authenticated/);
  assert.match(sql, /revoke all on public\.iris_web_conversations/);
  assert.match(sql, /from public, anon, authenticated/);
  assert.match(sql, /using \(\(select auth\.uid\(\)\) = user_id\)/g);
  assert.doesNotMatch(sql.replace(/^--.*$/gm, ''), /for select to anon|security definer/i);
  assert.match(sql, /foreign key \(conversation_id, user_id\)/);
  assert.match(sql, /references public\.iris_web_conversations\(id,user_id\)/);
});

test('Administrador tem dupla checagem e não lê mensagens sem auditar acesso', () => {
  const page = read('app/(dashboard)/admin/copiloto/page.tsx');
  assert.match(page, /db\.auth\.getUser\(\)/);
  assert.match(page, /if \(profileError \|\| !perfil\?\.is_admin\) redirect\('\/dashboard'\)/);
  assert.match(page, /iris_web_admin_audit/);
  assert.match(page, /read_conversation/);
  assert.match(page, /if \(!readAuditError\)/);
  assert.match(page, /eq\('conversation_id', chosen\.id\)\.eq\('user_id', chosen\.user_id\)/);
  assert.match(page, /Conteúdos de conversas privadas/);
  const portal = read('app/(dashboard)/admin/page.tsx');
  assert.match(portal, /href="\/admin\/copiloto"/);
});

test('Histórico não renova tokens da IA por ler uma conversa', () => {
  const history = read('app/api/copiloto/historico/route.ts');
  assert.doesNotMatch(history, /chamarClaude|classificarComJev|TYPESAFE_API_KEY/);
  const copilot = read('app/api/copiloto/route.ts');
  assert.match(copilot, /saveIrisTurn/);
  assert.match(copilot, /responderComHistorico/);
  assert.match(copilot, /recentIrisContext/);
  assert.match(copilot, /classificarComJev\(pedido\)/);
  assert.match(copilot, /ownsIrisConversation\(user\.id, conversationId\)/);
  assert.match(copilot, /aviso_historico/);
});

test('Feedback restaura joinha sem gravar tokens de confirmação ou CV', () => {
  const api = read('app/api/copiloto/feedback/route.ts');
  const sql = read('supabase/sql/iris_web_historico_20261022.sql');
  assert.match(api, /feedback_rating: avaliacao/);
  assert.match(api, /\.eq\('user_id', user\.id\)/);
  assert.match(sql, /feedback_rating text/);
  assert.doesNotMatch(sql, /token|curriculo|raw_resume/i);
});

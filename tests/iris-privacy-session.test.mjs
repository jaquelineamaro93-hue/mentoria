import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../'+path, import.meta.url), 'utf8');
const ui = read('components/IrisCopiloto.tsx');
const history = read('app/api/copiloto/historico/route.ts');
const consent = read('app/api/copiloto/historico/consent/route.ts');
const ai = read('app/api/copiloto/route.ts');
const migration = read('supabase/migrations/20261023212000_iris_history_privacy_preference.sql');

test('Uma vez aceito, o texto longo de privacidade não ocupa mais espaço', () => {
  assert.match(ui, /const \[historicoAceito, setHistoricoAceito\] = useState\(false\)/);
  assert.match(ui, /setHistoricoAceito\(!!d\.historico_aceito\)/);
  assert.match(ui, /\{!historicoAceito && !historicoCarregando && \(/);
  assert.match(ui, /Salvar minhas conversas com a Íris/);
  assert.match(ui, /<details className=/);
  assert.match(ui, /Atualização de privacidade: ativar meu histórico/);
  assert.match(ui, /Sem marcar, a Íris continua funcionando sem histórico salvo/);
  assert.match(ui, /historicoAceito && \(/);
  assert.match(ui, /Salvamento de novas conversas ativo/);
  assert.match(ui, /onClick=\{\(\) => void atualizarPrivacidade\(!permitirHistorico\)\}/);
  assert.match(ui, /!historicoAceito && \(/);
});

test('Ao abrir/recarregar, começa uma conversa limpa sem apagar a lista de mensagens antigas', () => {
  assert.match(ui, /fetch\('\/api\/copiloto\/historico\?list_only=1'/);
  assert.match(ui, /setConversas\(d\.conversas \?\? \[\]\)/);
  assert.match(ui, /setConversationId\(null\)/);
  assert.match(ui, /setMensagens\(\[saudacaoIris\(d\.nome \|\| ''\)\]\)/);
  assert.match(ui, /onClick=\{fecharConversa\}/);
  assert.match(ui, /function fecharConversa\(\) \{/);
  assert.match(ui, /limparConversaVisivel\(\)/);
  assert.match(ui, /function novaConversa\(\)/);
  assert.match(ui, /setMostrarHistorico\(false\)/);
  assert.match(ui, /aria-label="Ver histórico da Íris"/);
  assert.match(ui, /onClick=\{\(\) => void abrirConversa\(c\.id\)\}/);
  assert.match(history, /const listOnly = request\.nextUrl\.searchParams\.get\('list_only'\) === '1'/);
  assert.match(history, /const selected = conversationId \|\| \(listOnly \? null : threads\?\.\[0\]\?\.id\)/);
  assert.match(history, /if \(!selected\) return json\(\{ conversas: threads \?\? \[\], mensagens: \[\], conversation_id: null, nome, \.\.\.privacidade \}\)/);
  // Fechar a UI não faz DELETE; a exclusão só existe em gesto separado.
  const close = ui.slice(ui.indexOf('function fecharConversa()'), ui.indexOf('async function atualizarPrivacidade'));
  assert.doesNotMatch(close, /DELETE|excluirConversa|\/api\/copiloto\/historico/);
});

test('A resposta tardia de uma sessão fechada não reabre o chat anterior', () => {
  assert.match(ui, /const geracaoConversa = useRef\(0\)/);
  assert.match(ui, /const geracao = geracaoConversa\.current/);
  assert.match(ui, /if \(geracao !== geracaoConversa\.current\) return/);
  assert.match(ui, /\+\+geracaoConversa\.current/);
  assert.match(ui, /if \(geracao === geracaoConversa\.current\) setMensagens/);
  assert.match(ui, /setConversationId\(dados\.conversation_id\)/);
});

test('Consentimento é registrado na conta, não deduzido da conversa aberta', () => {
  assert.match(migration, /create table if not exists public\.iris_web_privacy_preferences/);
  assert.match(migration, /user_id uuid primary key references auth\.users\(id\)/);
  assert.match(migration, /accepted_at timestamptz not null default now\(\)/);
  assert.match(migration, /history_enabled boolean not null default true/);
  assert.match(migration, /alter table public\.iris_web_privacy_preferences enable row level security/);
  assert.match(migration, /revoke all on public\.iris_web_privacy_preferences from public, anon, authenticated/);
  assert.match(migration, /grant select on public\.iris_web_privacy_preferences to authenticated/);
  assert.match(migration, /using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(migration, /from public\.iris_web_conversations/);
  assert.match(migration, /on conflict \(user_id\) do nothing/);
  assert.match(history, /\.from\('iris_web_privacy_preferences'\)/);
  assert.match(history, /historico_aceito: !!preferencia/);
  assert.match(history, /historico_ativo: !!preferencia\?\.history_enabled/);
});

test('Servidor persiste somente com preferência salva e habilitada', () => {
  assert.match(ai, /const salvamentoSolicitado = body\.persistir_historico === true/);
  assert.match(ai, /\.from\('iris_web_privacy_preferences'\)\.select\('history_enabled'\)/);
  assert.match(ai, /preferencia\?\.history_enabled === true/);
  assert.match(ai, /manterHistorico = !erroPreferencia/);
  assert.doesNotMatch(ai, /const manterHistorico = !!conversationId/);
  assert.match(ai, /if \(!manterHistorico \|\| status !== 200/);
  assert.match(consent, /db\.auth\.getUser\(\)/);
  assert.match(consent, /origin !== new URL\(request\.url\)\.origin/);
  assert.match(consent, /body\.habilitar !== 'boolean'/);
  assert.match(consent, /scope: 'iris_privacy_preference'/);
  assert.match(consent, /consent_version: 'iris_web_v1'/);
  assert.match(consent, /accepted_at: agora/);
  assert.match(consent, /\.eq\('user_id', user\.id\)/);
  assert.match(consent, /history_enabled: habilitar/);
  assert.doesNotMatch(ui, /localStorage|sessionStorage/);
});

test('PDI, histórico anterior e feedback continuam independentes', () => {
  assert.match(ai, /if \(body\.acao === 'confirmar_pdi'\)/);
  assert.match(ai, /autenticarAcao/);
  assert.match(ui, /respostaRef/);
  assert.match(ui, /feedback_rating/);
  assert.match(history, /if \(!conversa\) return json/);
  assert.doesNotMatch(migration, /drop table|truncate|delete from iris_web_messages/);
  assert.doesNotMatch(consent, /\.from\('pdi_/);
});

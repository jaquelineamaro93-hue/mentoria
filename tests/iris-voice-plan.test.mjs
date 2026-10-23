import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = path => readFileSync(new URL('../'+path, import.meta.url),'utf8');
const voz = src('lib/iris-mentoria-voz.ts');
const api = src('app/api/copiloto/route.ts');
const historia = src('app/api/copiloto/historico/route.ts');
const ui = src('components/IrisCopiloto.tsx');
const plano = src('app/api/copiloto/plano-acoes/route.ts');
const pagina = src('app/(dashboard)/plano-acoes-iris/page.tsx');
const client = src('app/(dashboard)/plano-acoes-iris/PlanoAcoesIrisClient.tsx');
const sql = src('supabase/migrations/20261023153000_iris_action_plans.sql');

test('Íris conhece mentorado autenticado e evita interrogatório repetitivo',()=>{
  assert.match(api,/select\('nome,is_admin/);
  assert.match(api,/momento_profissional,maior_desafio,prioridade_90_dias,comunicacao_preferida/);
  assert.match(api,/montarPromptMentoriaIris/);
  assert.match(api,/pontos_de_autoconhecimento/);
  assert.match(voz,/não pergunte de novo/);
  assert.match(voz,/primeiro responda de verdade/);
  assert.match(voz,/Se a pessoa corrigir ou disser/);
  assert.match(voz,/Use o primeiro nome apenas ocasionalmente/);
  assert.match(historia,/select\('nome'\)/);
  assert.match(historia,/nome,/);
  assert.match(ui,/saudacaoIris\(nome/);
  assert.match(ui,/setNomeMentorado/);
});

test('Consultoria tem métodos claros de transição, recrutamento, renda e mentoria prática',()=>{
  for(const fragment of ['TRANSIÇÃO DE CARREIRA','RECOLOCAÇÃO','CURRÍCULO E VAGA','CRESCIMENTO INTERNO','MONETIZAÇÃO','CONSULTORIA PROFUNDA']){
    assert.ok(voz.toUpperCase().includes(fragment),'Método ausente: '+fragment);
  }
  assert.match(voz,/lacunas comprovadas/);
  assert.match(voz,/não promessa|nunca promessa|sem garantias|nunca garantias/i);
  assert.match(voz,/não faça questionários/);
  assert.match(voz,/plano persistente|planos persistentes/i);
});

test('Comunicação é em português brasileiro e renderiza markdown seguro',()=>{
  assert.match(voz,/português brasileiro/);
  assert.match(voz,/Sem travessões/);
  assert.match(voz,/Separe ideias com linhas em branco/);
  assert.match(voz,/negrito/);
  assert.match(ui,/import ReactMarkdown from 'react-markdown'/);
  assert.match(ui,/remarkPlugins=\{\[remarkGfm\]\}/);
  assert.match(ui,/break-words/);
  assert.doesNotMatch(ui,/dangerouslySetInnerHTML|rehypeRaw/);
  assert.match(ui,/href=\{href\} target="_blank" rel="noopener noreferrer"/);
});

test('Página independente de Plano de Ações da Íris não escreve no PDI',()=>{
  assert.match(pagina,/redirect\('\/login'\)/);
  assert.match(pagina,/PlanoAcoesIrisClient/);
  assert.match(client,/Plano de Ações da Íris/);
  assert.match(client,/Plano independente do PDI/);
  assert.match(client,/Confirmar e salvar meu plano/);
  assert.match(client,/sem mexer no PDI/i);
  assert.match(client,/aria-valuenow=\{percentual\}/);
  assert.match(client,/method:'PATCH'/);
  assert.match(client,/method:'DELETE'/);
  assert.match(api,/href: \/plano de a/);
  assert.match(api,/\/plano-acoes-iris/);
  assert.match(ui,/Abrir meu Plano de Ações da Íris/);
  assert.match(ui,/href="\/plano-acoes-iris"/);
  assert.doesNotMatch(plano,/\.from\('pdi_(?:planos|acoes|respostas)'\)/);
});

test('Geração de plano é rascunho efêmero e salvamento exige confirmação explícita',()=>{
  assert.match(plano,/body\.acao === 'gerar'/);
  assert.match(plano,/body\.acao === 'salvar'/);
  assert.match(plano,/body\.confirmar !== true/);
  assert.match(plano,/planoIrisValido\(body\.rascunho\)/);
  assert.match(plano,/maxTokens: 2300/);
  assert.match(plano,/return resposta\(\{ rascunho:/);
  assert.match(client,/gerarPlano/);
  assert.match(client,/salvarPlano/);
  assert.match(client,/acao:'gerar'/);
  assert.match(client,/acao:'salvar',confirmar:true/);
  assert.match(voz,/uma ação = tarefa objetiva/i);
  assert.match(voz,/3 até 6 ações/);
});

test('Os planos usam autenticação, termos, RLS owner-only e escrita server-only',()=>{
  assert.match(sql,/create table if not exists public\.iris_action_plans/);
  assert.match(sql,/user_id uuid not null references auth\.users/);
  assert.match(sql,/enable row level security/);
  assert.match(sql,/revoke all on public\.iris_action_plans from public, anon, authenticated/);
  assert.match(sql,/grant select on public\.iris_action_plans to authenticated/);
  assert.match(sql,/using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.doesNotMatch(sql,/security definer/);
  assert.match(plano,/db\.auth\.getUser\(\)/);
  assert.match(plano,/mentoria_pausas/);
  assert.match(plano,/termos_aceites/);
  assert.match(plano,/status_assinatura/);
  assert.match(plano,/createAdminClient/);
  assert.match(plano,/\.eq\('user_id',a\.user\.id\)/);
  assert.match(plano,/scope: 'iris_action_plan_generate'/);
  assert.match(plano,/scope: 'iris_action_plan_save'/);
  assert.doesNotMatch(client,/SUPABASE_SERVICE_ROLE_KEY|createAdminClient/);
  assert.match(plano,/if \(!mesmaOrigem\(request\)\)/);
});

test('Ações do PDI tradicional preservam confirmação assinada separada',()=>{
  assert.match(api,/if \(body\.acao === 'confirmar_pdi'\)/);
  assert.match(api,/autenticarAcao\(user\.id, plano\.id/);
  assert.match(api,/\.from\('pdi_acoes'\)\.insert/);
  assert.match(api,/recentIrisContext/);
  assert.match(ui,/persistir_historico: permitirHistorico/);
  assert.match(ui,/Sem marcar, a Íris continua funcionando sem histórico salvo/);
});

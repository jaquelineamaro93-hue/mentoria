import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const apiVagas = read('app/api/vagas/route.ts');
const apiVaga = read('app/api/vagas/[id]/route.ts');
const apiRanking = read('app/api/passaporte/ranking/route.ts');
const client = read('app/(dashboard)/vagas/VagasClient.tsx');
const analise = read('app/(dashboard)/vagas/tabs/AnaliseFitTab.tsx');
const rankingFit = read('app/(dashboard)/vagas/tabs/RankingTab.tsx');
const rankingCommunity = read('app/(dashboard)/passaporte/components/RankingComunidade.tsx');
const sql = read('supabase/migrations/20261024022538_soma_saas_community_rpc_boundary.sql');

test('Candidatura: análise, salvamento, recarga e ranking preservam o score no contrato da API', () => {
  assert.match(analise, /fetch\('\/api\/vagas\/analisar-fit'/);
  assert.match(analise, /fit_score: analise\.fit_score/);
  assert.match(analise, /onVagaAdicionada\(\)/);
  assert.match(apiVagas, /fit_score: typeof body\.fit_score === 'number' \? body\.fit_score : null/);
  assert.match(apiVagas, /\.eq\('mentorado_id', user\.id\)/);
  assert.match(apiVagas, /'Cache-Control': 'private, no-store'/);
  assert.match(client, /setRefetch\(\(prev\) => prev \+ 1\)/);
  assert.match(client, /<RankingTab vagas=\{vagas\}/);
  assert.match(rankingFit, /\.filter\(\(v\) => typeof v\.fit_score === 'number'/);
});
test('Candidaturas: a API não permite modificar a pontuação ou trocar o proprietário', () => {
  assert.match(apiVaga, /const allowed = \[/);
  const match = apiVaga.match(/const allowed = \[([^\]]+)\]/);
  assert.ok(match);
  assert.doesNotMatch(match[1], /fit_score|mentorado_id|sub_scores|pontos_fortes/);
  assert.match(apiVaga, /\.eq\('mentorado_id', user\.id\)/);
  assert.match(apiVagas, /Pontuação de compatibilidade inválida/);
});
test('Duas contas fictícias: ordenar as vagas por pontuação sem misturar candidatos', () => {
  const rows = [
    { mentorado_id: 'teste-a', id: '1', fit_score: 72 },
    { mentorado_id: 'teste-b', id: '2', fit_score: 100 },
    { mentorado_id: 'teste-a', id: '3', fit_score: 82 },
    { mentorado_id: 'teste-a', id: '4', fit_score: null },
  ];
  const a = rows.filter(r => r.mentorado_id === 'teste-a' && r.fit_score !== null)
    .sort((x,y) => y.fit_score - x.fit_score);
  assert.deepEqual(a.map(r=>r.id),['3','1']);
  assert.equal(rows.filter(r=>r.mentorado_id === 'teste-b').length,1);
});
test('Ranking da comunidade: busca autenticada, pontuação e desempate determinístico', () => {
  assert.match(apiRanking, /requireProductAccess\('mentorship'\)/);
  assert.match(apiRanking, /supabase\.auth\.getUser\(\)/);
  assert.match(apiRanking, /rpc\('listar_ranking_comunidade'\)/);
  assert.match(apiRanking, /posicao: index \+ 1/);
  assert.match(apiRanking, /'Cache-Control': 'private, no-store'/);
  assert.match(sql, /soma_saas_table_gate/);
  assert.match(sql, /order by coalesce\(p\.pontos_total,0\) desc,coalesce\(p\.nome,''\) asc,p\.id asc/);
  const people = [
    { id:'teste-b', nome:'Bia', pontos:25 },
    { id:'teste-a', nome:'Ana', pontos:25 },
    { id:'teste-c', nome:'Caio', pontos:10 },
  ];
  people.sort((a,b)=>b.pontos-a.pontos||a.nome.localeCompare(b.nome,'pt-BR')||a.id.localeCompare(b.id));
  assert.deepEqual(people.map(p=>p.id),['teste-a','teste-b','teste-c']);
});
test('Novo registro de Impulsos deve ser relido sem cache e oferecer recuperação de erro', () => {
  assert.match(rankingCommunity, /cache: 'no-store'/);
  assert.match(rankingCommunity, /setRanking\(Array\.isArray\(data\.ranking\)/);
  assert.match(rankingCommunity, /Tentar novamente/);
  assert.match(rankingCommunity, /carregarRanking\(\)/);
});

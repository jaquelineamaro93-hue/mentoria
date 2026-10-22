import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

function legado() {
  const source = read('lib/gupy-report-parser.ts');
  const match = source.match(/export function revisarOrientacoesLegadasGupy\(markdown: string\): \{ texto: string; revisoes: number \} \{([\s\S]*?)\n\}/);
  assert.ok(match, 'Função de correção Gupy deve existir');
  // Exercita a função real, cuja implementação é JavaScript válido após retirar a anotação TS da assinatura.
  return new Function('markdown', match[1]);
}

test('Corrige recomendações legadas de dois currículos Topaz/Gauge', () => {
  const texto = [
    '**Recomendação SOMA:** Fazer **dois arquivos de currículo** (ou dois LinkedIn "versões verbais"):',
    '- **CV_Topaz_CX-Support_v1.pdf** – Foco em suporte/SLA.',
    '- **CV_Gauge_CRM-Executivo_v1.pdf** – Foco em estratégia.',
    '**Hack SOMA validado:** Fazer **dois documentos de currículo**:',
    '- **CV_Topaz_Support-Manager_v1.pdf** – SLA.',
    '- **CV_Gauge_CRM-Executivo_v1.pdf** – Martech.',
    '**Erro comum:** Submeter **mesmo currículo genérico** a ambas esperando "ATS encontre melhor match". **Não funciona.**',
    'Não copiar-colar; adaptar ordem de experiências, palavras-chave, métricas.',
    'Não é falsificar dados; é **reorganizar narrativa para cada público.**',
    'Topaz 75/100 e Gauge 89/100, notas estimadas históricas SOMA.',
  ].join('\n');
  const { texto: corrigido, revisoes } = legado()(texto);
  assert.ok(revisoes >= 8, 'Deve revisar recomendações antigas');
  assert.doesNotMatch(corrigido, /CV_(Topaz|Gauge)[^\n]*\.pdf|Fazer \*\*dois (arquivos|documentos)/i);
  assert.match(corrigido, /UM currículo no perfil compartilhado/);
  assert.match(corrigido, /todas as candidaturas ativas/);
  assert.match(corrigido, /Topaz 75\/100 e Gauge 89\/100/);
});

test('Textos corretos não são alterados nem geram revisões falsas', () => {
  const texto = 'Use um único perfil da Gupy, que vale para todas as candidaturas ativas.';
  assert.deepEqual(legado()(texto), { texto, revisoes: 0 });
});

test('Prompt Gupy e reanálise distinguem documentação de score/matching e regras do perfil', () => {
  const prompt = read('lib/prompts-career-tools.ts');
  const reanalisar = read('app/api/ferramentas-soma/reanalisar-gupy/route.ts');
  const original = read('app/api/ferramentas-soma/analisar/route.ts');
  assert.match(prompt, /currículo do perfil é COMPARTILHADO/);
  assert.match(prompt, /Candidatura Rápida/);
  assert.match(prompt, /não pode ser editada após o envio/);
  assert.match(reanalisar, /Esse é um fluxo/);

  assert.match(prompt, /Developer Hub/i);
  assert.match(prompt, /O campo "score" indica afinidade\/aderência àquela vaga/);
  assert.match(prompt, /"matching" refere-se ao resultado de teste de perfil/);
  assert.match(prompt, /não há base técnica para afirmar que utiliza os mesmos algoritmos de Uber ou 99/);
  assert.match(reanalisar, /REGRA CRÍTICA: na Gupy o perfil curricular é compartilhado/);
  assert.match(reanalisar, /Fonte técnica: https:\/\/developers.gupy.io\/docs\/listing-applications/);
  assert.match(original, /revisarOrientacoesLegadasGupy\(bruto\)\.texto/);
  assert.match(reanalisar, /revisarOrientacoesLegadasGupy\(bruto\)\.texto/);
});

test('Orientação operacional visível na interface do portal SOMA', () => {
  const ui = read('components/GupyMetodologiaSoma.tsx');
  assert.match(ui, /um currículo para todas as vagas na Gupy/);
  assert.match(ui, /alterações em .*Meu currículo/);
  assert.match(ui, /score de afinidade é relacionado à vaga/);
  assert.match(ui, /se refere a resultado de teste de perfil/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('LP comunica networking genuíno, com logos e sem promessa de parceria', () => {
  const home = read('app/(public)/page.tsx');
  const section = read('components/public/SomaNetworkCompanies.tsx');
  assert.match(home, /<SomaNetworkCompanies \/>/);
  assert.match(section, /Conecte-se com profissionais de empresas como/);
  assert.match(section, /Carreira e networking não precisam ser pesados/);
  assert.match(section, /Aprenda com quem também está investindo em si/);
  assert.match(section, /src=\{'https:\/\/www\.google\.com\/s2\/favicons\?domain='/);
  assert.match(section, /não representa parceria, patrocínio ou vínculo atual/);
  assert.match(section, /grid-cols-2/);
  assert.match(section, /sm:grid-cols-4/);
});

test('Íris gera identificador de resposta sem vazar texto na avaliação', () => {
  const api = read('app/api/copiloto/route.ts');
  const ui = read('components/IrisCopiloto.tsx');
  assert.match(api, /response_id: crypto\.randomUUID\(\)/);
  assert.match(ui, /ThumbsUp/);
  assert.match(ui, /ThumbsDown/);
  assert.match(ui, /aria-pressed=\{m\.rating === 'positivo'\}/);
  assert.match(ui, /aria-pressed=\{m\.rating === 'negativo'\}/);
  assert.match(ui, /avaliarResposta\(indice, 'negativo', m\.comentario/);
  assert.match(ui, /Esta resposta ajudou\?/);
  assert.match(ui, /maxLength=\{350\}/);
  assert.match(ui, /min-h-11/);
  assert.match(ui, /fetch\('\/api\/copiloto\/feedback'/);
  const body = ui.slice(ui.indexOf("async function avaliarResposta"), ui.indexOf("async function enviar"));
  assert.doesNotMatch(body, /body:\s*JSON\.stringify\(\{[\s\S]*?texto:/i);
  assert.match(body, /responseId: msg\.responseId/);
});

test('Avaliação da Íris usa sessão autenticada e isolamento do Supabase', () => {
  const api = read('app/api/copiloto/feedback/route.ts');
  assert.match(api, /await db\.auth\.getUser\(\)/);
  assert.match(api, /origin !== new URL\(request\.url\)\.origin/);
  assert.match(api, /consumeIdentifierRateLimit/);
  assert.match(api, /user_id: user\.id/);
  assert.match(api, /soma_copilot_feedback/);
  assert.match(api, /onConflict: 'user_id,response_id'/);
  assert.match(api, /reason\.length > 350/);
  assert.doesNotMatch(api, /SERVICE_ROLE|createAdminClient|\.select\('curriculo/);
});

test('Feedback persiste somente contexto mínimo e não dispara modelo de IA', () => {
  const api = read('app/api/copiloto/feedback/route.ts');
  assert.doesNotMatch(api, /chamarClaude|api\/anthropic|raw_resume|OPENAI_API_KEY/);
  assert.match(api, /response_id: responseId/);
  assert.match(api, /reason,/);
});

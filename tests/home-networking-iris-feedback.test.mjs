import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Networking fica na home e fala de conexões genuínas, sem confundir marcas com patrocinadores', () => {
  const home = read('app/(public)/page.tsx');
  const networking = read('components/public/SomaNetworking.tsx');
  assert.match(home, /<SomaNetworking \/>/);
  assert.match(networking, /Conecte-se com profissionais de empresas como estas/);
  assert.match(networking, /Carreira e networking não precisam ser pesados ou artificiais/);
  assert.match(networking, /EMPRESAS_REDE\.length > 0/);
  assert.match(networking, /sem vínculo de parceria ou patrocínio/);
  assert.match(networking, /CRM/);
  assert.match(networking, /sm:grid-cols-3 lg:grid-cols-6/);
});

test('Íris tem avaliação por resposta com joinha e comentário opcional, sem aparecer na LP', () => {
  const iris = read('components/IrisCopiloto.tsx');
  const home = read('app/(public)/page.tsx');
  assert.match(iris, /ThumbsUp, X|ThumbsDown, ThumbsUp/);
  assert.match(iris, /Esta resposta ajudou/);
  assert.match(iris, /Resposta não ajudou/);
  assert.match(iris, /feedbackTexto/);
  assert.match(iris, /Enviar avaliação/);
  assert.match(iris, /\/api\/copiloto\/feedback/);
  assert.match(iris, /respostaRef: resposta\.ok/);
  assert.doesNotMatch(home, /ThumbsUp|feedback da Íris|avaliar Íris|SomaIrisFeedback/);
});

test('Feedback exige usuário autenticado, evita dados de outros mentorados e não grava conversa', () => {
  const api = read('app/api/copiloto/feedback/route.ts');
  assert.match(api, /db\.auth\.getUser\(\)/);
  assert.match(api, /\.eq\('id', user\.id\)/);
  assert.match(api, /consumeIdentifierRateLimit/);
  assert.match(api, /feature_key: 'iris-copiloto'/);
  assert.match(api, /event_name: 'iris_response_feedback'/);
  assert.match(api, /metadata: \{ avaliacao, resposta_ref: respostaRef/);
  assert.match(api, /slice\(0, 300\)/);
  assert.doesNotMatch(api, /SUPABASE_SERVICE_ROLE_KEY|raw_resume|curriculo_texto|from\('pdi_planos'\)/);
});

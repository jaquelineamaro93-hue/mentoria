import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Networking fica na home e fala de conexões genuínas, sem confundir marcas com patrocinadores', () => {
  const home = read('app/(public)/page.tsx');
  const networking = read('components/public/SomaNetworking.tsx');
  assert.match(home, /<SomaNetworking \/>/);
  assert.match(networking, /Conecte-se com profissionais de empresas como/);
  assert.match(networking, /Carreira e networking não precisam ser pesados/);
  assert.match(networking, /Podem ser genuínos/);
  assert.match(networking, /Aprenda com quem também está investindo em si/);
  assert.match(networking, /EMPRESAS_REDE\.length > 0/);
  assert.match(networking, /sem vínculo de parceria ou patrocínio/);
  assert.match(networking, /CRM/);
  assert.match(networking, /sm:grid-cols-4/);
  for (const marca of ['Banco do Brasil', 'Volvo', 'Webmotors', 'Ansell']) {
    assert.ok(networking.includes(marca), 'Logo ausente: ' + marca);
  }
  assert.match(networking, /upload\.wikimedia\.org\/wikipedia\/commons/);
  assert.match(networking, /não indica vínculo atual nem garante contato com colaboradores/);
  assert.match(networking, /Logotipo Webmotors: © Lucas Manfre Barreiro/);
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


test('13 empresas de mentorados aparecem com marca, site oficial e sem confundir patrocínio', () => {
  const home = read('app/(public)/page.tsx');
  const networking = read('components/public/SomaNetworking.tsx');
  const empresas = [
    'Porte', 'Credsystem', 'Lojas Torra', 'Whirlpool', 'O Boticário',
    'Monks', 'Cielo', 'Samsung', 'LWSA', 'Embraer',
    'Gupy', 'PicPay', 'Loft',
  ];
  const bloco = networking.split('const EMPRESAS_MENTORADOS:')[1]?.split('const AREAS_REDE')[0] ?? '';
  assert.equal((bloco.match(/\\{ nome:/g) ?? []).length, 13, 'Devem existir 13 logos de mentorados');
  for (const nome of empresas) {
    assert.ok(bloco.includes(`nome: '${nome}'`), 'Marca ausente: ' + nome);
  }
  assert.match(networking, /Empresas onde nossos mentorados atuam/);
  assert.match(networking, /As marcas representam apenas a atuação profissional de mentorados/);
  assert.match(networking, /não.*parceria|parceria.*patrocínio/i);
  assert.match(networking, /rel="noopener noreferrer"/);
  assert.match(networking, /grid-cols-5/);
  assert.match(networking, /overflow-x-auto/);
  assert.match(networking, /google\\.com\\/s2\\/favicons/);
  assert.doesNotMatch(networking, /srsltid=|gclid=|gad_source=/);
  assert.match(home, /<SomaNetworking \\/>/);
  assert.match(home, /<SomaSuccessStories \\/>/);
  for (const antiga of ['Banco do Brasil', 'Volvo', 'Webmotors', 'Ansell']) {
    assert.ok(networking.includes(antiga), 'Marca anterior removida: ' + antiga);
  }
});

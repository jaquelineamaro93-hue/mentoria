import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Rede SOMA tem uma única grade com exatamente 22 empresas e a colagem original', () => {
 const home=read('app/(public)/page.tsx');
 const source=read('components/public/SomaNetworking.tsx');
 assert.match(home, /<SomaBrandTicker \/>/);
 assert.match(read('components/public/SomaBrandTicker.tsx'), /SOMA_COMPANIES/);
 assert.doesNotMatch(home, /<SomaNetworking \/>/);
 assert.match(source,/const EMPRESAS: ReadonlyArray<Empresa>/);
 const arr=source.split('const EMPRESAS: ReadonlyArray<Empresa> = [')[1]?.split('];')[0] ?? '';
 assert.equal((arr.match(/nome: '/g)||[]).length,22);
 const brands=['Porte','Credsystem','Lojas Torra','Whirlpool','O Boticário','Monks','Cielo','Renner','Samsung','LWSA','Embraer','Gupy','PicPay','Loft','Capgemini','Mercado Livre','RD Saúde','Itaú','Banco do Brasil','Volvo','Webmotors','Ansell'];
 for(const brand of brands) assert.ok(arr.includes("nome: '"+brand+"'"),brand);
 assert.match(source,/Onde mentorados e alunos constroem carreira/);
 assert.match(source,/soma-home-colagem-2026\.webp/);
 assert.match(source,/lg:grid-cols-5 xl:grid-cols-6/);
 assert.match(source,/Não há parceria, patrocínio ou endosso/);
 assert.doesNotMatch(source,/Outras trajetórias profissionais que inspiram/);
 assert.match(source,/não indica vínculo atual|atual ou anterior/);
 assert.match(source,/id="rede-soma"/);
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



test('Logos oficiais já cadastrados continuam no grid, inclusive Volvo e Cielo locais',()=>{
 const source=read('components/public/SomaNetworking.tsx');
 const volvo=read('public/images/volvo-wordmark.svg');
 const cielo=read('public/images/cielo-mentorado.svg');
 assert.match(source,/\/images\/volvo-wordmark\.svg/);
 assert.match(source,/\/images\/cielo-mentorado\.svg/);
 assert.match(volvo,/<svg/);
 assert.match(cielo,/data:image\/webp;base64,/);
 assert.match(source,/empresa\.logoUrl \?\?/);
 assert.match(source,/google\.com\/s2\/favicons/);
 assert.match(source,/Logotipo Webmotors: © Lucas Manfre Barreiro/);
 assert.match(source,/rel="noopener noreferrer"/);
});
test('Logos completos das empresas permanecem inalterados',()=>{
 const source=read('components/public/SomaNetworking.tsx');
 const expected=[['Whirlpool','Whirlpool_Corporation_Logo.png'],['Samsung','Samsung_wordmark.svg'],['Capgemini','Capgemini_201x_logo.svg'],['Mercado Livre','Mercado_Livre_wordmark_'],['RD Saúde','Logo_RD_Saude.png'],['Itaú','ITAU_LOGO.svg']];
 for(const [brand,path] of expected){const line=source.split('\n').find(line=>line.includes("nome: '"+brand+"'"));assert.ok(line?.includes(path),brand)}
});

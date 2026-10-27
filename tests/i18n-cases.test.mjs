import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const cases=read('app/(public)/cases/page.tsx');
const home=read('app/(public)/page.tsx');
const locale=read('components/LocaleProvider.tsx');
const copy=read('components/LocalizedText.tsx');
const iris=read('components/IrisCopiloto.tsx');
const app=read('components/AppShell.tsx');
const root=read('app/layout.tsx');
for(const tag of ['pt-BR','en','es-419']) {
  assert.ok(locale.includes(tag),'Missing locale '+tag);
  assert.ok(cases.includes(tag),'Cases missing locale '+tag);
}
assert.ok(cases.includes('Nathalia Ferlin')&&cases.includes('Paulo Cézar Silveira'));
assert.match(cases,/lang="pt-BR"/);
assert.ok(read('components/public/SomaMarketingChrome.tsx').includes("href: '/cases'"),'Public navigation missing case route');
assert.ok(home.includes('LocalizedText'),'Landing missing localized copy');
assert.match(copy,/Preguntas frecuentes/);
assert.match(app,/translatedNav\(location\.label,locale\)/);
assert.match(iris,/mensagem: pedido, locale,/);
assert.match(root,/LocaleProvider/);
assert.doesNotMatch(locale,/localStorage\.setItem\('.*token|localStorage\.setItem\('.*profile/i);
console.log('PASS SOMA locale navigation, landing copy, cases and Íris request contract');

const translatedModules=[
 'app/(dashboard)/dashboard/DashboardClient.tsx',
 'app/(dashboard)/onboarding/OnboardingClient.tsx',
 'app/(dashboard)/carreira/CarreiraClient.tsx',
 'app/(dashboard)/plano-acoes-iris/PlanoAcoesIrisClient.tsx',
 'app/(public)/checkout/CheckoutClient.tsx',
 'components/public/SomaNetworking.tsx',
 'components/public/SomaSuccessStories.tsx',
 'app/(public)/como-funciona/page.tsx',
 'app/(public)/depoimentos/page.tsx',
 'app/(public)/planos/page.tsx',
];
for(const file of translatedModules)assert.match(read(file),/LocalizedText|translateCopy/,'Missing locale in '+file);
const videos=JSON.parse(read('public/cases/video-manifest.json'));
assert.deepEqual(videos.videos,[],'Never publish videos without separate verified authorization');
assert.match(read('components/public/CaseVideoShowcase.tsx'),/authorized===true/);
assert.match(read('components/public/CaseVideoShowcase.tsx'),/allowedMedia\(video\.src,'video'\)/);
assert.match(read('app/(public)/cases/page.tsx'),/CaseVideoShowcase/);
assert.match(read('app/(dashboard)/plano-acoes-iris/PlanoAcoesIrisClient.tsx'),/objetivo:objetivo\.trim\(\),locale/);
assert.match(read('components/LocalizedText.tsx'),/export function translateCopy/);
console.log('PASS expanded SOMA localization and approved-only video contract');

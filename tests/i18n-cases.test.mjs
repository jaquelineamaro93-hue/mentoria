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
assert.ok(home.includes('href="/cases"'),'Landing missing case route');
assert.ok(home.includes('LocalizedText'),'Landing missing localized copy');
assert.match(copy,/Preguntas frecuentes/);
assert.match(app,/translatedNav\(location\.label,locale\)/);
assert.match(iris,/mensagem: pedido, locale,/);
assert.match(root,/LocaleProvider/);
assert.doesNotMatch(locale,/localStorage\.setItem\('.*token|localStorage\.setItem\('.*profile/i);
console.log('PASS SOMA locale navigation, landing copy, cases and Íris request contract');
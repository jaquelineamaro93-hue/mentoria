import assert from 'node:assert/strict';
import fs from 'node:fs';
const page=fs.readFileSync('app/(dashboard)/onboarding/OnboardingClient.tsx','utf8');
const dict=fs.readFileSync('lib/i18n/onboarding-copy.ts','utf8');
const shared=fs.readFileSync('components/LocalizedText.tsx','utf8');
const keys=new Set([...dict.matchAll(/^\s*"([^"]+)":\[/gm)].map(x=>x[1]));
const sharedKeys=new Set([...shared.matchAll(/(?:'([^']+)'|"([^"]+)"):\[/g)].map(x=>x[1]||x[2]));
const fields=[...page.matchAll(/\b(?:titulo|descricao|beneficio|cta|progresso|frase|etapa|grupo|nome)\s*:\s*'([^']+)'/g)].map(x=>x[1]);
const brands=new Set(['Lume','Norte','Brasa','Íris']);
const missing=[...new Set(fields)].filter(x=>!keys.has(x)&&!sharedKeys.has(x)&&!brands.has(x));
assert.deepEqual(missing,[],'All authored onboarding cards must have EN/ES translation entries');
assert.ok(keys.size>=120,'Expected broad onboarding page translations');
for(const phrase of ['Percepção 360','Análise de currículo','Primeiros 90 dias','Treinar entrevista',
'Compare como você se vê com a percepção de outras pessoas.','Seu espaço fica pronto e você escolhe se deseja receber acompanhamento no WhatsApp.']){
 assert.ok(keys.has(phrase),'Screenshot-matched content missing translations: '+phrase);
}
for(const value of ['item.titulo','item.descricao','item.beneficio','item.cta','etapa.titulo','etapa.descricao','etapa.beneficio','grupo.grupo']){
 assert.ok(page.includes('{t('+value+')}'),'Not connected to active locale: '+value);
}
for(const phrase of ['onboardingProgress(etapa.progresso,locale)','onboardingProgress(item.progresso,locale)',
'const {locale}=useLocale()', "t(guias[mascoteAtivo].frase)"]){
 assert.ok(page.includes(phrase),'Missing dynamic locale coverage: '+phrase);
}
assert.ok(dict.includes("if(locale==='pt-BR')return value"));
assert.ok(!page.includes('t(entrevista.objetivo_principal)'),'Do not translate member-provided goals');
console.log('PASS onboarding: '+fields.length+' card fields, '+keys.size+' localized entries, dynamic progress and user-data boundaries');

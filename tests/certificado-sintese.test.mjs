import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const base = new URL('../', import.meta.url);
const summary = readFileSync(new URL('lib/certificado-sintese.ts',base),'utf8');
const certificate = readFileSync(new URL('app/(dashboard)/certificados/[mes]/page.tsx',base),'utf8');
test('certificado combina atividades automáticas e manuais sem alterar pontos',()=>{
  assert.match(certificate,/carreira_atividades_reconhecidas/);
  assert.match(certificate,/sintetizarJornada\(acoes\?\?\[\], evidencias\?\?\[\]\)/);
  assert.match(certificate,/!feedback/);
  assert.match(certificate,/!active/);
  assert.doesNotMatch(certificate,/\.update\(|\.insert\(/);
  assert.doesNotMatch(summary,/pontos_total|user_xp|\.update\(|\.insert\(/);
});
test('verso contém resumo e foco baseados em evidências',()=>{
  assert.match(certificate,/sintese\.resumo/);
  assert.match(certificate,/sintese\.proximoFoco/);
  assert.match(certificate,/sintese\.frentes/);
});

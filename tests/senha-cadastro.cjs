const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('lib/auth/senha-cadastro.ts','utf8');
const code = ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
const ctx = {exports:{}};
vm.runInNewContext(code,ctx);

const {requisitosSenha,senhaAtendeRequisitos,traduzirErroCadastro}=ctx.exports;
assert.deepEqual(Object.values(requisitosSenha('abcdef12')), [true,true,false,true,false]);
assert.deepEqual(Object.values(requisitosSenha('ABCDEF12')), [true,false,true,true,false]);
assert.deepEqual(Object.values(requisitosSenha('Abcde!fg')), [true,true,true,false,true]);
assert.deepEqual(Object.values(requisitosSenha('Ab1!')), [false,true,true,true,true]);
assert.equal(senhaAtendeRequisitos('Abcdef123!'),true);
assert.equal(senhaAtendeRequisitos('123456789012'),false);
assert.equal(senhaAtendeRequisitos('Abcdef123'),false);
assert.equal(senhaAtendeRequisitos('Abcdef!@#'),false);

const gotya="Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz, ABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789, !@#$%^&*()_+-=[]{};'\\:\"|<>?,./" + String.fromCharCode(96)+"~.";
assert.match(traduzirErroCadastro(gotya),/maiúscula, letra minúscula, número e símbolo/);
assert.doesNotMatch(traduzirErroCadastro(gotya),/^A senha precisa ter pelo menos 8 caracteres/);
assert.match(traduzirErroCadastro(gotya+" Password is known to be weak and easy to guess"),/comuns ou fáceis de adivinhar/);
assert.match(traduzirErroCadastro('Password must be at least 12 characters long'),/12 caracteres/);
assert.match(traduzirErroCadastro('User already registered'),/já tem uma conta/);
assert.match(traduzirErroCadastro('Password is known to be weak and easy to guess'),/fácil de adivinhar/);
console.log('Cadastro: testes de requisitos e mensagens Supabase passaram.');

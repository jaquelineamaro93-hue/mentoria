const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source = ts.transpileModule(fs.readFileSync('lib/manus.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
let response;
let calls = [];
const context = { exports: {}, AbortSignal, console: { warn() {} }, fetch: async (url, options) => { calls.push({ url, options }); return response; } };
vm.runInNewContext(source, context);
(async () => {
  response = { ok: true, json: async () => ({ ok: true, data: [{ id: 'iris-id', task_id: 'iris-thread', nickname: 'Íris', about: 'private description' }] }) };
  const agents = await context.exports.listManusAgents('test-key');
  assert.equal(agents[0].nickname, 'Íris');
  assert.equal(agents[0].about, undefined);
  assert.equal(calls[0].url, 'https://api.manus.ai/v2/agent.list');
  assert.equal(calls[0].options.headers['x-manus-api-key'], 'test-key');
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(calls[0].options.redirect, 'error');
  response = { ok: false, status: 401 };
  await assert.rejects(context.exports.listManusAgents('test-key'), /recusou a chave/);
  response = { ok: false, status: 403 };
  await assert.rejects(context.exports.listManusAgents('test-key'), /negou acesso/);
  response = { ok: false, status: 429 };
  await assert.rejects(context.exports.listManusAgents('test-key'), /limite temporário/);
  response = { ok: false, status: 503 };
  await assert.rejects(context.exports.listManusAgents('test-key'), /indisponível/);
  response = { ok: true, json: async () => ({ ok: false, data: [] }) };
  await assert.rejects(context.exports.listManusAgents('test-key'), /inesperada/);
  response = { ok: true, json: async () => ({ ok: true, data: [{ id: 'iris-id' }] }) };
  const withoutOptional = await context.exports.listManusAgents('test-key');
  assert.equal(withoutOptional[0].id, 'iris-id');
  assert.equal(withoutOptional[0].nickname, 'Agente sem nome');
  assert.equal(withoutOptional[0].task_id, null);

  response = { ok: true, json: async () => ({ ok: true, data: [{ id: 'iris-id', nickname: 'Íris', task_id: null }, { id: null }, null] }) };
  const mixed = await context.exports.listManusAgents('test-key');
  assert.equal(mixed.length, 1);
  assert.equal(mixed[0].nickname, 'Íris');

  response = { ok: true, json: async () => ({ ok: true, data: [{ id: 'iris-id', name: 'Agente Cue' }] }) };
  const nameFallback = await context.exports.listManusAgents('test-key');
  assert.equal(nameFallback[0].nickname, 'Agente Cue');

  response = { ok: true, json: async () => ({ ok: true, data: [] }) };
  const empty = await context.exports.listManusAgents('test-key');
  assert.equal(empty.length, 0);

  response = { ok: true, json: async () => ({ ok: true, data: [{ task_id: 'main-thread', nickname: 'Sem identificação' }] }) };
  await assert.rejects(context.exports.listManusAgents('test-key'), /nenhum agente veio com ID válido/);
  console.log('Manus connection: 11 scenarios passed (mock API, no external messages).');
})().catch(error => { console.error(error); process.exitCode = 1; });

const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const source=fs.readFileSync('lib/trial-growth.ts','utf8');const mod={exports:{}};
new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(name=>name==='node:crypto'?require(name):{},mod,mod.exports);
const stage=mod.exports.trialGrowthStage;
for(const status of ['active','expired']) {
 for(const days of [-2,-3,-9,-14]) assert.equal(stage(status,days),'p2');
 for(const days of [-1,-15]) assert.equal(stage(status,days),null);
}
assert.equal(stage('active',3),'d3');assert.equal(stage('active',1),'d1');assert.equal(stage('active',0),'d0');assert.equal(stage('expired',3),null);assert.equal(stage('converted',-2),null);
console.log('PASS recovery catches missed days 2–14, excludes days 1/15, converted and future expired states');

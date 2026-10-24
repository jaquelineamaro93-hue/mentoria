import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularAdicionalCarreira } from '../lib/soma-carreira-pricing.ts';
test('one monthly meeting is included and extras are total package prices', () => {
 assert.equal(calcularAdicionalCarreira(6,1),0);
 assert.equal(calcularAdicionalCarreira(12,1),0);
 assert.equal(calcularAdicionalCarreira(6,2),17990);
 assert.equal(calcularAdicionalCarreira(6,3),22799);
 assert.equal(calcularAdicionalCarreira(12,2),35980);
 assert.equal(calcularAdicionalCarreira(12,3),45598);
});
test('unknown quantities and durations do not fabricate a price', () => {
 assert.equal(calcularAdicionalCarreira(6,4),null);
 assert.equal(calcularAdicionalCarreira(6,0),null);
 assert.equal(calcularAdicionalCarreira(3,2),null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { addCalendarMonths, manualPlanDates } from '../lib/manual-plan-dates.ts';

test('calendar months clamp to month end including leap years', () => {
  assert.equal(addCalendarMonths('2026-10-31', 4), '2027-02-28');
  assert.equal(addCalendarMonths('2028-01-31', 1), '2028-02-29');
});
test('upfront plans renew at expiry; recurring plans bill monthly', () => {
  const now = new Date('2026-10-30T16:00:00Z');
  assert.deepEqual(manualPlanDates(6, 'avista', now), { data_fim_acesso: '2027-04-30', proxima_cobranca: '2027-04-30' });
  assert.deepEqual(manualPlanDates(6, 'recorrente', now), { data_fim_acesso: '2027-04-30', proxima_cobranca: '2026-11-30' });
});
test('dates use the Brazilian day at UTC midnight', () => {
  assert.equal(manualPlanDates(6, 'cartao', new Date('2026-10-30T01:00:00Z')).data_fim_acesso, '2027-04-29');
});

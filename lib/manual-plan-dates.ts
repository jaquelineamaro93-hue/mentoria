export function addCalendarMonths(day: string, months: number) {
  const [year, month, date] = day.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(date, last));
  return target.toISOString().slice(0, 10);
}

export function manualPlanDates(months: number, payment: string | null | undefined, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  const start = `${get('year')}-${get('month')}-${get('day')}`;
  return { data_fim_acesso: addCalendarMonths(start, months), proxima_cobranca: addCalendarMonths(start, payment === 'recorrente' ? 1 : months) };
}

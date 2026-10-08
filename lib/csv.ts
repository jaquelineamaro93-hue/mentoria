export function escaparCsv(value: unknown) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function gerarCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escaparCsv).join(','),
    ...rows.map((row) => headers.map((header) => escaparCsv(row[header])).join(',')),
  ];

  return '\uFEFF' + lines.join('\r\n');
}

export function parseCsv(text: string): Array<Record<string, string>> {
  const input = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field.replace(/\r$/, ''));
  if (row.some((cell) => cell.length > 0)) rows.push(row);

  if (quoted || rows.length < 1) {
    throw new Error('CSV inválido.');
  }

  const headers = rows[0].map((header) => header.trim());
  if (headers.length < 2 || headers.some((header) => !header)) {
    throw new Error('Cabeçalho CSV inválido.');
  }

  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  );
}

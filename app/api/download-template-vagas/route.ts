import * as XLSX from 'xlsx';

export async function GET() {
  const templateData = [
    {
      'EMPRESA': 'Exemplo: Google',
      'NOME DA VAGA': 'Product Manager',
      'LINK DA VAGA': 'https://example.com/job',
      'HARD SKILL': 'Python, SQL, Analytics',
      'SOFT SKILL': 'Liderança, Comunicação',
      'DATA CANDIDATURA': new Date().toISOString().split('T')[0],
      'ONDE VIU A VAGA': 'LinkedIn',
      'ETAPA DO PROCESSO': 'Para Aplicar',
      'FIT': 'Alto',
      'OBSERVAÇÃO': 'Empresa de interesse',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vagas');

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  return new Response(buffer, {
    headers: {
      'Content-Disposition': 'attachment; filename="Template_Vagas.xlsx"',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });
}

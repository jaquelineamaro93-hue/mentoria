import { gerarCsv } from '@/lib/csv';

export async function GET() {
  const templateData = [
    {
      EMPRESA: 'Exemplo: Google',
      'NOME DA VAGA': 'Product Manager',
      'LINK DA VAGA': 'https://example.com/job',
      'HARD SKILL': 'Python, SQL, Analytics',
      'SOFT SKILL': 'Liderança, Comunicação',
      'DATA CANDIDATURA': new Date().toISOString().split('T')[0],
      'ONDE VIU A VAGA': 'LinkedIn',
      'ETAPA DO PROCESSO': 'Para Aplicar',
      FIT: 'Alto',
      'OBSERVAÇÃO': 'Empresa de interesse',
    },
  ];

  const csv = gerarCsv(templateData);

  return new Response(csv, {
    headers: {
      'Content-Disposition': 'attachment; filename="Template_Vagas.csv"',
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

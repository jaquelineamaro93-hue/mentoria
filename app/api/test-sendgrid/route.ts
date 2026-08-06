import { NextResponse } from 'next/server';
export async function POST(request: Request) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? 'consultoria@camarocrm.com';
  console.log('🔍 SendGrid Configuration Check:');
  console.log(`API Key exists: ${!!apiKey}`);
  console.log(`API Key starts with: ${apiKey?.substring(0, 10)}...`);
  console.log(`From Email: ${fromEmail}`);
  if (!apiKey) return NextResponse.json({ error: 'SENDGRID_API_KEY não configurada em Vercel', status: 'FAILED' }, { status: 400 });
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: 'jaqueline.amaro93@gmail.com' }] }],
        from: { email: fromEmail, name: 'Teste SOMA' },
        subject: 'Teste SendGrid - Não responda',
        content: [{ type: 'text/html', value: '<p>Este é um email de teste para validar a configuração do SendGrid.</p>' }],
      }),
    });
    console.log(`SendGrid API Response Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`SendGrid API Response: ${responseText}`);
    if (!response.ok) return NextResponse.json({ error: `SendGrid retornou erro: ${response.status}`, details: responseText, status: 'FAILED' }, { status: response.status });
    return NextResponse.json({ message: 'Email de teste enviado com sucesso para jaqueline.amaro93@gmail.com', status: 'SUCCESS', config: { apiKeyConfigured: true, fromEmail: fromEmail } });
  } catch (error) {
    console.error('Erro ao testar SendGrid:', error);
    return NextResponse.json({ error: 'Erro ao conectar com SendGrid', details: String(error), status: 'FAILED' }, { status: 500 });
  }
}

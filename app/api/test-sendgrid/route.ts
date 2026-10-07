import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/require-admin';

export async function POST() {
  const authorization = await requireAdmin();
  if (!authorization.ok) return authorization.response;

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? 'consultoria@camarocrm.com';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'SendGrid não configurado.', status: 'FAILED' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: 'jaqueline.amaro93@gmail.com' }] }],
        from: { email: fromEmail, name: 'Teste SOMA' },
        subject: 'Teste SendGrid - Não responda',
        content: [
          {
            type: 'text/html',
            value: '<p>Este é um email de teste para validar a configuração do SendGrid.</p>',
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('[TEST-SENDGRID] Falha no provedor:', response.status);
      return NextResponse.json(
        { error: 'Falha ao testar o envio.', status: 'FAILED' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { message: 'Email de teste enviado com sucesso.', status: 'SUCCESS' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error(
      '[TEST-SENDGRID] Falha inesperada:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { error: 'Erro ao conectar com SendGrid', status: 'FAILED' },
      { status: 500 }
    );
  }
}

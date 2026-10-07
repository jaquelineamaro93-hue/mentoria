import { NextResponse } from 'next/server';

// Endpoint antigo removido por segurança.
// A confirmação de cadastro agora exige prova de posse do e-mail via Magic Code.
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Confirmação direta desativada. Use o código enviado ao e-mail para concluir o acesso.',
    },
    {
      status: 410,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}

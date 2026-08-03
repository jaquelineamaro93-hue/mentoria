import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const { userId, email } = await request.json();

  if (!userId || !email) {
    return NextResponse.json({ error: 'userId e email são obrigatórios' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Gera link de reset para o usuário
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_VERCEL_URL || 'https://mentoria-pi-taupe.vercel.app'}/reset-password`,
      },
    });

    if (error || !data) {
      console.error('Erro ao gerar link:', error);
      return NextResponse.json(
        { error: 'Erro ao gerar link de reset' },
        { status: 500 }
      );
    }

    console.log('Data completa do generateLink:', JSON.stringify(data, null, 2));

    // Supabase retorna o link em data.properties?.action_link ou data?.action_link
    const resetUrl = (data.properties as any)?.action_link || (data as any)?.action_link;

    console.log('Reset URL gerada:', resetUrl);

    if (!resetUrl) {
      console.error('action_link não encontrado em:', JSON.stringify(data));
      return NextResponse.json(
        { error: 'Erro ao gerar link de reset (action_link vazio)' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Link gerado com sucesso',
      link: resetUrl,
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

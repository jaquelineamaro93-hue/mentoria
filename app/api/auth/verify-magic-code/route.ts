import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const { email, code } = await request.json();

  if (!email || !code) {
    return NextResponse.json(
      { error: 'Email e código são obrigatórios' },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();

    // Busca o código armazenado
    const { data: magicCode, error: fetchError } = await supabase
      .from('magic_codes')
      .select('code, expires_at')
      .eq('email', email)
      .single();

    if (fetchError || !magicCode) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 401 }
      );
    }

    // Verifica se expirou
    if (new Date(magicCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Código expirado. Solicite um novo.' },
        { status: 401 }
      );
    }

    // Verifica se o código está correto
    if (magicCode.code !== code) {
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 401 }
      );
    }

    // Verifica se o usuário existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Gera um link de login
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_VERCEL_URL || 'https://mentoria-pi-taupe.vercel.app'}/dashboard`,
      },
    });

    if (linkError || !linkData) {
      return NextResponse.json(
        { error: 'Erro ao gerar link de acesso' },
        { status: 500 }
      );
    }

    // Extrai o action link corretamente
    const actionLink = (linkData.properties as any)?.action_link;
    if (!actionLink) {
      console.error('Link não gerado:', linkData);
      return NextResponse.json(
        { error: 'Erro ao gerar link de acesso' },
        { status: 500 }
      );
    }

    // Limpa o código usado
    await supabase.from('magic_codes').delete().eq('email', email);

    return NextResponse.json({
      message: 'Código verificado com sucesso!',
      loginUrl: actionLink,
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

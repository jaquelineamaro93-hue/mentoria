import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
  }

  try {
    // Verifica se o usuário existe
    const supabaseUser = await createClient();
    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (!profile) {
      // Por segurança, não revela se o email existe
      return NextResponse.json({
        message: 'Se o email existe, você receberá um código.'
      });
    }

    // Gera código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Armazena o código com validade de 15 minutos
    const supabaseAdmin = createAdminClient();
    const { error: insertError } = await supabaseAdmin
      .from('magic_codes')
      .upsert({
        email,
        code: codigo,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }, { onConflict: 'email' });

    if (insertError) {
      console.error('Erro ao salvar código:', insertError);
      return NextResponse.json(
        { error: 'Erro ao gerar código' },
        { status: 500 }
      );
    }

    // TODO: Enviar email com o código via SendGrid
    console.log(`[DEV] Código para ${email}: ${codigo}`);

    return NextResponse.json({
      message: 'Se o email existe, você receberá um código.',
      // Em desenvolvimento, retorna o código (remover em produção!)
      ...(process.env.NODE_ENV === 'development' && { debug_code: codigo }),
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

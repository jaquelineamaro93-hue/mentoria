import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const { userId, email } = await request.json();

  if (!userId || !email) {
    return NextResponse.json({ error: 'userId e email são obrigatórios' }, { status: 400 });
  }

  try {
    console.log(`📧 [ADMIN-RESET-PASSWORD] Iniciando reset para: ${email}`);

    console.log(`🔑 [ADMIN-RESET-PASSWORD] Criando admin client...`);
    const supabase = createAdminClient();
    console.log(`✅ [ADMIN-RESET-PASSWORD] Admin client criado, chamando generateLink...`);

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `https://${process.env.NEXT_PUBLIC_VERCEL_URL || 'somamentoria.com'}/reset-password`,
      },
    });

    if (error || !data) {
      console.error('🔴 Erro ao gerar link de reset:', {
        error: error,
        errorMessage: error?.message,
        errorStatus: (error as any)?.status,
        data: data,
        email: email,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
      return NextResponse.json(
        { error: 'Erro ao gerar link de reset' },
        { status: 500 }
      );
    }

    console.log(`✅ [ADMIN-RESET-PASSWORD] generateLink retornou com sucesso`);

    const resetUrl = (data.properties as any)?.action_link || (data as any)?.action_link;

    if (!resetUrl) {
      console.error(`🔴 [ADMIN-RESET-PASSWORD] Link não encontrado na resposta:`, data);
      return NextResponse.json(
        { error: 'Erro ao gerar link de reset' },
        { status: 500 }
      );
    }

    console.log(`✅ [ADMIN-RESET-PASSWORD] Link extraído com sucesso`);

    return NextResponse.json({
      message: 'Link gerado com sucesso',
      link: resetUrl,
    });
  } catch (error) {
    console.error('🔴 [ADMIN-RESET-PASSWORD] Erro no catch block:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}

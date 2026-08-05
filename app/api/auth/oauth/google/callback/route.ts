import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { token, user: googleUser } = await request.json();

    if (!token || !googleUser) {
      return NextResponse.json(
        { error: 'Token ou dados do usuário não fornecidos' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Buscar ou criar usuário via OAuth
    const { data: existingUser, error: fetchError } = await supabase
      .from('oauth_connections')
      .select('user_id')
      .eq('provider', 'google')
      .eq('provider_id', googleUser.id)
      .single();

    let userId: string;

    if (existingUser) {
      // Usuário já existe, atualizar last_used
      userId = existingUser.user_id;
      await supabase
        .from('oauth_connections')
        .update({ last_used: new Date().toISOString() })
        .eq('provider', 'google')
        .eq('provider_id', googleUser.id);
    } else {
      // Buscar por email
      const { data: existingByEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', googleUser.email)
        .single();

      if (existingByEmail) {
        userId = existingByEmail.id;
        // Vincular OAuth ao usuário existente
        await supabase
          .from('oauth_connections')
          .insert({
            user_id: userId,
            provider: 'google',
            provider_id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            picture_url: googleUser.picture,
          });
      } else {
        // Criar novo usuário
        const { data: newAuth, error: authError } = await supabase.auth.admin.createUser({
          email: googleUser.email,
          user_metadata: {
            name: googleUser.name,
            picture: googleUser.picture,
            oauth_provider: 'google',
          },
          email_confirm: true,
        });

        if (authError || !newAuth.user) {
          return NextResponse.json(
            { error: 'Erro ao criar usuário' },
            { status: 500 }
          );
        }

        userId = newAuth.user.id;

        // Vincular OAuth
        await supabase
          .from('oauth_connections')
          .insert({
            user_id: userId,
            provider: 'google',
            provider_id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            picture_url: googleUser.picture,
          });

        // O perfil será criado automaticamente por um trigger
      }
    }

    // Gerar session
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: googleUser.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://somamentoria.com'}/dashboard`,
      },
    });

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Erro ao gerar sessão' },
        { status: 500 }
      );
    }

    const actionLink = (sessionData.properties as any)?.action_link;

    return NextResponse.json({
      success: true,
      loginUrl: actionLink,
      userId,
    });
  } catch (error) {
    console.error('🔴 [OAUTH-GOOGLE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar login com Google' },
      { status: 500 }
    );
  }
}

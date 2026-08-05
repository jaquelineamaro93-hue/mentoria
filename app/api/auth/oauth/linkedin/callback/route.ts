import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { token, user: linkedinUser } = await request.json();

    if (!token || !linkedinUser) {
      return NextResponse.json(
        { error: 'Token ou dados do usuário não fornecidos' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Buscar ou criar usuário via OAuth
    const { data: existingUser } = await supabase
      .from('oauth_connections')
      .select('user_id')
      .eq('provider', 'linkedin')
      .eq('provider_id', linkedinUser.id)
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.user_id;
      await supabase
        .from('oauth_connections')
        .update({ last_used: new Date().toISOString() })
        .eq('provider', 'linkedin')
        .eq('provider_id', linkedinUser.id);
    } else {
      // Buscar por email
      const { data: existingByEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', linkedinUser.email)
        .single();

      if (existingByEmail) {
        userId = existingByEmail.id;
        await supabase
          .from('oauth_connections')
          .insert({
            user_id: userId,
            provider: 'linkedin',
            provider_id: linkedinUser.id,
            email: linkedinUser.email,
            name: linkedinUser.name,
            picture_url: linkedinUser.picture,
          });
      } else {
        // Criar novo usuário
        const { data: newAuth, error: authError } = await supabase.auth.admin.createUser({
          email: linkedinUser.email,
          user_metadata: {
            name: linkedinUser.name,
            picture: linkedinUser.picture,
            oauth_provider: 'linkedin',
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

        await supabase
          .from('oauth_connections')
          .insert({
            user_id: userId,
            provider: 'linkedin',
            provider_id: linkedinUser.id,
            email: linkedinUser.email,
            name: linkedinUser.name,
            picture_url: linkedinUser.picture,
          });
      }
    }

    // Gerar session
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: linkedinUser.email,
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
    console.error('🔴 [OAUTH-LINKEDIN] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar login com LinkedIn' },
      { status: 500 }
    );
  }
}

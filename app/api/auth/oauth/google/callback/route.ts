import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('[OAUTH-GOOGLE-CALLBACK] Iniciando...');
    const body = await request.json();
    const { token, user: googleUser } = body;
    console.log('[OAUTH-GOOGLE-CALLBACK] Dados recebidos:', { hasToken: !!token, email: googleUser?.email, id: googleUser?.id });

    if (!token || !googleUser) {
      console.error('[OAUTH-GOOGLE-CALLBACK] Erro: token ou googleUser faltando');
      return NextResponse.json(
        { error: 'Token ou dados do usuário não fornecidos', received: { hasToken: !!token, hasGoogleUser: !!googleUser } },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    console.log('[OAUTH-GOOGLE-CALLBACK] Admin client criado');

    // Buscar ou criar usuário via OAuth
    console.log('[OAUTH-GOOGLE-CALLBACK] Buscando oauth_connections...');
    const { data: existingUser, error: fetchError } = await supabase
      .from('oauth_connections')
      .select('user_id')
      .eq('provider', 'google')
      .eq('provider_id', googleUser.id)
      .single();

    console.log('[OAUTH-GOOGLE-CALLBACK] Resultado da busca:', { found: !!existingUser, error: fetchError?.message });

    let userId: string;

    if (existingUser) {
      // Usuário já existe, atualizar last_used
      console.log('[OAUTH-GOOGLE-CALLBACK] Usuário já existe:', existingUser.user_id);
      userId = existingUser.user_id;
      await supabase
        .from('oauth_connections')
        .update({ last_used: new Date().toISOString() })
        .eq('provider', 'google')
        .eq('provider_id', googleUser.id);
    } else {
      console.log('[OAUTH-GOOGLE-CALLBACK] Usuário não encontrado, buscando por email...');
      // Buscar por email
      const { data: existingByEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', googleUser.email)
        .single();

      if (existingByEmail) {
        console.log('[OAUTH-GOOGLE-CALLBACK] Usuário encontrado por email:', existingByEmail.id);
        userId = existingByEmail.id;
        // Vincular OAuth ao usuário existente
        const { error: linkError } = await supabase
          .from('oauth_connections')
          .insert({
            user_id: userId,
            provider: 'google',
            provider_id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            picture_url: googleUser.picture,
          });
        console.log('[OAUTH-GOOGLE-CALLBACK] Link de oauth_connections criado:', { error: linkError?.message });
      } else {
        console.log('[OAUTH-GOOGLE-CALLBACK] Usuário não encontrado por email, criando novo...');
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
          console.error('[OAUTH-GOOGLE-CALLBACK] Erro ao criar usuário:', authError?.message);
          return NextResponse.json(
            { error: 'Erro ao criar usuário', details: authError?.message },
            { status: 500 }
          );
        }

        console.log('[OAUTH-GOOGLE-CALLBACK] Novo usuário criado:', newAuth.user.id);
        userId = newAuth.user.id;

        // Vincular OAuth
        const { error: linkError } = await supabase
          .from('oauth_connections')
          .insert({
            user_id: userId,
            provider: 'google',
            provider_id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            picture_url: googleUser.picture,
          });
        console.log('[OAUTH-GOOGLE-CALLBACK] Link de oauth_connections criado:', { error: linkError?.message });
      }
    }

    // Gerar session
    console.log('[OAUTH-GOOGLE-CALLBACK] Gerando magic link...');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://somamentoria.com';
    console.log('[OAUTH-GOOGLE-CALLBACK] Site URL:', siteUrl);

    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: googleUser.email,
      options: {
        redirectTo: `${siteUrl}/dashboard`,
      },
    });

    console.log('[OAUTH-GOOGLE-CALLBACK] Magic link gerado:', { hasData: !!sessionData, error: sessionError?.message });

    if (sessionError || !sessionData) {
      console.error('[OAUTH-GOOGLE-CALLBACK] Erro ao gerar magic link:', sessionError?.message);
      return NextResponse.json(
        { error: 'Erro ao gerar sessão', details: sessionError?.message },
        { status: 500 }
      );
    }

    const actionLink = (sessionData.properties as any)?.action_link;
    console.log('[OAUTH-GOOGLE-CALLBACK] Action link extraído:', { hasLink: !!actionLink });

    if (!actionLink) {
      console.error('[OAUTH-GOOGLE-CALLBACK] Action link não encontrado em sessionData');
      return NextResponse.json(
        { error: 'Erro ao gerar link de login', details: 'action_link não encontrado' },
        { status: 500 }
      );
    }

    console.log('[OAUTH-GOOGLE-CALLBACK] Sucesso! Retornando loginUrl');
    return NextResponse.json({
      success: true,
      loginUrl: actionLink,
      userId,
    });
  } catch (error) {
    console.error('[OAUTH-GOOGLE-CALLBACK] Erro capturado:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Erro ao processar login com Google', details: errorMessage },
      { status: 500 }
    );
  }
}

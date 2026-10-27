import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enviarEmail } from '@/lib/sendgrid';
import { buildWelcomeEmail } from '@/lib/welcome-email';

const noStore = { 'Cache-Control': 'no-store' };
const silent = () => NextResponse.json({ ok: true }, { status: 202, headers: noStore });

/**
 * Exclusivamente para o usuário logado. Nunca aceita destinatário de entrada.
 * Executa após uma visita autenticada ao dashboard, uma vez por usuário novo.
 * Um resultado incerto de provedor permanece reservado para evitar duplicidade.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return NextResponse.json({ error: 'Origem inválida' }, { status: 403, headers: noStore });
      }
    } catch {
      return NextResponse.json({ error: 'Origem inválida' }, { status: 403, headers: noStore });
    }
  }

  if (
    process.env.SOMA_WELCOME_ENABLED !== 'true' ||
    !process.env.SENDGRID_API_KEY ||
    !process.env.SOMA_WELCOME_MIN_CREATED_AT
  ) return silent();

  const minDate = Date.parse(process.env.SOMA_WELCOME_MIN_CREATED_AT);
  if (!Number.isFinite(minDate)) return silent();

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email || !user.email_confirmed_at) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401, headers: noStore });
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id,nome,email,created_at,is_admin')
      .eq('id', user.id)
      .maybeSingle();

    // Não retroenviar e-mails a quem já tinha conta quando a campanha foi ativada.
    if (profileError || !profile ||
      profile.is_admin ||
      !profile.created_at ||
      new Date(profile.created_at).getTime() < minDate ||
      profile.email?.trim().toLowerCase() !== user.email.trim().toLowerCase()
    ) return silent();

    const { error: reserveError } = await admin
      .from('welcome_email_dispatches')
      .insert({ user_id: user.id, status: 'reserved' });

    // Chave primária garante que re-renderizações e acessos repetidos não reenviem.
    if (reserveError?.code === '23505') return silent();
    if (reserveError) {
      console.error('[WELCOME] Falha ao reservar primeiro envio', reserveError.code);
      return silent();
    }

    const message = buildWelcomeEmail(profile.nome || '');
    const accepted = await enviarEmail({
      to: user.email,
      from: 'consultoria@camarocrm.com',
      subject: message.subject,
      html: message.html,
    });

    const { error: markError } = await admin
      .from('welcome_email_dispatches')
      .update({
        status: accepted ? 'sent' : 'failed',
        updated_at: new Date().toISOString(),
        ...(accepted ? { sent_at: new Date().toISOString() } : {}),
      })
      .eq('user_id', user.id)
      .eq('status', 'reserved');

    if (markError) console.error('[WELCOME] Falha ao registrar resultado do envio', markError.code);
    if (!accepted) console.warn('[WELCOME] Envio não confirmado pelo SendGrid');

    return silent();
  } catch (error) {
    console.error('[WELCOME] Falha inesperada no disparo', error instanceof Error ? error.name : 'unknown');
    return silent();
  }
}

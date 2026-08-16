import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AuthConfirmPage() {
  const supabase = await createClient();

  // Tenta 3 vezes com delay (sincronização de cookies)
  for (let i = 0; i < 3; i++) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      redirect('/dashboard');
    }

    // Pequeno delay antes de tentar de novo
    if (i < 2) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Se chegou aqui, não tem sessão
  redirect('/login?error=no_session');
}

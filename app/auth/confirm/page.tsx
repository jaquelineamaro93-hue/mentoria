import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AuthConfirmPage() {
  const supabase = await createClient();

  try {
    // Server component: processa no servidor onde cookies já existem
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      // Autenticado! Vai pro dashboard
      redirect('/dashboard');
    } else {
      // Sem sessão, volta ao login
      redirect('/login?error=no_session');
    }
  } catch (error) {
    console.error('Erro na confirmação:', error);
    redirect('/login?error=auth_error');
  }
}

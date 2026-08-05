'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthConfirmPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Aguarda o Supabase processar a sessão via URL hash
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verifica se a sessão foi estabelecida
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // Sessão válida, redireciona para dashboard
          router.push('/dashboard');
        } else {
          // Sem sessão, volta para login
          router.push('/login?error=auth_failed');
        }
      } catch (error) {
        console.error('Erro na confirmação de autenticação:', error);
        router.push('/login?error=auth_error');
      }
    };

    handleConfirmation();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-ink-faint">Processando autenticação...</p>
    </div>
  );
}

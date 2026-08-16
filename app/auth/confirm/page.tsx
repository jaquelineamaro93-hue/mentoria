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
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Delay pra garantir que o middleware processou o code
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          router.push('/dashboard');
        } else {
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

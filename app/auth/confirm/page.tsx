'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthConfirmContent() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Supabase já colocou a sessão nos cookies via redirect 303
        // Só precisa validar
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('📊 Session:', session?.user?.email || 'nenhuma');

        if (session?.user) {
          console.log('✅ Autenticado! Redirecionando pro dashboard');
          router.push('/dashboard');
        } else {
          console.error('❌ Sem sessão após exchange');
          router.push('/login?error=no_session');
        }
      } catch (error) {
        console.error('❌ Erro geral:', error);
        router.push('/login?error=auth_error');
      }
    };

    handleConfirmation();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-ink-faint mb-2">Processando autenticação...</p>
        <p className="text-xs text-ink-faint">Abre o console (F12) pra ver os logs</p>
      </div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-ink-faint">Carregando...</p></div>}>
      <AuthConfirmContent />
    </Suspense>
  );
}

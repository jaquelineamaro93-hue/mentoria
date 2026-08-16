'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthConfirmContent() {
  const router = useRouter();
  const supabase = createClient();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Ouve mudanças de autenticação (mais robusto que getSession)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔔 Auth event:', event);
      console.log('📊 Session:', session?.user?.email || 'nenhuma');

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Autenticado via event! Redirecionando...');
        setIsChecking(false);
        router.push('/dashboard');
      } else if (event === 'SIGNED_OUT' || !session?.user) {
        console.log('❌ Não autenticado, voltando ao login');
        setIsChecking(false);
        router.push('/login?error=auth_failed');
      }
    });

    // Fallback: se não receber evento em 3s, valida manualmente
    const timeout = setTimeout(async () => {
      if (!mounted || !isChecking) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ Sessão validada manualmente');
        setIsChecking(false);
        router.push('/dashboard');
      } else {
        console.log('❌ Sessão não encontrada');
        setIsChecking(false);
        router.push('/login?error=no_session');
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-ink-faint mb-2">Processando autenticação...</p>
        {isChecking && <p className="text-xs text-ink-faint">F12 para logs</p>}
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

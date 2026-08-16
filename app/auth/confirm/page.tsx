'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthConfirmContent() {
  const router = useRouter();
  const supabase = createClient();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Ouve mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔔 Auth event:', event);
        console.log('📊 Session user:', session?.user?.email);

        // SIGNED_IN é acionado automaticamente quando Supabase sincroniza
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ AUTENTICADO! Indo pro dashboard...');
          router.push('/dashboard');
          return;
        }
      }
    );

    // Fallback: se não receber SIGNED_IN em 5s, checa manualmente
    timeoutId = setTimeout(async () => {
      if (!mounted) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('✅ Sessão encontrada via fallback');
        router.push('/dashboard');
      } else {
        console.log('❌ Sem sessão após 5s');
        router.push('/login?error=no_session');
      }
    }, 5000);

    setIsReady(true);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [router, supabase]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-faint">Inicializando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-ink-faint mb-2">Processando autenticação...</p>
        <p className="text-xs text-ink-faint">Abre F12 pra ver logs</p>
      </div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>}>
      <AuthConfirmContent />
    </Suspense>
  );
}

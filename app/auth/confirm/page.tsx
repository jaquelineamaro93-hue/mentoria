'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        const accessToken = searchParams.get('access_token');
        const tokenType = searchParams.get('type');

        console.log('🔍 Access token encontrado:', !!accessToken);
        console.log('📝 Type:', tokenType);

        if (accessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: searchParams.get('refresh_token') || '',
          });

          if (error) {
            console.error('❌ Erro ao setSession:', error);
            router.push('/login?error=set_session_failed');
            return;
          }

          console.log('✅ Sessão criada:', data.user?.email);
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('✅ Autenticado! Redirecionando...');
          router.push('/dashboard');
        } else {
          console.log('❌ Sem sessão');
          router.push('/login?error=no_session');
        }
      } catch (error) {
        console.error('❌ Erro:', error);
        router.push('/login?error=auth_error');
      }
    };

    handleConfirmation();
  }, [router, supabase, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-ink-faint">Processando...</p>
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

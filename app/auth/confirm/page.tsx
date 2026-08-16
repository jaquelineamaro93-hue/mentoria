'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Extrai access_token da URL
        const accessToken = searchParams.get('access_token');
        const tokenType = searchParams.get('type');

        console.log('🔍 Access token encontrado:', !!accessToken);
        console.log('📝 Type:', tokenType);

        if (accessToken) {
          // Se tem access_token, cria a sessão manualmente
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

        // Valida a sessão
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
  return <AuthConfirmContent />;
}

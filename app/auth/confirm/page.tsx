'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { exchangeCode } from '@/lib/supabase/auth-actions';

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const code = searchParams.get('code');

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        if (!code) {
          console.log('⚠️ Sem code na URL');
          router.push('/login?error=no_code');
          return;
        }

        console.log('🔄 Exchange do código:', code.slice(0, 20) + '...');
        
        // Server action para fazer exchange
        const result = await exchangeCode(code);
        
        if (!result.success) {
          console.error('❌ Exchange falhou:', result.error);
          router.push('/login?error=exchange_failed');
          return;
        }

        console.log('✅ Code trocado, checando sessão...');
        
        // Pequeno delay pra sincronizar cookies
        await new Promise(resolve => setTimeout(resolve, 1000));

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
  }, [code, router, supabase]);

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

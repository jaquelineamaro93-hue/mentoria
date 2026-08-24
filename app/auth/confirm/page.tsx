'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthConfirmContent() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState('Processando autenticação...');

  useEffect(() => {
    let isSubscribed = true;

    const handleAuth = async () => {
      // 1. Escuta eventos do Supabase
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isSubscribed) return;
        
        console.log('🔔 Auth Event:', event);

        if (event === 'PASSWORD_RECOVERY') {
          console.log('🔐 Password recovery detectado');
          router.push('/reset-password'); 
        } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          console.log('✅ SIGNED_IN com usuário:', session.user.email);
          router.push('/dashboard');
        }
      });

      // 2a. Lê token_hash da QUERY (OAuth Google)
      if (typeof window !== "undefined") {
        const queryParams = new URLSearchParams(window.location.search);
        const tokenHash = queryParams.get("token_hash");
        const tokenType = queryParams.get("type");
        if (tokenHash && tokenType) {
          setStatus("Verificando login com Google...");
          const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tokenType as any });
          if (otpError) { router.push('/login?error=token_invalid'); return; }
          router.push('/dashboard');
          return;
        }
      }

      // 2b. Lê tokens da HASH da URL (magic link - NAO MEXER)
      if (typeof window !== 'undefined' && window.location.hash) {
        console.log('📍 Hash encontrada:', window.location.hash.substring(1, 50) + '...');
        
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('🔑 Access token:', !!accessToken);
        console.log('🔄 Refresh token:', !!refreshToken);
        console.log('📝 Type:', type);

        if (accessToken && refreshToken) {
          console.log('⚙️ Chamando setSession...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('❌ setSession error:', error);
          } else {
            console.log('✅ setSession sucesso:', data.user?.email);
            
            if (type === 'recovery') {
              console.log('➡️ Redirecionando para reset-password');
              router.push('/reset-password');
            } else {
              console.log('➡️ Redirecionando para dashboard');
              router.push('/dashboard');
            }
            return;
          }
        }
      }

      // 3. Fallback após 5s
      const timeout = setTimeout(async () => {
        if (!isSubscribed) return;
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('⏱️ Fallback check - Session:', session?.user?.email || 'nenhuma');
        
        if (!session) {
          console.log('❌ Nenhuma sessão encontrada');
          router.push('/login?error=no_session');
        }
      }, 5000);

      return () => {
        clearTimeout(timeout);
        subscription?.unsubscribe();
      };
    };

    handleAuth();

    return () => {
      isSubscribed = false;
    };
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-text mb-2">{status}</p>
        <p className="text-xs text-gray-text">F12 para logs completos</p>
      </div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-text">Carregando...</p></div>}>
      <AuthConfirmContent />
    </Suspense>
  );
}

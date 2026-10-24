'use client';

import { safeSaasNext } from '@/lib/auth/saas-return';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AuthJourneyLoading from '@/components/AuthJourneyLoading';

function AuthConfirmContent() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState('Processando autenticação...');

  useEffect(() => {
    let isSubscribed = true;

    const handleAuth = async () => {
      const nextPath = safeSaasNext(new URLSearchParams(window.location.search).get('next'));
      let navegando = false;
      const concluirAcesso = () => {
        if (!isSubscribed || navegando) return;
        navegando = true;
        if (nextPath) router.push(nextPath);
        else router.push('/dashboard');
      };
      const registrarLogin = async () => {
        const { error } = await supabase.rpc('registrar_login_portal');
        if (error) {
          // Falha de telemetria não interfere na autenticação.
        }
      };

      // Só ativa trial depois que a sessão foi estabelecida. A rota valida usuário e plano.
      const concluirTrial = async () => {
        const planId = nextPath ? null : new URLSearchParams(window.location.search).get('trial_plan');
        if (!planId) return true;
        try {
          const response = await fetch('/api/trial/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            cache: 'no-store',
            body: JSON.stringify({ planId, source: 'magic_code' }),
          });
          if (response.ok) return true;
          const result = await response.json().catch(() => ({}));
          if (response.status === 409 && String(result.error || '').includes('acesso ativo')) return true;
          setStatus(result.error || 'Não foi possível iniciar o teste. Atualize a página para tentar novamente.');
          return false;
        } catch {
          setStatus('Não foi possível iniciar o teste. Atualize a página para tentar novamente.');
          return false;
        }
      };

      // 1. Escuta eventos do Supabase
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isSubscribed) return;
        

        if (event === 'PASSWORD_RECOVERY') {
          router.push('/reset-password'); 
        } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          await registrarLogin();
          if (await concluirTrial()) concluirAcesso();
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
          await registrarLogin();
          if (await concluirTrial()) concluirAcesso();
          return;
        }
      }

      // 2b. Lê tokens da HASH da URL (magic link - NAO MEXER)
      if (typeof window !== 'undefined' && window.location.hash) {
        
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');


        if (accessToken && refreshToken) {
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setStatus('Não foi possível validar o link de acesso. Entre novamente.');
          } else {
            await registrarLogin();
            
            if (type === 'recovery') {
              router.push('/reset-password');
            } else {
              if (await concluirTrial()) concluirAcesso();
            }
            return;
          }
        }
      }

      // 3. Fallback após 5s
      const timeout = setTimeout(async () => {
        if (!isSubscribed) return;
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
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
    <AuthJourneyLoading
      etapa={status.startsWith('Não foi possível') ? 'erro' : status.includes('Verificando') ? 'preparando' : 'verificando'}
      detalhe={status.startsWith('Não foi possível') ? status : undefined}
    />
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<AuthJourneyLoading etapa="verificando" />}>
      <AuthConfirmContent />
    </Suspense>
  );
}

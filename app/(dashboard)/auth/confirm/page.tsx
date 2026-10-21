'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AuthJourneyLoading from '@/components/AuthJourneyLoading';

type Etapa = 'verificando' | 'preparando' | 'finalizando' | 'erro';

function ConfirmarLogin() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>('verificando');
  const [detalhe, setDetalhe] = useState<string | undefined>();

  useEffect(() => {
    let ativa = true;
    const supabase = createClient();
    const setStatus = (novaEtapa: Etapa, mensagem?: string) => {
      if (!ativa) return;
      setEtapa(novaEtapa);
      setDetalhe(mensagem);
    };

    // Evita imprimir tokens, fragmentos, e-mails ou dados de sessão no console.
    const concluir = async (tipo?: string | null) => {
      setStatus('preparando');
      const { data: identidade, error } = await supabase.auth.getUser();
      if (!ativa) return;
      if (error || !identidade.user) {
        setStatus('erro', 'Não conseguimos validar sua sessão. Entre novamente para continuar.');
        return;
      }

      // Este registro é complementar e não deve comprometer a entrada.
      const login = supabase.rpc('registrar_login_portal')
        .then(() => undefined, () => undefined);

      const trialPlan = new URLSearchParams(window.location.search).get('trial_plan');
      if (trialPlan && tipo !== 'recovery') {
        const response = await fetch('/api/trial/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({ planId: trialPlan, source: 'magic_code' }),
        }).catch(() => null);
        if (!ativa) return;
        if (!response) {
          setStatus('erro', 'Não conseguimos iniciar seu teste gratuito. Tente entrar novamente.');
          return;
        }
        if (!response.ok) {
          const result = await response.json().catch(() => ({})) as { error?: string };
          if (response.status !== 409 || !String(result.error || '').includes('acesso ativo')) {
            setStatus('erro', result.error || 'Não foi possível iniciar o período de teste.');
            return;
          }
        }
      }
      void login;
      if (!ativa) return;
      setStatus('finalizando');
      router.replace(tipo === 'recovery' ? '/reset-password' : '/dashboard');
      router.refresh();
    };

    const processar = async () => {
      try {
        const url = new URL(window.location.href);
        const tokenHash = url.searchParams.get('token_hash');
        const tokenType = url.searchParams.get('type');

        if (tokenHash && tokenType) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: tokenType as Parameters<typeof supabase.auth.verifyOtp>[0]['type'],
          });
          if (!ativa) return;
          if (error) throw new Error('Link inválido ou expirado.');
          url.searchParams.delete('token_hash');
          url.searchParams.delete('type');
          window.history.replaceState(null, '', url.pathname + url.search);
          await concluir(tokenType);
          return;
        }

        // Magic link legado via URL fragment. Não registra nem envia o token a terceiros.
        const fragmento = new URLSearchParams(url.hash.replace(/^#/, ''));
        const accessToken = fragmento.get('access_token');
        const refreshToken = fragmento.get('refresh_token');
        const tipo = fragmento.get('type');
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!ativa) return;
          if (error) throw new Error('O link de acesso expirou. Solicite um novo.');
          window.history.replaceState(null, '', url.pathname + url.search);
          await concluir(tipo);
          return;
        }

        // Login realizado pelo servidor ou retorno do provedor Google.
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!ativa) return;
        if (error || !session) {
          throw new Error('Não localizamos uma sessão ativa. Entre novamente.');
        }
        await concluir();
      } catch (erro) {
        setStatus('erro', erro instanceof Error ? erro.message : 'Não foi possível concluir a autenticação.');
      }
    };
    void processar();
    return () => { ativa = false; };
  }, [router]);

  return <AuthJourneyLoading etapa={etapa} detalhe={detalhe} />;
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<AuthJourneyLoading etapa="verificando" />}>
      <ConfirmarLogin />
    </Suspense>
  );
}

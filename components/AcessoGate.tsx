'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ROTAS_LIBERADAS = ['/login', '/renovar', '/magic-login', '/reset-password', '/modulos'];

export default function AcessoGate() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [checando, setChecando] = useState(true);

  useEffect(() => {
    async function checar() {
      if (ROTAS_LIBERADAS.includes(pathname)) {
        setChecando(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setChecando(false);
        return;
      }

      const { data: perfil } = await supabase
        .from('profiles')
        .select('status_pagamento, status_assinatura, data_fim_acesso, is_admin, trial_status, trial_ends_at')
        .eq('id', user.id)
        .maybeSingle();

      if (!perfil) {
        // Novo usuário sem perfil ainda - deixar entrar
        setChecando(false);
        return;
      }

      if (perfil.is_admin) {
        setChecando(false);
        return;
      }

      const { data: pausa } = await supabase
        .from('mentoria_pausas').select('id').eq('user_id',user.id)
        .eq('status','ativa').limit(1).maybeSingle();
      if (pausa) {
        if (!['/meu-plano','/termos','/perfil','/renovar'].includes(pathname)) {
          router.push('/meu-plano');
        }
        setChecando(false);
        return;
      }

      const trialAtivo =
        perfil.trial_status === 'active' &&
        !!perfil.trial_ends_at &&
        new Date(perfil.trial_ends_at).getTime() > Date.now();

      const passouDoPrazo =
        perfil.data_fim_acesso && perfil.data_fim_acesso < new Date().toISOString().slice(0, 10);

      const trialExpirado =
        perfil.trial_status === 'expired' ||
        (perfil.trial_status === 'active' &&
          !!perfil.trial_ends_at &&
          new Date(perfil.trial_ends_at).getTime() <= Date.now());

      if (
        !trialAtivo &&
        ((trialExpirado && perfil.status_assinatura !== 'ativo') ||
          perfil.status_pagamento === 'encerrado' ||
          passouDoPrazo)
      ) {
        const {data:modular,error}=await supabase.rpc('soma_has_paid_module');
        if(error||modular!==true){
          router.push('/renovar');
          return;
        }
        // Direitos modulares continuam válidos mesmo após término do plano
        // de Mentoria. Rotas específicas são protegidas no proxy.ts.
      }

      setChecando(false);
    }

    checar();
  }, [pathname, supabase, router]);

  if (checando) return null;

  return null;
}

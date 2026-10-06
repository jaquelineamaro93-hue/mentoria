'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ROTAS_LIBERADAS = ['/login', '/renovar', '/magic-login', '/reset-password'];

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
        router.push('/renovar');
        return;
      }

      setChecando(false);
    }

    checar();
  }, [pathname, supabase, router]);

  if (checando) return null;

  return null;
}

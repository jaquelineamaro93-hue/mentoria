'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ROTAS_LIBERADAS = ['/login', '/assinatura'];

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
        .select('status_pagamento, data_fim_acesso, is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (!perfil || perfil.is_admin) {
        setChecando(false);
        return;
      }

      const passouDoPrazo =
        perfil.data_fim_acesso && perfil.data_fim_acesso < new Date().toISOString().slice(0, 10);

      if (perfil.status_pagamento === 'encerrado' || passouDoPrazo) {
        router.push('/assinatura');
        return;
      }

      setChecando(false);
    }

    checar();
  }, [pathname, supabase, router]);

  if (checando) return null;

  return null;
}

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ROTAS_LIBERADAS = ['/login', '/assinatura', '/magic-login', '/reset-password'];

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

      if (!perfil) {
  // Novo usuário sem perfil ainda - deixar entrar
  setChecando(false);
  return;
}

if (perfil.is_admin) {
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

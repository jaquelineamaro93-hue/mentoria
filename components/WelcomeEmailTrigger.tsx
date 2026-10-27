'use client';
import { useEffect } from 'react';

/**
 * Disparo silencioso depois de entrar no dashboard com sessão válida.
 * A API faz toda a verificação e deduplicação no servidor.
 */
export default function WelcomeEmailTrigger() {
  useEffect(() => {
    fetch('/api/welcome/dispatch', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).catch(() => {
      // A falha de boas-vindas não bloqueia a experiência do usuário.
    });
  }, []);
  return null;
}

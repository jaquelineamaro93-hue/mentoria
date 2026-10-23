import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PlanoAcoesIrisClient from './PlanoAcoesIrisClient';

export const metadata: Metadata = {
  title: 'Plano de Ação Íris | SOMA Mentoria',
  description: 'Transforme sua orientação de carreira em um plano prático e acompanhe suas próprias ações na SOMA.',
};

export default async function PlanoAcoesIrisPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login');

  return <PlanoAcoesIrisClient />;
}

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Primeiros90DiasClient from './Primeiros90DiasClient';
import type { Profile } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Primeiros 90 Dias | SOMA Mentoria',
  description: 'Guia de aceleração de carreira e transição executiva',
};

export default async function Primeiros90DiasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  // Fetch existing data if available
  const { data: existingData, error } = await supabase
    .from('primeiros_90_dias_respostas')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const initialData = existingData || {
    id: null,
    user_id: user.id,
    situacao_stars: null,
    respostas_json: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return <Primeiros90DiasClient initialData={initialData} userId={user.id} />;
}

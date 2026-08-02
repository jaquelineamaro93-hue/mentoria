import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FeedbackParesClient from './FeedbackParesClient';
import type { MentoradoPublico, PeerFeedback, Profile } from '@/lib/types';

export default async function FeedbackParesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  const { data: colegasRaw } = await supabase.rpc('listar_mentorados_publicos');
  const colegas = (colegasRaw ?? []) as MentoradoPublico[];

  const { data: recebidos } = await supabase
    .from('peer_feedbacks')
    .select('*')
    .eq('para_user_id', user.id)
    .order('created_at', { ascending: false })
    .returns<PeerFeedback[]>();

  const { data: enviados } = await supabase
    .from('peer_feedbacks')
    .select('*')
    .eq('de_user_id', user.id)
    .order('created_at', { ascending: false })
    .returns<PeerFeedback[]>();

  const idsColegas = new Map((colegas ?? []).map((c) => [c.id, c.nome]));

  return (
    <FeedbackParesClient
      profile={profile}
      userId={user.id}
      colegas={colegas ?? []}
      recebidos={recebidos ?? []}
      enviados={enviados ?? []}
      nomesPorId={Object.fromEntries(idsColegas)}
    />
  );
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PerfilClient from './PerfilClient';

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Prefill only empty avatars. A photo uploaded by the mentee always wins.
  const googleIdentity = user.identities?.find((identity) => identity.provider === 'google');
  const googleData = googleIdentity?.identity_data as Record<string, unknown> | undefined;
  const googleAvatar = [googleData?.avatar_url, googleData?.picture, user.user_metadata?.avatar_url, user.user_metadata?.picture]
    .find((value): value is string => typeof value === 'string' && /^https:\\/\\//.test(value));
  if (perfil && !perfil.foto_url && googleAvatar) {
    const { error } = await supabase.from('profiles').update({ foto_url: googleAvatar }).eq('id', user.id).is('foto_url', null);
    if (!error) perfil.foto_url = googleAvatar;
  }

  const { data: plano } = perfil?.plano_id
    ? await supabase
        .from('planos_mentoria')
        .select('*')
        .eq('id', perfil.plano_id)
        .single()
    : { data: null };

  return <PerfilClient perfil={perfil} plano={plano} />;
}

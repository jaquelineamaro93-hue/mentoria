import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';
import UsuariosPermissoesClient from './UsuariosPermissoesClient';
import type { Profile } from '@/lib/types';

export const metadata = {
  title: 'Gerenciar Acesso | SOMA',
};

export default async function UsuariosPermissoesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return redirect('/dashboard');
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('nome');

  const { data: permissoes } = await supabase
    .from('admin_permissoes')
    .select('*')
    .catch(() => ({ data: [] }));

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar profile={profile as Profile} />
      <UsuariosPermissoesClient
        profile={profile as Profile}
        usuarios={profiles || []}
        permissoes={permissoes || []}
      />
    </div>
  );
}

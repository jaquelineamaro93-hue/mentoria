import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';
import UsuarioPermissoesClient from './UsuarioPermissoesClient';
import type { Profile } from '@/lib/types';

export const metadata = {
  title: 'Editar Permissões | SOMA',
};

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function UsuarioPermissoesPage({ params }: Props) {
  const { userId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!adminProfile?.is_admin) {
    return redirect('/dashboard');
  }

  const { data: usuarioProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!usuarioProfile) {
    return redirect('/admin');
  }

  const { data: permissoes } = await supabase
    .from('admin_permissoes')
    .select('*')
    .eq('user_id', userId);

  return (
    <div className="flex min-h-screen bg-white">
      
      <UsuarioPermissoesClient
        usuario={usuarioProfile as Profile}
        permissoesIniciais={permissoes || []}
      />
    </div>
  );
}

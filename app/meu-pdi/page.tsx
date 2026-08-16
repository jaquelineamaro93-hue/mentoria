import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MeuPdiClient from './MeuPdiClient';

export default async function MeuPdiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return <MeuPdiClient userId={user.id} />;
}

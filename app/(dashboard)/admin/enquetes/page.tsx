import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminEnquetesClient from './AdminEnquetesClient';

export default async function EnquetesPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile?.is_admin) redirect('/dashboard');
  const { data: enquetes } = await supabase.from('enquetes').select('*').order('data_fim', { ascending: false });
  return <AdminEnquetesClient enquetes={enquetes || []} />;
}

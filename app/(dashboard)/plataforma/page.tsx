import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PlataformaClient from './PlataformaClient';
export default async function PlataformaPage() {
 const db = await createClient(); const { data: { user } } = await db.auth.getUser();
 if (!user) redirect('/login');
 const [{ data: modules }, { data: state, error }] = await Promise.all([
  db.from('soma_modules').select('slug,title,route_path').eq('enabled',true).order('display_order'), db.rpc('soma_saas_state'),
 ]);
 if(error) return <p role="alert">Não foi possível consultar seu plano. Atualize a página para tentar novamente.</p>;
 return <PlataformaClient modules={modules ?? []} initialAccess={state} />;
}

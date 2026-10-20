import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import GerenciarModulosClient from './GerenciarModulosClient';

export const dynamic='force-dynamic';

export default async function GerenciarModulosPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect('/login');
 const {data:perfil}=await supabase.from('profiles')
   .select('is_admin').eq('id',user.id).maybeSingle();
 if(!perfil?.is_admin)redirect('/dashboard');

 const admin=createAdminClient();
 const {data:modules,error}=await admin.from('soma_modules')
  .select('slug,title,description,monthly_price,enforce_access,purchasable,enabled,route_path')
  .order('display_order');
 if(error)throw Error('Não foi possível carregar os módulos.');
 return <GerenciarModulosClient initialModules={(modules??[]).map(m=>({
  ...m,monthly_price:m.monthly_price==null?null:Number(m.monthly_price),
 }))}/>;
}

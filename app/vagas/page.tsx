import VagasClient from './VagasClient';
import { createClient } from '@/lib/supabase/server';

export default async function VagasPage() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    return <div className="p-8">Não autenticado</div>;
  }

  return <VagasClient />;
}

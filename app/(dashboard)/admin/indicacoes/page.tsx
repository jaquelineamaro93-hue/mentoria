import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminIndicacoesClient from './AdminIndicacoesClient';

const AMIGOS_POR_SESSAO = 2;

export default async function AdminIndicacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: perfilAdmin } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!perfilAdmin?.is_admin) redirect('/dashboard');

  const { data: perfis } = await supabase
    .from('profiles')
    .select('id, nome, email, sessoes_bonus_resgatadas');

  const { data: indicacoes } = await supabase
    .from('indicacoes')
    .select('*')
    .order('created_at', { ascending: false });

  const porIndicador = new Map<string, typeof indicacoes>();
  (indicacoes ?? []).forEach((i) => {
    const lista = porIndicador.get(i.indicador_id) ?? [];
    lista.push(i);
    porIndicador.set(i.indicador_id, lista);
  });

  const linhas = (perfis ?? [])
    .map((perfil) => {
      const listaIndicacoes = porIndicador.get(perfil.id) ?? [];
      const convertidas = listaIndicacoes.filter((i) => i.status === 'convertido').length;
      const liberadas = Math.floor(convertidas / AMIGOS_POR_SESSAO);
      const disponiveis = liberadas - perfil.sessoes_bonus_resgatadas;
      return {
        id: perfil.id,
        nome: perfil.nome,
        email: perfil.email,
        indicacoes: listaIndicacoes,
        convertidas,
        liberadas,
        disponiveis,
      };
    })
    .filter((linha) => linha.indicacoes.length > 0)
    .sort((a, b) => b.disponiveis - a.disponiveis);

  return <AdminIndicacoesClient linhas={linhas} />;
}

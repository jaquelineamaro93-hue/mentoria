import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight, LockKeyhole, Printer } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireProductAccess } from '@/lib/security/require-product-access';

export const metadata: Metadata = {
  title: 'Meus certificados | SOMA',
  description: 'Certificados mensais de evolução da sua jornada na SOMA.',
};

function mesLongo(referencia: string) {
  return new Date(referencia + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export default async function CertificadosPage() {
  const access = await requireProductAccess('mentorship');
  if (!access.ok) redirect('/plataforma');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: feedbacks, error: feedbackError }, { data: atividades, error: atividadeError }] = await Promise.all([
    supabase.from('profiles').select('nome,status_assinatura,data_fim_acesso,trial_status,trial_ends_at,is_admin').eq('id', user.id).single(),
    supabase.from('checkins_mensais').select('id,mes_referencia,created_at').eq('user_id', user.id).order('mes_referencia', { ascending: false }),
    supabase.from('carreira_checkins').select('dia,tipo').eq('user_id', user.id).order('dia', { ascending: false }),
  ]);

  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const ativo = !!profile && (
    (profile.status_assinatura === 'ativo' && (!profile.data_fim_acesso || profile.data_fim_acesso >= hoje)) ||
    (profile.trial_status === 'active' && !!profile.trial_ends_at && new Date(profile.trial_ends_at).getTime() > Date.now())
  );
  const porMes = new Map<string, { quantidade: number; tipos: Set<string> }>();
  for (const a of atividades ?? []) {
    const mes = a.dia.slice(0, 7);
    const atual = porMes.get(mes) ?? { quantidade: 0, tipos: new Set<string>() };
    atual.quantidade += 1;
    atual.tipos.add(a.tipo);
    porMes.set(mes, atual);
  }

  const certificados = (feedbacks ?? []).filter(f => {
    const atividadesMes = porMes.get(f.mes_referencia.slice(0, 7));
    return ativo && !!atividadesMes && atividadesMes.quantidade > 0;
  });
  const nome = (profile?.nome || 'Profissional SOMA').trim();
  const erro = !!feedbackError || !!atividadeError;

  return (
    <main className="w-full px-3 py-7 sm:px-5 lg:px-6">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.19em] text-[#386657]">Sua experiência na SOMA</p>
        <h1 className="mt-2 font-display text-3xl text-[#18382F] sm:text-4xl">Meus certificados</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#52675B]">Cada certificado reconhece um mês em que você registrou atividades de carreira e concluiu sua avaliação mensal. Sua evolução é construída com ações reais.</p>
        <Link href="/minha-trilha" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#245846] hover:underline">Avaliar a mentoria <ArrowUpRight size={16}/></Link>
      </header>

      <section aria-label="Seu progresso no mês" className="mb-6 rounded-2xl border border-[#DCE7DF] bg-white px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#386657]">Seu progresso em {mesLongo(new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}).slice(0,7)+'-01')}</p><h2 className="mt-1 font-serif text-2xl text-[#18382F]">Caminho para o certificado</h2></div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ativo?'bg-[#EAF5EE] text-[#245846]':'bg-[#FFF1EA] text-[#9A482A]'}`}>{ativo?'Plano ativo':'Plano sem acesso'}</span>
        </div>
        {(()=>{const atual=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}).slice(0,7); const atividade=(porMes.get(atual)?.quantidade??0)>0; const avaliacao=(feedbacks??[]).some(f=>f.mes_referencia.slice(0,7)===atual);return <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[{ok:atividade,titulo:'Atividade do mês',detalhe:atividade?'Registrada':'Ainda não registrada',href:'/passaporte?aba=ofensiva'}, {ok:avaliacao,titulo:'Avaliação mensal',detalhe:avaliacao?'Enviada':'Ainda não enviada',href:'/minha-trilha'}, {ok:ativo,titulo:'Acesso à mentoria',detalhe:ativo?'Válido':'Verifique seu plano',href:'/meu-plano'}].map(x=><div key={x.titulo} className="flex items-start gap-3 border-t border-[#E3EBE4] pt-3"><span aria-hidden="true" className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${x.ok?'bg-[#DDF2E4] text-[#256344]':'bg-[#F1EEE6] text-[#7A6852]'}`}>{x.ok?'✓':'·'}</span><div><p className="text-sm font-semibold text-[#203D33]">{x.titulo}</p><p className="mt-1 text-xs text-[#65766C]">{x.detalhe}</p>{!x.ok&&<Link href={x.href} className="mt-1 inline-block text-xs font-semibold text-[#245846] underline">Resolver pendência</Link>}</div></div>)}
        </div>})()}
      </section>

      {erro ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">Não foi possível verificar todos os registros agora. Nenhum certificado será liberado sem confirmar sua elegibilidade.</div> :
      certificados.length === 0 ? (
        <div className="rounded-2xl border border-[#DCE7DF] bg-[#F6F8F3] px-6 py-12 text-center">
          <LockKeyhole size={30} className="mx-auto text-[#527565]"/>
          <h2 className="mt-4 text-xl font-semibold text-[#18382F]">Sua próxima conquista está em construção</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#52675B]">Confira os requisitos do mês acima. O certificado aparece assim que a atividade, a avaliação e o acesso estiverem válidos.</p>

        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-[#52675B]">{certificados.length} {certificados.length === 1 ? 'certificado disponível' : 'certificados disponíveis'}</p>
          {certificados.map((item, index) => {
            const dados = porMes.get(item.mes_referencia.slice(0, 7))!;
            const titulo = mesLongo(item.mes_referencia);
            return <article key={item.id} className="overflow-hidden rounded-2xl border border-[#D9E4DA] bg-[#F9F8F4] shadow-sm">
              <div className="grid lg:grid-cols-[1fr_0.68fr]">
                <div className="relative min-h-72 overflow-hidden bg-[#112820] px-7 py-8 text-[#F9F6EE] sm:px-10">
                  <div className="absolute -right-16 -top-28 h-72 w-72 rounded-full border border-[#70B69F]/40" aria-hidden="true" />
                  <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full border border-[#70B69F]/30" aria-hidden="true" />
                  <div className="relative">
                    <div className="flex items-center justify-between border-b border-white/25 pb-4 text-[11px] font-semibold uppercase tracking-[0.18em]"><span>SOMA <span className="text-[#65D5B5]">●</span> CARREIRA</span><span>EDIÇÃO {String(index+1).padStart(2,'0')}</span></div>
                    <p className="mt-9 text-[11px] uppercase tracking-[0.25em] text-[#A9CCB8]">Registro de desenvolvimento</p>
                    <h2 className="mt-3 max-w-md font-serif text-4xl leading-tight sm:text-5xl">Certificado<br/>de evolução.</h2>
                    <p className="mt-5 text-xl font-medium">{nome}</p>
                    <p className="mt-1 text-sm capitalize text-[#BBD2C5]">{titulo}</p>
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-6 p-7 sm:p-9">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#386657]">Na sua jornada</p>
                    <h3 className="mt-3 font-serif text-2xl text-[#18382F]">Movimento que se registra.</h3>
                    <p className="mt-3 text-sm leading-6 text-[#53675B]">Sua avaliação mensal e suas ações realizadas no período confirmam a participação ativa na jornada.</p>
                    <div className="mt-5 border-t border-[#D8E3DA] pt-4 text-sm text-[#274638]"><strong>{dados.quantidade}</strong> {dados.quantidade === 1 ? 'atividade registrada' : 'atividades registradas'} neste mês</div>
                    <p className="mt-2 text-xs text-[#65766C]">Frente: reconhecimento da participação. Verso: síntese de ações documentadas, sem publicar o conteúdo privado da avaliação.</p>
                  </div>
                  <Link href={`/certificados/${item.mes_referencia}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#183F37] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#286554]"><Printer size={16}/> Visualizar e imprimir</Link>
                </div>
              </div>
            </article>;
          })}
        </div>
      )}
    </main>
  );
}

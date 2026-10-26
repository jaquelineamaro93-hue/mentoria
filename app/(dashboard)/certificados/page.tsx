import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Award, ArrowUpRight, CalendarCheck, ClipboardCheck, LockKeyhole, Printer } from 'lucide-react';
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
  const ativo = !!profile && !profile.is_admin && (
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
    <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.19em] text-[#386657]">Sua experiência na SOMA</p>
        <h1 className="mt-2 font-display text-3xl text-[#18382F] sm:text-4xl">Meus certificados</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#52675B]">Cada certificado reconhece um mês em que você registrou atividades de carreira e concluiu sua avaliação mensal. Sua evolução é construída com ações reais.</p>
        <Link href="/minha-trilha" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#245846] hover:underline">Avaliar a mentoria <ArrowUpRight size={16}/></Link>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[{ icon: CalendarCheck, titulo: 'Avaliação mensal', detalhe: 'Feedback registrado no mês' }, { icon: ClipboardCheck, titulo: 'Atividade comprovada', detalhe: 'Ao menos uma ação de carreira no mês' }, { icon: Award, titulo: 'Acesso ativo', detalhe: 'Plano de mentoria válido na emissão' }].map(({icon: Icon,titulo,detalhe}) => (
          <div key={titulo} className="flex gap-3 rounded-2xl border border-[#DCE7DF] bg-white p-4"><Icon size={20} className="mt-0.5 shrink-0 text-[#376F59]"/><div><p className="text-sm font-semibold text-[#203D33]">{titulo}</p><p className="mt-1 text-xs leading-5 text-[#65766C]">{detalhe}</p></div></div>
        ))}
      </div>

      {erro ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">Não foi possível verificar todos os registros agora. Nenhum certificado será liberado sem confirmar sua elegibilidade.</div> :
      certificados.length === 0 ? (
        <div className="rounded-2xl border border-[#DCE7DF] bg-[#F6F8F3] px-6 py-12 text-center">
          <LockKeyhole size={30} className="mx-auto text-[#527565]"/>
          <h2 className="mt-4 text-xl font-semibold text-[#18382F]">Sua próxima conquista está em construção</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#52675B]">Para liberar o certificado de um mês, é necessário ter um plano ativo, registrar pelo menos uma atividade no Passaporte e enviar a avaliação daquele mês.</p>
          <Link href="/passaporte?aba=ofensiva" className="mt-5 inline-flex rounded-xl bg-[#183F37] px-4 py-2.5 text-sm font-semibold text-white">Registrar uma atividade</Link>
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

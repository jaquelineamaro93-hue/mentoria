import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireProductAccess } from '@/lib/security/require-product-access';
import PrintCertificateButton from './PrintCertificateButton';

export const dynamic = 'force-dynamic';

export default async function CertificadoMensal({ params }: { params: Promise<{ mes: string }> }) {
  const { mes } = await params;
  if (!/^\\d{4}-(0[1-9]|1[0-2])-01$/.test(mes)) notFound();
  const access = await requireProductAccess('mentorship');
  if (!access.ok) redirect('/plataforma');
  const db = await createClient();
  const {data:{user}} = await db.auth.getUser();
  if (!user) redirect('/login');
  const [{data:profile,error:profileError},{data:feedback,error:feedbackError},{data:acoes,error:acoesError}] = await Promise.all([
    db.from('profiles').select('nome,status_assinatura,data_fim_acesso,trial_status,trial_ends_at,is_admin').eq('id',user.id).single(),
    db.from('checkins_mensais').select('id,mes_referencia').eq('user_id',user.id).eq('mes_referencia',mes).maybeSingle(),
    db.from('carreira_checkins').select('dia,tipo').eq('user_id',user.id).gte('dia',mes).lt('dia',new Date(Date.UTC(Number(mes.slice(0,4)),Number(mes.slice(5,7)),1)).toISOString().slice(0,10)),
  ]);
  const today = new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
  const active=!!profile&&(
    (profile.status_assinatura==='ativo'&&(!profile.data_fim_acesso||profile.data_fim_acesso>=today))||
    (profile.trial_status==='active'&&!!profile.trial_ends_at&&new Date(profile.trial_ends_at).getTime()>Date.now())
  );
  if(profileError||feedbackError||acoesError||!active||!feedback||!acoes?.length) notFound();
  const titulo=new Date(mes+'T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  const nome=profile.nome?.trim()||'Profissional SOMA';
  const labels: Record<string, string> = {
    ingles:'Prática de inglês',curriculo:'Desenvolvimento de currículo',linkedin:'Posicionamento profissional',
    networking:'Construção de conexões',candidatura:'Busca de oportunidades',entrevista:'Preparação para entrevistas',
    pdi:'Plano de desenvolvimento',aprendizado:'Aprendizado contínuo',reflexao:'Reflexão de carreira',
  };
  const tipos=[...new Set(acoes.map(a=>String(a.tipo)))].map(t=>labels[t] || 'Atividade de carreira');
  return <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
    <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3"><Link href="/certificados" className="text-sm font-semibold text-[#245846]">Voltar aos certificados</Link><PrintCertificateButton/></div>
    <div className="certificate-pages space-y-6">
      <section className="certificate-page relative flex min-h-[680px] flex-col justify-between overflow-hidden bg-[#112820] p-8 text-[#F9F6EE] sm:p-14">
        <div className="absolute -right-36 -top-36 h-96 w-96 rounded-full border border-[#65D5B5]/40" aria-hidden="true"/>
        <div className="relative flex items-center justify-between border-b border-white/25 pb-5 text-xs font-semibold uppercase tracking-[0.2em]"><span>SOMA <span className="text-[#65D5B5]">●</span> CARREIRA</span><span>Jornada mensal</span></div>
        <div className="relative"><p className="mb-4 text-xs uppercase tracking-[0.25em] text-[#A9CCB8]">Uma carreira em movimento</p><h1 className="font-serif text-5xl leading-tight sm:text-7xl">Certificado<br/>de evolução.</h1><p className="mt-9 text-sm text-[#BBD2C5]">Concedido a</p><h2 className="mt-2 font-serif text-3xl">{nome}</h2><p className="mt-5 max-w-lg text-base leading-7">Pela participação ativa e pelo registro de atividades de desenvolvimento e avaliação da mentoria no período de {titulo}.</p></div>
        <div className="relative flex flex-wrap justify-between gap-4 border-t border-white/25 pt-5 text-xs uppercase tracking-[0.12em]"><span className="capitalize">{titulo}</span><span>SOMA Mentoria</span></div>
      </section>
      <section className="certificate-page flex min-h-[680px] flex-col justify-between bg-[#F7F5EE] p-8 text-[#17382F] sm:p-14">
        <div><div className="flex items-center justify-between border-b border-[#BDCFC0] pb-5 text-xs font-semibold uppercase tracking-[0.2em]"><span>SOMA • Sua evolução</span><span>02 / 02</span></div><p className="mt-12 text-xs uppercase tracking-[0.25em] text-[#386657]">Registro de desenvolvimento</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">Seu mês.<br/>Suas conquistas.</h2><div className="mt-12 grid gap-8 sm:grid-cols-2"><div className="border-t border-[#9EBBA9] pt-4"><p className="text-5xl font-serif">{acoes.length}</p><p className="mt-3 text-sm">Atividades de carreira registradas</p></div><div className="border-t border-[#9EBBA9] pt-4"><p className="text-5xl font-serif">01</p><p className="mt-3 text-sm">Avaliação mensal concluída</p></div></div><h3 className="mt-12 text-xs font-semibold uppercase tracking-[0.2em]">Áreas trabalhadas no período</h3><ul className="mt-4 grid gap-3 sm:grid-cols-2">{tipos.map(tipo=><li key={tipo} className="border-b border-[#D2DED4] py-2 text-sm">{tipo}</li>)}</ul></div>
        <div className="border-t border-[#BDCFC0] pt-5 text-xs leading-5 text-[#52675B]">Este documento reconhece registros de participação e desenvolvimento na SOMA. Não comprova competências formalmente avaliadas, carga horária ou endosso de terceiros. A avaliação privada não é reproduzida.</div>
      </section>
    </div>
    <style>{`@media print { @page { size: A4 portrait; margin: 0; } html,body { background: white!important; } body * { visibility: hidden; } .certificate-pages,.certificate-pages * { visibility: visible; } .certificate-pages { position: absolute; inset: 0; width: 100%; } .certificate-page { break-after: page; page-break-after: always; min-height: 297mm!important; width:210mm!important; print-color-adjust:exact; -webkit-print-color-adjust:exact; } .certificate-page:last-child { break-after: auto; page-break-after:auto; } .no-print { display:none!important; } }`}</style>
  </main>;
}

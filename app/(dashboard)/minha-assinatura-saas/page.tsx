import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolverAcessoSaas, SAAS_TRIAL_DIAS } from '@/lib/soma-saas-entitlements';
import SaasTrialControl from '@/components/saas/SaasTrialControl';
import SaasCheckoutControl from '@/components/saas/SaasCheckoutControl';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Minha assinatura SaaS | SOMA' };

export default async function MinhaAssinaturaSaasPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login?next=%2Fminha-assinatura-saas');

  let acesso;
  try { acesso = await resolverAcessoSaas(user.id); } catch {
    return <main className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="text-2xl font-bold text-[#183F37]">Minha assinatura SaaS</h1>
      <p role="alert" className="mt-4 text-sm text-[#a04733]">Não foi possível consultar os acessos agora.</p>
      <Link href="/planos" className="mt-4 inline-block underline">Ver planos</Link>
    </main>;
  }
  const { data: modulos } = await db.from('soma_modules').select('slug,title')
    .eq('enabled',true).order('display_order');
  const cat = new Map((modulos||[]).map(m=>[m.slug,m.title]));
  const trialVenceu = acesso.trialJaUsado && !acesso.emTrialSaas;
  const liberado = process.env.SOMA_SAAS_TRIAL_GATES_READY === 'true';
  const checkoutLiberado = process.env.SOMA_SAAS_CHECKOUT_GATES_READY === 'true';

  return <main className="mx-auto max-w-4xl px-5 py-8">
    <p className="text-xs font-semibold uppercase tracking-widest text-[#0D8071]">SOMA Plataforma</p>
    <h1 className="mt-2 text-3xl font-bold text-[#183F37]">Minha assinatura SaaS</h1>
    <p className="mt-2 text-sm leading-6 text-[#597165]">
      Consulte seu plano, os módulos autorizados e o período de teste.
      Sua contratação da plataforma é separada da mentoria com encontros humanos.
    </p>

    <section className="mt-7 rounded-2xl border border-[#d6e7de] bg-[#f6faf7] p-5">
      <h2 className="text-lg font-semibold text-[#244a3c]">Seu acesso</h2>
      {acesso.temMentoria ?
        <p className="mt-2 text-sm">Sua mentoria está ativa. As ferramentas previstas no seu contrato continuam disponíveis.</p> :
        acesso.emTrialSaas ?
          <p className="mt-2 text-sm">Seu teste SaaS de {SAAS_TRIAL_DIAS} dias está ativo até{' '}
            <strong>{acesso.expiraEm ? new Date(acesso.expiraEm).toLocaleDateString('pt-BR',
              {timeZone:'America/Sao_Paulo'}):''}</strong>.
            O teste não inclui encontros de mentoria.</p> :
          <p className="mt-2 text-sm">{trialVenceu
            ? 'Seu teste SaaS já foi utilizado. Consulte os planos para continuar.'
            : 'Você ainda não tem um teste SaaS ativo.'}</p>}
      <h3 className="mt-5 text-sm font-semibold">Módulos disponíveis para sua conta</h3>
      {acesso.modulosPermitidos.length ?
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">{acesso.modulosPermitidos.map(slug=>
          <li key={slug} className="rounded-lg border border-[#d7e5db] bg-white px-3 py-2 text-sm">
            {cat.get(slug)||slug}
          </li>)}</ul> :
        <p className="mt-2 text-sm text-[#5a7064]">Nenhum módulo contratado ou em teste no momento.</p>}
    </section>
    {!acesso.temMentoria && !acesso.trialJaUsado &&
      <SaasTrialControl modulos={modulos||[]} liberado={liberado} />}
    {!acesso.temMentoria && <SaasCheckoutControl modulos={modulos||[]} disponivel={checkoutLiberado} />}
    <p className="mt-6 text-sm text-[#5a7064]">
      Os planos da Plataforma e da Carreira possuem condições e acessos distintos.
    </p>
    <Link href="/planos#soma-saas" className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-[#b6d6c6] px-4 text-sm font-semibold text-[#0D8071] hover:bg-[#f2faf5]">
      Ver planos da Plataforma
    </Link>
  </main>;
}

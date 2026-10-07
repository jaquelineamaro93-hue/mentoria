import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Beaker,
  Clock3,
  FlaskConical,
  Sparkles,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Panel, Eyebrow } from '@/components/Panel';

export const dynamic = 'force-dynamic';

type FeatureRow = {
  key: string;
  label: string;
  group: string;
  allUsers: number;
  recentUsers: number;
  recentActions: number;
  views: number;
  isNew?: boolean;
};

type TimedRow = {
  userId: string;
  timestamp: string | null;
};

function uniqueUsers(rows: TimedRow[], cutoff?: number) {
  return new Set(
    rows
      .filter((row) => {
        if (!row.userId) return false;
        if (!cutoff) return true;
        if (!row.timestamp) return false;
        return new Date(row.timestamp).getTime() >= cutoff;
      })
      .map((row) => row.userId)
  ).size;
}

function recentActions(rows: TimedRow[], cutoff: number) {
  return rows.filter(
    (row) => row.timestamp && new Date(row.timestamp).getTime() >= cutoff
  ).length;
}

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function featureSignal(row: FeatureRow, base: number) {
  if (row.isNew) return 'Nova: medir antes de otimizar';

  const adoption = pct(row.allUsers, base);
  if (adoption >= 35 && row.recentUsers >= 5) return 'Core: aprofundar valor';
  if (adoption >= 25 && row.recentUsers <= 2) return 'Boa adoção, uso recente baixo';
  if (row.views >= 5 && row.recentUsers <= 1) return 'Visita sem uso salvo: investigar fricção';
  if (adoption <= 10 && row.views <= 2) return 'Baixa descoberta: revisar navegação';
  return 'Acompanhar';
}

function featureTone(signal: string) {
  if (signal.startsWith('Core')) return 'bg-emerald-50 text-emerald-800';
  if (signal.includes('fricção') || signal.includes('uso recente baixo')) {
    return 'bg-amber-50 text-amber-800';
  }
  if (signal.includes('Baixa descoberta')) return 'bg-rose-50 text-rose-800';
  return 'bg-gray-50 text-gray-text';
}

type PagedQuery = PromiseLike<{
  data: any[] | null;
  error: { message?: string } | null;
}>;

async function allRows(
  loadPage: (from: number, to: number) => PagedQuery,
  pageSize = 1000
): Promise<any[]> {
  const result: any[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await loadPage(from, from + pageSize - 1);
    if (error) {
      throw new Error(error.message || 'Falha ao carregar dados de analytics.');
    }

    const page = data ?? [];
    result.push(...page);

    if (page.length < pageSize) break;
  }

  return result;
}

async function rows(
  loadPage: (from: number, to: number) => PagedQuery,
  userField: string,
  timeField: string
): Promise<TimedRow[]> {
  const data = await allRows(loadPage);
  return data.map((row) => ({
    userId: String(row[userField] ?? ''),
    timestamp: row[timeField] ? String(row[timeField]) : null,
  }));
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!me?.is_admin) redirect('/dashboard');

  const params = await searchParams;
  const requestedDays = Number(params.period ?? 30);
  const periodDays = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
  const cutoff = Date.now() - periodDays * 86400000;
  const cutoffIso = new Date(cutoff).toISOString();
  const admin = createAdminClient();

  const [
    profiles,
    events,
    experiments,
    assignments,
    diagnostics,
    via,
    pdi,
    journal,
    quemSouEu,
    feedback360,
    linkedinDrafts,
    entrevistas,
    vagas,
    contatos,
    primeiros90,
    checkins,
    cvs,
    somaAnalises,
  ] = await Promise.all([
    allRows((from, to) =>
      admin
        .from('profiles')
        .select(
          'id,created_at,last_activity_at,status_assinatura,trial_status,trial_started_at,trial_ends_at,trial_converted_at,trial_prompt_variant,is_admin'
        )
        .eq('is_admin', false)
        .range(from, to)
    ),
    allRows((from, to) =>
      admin
        .from('product_events')
        .select('user_id,event_name,feature_key,metadata,occurred_at')
        .gte('occurred_at', cutoffIso)
        .order('occurred_at', { ascending: false })
        .range(from, to)
    ),
    allRows((from, to) =>
      admin
        .from('product_experiments')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to)
    ),
    allRows((from, to) =>
      admin
        .from('product_experiment_assignments')
        .select('experiment_id,user_id,variant,assigned_at')
        .range(from, to)
    ),
    rows(
      (from, to) => admin.from('diagnostics').select('user_id,updated_at').range(from, to),
      'user_id',
      'updated_at'
    ),
    rows(
      (from, to) => admin.from('via_resultados').select('user_id,updated_at').range(from, to),
      'user_id',
      'updated_at'
    ),
    rows(
      (from, to) => admin.from('pdi_respostas').select('user_id,updated_at').range(from, to),
      'user_id',
      'updated_at'
    ),
    rows(
      (from, to) => admin.from('journal_notes').select('user_id,updated_at').range(from, to),
      'user_id',
      'updated_at'
    ),
    rows(
      (from, to) => admin.from('quem_sou_eu_respostas').select('user_id,updated_at').range(from, to),
      'user_id',
      'updated_at'
    ),
    rows(
      (from, to) => admin.from('feedback_360_rounds').select('user_id,updated_at').range(from, to),
      'user_id',
      'updated_at'
    ),
    rows(
      (from, to) => admin.from('linkedin_content_drafts').select('user_id,updated_at').range(from, to),
      'user_id',
      'updated_at'
    ),
    rows(
      (from, to) => admin.from('entrevista_simulacoes').select('user_id,updated_at').range(from, to),
      'user_id',
      'updated_at'
    ),
    rows(
      (from, to) => admin.from('vagas_candidatura').select('mentorado_id,updated_at').range(from, to),
      'mentorado_id',
      'updated_at'
    ),
    rows(
      (from, to) => admin.from('contatos_rede').select('user_id,created_at').range(from, to),
      'user_id',
      'created_at'
    ),
    rows(
      (from, to) =>
        admin.from('primeiros_90_dias_respostas').select('user_id,updated_at').range(from, to),
      'user_id',
      'updated_at'
    ),
    rows(
      (from, to) => admin.from('checkins_mensais').select('user_id,created_at').range(from, to),
      'user_id',
      'created_at'
    ),
    rows(
      (from, to) => admin.from('cv_simulacoes').select('user_id,created_at').range(from, to),
      'user_id',
      'created_at'
    ),
    allRows((from, to) =>
      admin.from('soma_analises').select('user_id,ferramenta,created_at').range(from, to)
    ),
  ]);

  const base = profiles.length;
  const active7 = profiles.filter(
    (profile) =>
      profile.last_activity_at &&
      new Date(profile.last_activity_at).getTime() >= Date.now() - 7 * 86400000
  ).length;
  const active30 = profiles.filter(
    (profile) =>
      profile.last_activity_at &&
      new Date(profile.last_activity_at).getTime() >= Date.now() - 30 * 86400000
  ).length;
  const newPeriod = profiles.filter(
    (profile) => new Date(profile.created_at).getTime() >= cutoff
  ).length;
  const never = profiles.filter((profile) => !profile.last_activity_at).length;

  const viewMap = new Map<string, Set<string>>();
  for (const event of events) {
    if (event.event_name !== 'feature_view' || !event.feature_key || !event.user_id) continue;
    const current = viewMap.get(event.feature_key) ?? new Set<string>();
    current.add(event.user_id);
    viewMap.set(event.feature_key, current);
  }

  const somaByTool = (tool: string): TimedRow[] =>
    somaAnalises
      .filter((item) => item.ferramenta === tool)
      .map((item) => ({ userId: item.user_id, timestamp: item.created_at }));

  const featureDefinitions: Array<{
    key: string;
    label: string;
    group: string;
    data: TimedRow[];
    isNew?: boolean;
  }> = [
    { key: 'quem_sou_eu', label: 'Mapa Quem Sou Eu', group: 'Minha jornada', data: quemSouEu },
    { key: 'diagnostico_perfil', label: 'Diagnóstico & Perfil', group: 'Minha jornada', data: diagnostics },
    { key: 'via', label: 'VIA', group: 'Minha jornada', data: via },
    { key: 'diario', label: 'Diário de Bordo', group: 'Minha jornada', data: journal },
    { key: 'percepcao_360', label: 'Percepção 360', group: 'Minha jornada', data: feedback360, isNew: true },
    { key: 'pdi', label: 'Plano de desenvolvimento', group: 'Crescimento na empresa', data: pdi },
    { key: 'primeiros_90_dias', label: 'Primeiros 90 dias', group: 'Crescimento na empresa', data: primeiros90 },
    { key: 'leitura_cenario', label: 'Leitura de cenário', group: 'Crescimento na empresa', data: somaByTool('cenario') },
    { key: 'curriculo', label: 'Analisar currículo', group: 'Mercado de trabalho', data: cvs },
    { key: 'gupy', label: 'Gupy & ATS', group: 'Mercado de trabalho', data: somaByTool('gupy') },
    { key: 'linkedin', label: 'LinkedIn estratégico', group: 'Mercado de trabalho', data: somaByTool('linkedin') },
    { key: 'conteudo_linkedin', label: 'Conteúdo & marca pessoal', group: 'Mercado de trabalho', data: linkedinDrafts },
    { key: 'vagas', label: 'Vagas & candidaturas', group: 'Mercado de trabalho', data: vagas },
    { key: 'network', label: 'Rede & oportunidades', group: 'Mercado de trabalho', data: contatos },
    { key: 'entrevista', label: 'Entrevistas & simulações', group: 'Mercado de trabalho', data: entrevistas },
    { key: 'avaliacao_mentoria', label: 'Avaliar a mentoria', group: 'Sua experiência', data: checkins },
  ];

  const features: FeatureRow[] = featureDefinitions
    .map((feature) => ({
      key: feature.key,
      label: feature.label,
      group: feature.group,
      allUsers: uniqueUsers(feature.data),
      recentUsers: uniqueUsers(feature.data, cutoff),
      recentActions: recentActions(feature.data, cutoff),
      views: viewMap.get(feature.key)?.size ?? 0,
      isNew: feature.isNew,
    }))
    .sort((a, b) => b.recentUsers - a.recentUsers || b.allUsers - a.allUsers);

  const trialsStarted = profiles.filter((profile) => Boolean(profile.trial_started_at));
  const trialsConverted = profiles.filter((profile) => profile.trial_status === 'converted');
  const trialsActive = profiles.filter((profile) => profile.trial_status === 'active');
  const trialsExpired = profiles.filter((profile) => profile.trial_status === 'expired');

  const conversionDays = trialsConverted
    .filter((profile) => profile.trial_started_at && profile.trial_converted_at)
    .map(
      (profile) =>
        (new Date(profile.trial_converted_at).getTime() -
          new Date(profile.trial_started_at).getTime()) /
        86400000
    );

  const avgConversionDays =
    conversionDays.length > 0
      ? conversionDays.reduce((sum, value) => sum + value, 0) / conversionDays.length
      : null;

  const experiment = experiments.find((item) => item.key === 'trial_prompt_timing_v2');
  const experimentAssignments = experiment
    ? assignments.filter((item) => item.experiment_id === experiment.id)
    : [];

  const variants = ['adaptive_value', 'fixed_day_5'].map((variant) => {
    const assignedUsers = new Set(
      experimentAssignments.filter((item) => item.variant === variant).map((item) => item.user_id)
    );

    const promptUsers = new Set(
      events
        .filter(
          (event) =>
            event.event_name === 'trial_prompt_view' &&
            assignedUsers.has(event.user_id)
        )
        .map((event) => event.user_id)
    );

    const checkoutUsers = new Set(
      events
        .filter(
          (event) =>
            (event.event_name === 'trial_upgrade_click' ||
              event.event_name === 'checkout_started') &&
            assignedUsers.has(event.user_id)
        )
        .map((event) => event.user_id)
    );

    const convertedUsers = new Set(
      profiles
        .filter(
          (profile) =>
            profile.trial_status === 'converted' &&
            profile.trial_prompt_variant === variant &&
            assignedUsers.has(profile.id)
        )
        .map((profile) => profile.id)
    );

    return {
      variant,
      assigned: assignedUsers.size,
      prompts: promptUsers.size,
      checkout: checkoutUsers.size,
      converted: convertedUsers.size,
      conversionRate: assignedUsers.size
        ? Math.round((convertedUsers.size / assignedUsers.size) * 100)
        : 0,
    };
  });

  const dayBuckets = Array.from({ length: periodDays }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (periodDays - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      users: new Set<string>(),
    };
  });

  const dayMap = new Map(dayBuckets.map((bucket) => [bucket.key, bucket]));
  for (const event of events) {
    if (!event.user_id) continue;
    const key = new Date(event.occurred_at).toISOString().slice(0, 10);
    dayMap.get(key)?.users.add(event.user_id);
  }

  const maxDaily = Math.max(1, ...dayBuckets.map((bucket) => bucket.users.size));

  return (
    <main className="px-6 py-8 md:px-10 md:py-10 w-full">
      <Link
        href="/admin"
        className="mb-5 inline-flex items-center gap-2 text-sm text-gray-text hover:text-black"
      >
        <ArrowLeft size={15} /> Voltar ao admin
      </Link>

      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow>
            <BarChart3 size={13} /> Produto & crescimento
          </Eyebrow>
          <h1 className="font-display text-3xl text-black mt-2">Analytics do portal</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-text">
            Uso real das ferramentas, sinais de melhoria, trial e experimentos. Os dados históricos
            vêm do próprio Supabase; as visualizações de página passam a ser registradas daqui para frente.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-gray-faint bg-white p-1">
          {[7, 30, 90].map((days) => (
            <Link
              key={days}
              href={`/admin/analytics?period=${days}`}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-medium',
                periodDays === days ? 'bg-mint-deep text-white' : 'text-gray-text hover:text-black',
              ].join(' ')}
            >
              {days}d
            </Link>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Mentorados', value: base, icon: Users },
          { label: 'Ativos 7d', value: active7, icon: Activity },
          { label: 'Ativos 30d', value: active30, icon: Activity },
          { label: `Novos ${periodDays}d`, value: newPeriod, icon: Sparkles },
          { label: 'Nunca acessaram', value: never, icon: Clock3 },
        ].map(({ label, value, icon: Icon }) => (
          <Panel key={label} className="p-4">
            <Icon size={16} className="text-mint-deep mb-2" />
            <p className="font-display text-2xl text-black">{value}</p>
            <p className="text-xs text-gray-text">{label}</p>
          </Panel>
        ))}
      </div>

      <section className="mb-8">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-[0.12em] text-gray-text">Priorização de produto</p>
          <h2 className="font-display text-2xl text-black mt-1">O que as pessoas realmente usam</h2>
          <p className="text-xs leading-5 text-gray-text mt-1 max-w-3xl">
            “Adoção” considera usuários que já salvaram algo naquela ferramenta. “Usuários recentes”
            e “ações” usam os últimos {periodDays} dias. “Visitas” começa a acumular após esta atualização.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-faint bg-white">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-gray-faint bg-gray-50/70">
                <th className="px-4 py-3 text-left font-medium text-black">Feature</th>
                <th className="px-4 py-3 text-right font-medium text-black">Adoção</th>
                <th className="px-4 py-3 text-right font-medium text-black">Usuários {periodDays}d</th>
                <th className="px-4 py-3 text-right font-medium text-black">Ações {periodDays}d</th>
                <th className="px-4 py-3 text-right font-medium text-black">Visitas {periodDays}d</th>
                <th className="px-4 py-3 text-left font-medium text-black">Sinal</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => {
                const signal = featureSignal(feature, base);
                return (
                  <tr key={feature.key} className="border-b border-gray-faint last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-black">{feature.label}</p>
                      <p className="text-[10px] text-gray-text mt-0.5">{feature.group}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-black">
                      {feature.allUsers}/{base} <span className="text-gray-text">({pct(feature.allUsers, base)}%)</span>
                    </td>
                    <td className="px-4 py-3 text-right text-black">{feature.recentUsers}</td>
                    <td className="px-4 py-3 text-right text-black">{feature.recentActions}</td>
                    <td className="px-4 py-3 text-right text-black">{feature.views}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] ${featureTone(signal)}`}>
                        {signal}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid xl:grid-cols-2 gap-6 mb-8">
        <Panel className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <Eyebrow>
                <FlaskConical size={13} /> Trial
              </Eyebrow>
              <h2 className="font-display text-xl text-black">Funil do teste gratuito</h2>
            </div>
            <Link
              href="/admin/gerenciar-planos"
              className="text-xs font-medium text-mint-deep hover:underline"
            >
              Configurar pacotes
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['Iniciados', trialsStarted.length],
              ['Ativos', trialsActive.length],
              ['Convertidos', trialsConverted.length],
              ['Expirados', trialsExpired.length],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-gray-faint p-3">
                <p className="font-display text-xl text-black">{value}</p>
                <p className="text-[11px] text-gray-text">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-text">Conversão</p>
              <p className="mt-1 font-display text-2xl text-black">
                {trialsStarted.length ? Math.round((trialsConverted.length / trialsStarted.length) * 100) : 0}%
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-text">Tempo médio até compra</p>
              <p className="mt-1 font-display text-2xl text-black">
                {avgConversionDays === null ? '—' : `${avgConversionDays.toFixed(1)} dias`}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-gray-text">
            O acesso continua disponível por até 7 dias. O experimento testa quando mostrar o convite
            para continuar, não quando encerrar o trial.
          </p>
        </Panel>

        <Panel className="p-5 md:p-6">
          <Eyebrow>
            <Beaker size={13} /> Teste A/B
          </Eyebrow>
          <h2 className="font-display text-xl text-black">Momento do convite de conversão</h2>
          <p className="mt-1 text-xs leading-5 text-gray-text">
            Variante A usa sinais de valor percebido; variante B espera o 7º dia. A conversão paga é
            a métrica principal.
          </p>

          <div className="mt-5 space-y-3">
            {variants.map((variant) => (
              <div key={variant.variant} className="rounded-xl border border-gray-faint p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-black">
                    {variant.variant === 'adaptive_value'
                      ? 'A · Depois de valor percebido'
                      : 'B · Dia 5'}
                  </p>
                  <span className="text-xs text-gray-text">{variant.conversionRate}% conversão</span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  {[
                    ['Atribuídos', variant.assigned],
                    ['Prompt', variant.prompts],
                    ['Checkout', variant.checkout],
                    ['Pagaram', variant.converted],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg bg-gray-50 px-2 py-2">
                      <p className="text-sm font-medium text-black">{value}</p>
                      <p className="text-[9px] text-gray-text">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[11px] leading-5 text-gray-text">
            Não declare vencedor com amostra pequena. Primeiro observe volume, equilíbrio entre variantes
            e conversões suficientes para uma decisão confiável.
          </p>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <p className="text-xs uppercase tracking-[0.12em] text-gray-text">Telemetria própria</p>
          <h2 className="font-display text-2xl text-black mt-1">Usuários com eventos por dia</h2>
        </div>

        <Panel className="p-5">
          {events.length === 0 ? (
            <p className="text-sm leading-6 text-gray-text">
              A coleta de eventos do portal começa com esta versão. O histórico de features acima
              continua disponível porque é reconstruído pelos dados já salvos no Supabase.
            </p>
          ) : (
            <div className="flex h-44 items-end gap-1 overflow-x-auto pt-4">
              {dayBuckets.map((bucket) => {
                const height = Math.max(4, Math.round((bucket.users.size / maxDaily) * 130));
                return (
                  <div key={bucket.key} className="flex min-w-[18px] flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[9px] text-gray-text">{bucket.users.size || ''}</span>
                    <div
                      className="w-full rounded-t bg-mint-deep/75"
                      style={{ height }}
                      title={`${bucket.label}: ${bucket.users.size} usuários`}
                    />
                    {periodDays <= 30 && (
                      <span className="text-[8px] text-gray-text [writing-mode:vertical-rl]">
                        {bucket.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </section>
    </main>
  );
}

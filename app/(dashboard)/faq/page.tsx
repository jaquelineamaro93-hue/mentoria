import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    categoria: 'Primeiros passos',
    perguntas: [
      {
        pergunta: 'O que e o SOMA Mentoria?',
        resposta: 'O SOMA e uma plataforma de mentoria de carreira. Aqui voce vai se autoconhecer, criar um plano de desenvolvimento (PDI), registrar sua evolucao e receber suporte da sua mentora ao longo de 90 dias.',
      },
      {
        pergunta: 'Por onde eu comeco?',
        resposta: 'Comece pelo Onboarding — e o primeiro passo da sua jornada. Depois acesse o Mapa Quem Sou Eu e o Diagnostico & Perfil para se conhecer melhor antes de montar seu PDI.',
      },
      {
        pergunta: 'Como funciona a trilha de 90 dias?',
        resposta: 'A trilha e dividida em 3 fases de 30 dias cada: Fase 1 (Diagnostico e Mapeamentos), Fase 2 (Posicionamento e Execucao) e Fase 3 (Alquimia e Consolidacao). Cada fase tem atividades especificas para voce completar.',
      },
    ],
  },
  {
    categoria: 'PDI e Desenvolvimento',
    perguntas: [
      {
        pergunta: 'O que e o PDI?',
        resposta: 'PDI significa Plano de Desenvolvimento Individual. E um documento personalizado com seus objetivos, acoes e prazos para crescer na carreira. Voce preenche as 20 secoes do Meu PDI e a IA gera seu plano automaticamente.',
      },
      {
        pergunta: 'Como gero meu plano do PDI?',
        resposta: 'Acesse PDI & Trilha Estrategica, preencha todas as 20 secoes das Perguntas Guia e clique na aba "Plano". Depois clique em "Gerar meu plano" — a IA vai criar um plano personalizado com base nas suas respostas.',
      },
      {
        pergunta: 'Posso editar meu PDI depois?',
        resposta: 'Sim! Voce pode voltar a qualquer secao e atualizar suas respostas. O plano pode ser regerado sempre que quiser.',
      },
    ],
  },
  {
    categoria: 'Pontos e Passaporte',
    perguntas: [
      {
        pergunta: 'Como funciona o sistema de pontos?',
        resposta: 'Voce ganha pontos completando atividades: preencher o PDI, escrever no Diario de Bordo, participar de encontros e muito mais. Os pontos acumulam no seu Passaporte SOMA.',
      },
      {
        pergunta: 'O que sao os selos?',
        resposta: 'Selos sao conquistas especiais que voce desbloqueia ao completar marcos importantes da mentoria. Por exemplo: completar todas as secoes do PDI, manter o diario ativo por 4 semanas, etc.',
      },
    ],
  },
  {
    categoria: 'Checkin Mensal',
    perguntas: [
      {
        pergunta: 'O que e o checkin mensal?',
        resposta: 'Uma vez por mes, voce da uma nota de 0 a 5 e escreve um comentario sobre como esta sendo a mentoria. Isso ajuda sua mentora a entender como voce esta e ajustar o que for preciso.',
      },
      {
        pergunta: 'O comentario e obrigatorio?',
        resposta: 'Sim! Alem da nota, voce precisa escrever pelo menos um comentario sobre sua experiencia. Quanto mais detalhe, melhor para a sua mentora te ajudar.',
      },
    ],
  },
  {
    categoria: 'Acesso e conta',
    perguntas: [
      {
        pergunta: 'Como faco login?',
        resposta: 'Voce recebe um codigo de 6 digitos no seu email. So digitar o codigo para entrar — sem precisar criar senha. Tambem pode entrar com sua conta Google.',
      },
      {
        pergunta: 'Como troco minha foto de perfil?',
        resposta: 'Va em Meu Perfil (no canto inferior esquerdo do menu). La voce pode atualizar sua foto, nome e outras informacoes.',
      },
      {
        pergunta: 'Tive algum problema tecnico. O que faco?',
        resposta: 'Tente recarregar a pagina primeiro. Se o problema persistir, entre em contato com sua mentora pelo WhatsApp ou email.',
      },
    ],
  },
];

export default async function FaqPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, tipo_pacote, is_admin, foto_url')
    .eq('id', user.id)
    .single();

  async function handleSignOut() {
    'use server';
    const sb = await createClient();
    await sb.auth.signOut();
    redirect('/login');
  }

  return (
    <>
      <div className="px-6 py-10 md:px-12">
        <h1 className="font-display text-3xl text-black mb-2">Perguntas Frequentes</h1>
        <p className="text-gray-text mb-10">Tudo o que voce precisa saber para aproveitar ao maximo a mentoria.</p>

          <div className="space-y-8">
            {FAQS.map((cat) => (
              <div key={cat.categoria}>
                <h2 className="text-xs uppercase tracking-widest text-gray-text mb-4">{cat.categoria}</h2>
                <div className="space-y-3">
                  {cat.perguntas.map((faq) => (
                    <details key={faq.pergunta} className="bg-white border border-gray-faint rounded-xl group">
                      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-medium text-black hover:text-orange transition-colors">
                        {faq.pergunta}
                        <ChevronDown size={16} className="text-gray-text group-open:rotate-180 transition-transform shrink-0 ml-4" />
                      </summary>
                      <div className="px-5 pb-4 text-sm text-gray-text leading-relaxed">
                        {faq.resposta}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

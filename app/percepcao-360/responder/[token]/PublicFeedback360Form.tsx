'use client';

import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, MessageSquareText, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Feedback360Closeness, Feedback360Relationship } from '@/lib/types';

export interface PublicFeedback360Data {
  mentor_name: string;
  title: string;
  objective: string | null;
  questions: Array<{
    id: string;
    order: number;
    text: string;
  }>;
}

const RELACOES: Array<{ value: Feedback360Relationship; label: string }> = [
  { value: 'gestor_direto', label: 'Gestor direto' },
  { value: 'lideranca_indireta', label: 'Liderança indireta' },
  { value: 'responde_a_mim', label: 'Responde a mim' },
  { value: 'par', label: 'Par / colega' },
  { value: 'stakeholder', label: 'Stakeholder' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'colega_faculdade', label: 'Colega de faculdade' },
  { value: 'professor', label: 'Professor(a)' },
  { value: 'amigo_pessoal', label: 'Relação pessoal' },
  { value: 'outro', label: 'Outro' },
];

const CONVIVENCIAS: Array<{ value: Feedback360Closeness; label: string }> = [
  { value: 'alta', label: 'Alta convivência' },
  { value: 'media', label: 'Convivência regular' },
  { value: 'baixa', label: 'Pouca convivência' },
];

export default function PublicFeedback360Form({
  token,
  data,
}: {
  token: string;
  data: PublicFeedback360Data | null;
}) {
  const supabase = createClient();
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [contexto, setContexto] = useState('');
  const [relacao, setRelacao] = useState<Feedback360Relationship>('par');
  const [relacaoOutro, setRelacaoOutro] = useState('');
  const [convivencia, setConvivencia] = useState<Feedback360Closeness>('media');
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const primeiroNome = useMemo(
    () => data?.mentor_name?.trim().split(/\s+/)[0] || 'esta pessoa',
    [data?.mentor_name]
  );

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] px-4 py-10 grid place-items-center">
        <section className="w-full max-w-xl rounded-2xl border border-gray-faint bg-white p-7 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-gray-100 text-gray-text">
            <MessageSquareText size={22} />
          </div>
          <p className="font-display text-2xl text-black">Este link não está disponível</p>
          <p className="mt-2 text-sm leading-6 text-gray-text">
            Ele pode ter sido desativado ou substituído. Peça um novo link para a pessoa que convidou você.
          </p>
        </section>
      </main>
    );
  }

  if (enviado) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] px-4 py-10 grid place-items-center">
        <section className="w-full max-w-xl rounded-2xl border border-mint bg-white p-7 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-mint-light text-mint-deep">
            <CheckCircle2 size={28} />
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-mint-deep">Feedback enviado</p>
          <h1 className="mt-2 font-display text-3xl text-black">Obrigada por contribuir</h1>
          <p className="mt-3 text-sm leading-6 text-gray-text">
            Suas respostas foram registradas na rodada de Percepção 360 de {primeiroNome}.
          </p>
        </section>
      </main>
    );
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');

    const respostasValidas = data.questions.map((question) => ({
      question_id: question.id,
      resposta: (respostas[question.id] ?? '').trim(),
    }));

    if (respostasValidas.some((item) => !item.resposta)) {
      setErro('Responda todas as perguntas antes de enviar.');
      return;
    }

    if (relacao === 'outro' && !relacaoOutro.trim()) {
      setErro('Descreva qual é a sua relação com a pessoa.');
      return;
    }

    setEnviando(true);

    const { error } = await supabase.rpc('submit_feedback_360_public', {
      p_token: token,
      p_nome: nome.trim(),
      p_cargo_funcao: cargo.trim(),
      p_empresa_contexto: contexto.trim(),
      p_relacao: relacao,
      p_relacao_outro: relacaoOutro.trim(),
      p_convivencia: convivencia,
      p_respostas: respostasValidas,
    });

    setEnviando(false);

    if (error) {
      setErro('Não foi possível enviar agora. Confira os campos e tente novamente.');
      return;
    }

    setEnviado(true);
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-7 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-2xl text-black">SOMA<span className="text-mint-deep">.</span></p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-gray-text">
              Percepção 360
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-faint bg-white px-3 py-1.5 text-[11px] text-gray-text">
            <ShieldCheck size={13} className="text-mint-deep" />
            Link seguro
          </div>
        </header>

        <section className="rounded-2xl border border-gray-faint bg-white p-5 sm:p-7 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.16em] text-mint-deep">
            Você foi convidado(a) por {data.mentor_name}
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl text-black">
            Conte como você percebe {primeiroNome}
          </h1>
          <p className="mt-3 text-sm sm:text-base leading-7 text-gray-text">
            {data.objective || 'Sua percepção ajuda a identificar forças, padrões e oportunidades de desenvolvimento.'}
          </p>
          <p className="mt-3 rounded-xl bg-mint-light/45 px-4 py-3 text-xs leading-5 text-black">
            Você não precisa entrar na SOMA. Seu nome é opcional e as respostas serão salvas diretamente
            na rodada correta do mentorado.
          </p>
        </section>

        <form onSubmit={enviar} className="mt-5 space-y-5">
          <section className="rounded-2xl border border-gray-faint bg-white p-5 sm:p-7 shadow-sm">
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-gray-text">Seu contexto</p>
              <p className="mt-1 text-sm text-black">
                Essas informações ajudam a interpretar o feedback sem transformar uma opinião isolada em verdade.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-gray-text">Nome opcional</span>
                <input
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  maxLength={160}
                  placeholder="Seu nome"
                  className="mt-1.5 w-full rounded-lg border border-gray-faint bg-white px-3.5 py-3 text-sm text-black outline-none focus:border-mint-deep"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wide text-gray-text">Cargo / função</span>
                <input
                  value={cargo}
                  onChange={(event) => setCargo(event.target.value)}
                  maxLength={200}
                  placeholder="Ex.: Tech Lead"
                  className="mt-1.5 w-full rounded-lg border border-gray-faint bg-white px-3.5 py-3 text-sm text-black outline-none focus:border-mint-deep"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wide text-gray-text">Empresa / contexto</span>
                <input
                  value={contexto}
                  onChange={(event) => setContexto(event.target.value)}
                  maxLength={250}
                  placeholder="Ex.: Trabalho atual"
                  className="mt-1.5 w-full rounded-lg border border-gray-faint bg-white px-3.5 py-3 text-sm text-black outline-none focus:border-mint-deep"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wide text-gray-text">Relação</span>
                <select
                  value={relacao}
                  onChange={(event) => setRelacao(event.target.value as Feedback360Relationship)}
                  className="mt-1.5 w-full rounded-lg border border-gray-faint bg-white px-3.5 py-3 text-sm text-black outline-none focus:border-mint-deep"
                >
                  {RELACOES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>

              {relacao === 'outro' && (
                <label className="block sm:col-span-2">
                  <span className="text-xs uppercase tracking-wide text-gray-text">Qual relação?</span>
                  <input
                    value={relacaoOutro}
                    onChange={(event) => setRelacaoOutro(event.target.value)}
                    maxLength={160}
                    placeholder="Descreva brevemente"
                    className="mt-1.5 w-full rounded-lg border border-gray-faint bg-white px-3.5 py-3 text-sm text-black outline-none focus:border-mint-deep"
                  />
                </label>
              )}

              <label className="block sm:col-span-2">
                <span className="text-xs uppercase tracking-wide text-gray-text">Nível de convivência</span>
                <select
                  value={convivencia}
                  onChange={(event) => setConvivencia(event.target.value as Feedback360Closeness)}
                  className="mt-1.5 w-full rounded-lg border border-gray-faint bg-white px-3.5 py-3 text-sm text-black outline-none focus:border-mint-deep"
                >
                  {CONVIVENCIAS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-faint bg-white p-5 sm:p-7 shadow-sm">
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-gray-text">Perguntas da rodada</p>
              <h2 className="mt-1 font-display text-2xl text-black">{data.title}</h2>
            </div>

            <div className="space-y-5">
              {data.questions.map((question) => (
                <label key={question.id} className="block">
                  <span className="flex items-start gap-2 text-sm font-medium leading-6 text-black">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint-light text-[11px] text-mint-deep">
                      {question.order}
                    </span>
                    <span>{question.text}</span>
                  </span>
                  <textarea
                    value={respostas[question.id] ?? ''}
                    onChange={(event) =>
                      setRespostas((current) => ({ ...current, [question.id]: event.target.value }))
                    }
                    required
                    maxLength={5000}
                    rows={5}
                    placeholder="Escreva sua resposta aqui"
                    className="mt-2.5 w-full rounded-xl border border-gray-faint bg-white px-4 py-3 text-sm leading-6 text-black outline-none focus:border-mint-deep resize-y"
                  />
                </label>
              ))}
            </div>
          </section>

          {erro && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-mint-deep px-5 py-3.5 text-sm font-medium text-white shadow-sm disabled:opacity-60"
          >
            {enviando ? <Loader2 size={17} className="animate-spin" /> : <MessageSquareText size={17} />}
            {enviando ? 'Enviando feedback...' : 'Enviar feedback'}
          </button>

          <p className="pb-5 text-center text-[11px] leading-5 text-gray-text">
            As respostas ficam disponíveis apenas para a pessoa responsável pela rodada dentro da SOMA.
          </p>
        </form>
      </div>
    </main>
  );
}

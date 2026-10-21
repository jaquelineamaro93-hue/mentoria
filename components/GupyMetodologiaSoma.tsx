import { Award, BadgeCheck, BookOpenCheck, Layers3, ListFilter, RefreshCcw } from 'lucide-react';

const estrategias = [
  {
    nome: 'Candidaturas com foco',
    Icon: ListFilter,
    pratica: 'Nos testes documentados no Guia GUPY da SOMA, candidaturas simultâneas a várias vagas da mesma empresa puderam diminuir as chances de avanço.',
    aplicar: 'Priorize oportunidades mais aderentes e confira o histórico antes de se inscrever novamente.',
  },
  {
    nome: 'Likes, dislikes e histórico',
    Icon: Layers3,
    pratica: 'A metodologia SOMA registra efeitos de avaliações anteriores de recrutadores sobre oportunidades futuras.',
    aplicar: 'Leve em conta o histórico das candidaturas ao planejar novas inscrições. O peso interno dessas avaliações não é público.',
  },
  {
    nome: 'Título e atividades estratégicos',
    Icon: BookOpenCheck,
    pratica: 'Cargos, descrições das atividades e palavras-chave influenciam a leitura e a encontrabilidade do perfil.',
    aplicar: 'Use nomenclaturas coerentes com sua experiência real e com os requisitos da vaga.',
  },
  {
    nome: 'Cursos e certificações',
    Icon: Award,
    pratica: 'O guia destaca cursos por habilidade e a organização de certificados relevantes, inclusive links de comprovação.',
    aplicar: 'Detalhe competências reais e reúna certificados verificáveis. Priorize formações relacionadas à vaga.',
  },
  {
    nome: 'Requisitos obrigatórios',
    Icon: BadgeCheck,
    pratica: 'Campos incompletos ou requisitos que não aparecem claramente no currículo podem prejudicar a avaliação de aderência.',
    aplicar: 'Quando realmente tiver uma habilidade exigida, como Excel avançado, descreva seu nível e a experiência que o comprova.',
  },
  {
    nome: 'Reorganização de cadastro',
    Icon: RefreshCcw,
    pratica: 'O Guia GUPY documenta experimentos de atualização, exclusão e recriação de perfis para analisar mudanças no histórico.',
    aplicar: 'Revise seus dados e, caso precise corrigir ou excluir a conta, utilize os canais oficiais e informações de identificação verdadeiras. O comportamento observado não garante um novo score.',
  },
] as const;

export default function GupyMetodologiaSoma({ expandido = false }: { expandido?: boolean }) {
  return (
    <section aria-labelledby="metodo-soma-gupy" className="min-w-0 overflow-hidden rounded-2xl border border-[#c9e1d8] bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint-light text-mint-deep">
          <BookOpenCheck size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-mint-deep">Metodologia SOMA · Guia GUPY</p>
          <h3 id="metodo-soma-gupy" className="mt-1 font-display text-2xl leading-tight text-[#183f37]">
            Hacks e práticas testadas na Gupy
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#50685f]">
            Aprendizados documentados ao longo de três anos de experimentos da criadora da SOMA.
            Eles integram a metodologia do portal e não representam divulgação oficial dos pesos internos da Gupy.
          </p>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-[#b9d9cd] bg-[#edf7f2] px-4 py-4">
        <p className="text-sm font-semibold text-[#183f37]">Uma regra importante: currículo único na Gupy</p>
        <p className="mt-1 text-sm leading-6 text-[#375748]">
          Alterações em “Meu currículo” são replicadas para todas as candidaturas ativas.
          Por isso, a SOMA recomenda melhorar um único perfil completo e fiel à trajetória,
          sem criar versões por vaga nem alternar o currículo a cada inscrição.
        </p>
        <a href="https://suporte-candidatos.gupy.io/s/article/Como-atualizar-o-meu-curriculo?language=pt_BR"
           target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-mint-deep underline underline-offset-2">
          Orientação oficial da Gupy
        </a>
      </div>
      <div className={'mt-5 grid gap-3 ' + (expandido ? 'lg:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3')}>
        {estrategias.map(({ nome, Icon, pratica, aplicar }) => (
          <article key={nome} className="min-w-0 rounded-xl border border-gray-faint bg-[#fbfcfb] p-4">
            <div className="flex items-center gap-2">
              <Icon size={18} className="shrink-0 text-mint-deep" aria-hidden="true" />
              <h4 className="text-sm font-semibold text-[#193f34]">{nome}</h4>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#43594f]">{pratica}</p>
            <div className="mt-3 border-t border-[#e1ece6] pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-mint-deep">Como aplicar</p>
              <p className="mt-1 text-sm leading-6 text-[#33493f]">{aplicar}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

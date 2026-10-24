export const ADMIN_AREAS = [
  { group: 'Pessoas e acompanhamento', items: [
    { href: '/admin/usuarios', title: 'Pessoas e acessos', description: 'Contas e permissões' },
    { href: '/admin/acompanhamentos', title: 'Íris e WhatsApp', description: 'Conversas e acompanhamentos' },
    { href: '/admin/feedbacks', title: 'Feedbacks do PDI', description: 'Devolutivas e evolução dos mentorados' },
  ] },
  { group: 'Produtos e financeiro', items: [
    { href: '/admin/gerenciar-planos', title: 'Planos e contratos', description: 'Produtos, vigências e acessos' },
    { href: '/admin/financeiro', title: 'Financeiro', description: 'Receitas e movimentações' },
  ] },
  { group: 'Conteúdos e resultados', items: [
    { href: '/admin/ajuda', title: 'Conteúdos e novidades', description: 'Tutoriais e avisos no sino' },
    { href: '/admin/analytics', title: 'Resultados', description: 'Uso da plataforma e testes A/B' },
    { href: '/admin/crescimento', title: 'Crescimento', description: 'Aquisição e retenção' },
    { href: '/admin/enquetes', title: 'Votações', description: 'Perguntas e respostas da comunidade' },
    { href: '/admin/vagas', title: 'Vagas', description: 'Gerenciar oportunidades' },
    { href: '/admin/indicacoes', title: 'Indicações', description: 'Acompanhar indicações' },
  ] },
];

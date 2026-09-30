import {
  LayoutDashboard, ListChecks, Compass, Sparkles, CalendarDays, Target,
  NotebookPen, PlayCircle, Award, BriefcaseBusiness, Star,
  Users, MessageCircle, MapPin, Gift, CreditCard, HelpCircle, FileText, ShieldCheck,
  FileSearch, MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}
export interface PortalNavGroup {
  id: string;
  label: string;
  items: PortalNavItem[];
}

export const overviewItem: PortalNavItem = { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard };
export const adminItem: PortalNavItem = { href: '/admin', label: 'Administração', icon: ShieldCheck };

export const portalNavGroups: PortalNavGroup[] = [
  {
    id: 'jornada',
    label: 'Minha jornada',
    items: [
      { href: '/onboarding', label: 'Primeiros passos', icon: ListChecks },
      { href: '/quem-sou-eu', label: 'Mapa Quem Sou Eu', icon: Sparkles },
      { href: '/exercicios', label: 'Diagnóstico & Perfil', icon: Compass },
      { href: '/diario', label: 'Diário de Bordo', icon: NotebookPen },
      { href: '/gravacoes', label: 'Gravações', icon: PlayCircle },
    ],
  },
  {
    id: 'empresa',
    label: 'Crescimento na empresa',
    items: [
      { href: '/primeiros-90-dias', label: 'Primeiros 90 dias', icon: CalendarDays },
      { href: '/meu-pdi', label: 'Plano de desenvolvimento', icon: Target },
    ],
  },
  {
    id: 'mercado',
    label: 'Mercado de trabalho',
    items: [
      { href: '/carreira?etapa=cv', label: 'Analisar currículo', icon: FileSearch },
      { href: '/carreira?etapa=vagas', label: 'Vagas & candidaturas', icon: BriefcaseBusiness },
      { href: '/carreira?etapa=entrevista', label: 'Entrevistas & simulações', icon: MessageSquare },
    ],
  },
  {
    id: 'experiencia',
    label: 'Sua experiência na SOMA',
    items: [
      { href: '/minha-trilha', label: 'Avaliar a mentoria', icon: Star },
    ],
  },
  {
    id: 'comunidade',
    label: 'Comunidade',
    items: [
      { href: '/network', label: 'Círculos de Influência', icon: Users },
      { href: '/feedback-pares', label: 'Feedback entre Colegas', icon: MessageCircle },
      { href: '/votar-encontro', label: 'Votar Encontro', icon: MapPin },
      { href: '/indique-um-amigo', label: 'Indique um Amigo', icon: Gift },
    ],
  },
  {
    id: 'espaco',
    label: 'Meu espaço',
    items: [
      { href: '/passaporte', label: 'Meu Passaporte', icon: Award },
      { href: '/meu-plano', label: 'Meu Plano', icon: CreditCard },
    ],
  },
];

export const supportItems: PortalNavItem[] = [
  { href: '/faq', label: 'Ajuda', icon: HelpCircle },
  { href: '/termos', label: 'Termos da mentoria', icon: FileText },
];

function hrefParts(href: string) {
  const [path, query = ''] = href.split('?');
  return { path, query: new URLSearchParams(query) };
}

export function isPortalRouteActive(pathname: string, href: string, currentSearch = '') {
  const { path, query } = hrefParts(href);
  const search = new URLSearchParams(currentSearch);

  if (path === '/dashboard') return pathname === '/' || pathname === '/dashboard';

  if (path === '/meu-pdi' && (pathname === '/pdi' || pathname.startsWith('/pdi/'))) {
    return true;
  }

  const legacyCareerStep =
    pathname === '/simulador-cv' || pathname.startsWith('/simulador-cv/')
      ? 'cv'
      : pathname === '/vagas' || pathname.startsWith('/vagas/')
        ? 'vagas'
        : pathname === '/entrevista' || pathname.startsWith('/entrevista/')
          ? 'entrevista'
          : null;

  if (path === '/carreira' && legacyCareerStep) {
    return query.get('etapa') === legacyCareerStep;
  }

  const pathMatches = pathname === path || pathname.startsWith(`${path}/`);
  if (!pathMatches) return false;

  if ([...query.keys()].length === 0) return true;

  for (const [key, value] of query.entries()) {
    const currentValue = search.get(key);
    if (key === 'etapa' && value === 'cv' && currentValue === null && pathname === '/carreira') {
      continue;
    }
    if (currentValue !== value) return false;
  }

  return true;
}

export function getPortalLocation(pathname: string, currentSearch = '') {
  if (isPortalRouteActive(pathname, '/admin', currentSearch)) {
    return { group: 'Gestão', label: 'Administração' };
  }
  if (pathname === '/perfil') return { group: 'Meu espaço', label: 'Meu perfil' };
  if (pathname === '/sessao-extra') return { group: 'Minha jornada', label: 'Sessão extra' };
  if (pathname === '/renovar') return { group: 'Meu espaço', label: 'Renovar mentoria' };

  for (const group of portalNavGroups) {
    const item = group.items.find((item) => isPortalRouteActive(pathname, item.href, currentSearch));
    if (item) return { group: group.label, label: item.label };
  }

  const support = supportItems.find((item) =>
    isPortalRouteActive(pathname, item.href, currentSearch)
  );

  return { group: 'Portal do mentorado', label: support?.label ?? 'Visão geral' };
}

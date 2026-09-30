import {
  LayoutDashboard, ListChecks, Compass, Sparkles, CalendarDays, Target,
  NotebookPen, TrendingUp, PlayCircle, Award, FileSearch, BriefcaseBusiness,
  Users, MessageCircle, MapPin, Gift, CreditCard, HelpCircle, FileText, ShieldCheck,
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
  { id: 'jornada', label: 'Minha jornada', items: [
    { href: '/onboarding', label: 'Primeiros passos', icon: ListChecks },
    { href: '/quem-sou-eu', label: 'Mapa Quem Sou Eu', icon: Sparkles },
    { href: '/exercicios', label: 'Diagnóstico & Perfil', icon: Compass },
    { href: '/primeiros-90-dias', label: 'Primeiros 90 Dias', icon: CalendarDays },
    { href: '/meu-pdi', label: 'PDI & Trilha Estratégica', icon: Target },
    { href: '/minha-trilha', label: 'Minha Trilha', icon: TrendingUp },
    { href: '/diario', label: 'Diário de Bordo', icon: NotebookPen },
    { href: '/gravacoes', label: 'Gravações', icon: PlayCircle },
  ] },
  { id: 'carreira', label: 'Carreira', items: [
    { href: '/simulador-cv', label: 'Simulador de CV', icon: FileSearch },
    { href: '/entrevista', label: 'SOAR Builder', icon: Sparkles },
    { href: '/vagas', label: 'Minhas candidaturas', icon: BriefcaseBusiness },
  ] },
  { id: 'comunidade', label: 'Comunidade', items: [
    { href: '/network', label: 'Círculos de Influência', icon: Users },
    { href: '/feedback-pares', label: 'Feedback entre Colegas', icon: MessageCircle },
    { href: '/votar-encontro', label: 'Votar Encontro', icon: MapPin },
    { href: '/indique-um-amigo', label: 'Indique um Amigo', icon: Gift },
  ] },
  { id: 'espaco', label: 'Meu espaço', items: [
    { href: '/passaporte', label: 'Meu Passaporte', icon: Award },
    { href: '/meu-plano', label: 'Meu Plano', icon: CreditCard },
  ] },
];
export const supportItems: PortalNavItem[] = [
  { href: '/faq', label: 'Ajuda', icon: HelpCircle },
  { href: '/termos', label: 'Termos da mentoria', icon: FileText },
];
export function isPortalRouteActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/' || pathname === '/dashboard';
  if (href === '/meu-pdi' && (pathname === '/pdi' || pathname.startsWith('/pdi/'))) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}
export function getPortalLocation(pathname: string) {
  if (isPortalRouteActive(pathname, '/admin')) return { group: 'Gestão', label: 'Administração' };
  if (pathname === '/perfil') return { group: 'Meu espaço', label: 'Meu perfil' };
  if (pathname === '/sessao-extra') return { group: 'Minha jornada', label: 'Sessão extra' };
  if (pathname === '/renovar') return { group: 'Meu espaço', label: 'Renovar mentoria' };
  for (const group of portalNavGroups) {
    const item = group.items.find((item) => isPortalRouteActive(pathname, item.href));
    if (item) return { group: group.label, label: item.label };
  }
  const support = supportItems.find((item) => isPortalRouteActive(pathname, item.href));
  return { group: 'Portal do mentorado', label: support?.label ?? 'Visão geral' };
}

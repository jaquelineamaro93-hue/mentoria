'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle,
  LayoutDashboard,
  Compass,
  NotebookPen,
  LogOut,
  Sparkles,
  Target,
  PlayCircle,
  Award,
  ShieldCheck,
  FileSearch,
  MessageCircle,
  Gift,
  TrendingUp,
  CreditCard,
  MapPin,
  ListChecks,
  UserCog,
  Briefcase,
  Users,
  Zap,
} from 'lucide-react';
import { NotificationBadge } from './NotificationBadge';
import type { Profile } from '@/lib/types';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard, notificationKey: 'avisoNaoLido' },
  { href: '/onboarding', label: 'Onboarding', icon: ListChecks },
  { href: '/quem-sou-eu', label: 'Mapa Quem Sou Eu', icon: Sparkles },
  { href: '/exercicios', label: 'Diagnóstico & Perfil', icon: Compass },
  { href: '/primeiros-90-dias', label: 'Primeiros 90 Dias', icon: Compass },
  { href: '/meu-pdi', label: 'PDI & Trilha Estratégica', icon: Target },
  { href: '/diario', label: 'Diário de Bordo', icon: NotebookPen },
  { href: '/feedback-pares', label: 'Feedback entre Colegas', icon: MessageCircle },
  { href: '/gravacoes', label: 'Gravações', icon: PlayCircle },
  { href: '/passaporte', label: 'Meu Passaporte', icon: Award },
  { href: '/simulador-cv', label: 'Simulador de CV', icon: FileSearch },
  { href: '/entrevista', label: 'SOAR Builder', icon: Sparkles },
  { href: '/network', label: 'Círculos de Influência', icon: Users },
  { href: '/meu-plano', label: 'Meu Plano', icon: CreditCard },
  { href: '/votar-encontro', label: 'Votar Encontro', icon: MapPin, notificationKey: 'naoVotou' },
  { href: '/indique-um-amigo', label: 'Indique um Amigo', icon: Gift },
  { href: '/faq', label: 'Perguntas Frequentes', icon: HelpCircle },
  { href: '/minha-trilha', label: 'Minha Trilha', icon: TrendingUp, notificationKey: 'atividadesPendentes' },
];

interface SidebarProps {
  profile: Pick<Profile, 'nome' | 'tipo_pacote' | 'is_admin' | 'foto_url'> | null;
  onSignOut?: () => void;
}

export default function Sidebar({ profile, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Record<string, boolean>>({
    avisoNaoLido: true,
    naoVotou: false,
    atividadesPendentes: false,
  });

  useEffect(() => {
    const handleNotificationCleared = (e: CustomEvent) => {
      const { key } = e.detail;
      setNotificacoes((prev) => ({ ...prev, [key]: false }));
    };

    window.addEventListener('clearNotification' as any, handleNotificationCleared);
    return () => window.removeEventListener('clearNotification' as any, handleNotificationCleared);
  }, []);

  return (
    <>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <button className="fixed top-6 right-6 z-40 md:hidden p-2 rounded border border-gray-faint hover:bg-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? "✕" : "☰"}
      </button>
    <aside className={`fixed md:sticky top-0 left-0 h-screen w-[280px] shrink-0 border-r flex flex-col z-50 transition-transform md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`} style={{ background: 'linear-gradient(180deg, #1A1A1A 0%, #2D2D2D 100%)', borderColor: '#3A3A3A' }}>
      <div className="flex-1 flex flex-col p-6 md:p-7 md:max-h-screen md:overflow-y-auto">
        <div className="mb-9">
          <p className="font-display text-3xl text-white">SOMA</p>
          <div className="h-px w-8 my-2.5" style={{ backgroundColor: '#3DD9C8' }} />
          <p className="text-[10px] uppercase tracking-[0.2em] text-white">
            Portal do Mentorado
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const temNotificacao = item.notificationKey && notificacoes[item.notificationKey];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] transition-colors border text-white ${
                  isActive
                    ? 'border-mint'
                    : 'border-transparent hover:text-white'
                }`}
                style={{ backgroundColor: isActive ? 'rgba(61, 217, 200, 0.4)' : 'transparent' }}
              >
                <Icon size={17} strokeWidth={1.75} />
                <span>{item.label}</span>
                {temNotificacao && <NotificationBadge temNotificacao={true} />}
              </Link>
            );
          })}
        </nav>

        {profile?.is_admin && (
          <>
            <div className="h-px my-4" style={{ backgroundColor: '#3A3A3A' }} />
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] transition-colors border text-white ${
                pathname === '/admin'
                  ? 'border-mint'
                  : 'border-transparent hover:text-white'
              }`}
              style={{ backgroundColor: pathname === '/admin' ? 'rgba(61, 217, 200, 0.4)' : 'transparent' }}
            >
              <ShieldCheck size={17} strokeWidth={1.75} />
              Painel dos mentorados
            </Link>
          </>
        )}
      </div>

      <div className="p-6 md:p-7 border-t" style={{ borderColor: '#3A3A3A' }}>
        {profile && (
          <div className="flex items-center gap-2.5 mb-3.5">
            {profile.foto_url ? (
              <img src={profile.foto_url} alt={profile.nome} className="w-8 h-8 rounded-full object-cover border border-mint" />
            ) : (
              <div className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-medium" style={{ backgroundColor: 'rgba(61, 217, 200, 0.2)', borderColor: '#3DD9C8', color: '#3DD9C8' }}>
                {profile.nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[13px] text-white leading-tight">{profile.nome}</p>
              <p className="text-[10px] uppercase tracking-wide leading-tight mt-0.5 text-white">
                Mentorada {profile.tipo_pacote === 'presencial' ? 'Presencial' : 'Online'}
              </p>
            </div>
          </div>
        )}
        <Link
          href="/perfil"
          className="flex items-center gap-2 text-[13px] transition-colors mb-3 text-white"
          onMouseEnter={(e) => e.currentTarget.style.color = '#3DD9C8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#FFFFFF'}
        >
          <UserCog size={15} strokeWidth={1.75} />
          Meu Perfil
        </Link>
        <Link
          href="/termos"
          className="flex items-center gap-2 text-[13px] transition-colors mb-3 text-white"
          onMouseEnter={(e) => e.currentTarget.style.color = '#3DD9C8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#FFFFFF'}
        >
          Termos da mentoria
        </Link>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 text-[13px] transition-colors text-white"
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#3DD9C8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#FFFFFF'}
        >
          <LogOut size={15} strokeWidth={1.75} />
          Sair
        </button>
      </div>
    </aside>
    </>
  );
}

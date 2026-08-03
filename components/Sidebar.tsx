'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
} from 'lucide-react';
import { NotificationBadge } from './NotificationBadge';
import type { Profile } from '@/lib/types';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard, notificationKey: 'avisoNaoLido' },
  { href: '/quem-sou-eu', label: 'Mapa Quem Sou Eu', icon: Sparkles },
  { href: '/exercicios', label: 'Diagnóstico & Perfil', icon: Compass },
  { href: '/pdi', label: 'Meu PDI', icon: Target },
  { href: '/diario', label: 'Diário de Bordo', icon: NotebookPen },
  { href: '/feedback-pares', label: 'Feedback entre Colegas', icon: MessageCircle },
  { href: '/gravacoes', label: 'Gravações', icon: PlayCircle },
  { href: '/passaporte', label: 'Meu Passaporte', icon: Award },
  { href: '/simulador-cv', label: 'Simulador de CV', icon: FileSearch },
  { href: '/meu-plano', label: 'Meu Plano', icon: CreditCard },
  { href: '/votar-encontro', label: 'Votar Encontro', icon: MapPin, notificationKey: 'naoVotou' },
  { href: '/indique-um-amigo', label: 'Indique um Amigo', icon: Gift },
  { href: '/minha-trilha', label: 'Minha Trilha', icon: TrendingUp, notificationKey: 'atividadesPendentes' },
];

interface SidebarProps {
  profile: Pick<Profile, 'nome' | 'tipo_pacote' | 'is_admin'> | null;
  onSignOut?: () => void;
}

export default function Sidebar({ profile, onSignOut }: SidebarProps) {
  const pathname = usePathname();
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
    <aside className="w-full md:w-[260px] shrink-0 border-r border-b md:border-b-0 border-line bg-paper flex flex-col md:h-screen md:sticky md:top-0">
      <div className="flex-1 flex flex-col p-6 md:p-7 md:max-h-screen md:overflow-y-auto">
        <div className="mb-9">
          <p className="font-display text-2xl text-brown-deep">SOMA</p>
          <div className="h-px w-8 bg-brown my-2.5" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink-faint">
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
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-sky-tint text-brown-deep border border-sky'
                    : 'text-ink-soft border border-transparent hover:bg-cream'
                }`}
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
            <div className="h-px bg-line my-4" />
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === '/admin'
                  ? 'bg-sky-tint text-brown-deep border border-sky'
                  : 'text-ink-soft border border-transparent hover:bg-cream'
              }`}
            >
              <ShieldCheck size={17} strokeWidth={1.75} />
              Painel dos mentorados
            </Link>
          </>
        )}
      </div>

      <div className="p-6 md:p-7 border-t border-line">
        {profile && (
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="w-8 h-8 rounded-full bg-sky-tint border border-sky flex items-center justify-center text-sky-deep text-xs font-medium">
              {profile.nome
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <p className="text-[13px] text-ink leading-tight">{profile.nome}</p>
              <p className="text-[10px] uppercase tracking-wide text-ink-faint leading-tight mt-0.5">
                Mentorada {profile.tipo_pacote === 'presencial' ? 'Presencial' : 'Online'}
              </p>
            </div>
          </div>
        )}
        <Link
          href="/termos"
          className="flex items-center gap-2 text-[13px] text-ink-faint hover:text-brown transition-colors mb-3"
        >
          Termos da mentoria
        </Link>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 text-[13px] text-ink-faint hover:text-brown transition-colors"
        >
          <LogOut size={15} strokeWidth={1.75} />
          Sair
        </button>
      </div>
    </aside>
  );
}

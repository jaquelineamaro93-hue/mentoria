'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  NotebookPen,
  LogOut,
} from 'lucide-react';
import type { Profile } from '@/lib/types';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/exercicios', label: 'Diagnóstico & Perfil', icon: Compass },
  { href: '/diario', label: 'Diário de Bordo', icon: NotebookPen },
];

interface SidebarProps {
  profile: Pick<Profile, 'nome' | 'tipo_pacote'> | null;
  onSignOut?: () => void;
}

export default function Sidebar({ profile, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-[280px] shrink-0 border-r border-line-soft bg-panel flex md:flex-col md:h-screen md:sticky md:top-0">
      <div className="flex-1 flex flex-col p-6 md:p-8">
        <div className="mb-10">
          <p className="font-display text-3xl tracking-wide text-gold-300">SOMA</p>
          <div className="h-px w-10 bg-gold-500/60 my-2" />
          <p className="text-[11px] uppercase tracking-[0.2em] text-cream-faint">
            Portal do Mentorado
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-gold-500/10 text-gold-300 border border-gold-500/30'
                    : 'text-cream-dim border border-transparent hover:bg-panel-raised hover:text-cream'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 md:p-8 border-t border-line-soft">
        {profile && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-gold-500/15 border border-gold-500/40 flex items-center justify-center text-gold-300 text-sm font-medium">
              {profile.nome
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-cream leading-tight">{profile.nome}</p>
              <p className="text-[11px] uppercase tracking-wide text-cream-faint leading-tight mt-0.5">
                Mentorado {profile.tipo_pacote === 'presencial' ? 'Presencial' : 'Online'}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 text-sm text-cream-faint hover:text-gold-300 transition-colors"
        >
          <LogOut size={16} strokeWidth={1.75} />
          Sair
        </button>
      </div>
    </aside>
  );
}

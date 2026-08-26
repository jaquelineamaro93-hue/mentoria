'use client';

import { useEffect, useState } from 'react';
import { useSidebar } from '@/lib/contexts/SidebarContext';
import { PanelLeftClose, PanelLeft, LayoutDashboard, Zap, Calendar, BookOpen, User, Settings, LogOut, Target, MessageCircle, PlayCircle, Award, FileSearch, Users, CreditCard, MapPin, Gift, HelpCircle, TrendingUp, Briefcase, Compass } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface UserProfile {
  nome: string;
  foto_url?: string;
  genero?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Onboarding', href: '/onboarding', icon: <Zap size={20} /> },
  { label: 'Mapa Quem Sou Eu', href: '/quem-sou-eu', icon: <Compass size={20} /> },
  { label: 'Diagnóstico & Perfil', href: '/exercicios', icon: <Zap size={20} /> },
  { label: 'Primeiros 90 Dias', href: '/primeiros-90-dias', icon: <Calendar size={20} /> },
  { label: 'PDI & Trilha', href: '/meu-pdi', icon: <Target size={20} /> },
  { label: 'Diário de Bordo', href: '/diario', icon: <BookOpen size={20} /> },
  { label: 'Feedback Pares', href: '/feedback-pares', icon: <MessageCircle size={20} /> },
  { label: 'Gravações', href: '/gravacoes', icon: <PlayCircle size={20} /> },
  { label: 'Passaporte', href: '/passaporte', icon: <Award size={20} /> },
  { label: 'Simulador CV', href: '/simulador-cv', icon: <FileSearch size={20} /> },
  { label: 'SOAR Builder', href: '/entrevista', icon: <Zap size={20} /> },
  { label: 'Círculos', href: '/network', icon: <Users size={20} /> },
  { label: 'Meu Plano', href: '/meu-plano', icon: <CreditCard size={20} /> },
  { label: 'Votar Encontro', href: '/votar-encontro', icon: <MapPin size={20} /> },
  { label: 'Indique Amigo', href: '/indique-um-amigo', icon: <Gift size={20} /> },
  { label: 'Minha Trilha', href: '/minha-trilha', icon: <TrendingUp size={20} /> },
  { label: 'FAQ', href: '/faq', icon: <HelpCircle size={20} /> },
  { label: 'Gestão Vagas', href: '/vagas', icon: <Briefcase size={20} /> },
  { label: 'Perfil', href: '/perfil', icon: <User size={20} /> },
];

export default function CollapsibleSidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initials, setInitials] = useState('');

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('nome, foto_url, genero')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        const partes = data.nome?.split(' ') || [];
        const iniciais = partes
          .slice(0, 2)
          .map((p) => p[0])
          .join('')
          .toUpperCase() || '';
        setInitials(iniciais);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  }

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-[#1E292B] border-r border-white/10
        flex flex-col transition-all duration-300 z-50 font-body
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center text-[#1E292B] font-bold text-sm">
              S
            </div>
            <span className="text-white font-semibold text-sm">SOMA</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-white/70 hover:text-white"
          title={isCollapsed ? 'Expandir' : 'Recolher'}
        >
          {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-2 overflow-y-auto">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  group relative
                  ${
                    isActive
                      ? 'bg-[#2D4A43] text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <div
                  className={`
                    ${isActive ? 'text-emerald-400' : 'text-white/70 group-hover:text-white'}
                    transition-colors
                  `}
                >
                  {item.icon}
                </div>

                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}

                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-white/10 backdrop-blur text-white text-xs rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer - User Card */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2 hover:bg-black/20 rounded-lg transition-colors cursor-pointer group relative">
          {profile?.foto_url ? (
            <img
              src={profile.foto_url}
              alt={profile.nome}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
          )}

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{profile?.nome || 'Usuário'}</p>
              <p className="text-white/50 text-xs truncate">Meu Perfil</p>
            </div>
          )}

          {!isCollapsed && (
            <button className="text-white/50 hover:text-white transition-colors p-1">
              <Settings size={14} />
            </button>
          )}

          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-white/10 backdrop-blur text-white text-xs rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Meu Perfil
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

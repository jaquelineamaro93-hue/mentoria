'use client';

import { useEffect, useState } from 'react';
import { useSidebar } from '@/lib/contexts/SidebarContext';
import { PanelLeftClose, PanelLeft, LayoutDashboard, Zap, Calendar, BookOpen, User, LogOut, Target, MessageCircle, PlayCircle, Award, FileSearch, Users, CreditCard, MapPin, Gift, HelpCircle, TrendingUp, Briefcase, Compass, ShieldCheck } from 'lucide-react';
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
  tipo_pacote?: string;
  is_admin?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Início', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Onboarding', href: '/onboarding', icon: <Zap size={20} /> },
  { label: 'Mapa Quem Sou Eu', href: '/quem-sou-eu', icon: <Compass size={20} /> },
  { label: 'Diagnóstico & Perfil', href: '/exercicios', icon: <Zap size={20} /> },
  { label: 'Primeiros 90 Dias', href: '/primeiros-90-dias', icon: <Calendar size={20} /> },
  { label: 'PDI & Trilha Estratégica', href: '/meu-pdi', icon: <Target size={20} /> },
  { label: 'Diário de Bordo', href: '/diario', icon: <BookOpen size={20} /> },
  { label: 'Feedback entre Colegas', href: '/feedback-pares', icon: <MessageCircle size={20} /> },
  { label: 'Gravações', href: '/gravacoes', icon: <PlayCircle size={20} /> },
  { label: 'Meu Passaporte', href: '/passaporte', icon: <Award size={20} /> },
  { label: 'Simulador de CV', href: '/simulador-cv', icon: <FileSearch size={20} /> },
  { label: 'SOAR Builder', href: '/entrevista', icon: <Zap size={20} /> },
  { label: 'Círculos de Influência', href: '/network', icon: <Users size={20} /> },
  { label: 'Meu Plano', href: '/meu-plano', icon: <CreditCard size={20} /> },
  { label: 'Votar Encontro', href: '/votar-encontro', icon: <MapPin size={20} /> },
  { label: 'Indique um Amigo', href: '/indique-um-amigo', icon: <Gift size={20} /> },
  { label: 'Minha Trilha', href: '/minha-trilha', icon: <TrendingUp size={20} /> },
  { label: 'Perguntas Frequentes', href: '/faq', icon: <HelpCircle size={20} /> },
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
        .select('nome, foto_url, genero, tipo_pacote, is_admin:is_admin')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        const partes = data.nome?.split(' ') || [];
        const iniciais = partes
          .slice(0, 2)
          .map((p: string) => p[0])
          .join('')
          .toUpperCase() || '';
        setInitials(iniciais);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
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
        fixed left-0 top-0 h-screen bg-gradient-to-b from-[#1A1A1A] to-[#2D2D2D] border-r border-white/5
        flex flex-col transition-all duration-300 z-50
        ${isCollapsed ? 'w-20' : 'w-[280px]'}
      `}
    >
      {/* Logo Section - Estilo padrão */}
      <div className="flex-shrink-0 p-6 md:p-7 border-b border-white/5">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <p className="font-display text-3xl text-white" style={{ fontFamily: "'Crimson Text', serif" }}>SOMA</p>
              <div className="h-px w-8 my-2.5" style={{ backgroundColor: '#3DD9C8' }} />
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Portal do Mentorado</p>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
            title={isCollapsed ? 'Expandir' : 'Recolher'}
          >
            {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 py-6 px-2 md:px-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = isActiveRoute(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                group relative text-sm
                ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <div className="flex-shrink-0">
                {item.icon}
              </div>

              {!isCollapsed && (
                <span className="truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>{item.label}</span>
              )}

              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-white/20 backdrop-blur text-white text-xs rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}

        {/* Admin Panel - Only for admins */}
        {profile?.is_admin && (
          <Link
            href="/admin"
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
              group relative text-sm
              ${
                pathname.startsWith('/admin')
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }
            `}
          >
            <div className="flex-shrink-0">
              <ShieldCheck size={20} />
            </div>

            {!isCollapsed && (
              <span className="truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>Painel dos mentorados</span>
            )}

            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-white/20 backdrop-blur text-white text-xs rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Painel dos mentorados
              </div>
            )}
          </Link>
        )}
      </nav>

      {/* Footer - User Card */}
      <div className="border-t border-white/5 p-3 md:p-4">
        {/* User Profile Card */}
        <Link href="/perfil">
          <div className="flex items-center gap-3 px-2 py-2 hover:bg-white/10 rounded-lg transition-colors group relative mb-3">
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
                <p className="text-white text-xs font-medium truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>{profile?.nome || 'Usuário'}</p>
                <p className="text-white/60 text-xs truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {profile?.tipo_pacote === 'presencial' ? 'MENTORADA PRESENCIAL' : 'MENTORADA ONLINE'}
                </p>
              </div>
            )}

            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-white/20 backdrop-blur text-white text-xs rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Meu Perfil
              </div>
            )}
          </div>
        </Link>

        {/* Links adicionais */}
        {!isCollapsed && (
          <div className="space-y-1 border-t border-white/10 pt-3">
            <Link href="/perfil" className="flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white text-sm transition-colors">
              Meu Perfil
            </Link>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white text-sm transition-colors">
              Termos da mentoria
            </a>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

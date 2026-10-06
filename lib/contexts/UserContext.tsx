'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

interface UserContextType {
  profile: Profile | null;
  initials: string;
  isLoading: boolean;
}

interface UserProviderProps {
  children: React.ReactNode;
  initialProfile?: Profile | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function buildInitials(nome?: string | null) {
  return (nome ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

export function UserProvider({
  children,
  initialProfile = null,
}: UserProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [initials, setInitials] = useState(buildInitials(initialProfile?.nome));
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    // O layout autenticado já injeta o perfil carregado no servidor. Isso evita
    // o "pisca" em que itens condicionais (como Administração) somem enquanto
    // o navegador ainda está resolvendo a sessão.
    if (initialProfile) {
      setProfile(initialProfile);
      setInitials(buildInitials(initialProfile.nome));
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const loadUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !isMounted) {
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single<Profile>();

        if (!error && data && isMounted) {
          setProfile(data);
          setInitials(buildInitials(data.nome));
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, [initialProfile, supabase]);

  return (
    <UserContext.Provider value={{ profile, initials, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
};

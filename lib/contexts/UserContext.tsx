'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

interface UserContextType {
  profile: Profile | null;
  initials: string;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initials, setInitials] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const loadUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single<Profile>();

        if (!error && data && isMounted) {
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
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);

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

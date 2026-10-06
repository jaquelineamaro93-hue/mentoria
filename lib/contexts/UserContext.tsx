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

function getInitials(profile: Profile | null) {
  const partes = profile?.nome?.split(' ') || [];
  return partes
    .slice(0, 2)
    .map((p: string) => p[0])
    .join('')
    .toUpperCase() || '';
}

export function UserProvider({
  children,
  initialProfile = null,
}: {
  children: React.ReactNode;
  initialProfile?: Profile | null;
}) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [initials, setInitials] = useState(() => getInitials(initialProfile));
  const [isLoading, setIsLoading] = useState(!initialProfile);
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
          setInitials(getInitials(data));
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

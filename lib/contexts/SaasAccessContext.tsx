'use client';
import { createContext, useContext } from 'react';
import type { SaasAccess } from '@/lib/saas-access';
export const SaasAccessContext = createContext<SaasAccess | null>(null);
export const useSaasAccess = () => useContext(SaasAccessContext);

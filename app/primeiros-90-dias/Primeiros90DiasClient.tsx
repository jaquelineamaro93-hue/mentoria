'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import StandardLayout from '@/components/StandardLayout';
import { createClient } from '@/lib/supabase/client';
import StarsSelector from './components/StarsSelector';
import DashboardAcompanhamento from './components/DashboardAcompanhamento';
import TabNavigation from './components/TabNavigation';
import Month1Content from './components/Month1Content';
import Month2Content from './components/Month2Content';
import Month3Content from './components/Month3Content';
import type { Profile } from '@/lib/types';

interface Primeiros90DiasClientProps {
  initialData: any;
  userId: string;
  profile: Profile | null;
}

export default function Primeiros90DiasClient({ initialData, userId, profile }: Primeiros90DiasClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'month1' | 'month2' | 'month3'>('overview');
  const [situacaoStars, setSituacaoStars] = useState<string | null>(initialData?.situacao_stars);
  const [respostas, setRespostas] = useState<Record<string, any>>(initialData?.respostas_json || {});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const saveData = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      const { error } = await supabase.from('primeiros_90_dias_respostas').upsert(
        [
          {
            user_id: userId,
            situacao_stars: situacaoStars,
            respostas_json: respostas,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id' }
      );

      if (error) {
        console.error('Erro ao salvar:', error);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar (exceção):', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStarsSelect = (stars: string) => {
    setSituacaoStars(stars);
  };

  const handleRespostasChange = (path: string, value: any) => {
    setRespostas((prev) => ({
      ...prev,
      [path]: value,
    }));
  };

  return (
    <StandardLayout profile={profile} onSignOut={handleSignOut}>
        {/* Header with Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-text hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar ao Início
        </Link>
        <h1 className="font-display text-4xl text-black mb-2">Primeiros 90 Dias</h1>
        <p className="text-gray-text text-base leading-relaxed mb-8">
          Guia de aceleração de carreira e transição executiva
        </p>
        {/* STARS Diagnosis */}
        <div className="mb-12">
          <h2 className="text-xl text-black font-medium mb-6">Contexto de Atuação</h2>
          <StarsSelector selected={situacaoStars} onSelect={handleStarsSelect} />
        </div>

        {/* Main Tabs */}
        {situacaoStars && (
          <div className="mt-12">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="mt-8 border-t border-gray-faint pt-8">
              {/* Aba 1: Visão Geral & Insights (Dashboard) */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <DashboardAcompanhamento respostas={respostas} situacao={situacaoStars} />
                </div>
              )}

              {/* Aba 2: Mês 1 */}
              {activeTab === 'month1' && (
                <Month1Content
                  respostas={respostas}
                  situacao={situacaoStars}
                  onChange={handleRespostasChange}
                />
              )}

              {/* Aba 3: Mês 2 */}
              {activeTab === 'month2' && (
                <Month2Content
                  respostas={respostas}
                  situacao={situacaoStars}
                  onChange={handleRespostasChange}
                />
              )}

              {/* Aba 4: Mês 3 */}
              {activeTab === 'month3' && (
                <Month3Content
                  respostas={respostas}
                  situacao={situacaoStars}
                  onChange={handleRespostasChange}
                />
              )}
            </div>

            {/* Save Button */}
            <div className="mt-12 flex items-center gap-4">
              <button
                onClick={saveData}
                disabled={isSaving}
                className="px-6 py-3 rounded-lg font-medium transition-colors text-white border"
                style={{
                  backgroundColor: '#0D8071',
                  borderColor: '#0D8071',
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? 'Salvando...' : 'Salvar Progresso'}
              </button>
              {saved && <p className="text-mint font-medium">Salvo com sucesso</p>}
            </div>
        )}
    </StandardLayout>
  );
}

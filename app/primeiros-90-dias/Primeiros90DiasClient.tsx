'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import StarsSelector from './components/StarsSelector';
import TabNavigation from './components/TabNavigation';
import Month1Content from './components/Month1Content';
import Month2Content from './components/Month2Content';
import Month3Content from './components/Month3Content';

interface Primeiros90DiasClientProps {
  initialData: any;
  userId: string;
}

export default function Primeiros90DiasClient({ initialData, userId }: Primeiros90DiasClientProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'month1' | 'month2' | 'month3'>('month1');
  const [situacaoStars, setSituacaoStars] = useState<string | null>(initialData?.situacao_stars);
  const [respostas, setRespostas] = useState<Record<string, any>>(initialData?.respostas_json || {});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-faint px-8 py-12">
        <h1 className="font-display text-5xl text-black mb-2">Primeiros 90 Dias</h1>
        <p className="text-gray-text text-base leading-relaxed">
          Guia de aceleração de carreira e transição executiva
        </p>
      </div>

      {/* Content */}
      <div className="px-8 py-8 max-w-6xl mx-auto">
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
              {activeTab === 'month1' && (
                <Month1Content
                  respostas={respostas}
                  situacao={situacaoStars}
                  onChange={handleRespostasChange}
                />
              )}
              {activeTab === 'month2' && (
                <Month2Content
                  respostas={respostas}
                  situacao={situacaoStars}
                  onChange={handleRespostasChange}
                />
              )}
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
                  backgroundColor: '#3DD9C8',
                  borderColor: '#3DD9C8',
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? 'Salvando...' : 'Salvar Progresso'}
              </button>
              {saved && <p className="text-mint font-medium">Salvo com sucesso</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

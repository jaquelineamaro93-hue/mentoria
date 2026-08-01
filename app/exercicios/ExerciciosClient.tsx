'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Sparkles, TrendingUp, Save, Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { Diagnostic, Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
  diagnostics: Diagnostic[];
  userId: string;
}

const FORCAS = [
  'Comunicação',
  'Organização',
  'Análise de dados',
  'Liderança',
  'Criatividade',
  'Negociação',
  'Empatia',
  'Execução',
];

export default function ExerciciosClient({ profile, diagnostics, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [momentoCarreira, setMomentoCarreira] = useState(
    diagnostics[diagnostics.length - 1]?.momento_carreira ?? ''
  );
  const [objetivos, setObjetivos] = useState(
    diagnostics[diagnostics.length - 1]?.objetivos ?? ''
  );
  const [forcasSelecionadas, setForcasSelecionadas] = useState<string[]>(
    (diagnostics[diagnostics.length - 1]?.habilidades?.forcas as string[]) ?? []
  );

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  function toggleForca(forca: string) {
    setForcasSelecionadas((prev) =>
      prev.includes(forca) ? prev.filter((f) => f !== forca) : [...prev, forca]
    );
  }

  async function handleSalvarDiagnostico() {
    setSalvando(true);
    setMensagem(null);

    const { error } = await supabase.from('diagnostics').insert({
      user_id: userId,
      momento_carreira: momentoCarreira,
      objetivos,
      quem_sou_data: { momento_carreira: momentoCarreira, objetivos },
      habilidades: { forcas: forcasSelecionadas },
      personality_results: {},
    });

    setSalvando(false);

    if (error) {
      posthog.capture('diagnostico_falhou');
      setMensagem('Não foi possível salvar agora. Tente novamente em instantes.');
      return;
    }

    posthog.capture('diagnostico_preenchido', {
      quantidade_diagnosticos_anteriores: diagnostics.length,
      quantidade_forcas_selecionadas: forcasSelecionadas.length,
    });

    setMensagem('Diagnóstico salvo! Ele já aparece na sua linha de evolução.');
    router.refresh();
  }

  const primeiro = diagnostics[0];
  const ultimo = diagnostics[diagnostics.length - 1];

  return (
    <div className="flex flex-col md:flex-row w-full">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 px-6 py-8 md:px-12 md:py-12 max-w-4xl mx-auto w-full">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400 mb-2">
            Área de diagnóstico
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-cream">Diagnóstico & Perfil</h1>
          <p className="text-sm text-cream-faint mt-2">
            Entenda onde você está agora e acompanhe como isso muda ao longo da mentoria.
          </p>
        </div>

        {/* Mapa Quem Sou */}
        <section className="mb-10">
          <Eyebrow>
            <Compass size={13} /> Mapa &quot;Quem Sou&quot;
          </Eyebrow>
          <Panel className="p-6">
            <div className="flex flex-col gap-5">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wide text-cream-faint">
                  Momento atual de carreira
                </span>
                <textarea
                  value={momentoCarreira}
                  onChange={(e) => setMomentoCarreira(e.target.value)}
                  rows={3}
                  placeholder="Descreva onde você está profissionalmente agora..."
                  className="bg-panel border border-line rounded-lg px-4 py-3 text-sm text-cream focus:border-gold-500 resize-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wide text-cream-faint">
                  Objetivos com a mentoria
                </span>
                <textarea
                  value={objetivos}
                  onChange={(e) => setObjetivos(e.target.value)}
                  rows={3}
                  placeholder="O que você quer alcançar até o fim do programa?"
                  className="bg-panel border border-line rounded-lg px-4 py-3 text-sm text-cream focus:border-gold-500 resize-none"
                />
              </label>

              <div>
                <span className="text-xs uppercase tracking-wide text-cream-faint block mb-2">
                  Pontos fortes (selecione quantos quiser)
                </span>
                <div className="flex flex-wrap gap-2">
                  {FORCAS.map((forca) => {
                    const ativo = forcasSelecionadas.includes(forca);
                    return (
                      <button
                        key={forca}
                        type="button"
                        onClick={() => toggleForca(forca)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          ativo
                            ? 'bg-gold-500/15 border-gold-500/50 text-gold-300'
                            : 'bg-panel border-line text-cream-faint hover:border-line-soft hover:text-cream-dim'
                        }`}
                      >
                        {forca}
                      </button>
                    );
                  })}
                </div>
              </div>

              {mensagem && (
                <p className="text-sm text-gold-300 bg-gold-500/10 border border-gold-500/30 rounded-md px-4 py-2.5">
                  {mensagem}
                </p>
              )}

              <button
                onClick={handleSalvarDiagnostico}
                disabled={salvando}
                className="self-start flex items-center gap-2 bg-gold-400 hover:bg-gold-300 disabled:opacity-60 text-[#100d12] text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                {salvando ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {salvando ? 'Salvando...' : 'Salvar diagnóstico'}
              </button>
            </div>
          </Panel>
        </section>

        {/* Teste de personalidade */}
        <section className="mb-10">
          <Eyebrow>
            <Sparkles size={13} /> Teste de personalidade & habilidades
          </Eyebrow>
          <Panel className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-cream mb-1">Avaliação individual guiada</p>
              <p className="text-sm text-cream-faint">
                Módulo de avaliação para mapear pontos fortes e áreas de desenvolvimento com
                a Gabi.
              </p>
            </div>
            <button
              type="button"
              disabled
              className="shrink-0 text-sm px-5 py-2.5 rounded-lg border border-line text-cream-faint cursor-not-allowed"
              title="Em breve: será liberado durante sua jornada"
            >
              Em breve
            </button>
          </Panel>
        </section>

        {/* Evolução do mentorado */}
        <section>
          <Eyebrow>
            <TrendingUp size={13} /> Evolução do mentorado
          </Eyebrow>

          {diagnostics.length === 0 ? (
            <Panel className="p-6 text-sm text-cream-faint">
              Salve seu primeiro diagnóstico acima para começar sua linha de evolução.
            </Panel>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <Panel className="p-6">
                <p className="text-[11px] uppercase tracking-wide text-cream-faint mb-3">
                  Diagnóstico inicial ·{' '}
                  {new Date(primeiro.created_at).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-cream leading-relaxed">
                  {primeiro.momento_carreira || 'Sem registro de momento de carreira.'}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {((primeiro.habilidades?.forcas as string[]) ?? []).map((f) => (
                    <span
                      key={f}
                      className="text-[11px] px-2 py-1 rounded-full bg-panel border border-line text-cream-faint"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </Panel>

              <Panel className="p-6 border-gold-500/30">
                <p className="text-[11px] uppercase tracking-wide text-gold-400 mb-3">
                  Momento atual ·{' '}
                  {new Date(ultimo.created_at).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-cream leading-relaxed">
                  {ultimo.momento_carreira || 'Sem registro de momento de carreira.'}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {((ultimo.habilidades?.forcas as string[]) ?? []).map((f) => (
                    <span
                      key={f}
                      className="text-[11px] px-2 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </Panel>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

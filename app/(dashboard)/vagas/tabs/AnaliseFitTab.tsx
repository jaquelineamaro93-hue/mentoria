'use client';

import { useState, useRef } from 'react';
import { Sparkles, Loader, AlertCircle, Check, Upload } from 'lucide-react';
import Link from 'next/link';
import { Panel, Eyebrow } from '@/components/Panel';

interface Vaga {
  id: string;
  empresa: string;
  cargo: string;
  fit_score: number | null;
}

interface Props {
  vagas: Vaga[];
  onVagaAdicionada: () => void;
}

interface AnaliseResult {
  fit_score: number;
  breakdown_por_categoria?: {
    experiencia: number;
    skills_tecnicas: number;
    senioridade: number;
    contexto_setor: number;
  };
  pontos_fortes: string[];
  gaps: string[];
  recomendacoes: string[];
  palavras_chave_ats?: string[];
  resumo: string;
}

interface Mensagem {
  tipo: 'sucesso' | 'erro' | 'aviso';
  titulo: string;
  descricao: string;
}

export default function AnaliseFitTab({ vagas, onVagaAdicionada }: Props) {
  const linkedinInputRef = useRef<HTMLInputElement>(null);

  const [perfil, setPerfil] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [cargosDesejados, setCargosDesejados] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [cargo, setCargo] = useState('');
  const [descricao_vaga, setDescricaoVaga] = useState('');
  const [analisando, setAnalisando] = useState(false);
  const [analise, setAnalise] = useState<AnaliseResult | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);
  const [perfilCarregado, setPerfilCarregado] = useState(false);
  const [importandoLinkedin, setImportandoLinkedin] = useState(false);

  async function handleUploadLinkedin(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      setMensagem({
        tipo: 'erro',
        titulo: 'Arquivo inválido',
        descricao: 'Por favor, envie um arquivo PDF',
      });
      return;
    }

    setImportandoLinkedin(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/perfil/importar-linkedin', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setPerfilCarregado(true);
        setMensagem({
          tipo: 'sucesso',
          titulo: '✅ Perfil do LinkedIn carregado',
          descricao: 'Seu currículo foi sincronizado com sucesso. +50 XP',
        });
      } else {
        const data = await res.json();
        setMensagem({
          tipo: 'erro',
          titulo: 'Erro ao importar',
          descricao: data.error || 'Tente novamente',
        });
      }
    } catch (e) {
      setMensagem({
        tipo: 'erro',
        titulo: 'Erro ao processar',
        descricao: 'Houve um erro ao processar o arquivo',
      });
    }
    setImportandoLinkedin(false);
    if (linkedinInputRef.current) {
      linkedinInputRef.current.value = '';
    }
  }

  async function analisarFit() {
    if (!empresa.trim() || !cargo.trim() || !descricao_vaga.trim()) {
      setMensagem({
        tipo: 'aviso',
        titulo: 'Preencha todos os campos',
        descricao: 'Empresa, cargo e descrição são obrigatórios',
      });
      return;
    }

    setAnalisando(true);
    setMensagem(null);

    try {
      const res = await fetch('/api/vagas/analisar-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa,
          cargo,
          descricao_vaga,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAnalise(data);
      } else {
        if (data.errorCode === 'MISSING_LINKEDIN_IMPORT') {
          setMensagem({
            tipo: 'aviso',
            titulo: '📄 Importe seu currículo do LinkedIn',
            descricao: 'Para analisar a compatibilidade, importe seu PDF do LinkedIn no botão acima.',
          });
        } else {
          setMensagem({
            tipo: 'erro',
            titulo: data.error || 'Erro ao analisar',
            descricao: 'Tente novamente ou contate o suporte',
          });
        }
      }
    } catch (erro) {
      setMensagem({
        tipo: 'erro',
        titulo: 'Erro ao conectar',
        descricao: 'Verifique sua conexão e tente novamente',
      });
    } finally {
      setAnalisando(false);
    }
  }

  async function salvarVaga() {
    if (!analise) return;

    setSalvando(true);

    try {
      const vagaRes = await fetch('/api/vagas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa,
          cargo,
          descricao_vaga,
          fit_score: analise.fit_score,
          etapa: 'para_aplicar',
        }),
      });

      if (vagaRes.ok) {
        setMensagem({
          tipo: 'sucesso',
          titulo: '✨ Vaga salva no Kanban!',
          descricao: 'Você pode acompanhar seu progresso agora',
        });
        setEmpresa('');
        setCargo('');
        setDescricaoVaga('');
        setAnalise(null);
        onVagaAdicionada();
      } else {
        setMensagem({
          tipo: 'erro',
          titulo: 'Erro ao salvar vaga',
          descricao: 'Tente novamente',
        });
      }
    } catch (erro) {
      setMensagem({
        tipo: 'erro',
        titulo: 'Erro ao salvar',
        descricao: 'Houve um erro inesperado',
      });
    } finally {
      setSalvando(false);
    }
  }

  const renderMensagem = (msg: Mensagem) => {
    const estilos = {
      sucesso: 'bg-emerald-light border border-emerald-500 text-emerald-900',
      erro: 'bg-red-50 border border-red-200 text-red-700',
      aviso: 'bg-mustard-light border border-yellow-400 text-yellow-900',
    };

    const icones = {
      sucesso: <Check className="w-5 h-5 flex-shrink-0" />,
      erro: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
      aviso: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
    };

    return (
      <div className={`p-4 rounded-lg flex gap-3 ${estilos[msg.tipo]}`}>
        {icones[msg.tipo]}
        <div className="flex-1">
          <div className="font-medium mb-1">{msg.titulo}</div>
          <p className="text-sm opacity-90">{msg.descricao}</p>
        </div>
      </div>
    );
  };

  const renderBarraCompatibilidade = (valor: number, label: string) => {
    const percentual = Math.min(Math.max(valor, 0), 100);
    const cor = percentual >= 70 ? 'bg-emerald-light' : percentual >= 50 ? 'bg-mint-deep' : 'bg-orange-500';

    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-black">{label}</span>
          <span className="text-sm font-bold text-mint">{percentual}%</span>
        </div>
        <div className="w-full bg-line rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${cor} transition-all duration-500`}
            style={{ width: `${percentual}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl">
      <Eyebrow>
        <Sparkles size={14} />
        Análise de Compatibilidade com IA
      </Eyebrow>
      <h2 className="font-display text-3xl text-black mb-8">Controle de Vagas</h2>

      {!analise ? (
        <div className="space-y-4">
          {mensagem && renderMensagem(mensagem)}

          <Panel className="p-6 bg-mustard-light border border-yellow-400">
            <div className="flex items-start gap-3">
              <Upload size={18} className="text-black flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-black mb-2">Passo 1: Sincronize seu Perfil</h3>
                <p className="text-sm text-black mb-3">
                  Importe seu PDF do LinkedIn para que a IA analise sua compatibilidade com as vagas.
                </p>
                <button
                  onClick={() => linkedinInputRef.current?.click()}
                  disabled={importandoLinkedin}
                  className="flex items-center gap-2 bg-brown-deep text-white px-4 py-2 rounded-lg hover:bg-brown transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {importandoLinkedin ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
                  {importandoLinkedin ? 'Importando...' : 'Importar PDF do LinkedIn'}
                </button>
                <input
                  ref={linkedinInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleUploadLinkedin}
                  className="hidden"
                />
                {perfilCarregado && (
                  <p className="text-xs text-green-700 mt-2">✓ Perfil do LinkedIn carregado e sincronizado</p>
                )}
              </div>
            </div>
          </Panel>

          <Panel className="p-6">
            <h3 className="font-medium text-black mb-4">Passo 2: Insira a Vaga</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Empresa</label>
                <input
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Ex: Nubank, Google, Uber"
                  className="w-full px-4 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-sky-deep focus:border-transparent bg-white text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Cargo</label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex: Analista de Marketing"
                  className="w-full px-4 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-sky-deep focus:border-transparent bg-white text-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Descrição da Vaga</label>
              <textarea
                value={descricao_vaga}
                onChange={(e) => setDescricaoVaga(e.target.value)}
                placeholder="Cole aqui a descrição completa da vaga..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-sky-deep focus:border-transparent bg-white text-black"
              />
            </div>

            <button
              onClick={analisarFit}
              disabled={analisando}
              className="mt-6 w-full bg-mint-deep text-white py-3 rounded-lg font-medium hover:bg-mint transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {analisando && <Loader size={16} className="animate-spin" />}
              {analisando ? 'Analisando...' : '⚡ Analisar Compatibilidade'}
            </button>
          </Panel>
        </div>
      ) : (
        <div className="space-y-6">
          {mensagem && renderMensagem(mensagem)}

          <Panel className="p-8 bg-mint-light border border-mint text-center">
            <div className="mb-4">
              <div className="w-32 h-32 rounded-full border-4 border-mint-deep flex items-center justify-center mx-auto mb-4">
                <div className="font-display text-5xl text-mint">
                  {analise.fit_score}%
                </div>
              </div>
              <h3 className="font-display text-2xl text-mint mb-2">Compatibilidade: {analise.fit_score}%</h3>
              <p className="text-mint text-sm">{analise.resumo}</p>
            </div>
          </Panel>

          <Panel className="p-6">
            <h3 className="font-medium text-black mb-4">Breakdown por Categoria</h3>
            <div className="space-y-4">
              {analise.breakdown_por_categoria && (
                <>
                  {renderBarraCompatibilidade(analise.breakdown_por_categoria.experiencia, 'Experiência')}
                  {renderBarraCompatibilidade(analise.breakdown_por_categoria.skills_tecnicas, 'Skills Técnicas')}
                  {renderBarraCompatibilidade(analise.breakdown_por_categoria.senioridade, 'Senioridade')}
                  {renderBarraCompatibilidade(analise.breakdown_por_categoria.contexto_setor, 'Contexto do Setor')}
                </>
              )}
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-4">
            <Panel className="p-6">
              <h3 className="font-medium text-green-700 mb-4">✓ Pontos Fortes</h3>
              <ul className="space-y-2">
                {analise.pontos_fortes.map((ponto, idx) => (
                  <li key={idx} className="text-sm text-green-700 flex gap-2">
                    <span>✓</span>
                    <span>{ponto}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel className="p-6">
              <h3 className="font-medium text-amber-700 mb-4">⚠ Gaps / Pontos de Atenção</h3>
              <ul className="space-y-2">
                {analise.gaps.map((gap, idx) => (
                  <li key={idx} className="text-sm text-amber-700 flex gap-2">
                    <span>⚠</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel className="p-6">
            <h3 className="font-medium text-black mb-4">Otimizações para ATS (Currículo)</h3>
            <div className="space-y-2">
              {analise.palavras_chave_ats?.map((keyword, idx) => (
                <div key={idx} className="inline-block px-3 py-1 rounded-full bg-mint-light text-mint text-xs font-medium mr-2 mb-2">
                  {keyword}
                </div>
              ))}
            </div>
          </Panel>

          <button
            onClick={salvarVaga}
            disabled={salvando}
            className="w-full bg-brown-deep text-white py-3 rounded-lg font-medium hover:bg-brown transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {salvando && <Loader size={16} className="animate-spin" />}
            {salvando ? 'Salvando...' : '+ Salvar esta Vaga no Kanban'}
          </button>

          <button
            onClick={() => {
              setAnalise(null);
              setEmpresa('');
              setCargo('');
              setDescricaoVaga('');
            }}
            className="w-full border border-gray-faint text-black py-3 rounded-lg font-medium hover:bg-white transition-colors"
          >
            Analisar Outra Vaga
          </button>
        </div>
      )}
    </div>
  );
}

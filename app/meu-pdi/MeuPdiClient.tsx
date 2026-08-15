'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Download,
  Trash2,
  FileText,
  Link as LinkIcon,
  Calendar,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Panel, Eyebrow } from '@/components/Panel';
import { createClient } from '@/lib/supabase/client';
import { posthog, limparIdentidade } from '@/lib/posthog';
import type { Profile, PdiResposta } from '@/lib/types';

interface Documento {
  id: string;
  user_id: string;
  nome: string;
  categoria: string;
  url: string;
  tamanho?: number;
  created_at: string;
}

interface Props {
  profile: Profile | null;
  userId: string;
  pdiRespostas: PdiResposta[];
  documentosIniciais: Documento[];
}

type AbaAtiva = 'arquivos' | 'feedbacks';

export default function MeuPdiClient({
  profile,
  userId,
  pdiRespostas,
  documentosIniciais,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('arquivos');
  const [documentos, setDocumentos] = useState<Documento[]>(documentosIniciais);
  const [novoDocumento, setNovoDocumento] = useState({
    nome: '',
    categoria: 'outro',
    url: '',
  });
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [erroUpload, setErroUpload] = useState<string | null>(null);
  const [sucessoUpload, setSucessoUpload] = useState(false);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  async function handleSignOut() {
    posthog.capture('logout_realizado');
    await supabase.auth.signOut();
    limparIdentidade();
    router.push('/login');
    router.refresh();
  }

  async function adicionarDocumento() {
    if (!novoDocumento.nome.trim() || !novoDocumento.url.trim()) {
      setErroUpload('Por favor, preencha o nome e a URL do documento.');
      return;
    }

    setEnviandoArquivo(true);
    setErroUpload(null);

    try {
      const { data, error } = await supabase
        .from('documentos_mentorado')
        .insert({
          user_id: userId,
          nome: novoDocumento.nome,
          categoria: novoDocumento.categoria,
          url: novoDocumento.url,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setDocumentos((prev) => [data as Documento, ...prev]);
      setNovoDocumento({ nome: '', categoria: 'outro', url: '' });
      setSucessoUpload(true);
      posthog.capture('documento_adicionado', {
        categoria: novoDocumento.categoria,
      });

      setTimeout(() => setSucessoUpload(false), 3000);
    } catch (err) {
      setErroUpload(
        err instanceof Error ? err.message : 'Erro ao adicionar documento.'
      );
    } finally {
      setEnviandoArquivo(false);
    }
  }

  async function deletarDocumento(id: string) {
    if (!confirm('Tem certeza que quer deletar este documento?')) return;

    setDeletandoId(id);
    try {
      const { error } = await supabase
        .from('documentos_mentorado')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDocumentos((prev) => prev.filter((d) => d.id !== id));
      posthog.capture('documento_deletado', { id });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao deletar documento.');
    } finally {
      setDeletandoId(null);
    }
  }

  function formatarTamanho(bytes?: number): string {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const primeiroNome = profile?.nome?.split(' ')[0] ?? 'Mentorado(a)';

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      <Sidebar profile={profile} onSignOut={handleSignOut} />

      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 w-full">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-deep mb-2">
            Acompanhamento & Recursos
          </p>
          <h1 className="font-display text-3xl text-brown-deep mb-2">
            Meu PDI & Documentos
          </h1>
          <p className="text-sm text-ink-faint">
            Centralize seus documentos, acompanhe seus feedbacks e evolua constantemente.
          </p>
        </div>

        <div className="flex gap-4 mb-8 border-b border-line">
          <button
            onClick={() => setAbaAtiva('arquivos')}
            className={`pb-3 font-medium text-sm transition-colors ${
              abaAtiva === 'arquivos'
                ? 'text-brown-deep border-b-2 border-brown-deep'
                : 'text-ink-faint hover:text-ink'
            }`}
          >
            <Upload size={16} className="inline mr-2" />
            Arquivos & Anexos
          </button>
          <button
            onClick={() => setAbaAtiva('feedbacks')}
            className={`pb-3 font-medium text-sm transition-colors ${
              abaAtiva === 'feedbacks'
                ? 'text-brown-deep border-b-2 border-brown-deep'
                : 'text-ink-faint hover:text-ink'
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            Diário de Feedbacks
          </button>
        </div>

        {abaAtiva === 'arquivos' && (
          <div className="space-y-6">
            <Panel className="p-6">
              <h2 className="font-medium text-brown-deep mb-4 flex items-center gap-2">
                <Upload size={18} />
                Adicionar Documento ou Link
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-ink-faint font-medium mb-2">
                      Nome do Documento
                    </label>
                    <input
                      type="text"
                      value={novoDocumento.nome}
                      onChange={(e) =>
                        setNovoDocumento((prev) => ({
                          ...prev,
                          nome: e.target.value,
                        }))
                      }
                      placeholder="Ex: Currículo Atualizado"
                      className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:border-sky-deep outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-faint font-medium mb-2">
                      Categoria
                    </label>
                    <select
                      value={novoDocumento.categoria}
                      onChange={(e) =>
                        setNovoDocumento((prev) => ({
                          ...prev,
                          categoria: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:border-sky-deep outline-none"
                    >
                      <option value="curriculum">Currículo</option>
                      <option value="portfolio">Portfólio</option>
                      <option value="certificado">Certificado</option>
                      <option value="assessment">Assessment</option>
                      <option value="relatorio">Relatório</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-ink-faint font-medium mb-2">
                      URL ou Link
                    </label>
                    <input
                      type="url"
                      value={novoDocumento.url}
                      onChange={(e) =>
                        setNovoDocumento((prev) => ({
                          ...prev,
                          url: e.target.value,
                        }))
                      }
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:border-sky-deep outline-none"
                    />
                  </div>
                </div>

                {erroUpload && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-600">{erroUpload}</span>
                  </div>
                )}

                {sucessoUpload && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-green-600">
                      Documento adicionado com sucesso!
                    </span>
                  </div>
                )}

                <button
                  onClick={adicionarDocumento}
                  disabled={enviandoArquivo}
                  className="w-full flex items-center justify-center gap-2 bg-brown hover:bg-brown-deep disabled:opacity-50 text-paper text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  {enviandoArquivo ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <LinkIcon size={16} />
                  )}
                  {enviandoArquivo ? 'Adicionando...' : 'Adicionar Documento'}
                </button>
              </div>
            </Panel>

            <div>
              <div className="mb-4">
                <Eyebrow>
                  Documentos Anexados ({documentos.length})
                </Eyebrow>
              </div>

              {documentos.length === 0 ? (
                <Panel className="p-6 text-center">
                  <FileText size={32} className="mx-auto text-ink-faint mb-3" />
                  <p className="text-ink-faint">
                    Nenhum documento adicionado ainda. Comece anexando seus recursos!
                  </p>
                </Panel>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line">
                        <th className="text-left py-3 px-4 text-xs font-medium text-ink-faint uppercase tracking-wide">
                          Nome do Arquivo
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-ink-faint uppercase tracking-wide">
                          Categoria
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-ink-faint uppercase tracking-wide">
                          Data de Anexo
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-ink-faint uppercase tracking-wide">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentos.map((doc) => (
                        <tr
                          key={doc.id}
                          className="border-b border-line hover:bg-cream transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <FileText size={16} className="text-sky-deep flex-shrink-0" />
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brown-deep hover:underline font-medium"
                              >
                                {doc.nome}
                              </a>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block bg-sky-tint text-brown-deep text-xs px-2.5 py-1 rounded-full capitalize">
                              {doc.categoria}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-ink-faint">
                            {formatarData(doc.created_at)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sky-deep hover:text-sky text-xs font-medium"
                              >
                                <Download size={14} />
                                Abrir
                              </a>
                              <button
                                onClick={() => deletarDocumento(doc.id)}
                                disabled={deletandoId === doc.id}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                              >
                                {deletandoId === doc.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'feedbacks' && (
          <div>
            <div className="mb-6">
              <Eyebrow>Histórico de Sessões & Feedbacks</Eyebrow>
            </div>

            {pdiRespostas.length === 0 ? (
              <Panel className="p-6 text-center">
                <FileText size={32} className="mx-auto text-ink-faint mb-3" />
                <p className="text-ink-faint mb-4">
                  Nenhum feedback registrado ainda. Seus alinhamentos aparecerão aqui!
                </p>
                <p className="text-xs text-ink-faint">
                  A mentora adicionará observações, pontos fortes e planos de ação após cada
                  encontro.
                </p>
              </Panel>
            ) : (
              <div className="space-y-6">
                {pdiRespostas.map((resposta, index) => (
                  <Panel key={resposta.id} className="p-6 relative">
                    <div className="absolute left-0 top-8 w-3 h-3 bg-brown-deep rounded-full border-4 border-white -ml-1.5" />

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar size={16} className="text-sky-deep" />
                          <span className="text-sm font-medium text-ink-faint">
                            Sessão {pdiRespostas.length - index}
                          </span>
                        </div>
                        <p className="text-xs text-ink-faint">
                          {formatarData(resposta.updated_at)}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium text-brown-deep mb-2 capitalize">
                          {resposta.secao?.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                          {resposta.dados?.texto || 'Sem conteúdo registrado'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 pt-4 border-t border-line">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-xs text-green-600 font-medium">
                        Sessão concluída
                      </span>
                    </div>
                  </Panel>
                ))}

                <div className="mt-8 p-6 bg-sky-tint border border-sky rounded-lg text-center">
                  <h3 className="font-medium text-brown-deep mb-2">
                    Próximo Encontro
                  </h3>
                  <p className="text-sm text-ink-faint mb-4">
                    Agende seu próximo alinhamento com a mentora para receber novos feedbacks e
                    ajustar sua estratégia.
                  </p>
                  <a
                    href="/dashboard"
                    className="inline-flex items-center gap-2 bg-brown hover:bg-brown-deep text-paper text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Ver Calendário
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

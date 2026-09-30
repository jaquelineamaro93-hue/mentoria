'use client';

import { useEffect, useState } from 'react';
import { FileText, MessageSquare, Plus, Trash2, ExternalLink, HelpCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PlanoGerado } from '@/components/pdi/PlanoGerado';
import PdiClientContent from './PdiClientContent';
import FeedbackTimeline from './FeedbackTimeline';
import type { PdiGuiaSecao, PdiResposta, Profile } from '@/lib/types';

interface MeuPdiClientProps {
  userId: string;
  profile: Profile | null;
  secoes: PdiGuiaSecao[];
  respostasIniciais: PdiResposta[];
  initialTab?: Tab;
}

type Tab = 'perguntas' | 'plano' | 'documentos' | 'feedbacks';


export default function MeuPdiClient({
  userId,
  profile,
  secoes,
  respostasIniciais,
  initialTab = 'perguntas',
}: MeuPdiClientProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [carregandoDocumentos, setCarregandoDocumentos] = useState(true);
  const [erroDocumento, setErroDocumento] = useState('');
  const [nomDoc, setNomDoc] = useState('');
  const [categoria, setCategoria] = useState('Currículo');
  const [urlDoc, setUrlDoc] = useState('');

  useEffect(() => {
    let ativo = true;
    async function carregarDocumentos() {
      setCarregandoDocumentos(true);
      const { data, error } = await supabase
        .from('documentos_mentorado')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!ativo) return;
      if (error) setErroDocumento('Não foi possível carregar seus documentos.');
      else setDocumentos(data ?? []);
      setCarregandoDocumentos(false);
    }
    carregarDocumentos();
    return () => { ativo = false; };
  }, [userId, supabase]);

  const handleAddDocumento = async () => {
    if (!nomDoc.trim() || !urlDoc.trim()) return;
    setErroDocumento('');

    const { data, error } = await supabase
      .from('documentos_mentorado')
      .insert({
        user_id: userId,
        nome: nomDoc.trim(),
        categoria,
        url: urlDoc.trim(),
      })
      .select()
      .single();

    if (error || !data) {
      setErroDocumento('Não foi possível salvar o documento. Confira o link e tente novamente.');
      return;
    }

    setDocumentos((prev) => [data, ...prev]);
    setNomDoc('');
    setUrlDoc('');
  };

  const handleDeleteDocumento = async (id: string) => {
    setErroDocumento('');
    const { error } = await supabase
      .from('documentos_mentorado')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      setErroDocumento('Não foi possível remover o documento.');
      return;
    }
    setDocumentos((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <>
      <div className="border-b border-gray-faint bg-white px-6 md:px-12 py-4 sticky top-0 z-10">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('perguntas')}
            className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors ${
              activeTab === 'perguntas'
                ? 'border-b-2 border-mint-deep text-black'
                : 'text-gray-text hover:text-black'
            }`}
          >
            <HelpCircle size={16} strokeWidth={1.5} />
            Perguntas Guia
          </button>
          <button
            onClick={() => setActiveTab('plano')}
            className={`pb-4 text-sm font-medium transition-colors ${
              activeTab === 'plano'
                ? 'border-b-2 border-mint-deep text-black'
                : 'text-gray-text hover:text-black'
            }`}
          >
            Plano
          </button>
          <button
            onClick={() => setActiveTab('documentos')}
            className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors ${
              activeTab === 'documentos'
                ? 'border-b-2 border-mint-deep text-black'
                : 'text-gray-text hover:text-black'
            }`}
          >
            <FileText size={16} strokeWidth={1.5} />
            Documentos & Anexos
          </button>
          <button
            onClick={() => setActiveTab('feedbacks')}
            className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors ${
              activeTab === 'feedbacks'
                ? 'border-b-2 border-mint-deep text-black'
                : 'text-gray-text hover:text-black'
            }`}
          >
            <MessageSquare size={16} strokeWidth={1.5} />
            Diário de Feedbacks
          </button>
        </div>
      </div>

      <main className="flex-1 px-6 py-10 md:px-12 w-full">
        {activeTab === 'perguntas' && (
          <PdiClientContent
            profile={profile}
            userId={userId}
            secoes={secoes}
            respostasIniciais={respostasIniciais}
          />
        )}

        {activeTab === 'plano' && <PlanoGerado mentoradoId={userId} />}

        {activeTab === 'documentos' && (
          <div>
            <h2 className="text-2xl font-medium text-black mb-6">Documentos & Anexos</h2>
            <div className="bg-white rounded-xl border border-gray-faint p-6 mb-8">
              <h3 className="text-lg font-medium text-black mb-4">Adicionar Novo Documento</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Nome do Documento</label>
                  <input type="text" value={nomDoc} onChange={(e) => setNomDoc(e.target.value)} placeholder="Ex: CV Atualizado" className="w-full border border-gray-faint rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint-deep/30" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Categoria</label>
                    <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full border border-gray-faint rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint-deep/30">
                      <option>Currículo</option>
                      <option>Assessment</option>
                      <option>Processos</option>
                      <option>Relatório</option>
                      <option>Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">URL / Link</label>
                    <input type="url" value={urlDoc} onChange={(e) => setUrlDoc(e.target.value)} placeholder="https://drive.google.com/..." className="w-full border border-gray-faint rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint-deep/30" />
                  </div>
                </div>
                <button onClick={handleAddDocumento} className="flex items-center gap-2 bg-mint-deep hover:opacity-90 text-white px-6 py-2 rounded-lg transition-colors">
                  <Plus size={16} />
                  Adicionar Documento
                </button>
              </div>
            </div>

            {erroDocumento && (
              <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {erroDocumento}
              </p>
            )}

            {carregandoDocumentos ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-text">
                <Loader2 size={16} className="animate-spin" />
                Carregando documentos...
              </div>
            ) : documentos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-faint border-dashed">
                <FileText size={32} className="mb-3 text-gray-text" />
                <p className="text-gray-text">Nenhum documento ou anexo adicionado ainda</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-faint overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white border-b border-gray-faint">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-gray-text">Nome</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-text">Categoria</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-text">Data</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-text">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentos.map(doc => (
                      <tr key={doc.id} className="border-b border-gray-faint hover:bg-white">
                        <td className="px-6 py-4 text-black">{doc.nome}</td>
                        <td className="px-6 py-4"><span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{doc.categoria}</span></td>
                        <td className="px-6 py-4 text-gray-text">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-3">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white rounded"><ExternalLink size={16} className="text-black" /></a>
                            <button onClick={() => handleDeleteDocumento(doc.id)} className="p-2 hover:bg-red-50 rounded"><Trash2 size={16} className="text-red-600" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feedbacks' && (
          <section>
            <h2 className="text-2xl font-medium text-black mb-6">Feedbacks dos Mentores</h2>
            <FeedbackTimeline userId={userId} />
          </section>
        )}
      </main>
    </>
  );
}

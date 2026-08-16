'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, MessageSquare, Plus, Trash2, ExternalLink, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PlanoGerado } from '@/components/pdi/PlanoGerado';
import PdiClientContent from './PdiClientContent';
import type { PdiGuiaSecao, PdiResposta, Profile } from '@/lib/types';

interface MeuPdiClientProps {
  userId: string;
  profile: Profile | null;
  secoes: PdiGuiaSecao[];
  respostasIniciais: PdiResposta[];
}

type Tab = 'perguntas' | 'plano' | 'documentos' | 'feedbacks';

export default function MeuPdiClient({ userId, profile, secoes, respostasIniciais }: MeuPdiClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('perguntas');
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [nomDoc, setNomDoc] = useState('');
  const [categoria, setCategoria] = useState('Currículo');
  const [urlDoc, setUrlDoc] = useState('');

  const handleAddDocumento = () => {
    if (!nomDoc.trim() || !urlDoc.trim()) return;
    setDocumentos([...documentos, {
      id: Date.now(),
      nome: nomDoc,
      categoria,
      url: urlDoc,
      data: new Date().toLocaleDateString('pt-BR'),
    }]);
    setNomDoc('');
    setUrlDoc('');
  };

  const handleDeleteDocumento = (id: number) => {
    setDocumentos(documentos.filter(d => d.id !== id));
  };

  return (
    <div className="flex flex-col w-full bg-cream min-h-screen">
      <div className="border-b border-line bg-paper sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-8 border-b border-line overflow-x-auto">
            <button
              onClick={() => setActiveTab('perguntas')}
              className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'perguntas'
                  ? 'border-b-2 border-brown-deep text-brown-deep'
                  : 'text-ink-faint hover:text-brown-deep'
              }`}
            >
              <HelpCircle size={16} strokeWidth={1.5} />
              Perguntas Guia
            </button>
            <button
              onClick={() => setActiveTab('plano')}
              className={`pb-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'plano'
                  ? 'border-b-2 border-brown-deep text-brown-deep'
                  : 'text-ink-faint hover:text-brown-deep'
              }`}
            >
              Plano
            </button>
            <button
              onClick={() => setActiveTab('documentos')}
              className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'documentos'
                  ? 'border-b-2 border-brown-deep text-brown-deep'
                  : 'text-ink-faint hover:text-brown-deep'
              }`}
            >
              <FileText size={16} strokeWidth={1.5} />
              Documentos & Anexos
            </button>
            <button
              onClick={() => setActiveTab('feedbacks')}
              className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'feedbacks'
                  ? 'border-b-2 border-brown-deep text-brown-deep'
                  : 'text-ink-faint hover:text-brown-deep'
              }`}
            >
              <MessageSquare size={16} strokeWidth={1.5} />
              Diário de Feedbacks
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
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
            <h2 className="text-2xl font-medium text-brown-deep mb-6">Documentos & Anexos</h2>
            <div className="bg-paper rounded-xl border border-line p-6 mb-8">
              <h3 className="text-lg font-medium text-brown-deep mb-4">Adicionar Novo Documento</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Nome do Documento</label>
                  <input type="text" value={nomDoc} onChange={(e) => setNomDoc(e.target.value)} placeholder="Ex: CV Atualizado" className="w-full border border-line rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Categoria</label>
                    <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full border border-line rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep">
                      <option>Currículo</option>
                      <option>Assessment</option>
                      <option>Processos</option>
                      <option>Relatório</option>
                      <option>Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">URL / Link</label>
                    <input type="url" value={urlDoc} onChange={(e) => setUrlDoc(e.target.value)} placeholder="https://drive.google.com/..." className="w-full border border-line rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep" />
                  </div>
                </div>
                <button onClick={handleAddDocumento} className="flex items-center gap-2 bg-brown-deep hover:bg-brown text-white px-6 py-2 rounded-lg transition-colors">
                  <Plus size={16} />
                  Adicionar Documento
                </button>
              </div>
            </div>

            {documentos.length === 0 ? (
              <div className="text-center py-12 bg-paper rounded-xl border border-line border-dashed">
                <FileText size={32} className="mx-auto mb-3 text-ink-faint" />
                <p className="text-ink-faint">Nenhum documento ou anexo adicionado ainda</p>
              </div>
            ) : (
              <div className="bg-paper rounded-xl border border-line overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-cream border-b border-line">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-ink-faint">Nome</th>
                      <th className="px-6 py-3 text-left font-medium text-ink-faint">Categoria</th>
                      <th className="px-6 py-3 text-left font-medium text-ink-faint">Data</th>
                      <th className="px-6 py-3 text-left font-medium text-ink-faint">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentos.map(doc => (
                      <tr key={doc.id} className="border-b border-line hover:bg-cream">
                        <td className="px-6 py-4 text-ink">{doc.nome}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${doc.categoria === 'Currículo' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                            {doc.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-ink-faint">{doc.data}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-3">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-cream rounded">
                              <ExternalLink size={16} className="text-brown-deep" />
                            </a>
                            <button onClick={() => handleDeleteDocumento(doc.id)} className="p-2 hover:bg-red-50 rounded">
                              <Trash2 size={16} className="text-red-600" />
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
        )}

        {activeTab === 'feedbacks' && (
          <div>
            <h2 className="text-2xl font-medium text-brown-deep mb-6">Diário de Feedbacks & Evolução</h2>
            <div className="text-center py-12 bg-paper rounded-xl border border-line border-dashed">
              <MessageSquare size={32} className="mx-auto mb-3 text-ink-faint" />
              <p className="text-ink-faint">Timeline de feedbacks será exibida aqui</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, MessageSquare, Plus, Trash2, ExternalLink, HelpCircle, Star } from 'lucide-react';
import StandardLayout from '@/components/StandardLayout';
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
}

type Tab = 'perguntas' | 'plano' | 'documentos' | 'feedbacks';


function CheckinMensal({ userId }: { userId: string }) {
  const supabase = createClient();
  const [nota, setNota] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [feedbackTexto, setFeedbackTexto] = useState('');
  const [sugestao, setSugestao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [historico, setHistorico] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const mesAtual = new Date().toISOString().slice(0, 7);

  useState(() => { carregarHistorico(); });

  async function carregarHistorico() {
    const { data } = await supabase.from('checkins_mensais').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setHistorico(data ?? []);
    setCarregando(false);
  }

  const jaEnviouEsteMes = historico.some(c => c.mes_referencia === mesAtual);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nota === 0) { setErro('Selecione uma nota de 1 a 5'); return; }
    if (!feedbackTexto.trim()) { setErro('Por favor, escreva sobre sua experiencia este mes'); return; }
    setSalvando(true); setErro('');
    const res = await fetch('/api/checkin-mensal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mes_referencia: mesAtual, nota, feedback_texto: feedbackTexto || null, sugestao_melhoria: sugestao || null }),
    });
    if (res.ok) { setSucesso(true); setNota(0); setFeedbackTexto(''); setSugestao(''); carregarHistorico(); }
    else { const d = await res.json(); setErro(d.error || 'Erro ao enviar'); }
    setSalvando(false);
  }

  return (
    <div>
      <h2 className="text-2xl font-medium text-black mb-6">Diário de Feedbacks</h2>
      {!jaEnviouEsteMes ? (
        <div className="bg-white border border-gray-faint rounded-xl p-6 mb-8">
          <h3 className="font-medium text-black mb-1">Check-in deste mês</h3>
          <p className="text-xs text-gray-text mb-4">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
          {sucesso && <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">Feedback enviado!</div>}
          {erro && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-600">{erro}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-text mb-2">Como voce avalia sua evolucao este mes?</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} type="button" onClick={() => setNota(n)} onMouseEnter={() => setHoverNota(n)} onMouseLeave={() => setHoverNota(0)} className="p-1">
                    <Star size={28} className={(hoverNota || nota) >= n ? 'fill-amber-400 text-amber-400' : 'text-line'} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-text mb-2">Como esta sendo sua experiencia na mentoria?</label>
              <textarea value={feedbackTexto} onChange={(e) => setFeedbackTexto(e.target.value)} className="w-full border border-gray-faint rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brown-deep resize-none" rows={3} placeholder="Compartilhe como esta sendo sua jornada..." />
            </div>
            <div>
              <label className="block text-sm text-gray-text mb-2">Alguma sugestao de melhoria?</label>
              <textarea value={sugestao} onChange={(e) => setSugestao(e.target.value)} className="w-full border border-gray-faint rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brown-deep resize-none" rows={2} placeholder="O que poderia ser diferente?" />
            </div>
            <button type="submit" disabled={salvando} className="bg-brown-deep text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brown transition-colors disabled:opacity-50">
              {salvando ? 'Enviando...' : 'Enviar feedback'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 text-sm text-green-700">Voce ja enviou seu check-in deste mes!</div>
      )}
      {!carregando && historico.length > 0 && (
        <div>
          <h3 className="font-medium text-black mb-4">Historico de check-ins</h3>
          <div className="space-y-3">
            {historico.map((c) => (
              <div key={c.id} className="bg-white border border-gray-faint rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-text">{new Date(c.mes_referencia + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map((n) => (<Star key={n} size={12} className={n <= c.nota ? 'fill-amber-400 text-amber-400' : 'text-line'} />))}</div>
                </div>
                {c.feedback_texto && <p className="text-sm text-black mb-1">{c.feedback_texto}</p>}
                {c.sugestao_melhoria && <p className="text-xs text-gray-text">Sugestao: {c.sugestao_melhoria}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MeuPdiClient({ userId, profile, secoes, respostasIniciais }: MeuPdiClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>('perguntas');
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [nomDoc, setNomDoc] = useState('');
  const [categoria, setCategoria] = useState('Currículo');
  const [urlDoc, setUrlDoc] = useState('');

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

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
    <StandardLayout profile={profile} onSignOut={handleSignOut}>
      <div className="border-b border-gray-faint bg-white px-6 md:px-12 py-4 sticky top-0 z-10">
        <div className="flex gap-8 max-w-5xl mx-auto">
          <button
            onClick={() => setActiveTab('perguntas')}
            className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors ${
              activeTab === 'perguntas'
                ? 'border-b-2 border-brown-deep text-black'
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
                ? 'border-b-2 border-brown-deep text-black'
                : 'text-gray-text hover:text-black'
            }`}
          >
            Plano
          </button>
          <button
            onClick={() => setActiveTab('documentos')}
            className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors ${
              activeTab === 'documentos'
                ? 'border-b-2 border-brown-deep text-black'
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
                ? 'border-b-2 border-brown-deep text-black'
                : 'text-gray-text hover:text-black'
            }`}
          >
            <MessageSquare size={16} strokeWidth={1.5} />
            Diário de Feedbacks
          </button>
        </div>
      </div>

      <main className="flex-1 px-6 py-10 md:px-12 max-w-5xl mx-auto w-full">
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
                  <input type="text" value={nomDoc} onChange={(e) => setNomDoc(e.target.value)} placeholder="Ex: CV Atualizado" className="w-full border border-gray-faint rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Categoria</label>
                    <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full border border-gray-faint rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep">
                      <option>Currículo</option>
                      <option>Assessment</option>
                      <option>Processos</option>
                      <option>Relatório</option>
                      <option>Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">URL / Link</label>
                    <input type="url" value={urlDoc} onChange={(e) => setUrlDoc(e.target.value)} placeholder="https://drive.google.com/..." className="w-full border border-gray-faint rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep" />
                  </div>
                </div>
                <button onClick={handleAddDocumento} className="flex items-center gap-2 bg-brown-deep hover:bg-brown text-white px-6 py-2 rounded-lg transition-colors">
                  <Plus size={16} />
                  Adicionar Documento
                </button>
              </div>
            </div>

            {documentos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-faint border-dashed">
                <FileText size={32} className="mx-auto mb-3 text-gray-text" />
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
                        <td className="px-6 py-4 text-gray-text">{doc.data}</td>
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
    </StandardLayout>
  );
}

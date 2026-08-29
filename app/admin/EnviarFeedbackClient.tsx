'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Loader2 } from 'lucide-react';

interface Profile {
  id: string;
  nome: string;
}

export default function EnviarFeedbackClient({ mentorados }: { mentorados: Profile[] }) {
  const supabase = createClient();
  const [mentoradoId, setMentoradoId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState<'feedback' | 'nota' | 'arquivo'>('feedback');
  const [arquivoUrl, setArquivoUrl] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  async function handleEnviar() {
    if (!mentoradoId || !titulo.trim() || !conteudo.trim()) {
      setErro('Preencha todos os campos obrigatórios');
      return;
    }

    setEnviando(true);
    setErro('');
    setSucesso('');

    const { data: userData } = await supabase.auth.getUser();
    const adminId = userData?.user?.id;

    if (!adminId) {
      setErro('Erro: não consegui identificar o admin');
      return;
    }

    const { error } = await supabase.from('feedback_sessoes').insert({
      user_id: mentoradoId,
      admin_id: adminId,
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      tipo,
      arquivo_url: arquivoUrl || null,
      data: new Date().toISOString(),
    });

    setEnviando(false);

    if (error) {
      setErro('Erro ao enviar feedback: ' + error.message);
      return;
    }

    setSucesso('Feedback enviado com sucesso!');
    setTitulo('');
    setConteudo('');
    setTipo('feedback');
    setArquivoUrl('');
  }

  return (
    <div className="bg-white rounded-xl border border-gray-faint p-8">
      <h2 className="text-2xl font-medium text-black mb-6">Enviar Feedback ao Mentorado</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black mb-2">Mentorado</label>
          <select
            value={mentoradoId}
            onChange={(e) => setMentoradoId(e.target.value)}
            className="w-full border border-gray-faint rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep"
          >
            <option value="">Selecionar mentorado...</option>
            {mentorados.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Feedback Sessão 3"
            className="w-full border border-gray-faint rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as any)}
              className="w-full border border-gray-faint rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep"
            >
              <option value="feedback">Feedback</option>
              <option value="nota">Nota</option>
              <option value="arquivo">Arquivo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">URL do Arquivo (opcional)</label>
            <input
              type="url"
              value={arquivoUrl}
              onChange={(e) => setArquivoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-faint rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">Conteúdo</label>
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Escreva o feedback aqui..."
            className="w-full h-32 border border-gray-faint rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brown-deep resize-none"
          />
        </div>

        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{erro}</p>}
        {sucesso && <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2">{sucesso}</p>}

        <button
          onClick={handleEnviar}
          disabled={enviando}
          className="flex items-center gap-2 bg-brown-deep hover:bg-brown text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {enviando ? 'Enviando...' : 'Enviar Feedback'}
        </button>
      </div>
    </div>
  );
}

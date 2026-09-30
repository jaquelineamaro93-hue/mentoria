'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Panel } from '@/components/Panel';

interface Documento {
  id: string;
  nome: string;
  categoria: string;
  url: string;
  tamanho: number | null;
  created_at: string | null;
}

const BUCKET = 'pdi-documentos';

function formatBytes(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export default function PdiEvidenciasClient({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Certificado');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [linkExterno, setLinkExterno] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('documentos_mentorado')
      .select('id, nome, categoria, url, tamanho, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setErro('Não consegui carregar suas evidências.');
    } else {
      setDocumentos((data ?? []) as Documento[]);
    }
    setCarregando(false);
  }

  async function adicionar() {
    setErro(null);
    setSucesso(null);

    const temArquivo = Boolean(arquivo);
    const temLink = Boolean(linkExterno.trim());

    if (!temArquivo && !temLink) {
      setErro('Escolha um arquivo ou informe um link.');
      return;
    }

    if (temArquivo && temLink) {
      setErro('Use um arquivo ou um link por vez.');
      return;
    }

    if (arquivo && arquivo.size > 10 * 1024 * 1024) {
      setErro('O arquivo deve ter no máximo 10 MB.');
      return;
    }

    setSalvando(true);

    let url = linkExterno.trim();
    let tamanho: number | null = null;
    let storagePath: string | null = null;

    try {
      if (arquivo) {
        const extName = sanitizeFileName(arquivo.name);
        storagePath = `${userId}/${crypto.randomUUID()}-${extName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, arquivo, {
            cacheControl: '3600',
            upsert: false,
            contentType: arquivo.type || undefined,
          });

        if (uploadError) {
          throw new Error(uploadError.message || 'Falha ao enviar arquivo.');
        }

        url = `storage:${storagePath}`;
        tamanho = arquivo.size;
      }

      const nomeFinal = nome.trim() || arquivo?.name || 'Evidência';

      const { data, error } = await supabase
        .from('documentos_mentorado')
        .insert({
          user_id: userId,
          nome: nomeFinal,
          categoria,
          url,
          tamanho,
        })
        .select('id, nome, categoria, url, tamanho, created_at')
        .single();

      if (error) {
        if (storagePath) {
          await supabase.storage.from(BUCKET).remove([storagePath]);
        }
        throw new Error(error.message || 'Falha ao salvar evidência.');
      }

      setDocumentos((atuais) => [data as Documento, ...atuais]);
      setNome('');
      setArquivo(null);
      setLinkExterno('');
      setSucesso('Evidência adicionada ao seu plano.');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não consegui adicionar a evidência.');
    } finally {
      setSalvando(false);
    }
  }

  async function abrir(documento: Documento) {
    setErro(null);

    if (!documento.url.startsWith('storage:')) {
      window.open(documento.url, '_blank', 'noopener,noreferrer');
      return;
    }

    const path = documento.url.replace(/^storage:/, '');
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);

    if (error || !data?.signedUrl) {
      setErro('Não consegui abrir este arquivo agora.');
      return;
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function remover(documento: Documento) {
    if (!window.confirm(`Remover “${documento.nome}”?`)) return;

    setErro(null);

    if (documento.url.startsWith('storage:')) {
      const path = documento.url.replace(/^storage:/, '');
      await supabase.storage.from(BUCKET).remove([path]);
    }

    const { error } = await supabase
      .from('documentos_mentorado')
      .delete()
      .eq('id', documento.id)
      .eq('user_id', userId);

    if (error) {
      setErro('Não consegui remover a evidência.');
      return;
    }

    setDocumentos((atuais) => atuais.filter((item) => item.id !== documento.id));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-mint-deep mb-1">Evidências do desenvolvimento</p>
        <h2 className="font-display text-2xl text-black">O que comprova sua evolução</h2>
        <p className="text-sm text-gray-text mt-1 max-w-3xl">
          Guarde aqui certificados, avaliações, relatórios, projetos ou materiais ligados ao seu plano de desenvolvimento.
          Currículo e materiais de candidatura ficam em Mercado de trabalho.
        </p>
      </div>

      <Panel className="p-5 md:p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <label>
            <span className="block text-sm font-medium text-black mb-2">Nome da evidência</span>
            <input
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Ex.: Certificação Marketing Cloud"
              className="w-full rounded-lg border border-gray-faint bg-white px-4 py-2.5 text-sm text-black focus:outline-none focus:border-mint-deep"
            />
          </label>

          <label>
            <span className="block text-sm font-medium text-black mb-2">Categoria</span>
            <select
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              className="w-full rounded-lg border border-gray-faint bg-white px-4 py-2.5 text-sm text-black focus:outline-none focus:border-mint-deep"
            >
              <option>Certificado</option>
              <option>Relatório ou projeto</option>
              <option>Avaliação ou assessment</option>
              <option>Material de apoio</option>
              <option>Outro</option>
            </select>
          </label>
        </div>

        <div className="mt-5 grid lg:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <label>
            <span className="block text-sm font-medium text-black mb-2">Enviar arquivo</span>
            <div className="rounded-lg border border-dashed border-gray-faint bg-[#fbfcfd] px-4 py-3">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
                onChange={(event) => setArquivo(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-text file:mr-3 file:rounded-md file:border-0 file:bg-mint-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-black"
              />
              <p className="text-[11px] text-gray-text mt-2">PDF, Word, PNG ou JPG · até 10 MB.</p>
            </div>
          </label>

          <div className="text-xs uppercase tracking-wide text-gray-text pb-4 text-center">ou</div>

          <label>
            <span className="block text-sm font-medium text-black mb-2">Adicionar link externo</span>
            <div className="relative">
              <LinkIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text" />
              <input
                type="url"
                value={linkExterno}
                onChange={(event) => setLinkExterno(event.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full rounded-lg border border-gray-faint bg-white py-2.5 pl-9 pr-4 text-sm text-black focus:outline-none focus:border-mint-deep"
              />
            </div>
          </label>
        </div>

        {erro && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-mint bg-mint-light px-4 py-3 text-sm text-black">
            <CheckCircle2 size={16} className="text-mint-deep" />
            {sucesso}
          </div>
        )}

        <button
          type="button"
          onClick={adicionar}
          disabled={salvando}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-mint-deep px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {salvando ? <Loader2 size={16} className="animate-spin" /> : arquivo ? <Upload size={16} /> : <Paperclip size={16} />}
          {salvando ? 'Salvando...' : 'Adicionar evidência'}
        </button>
      </Panel>

      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-black">Evidências salvas</h3>
          <span className="text-xs text-gray-text">{documentos.length} item{documentos.length === 1 ? '' : 's'}</span>
        </div>

        {carregando ? (
          <div className="rounded-xl border border-gray-faint bg-white p-6 text-sm text-gray-text">Carregando...</div>
        ) : documentos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-faint bg-white px-6 py-10 text-center">
            <FileText size={28} className="mx-auto text-gray-text mb-2" />
            <p className="text-sm text-gray-text">Nenhuma evidência adicionada ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documentos.map((documento) => (
              <article
                key={documento.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-faint bg-white px-4 py-3.5"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-mint-light grid place-items-center shrink-0">
                    <FileText size={17} className="text-mint-deep" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-black truncate">{documento.nome}</p>
                    <p className="text-xs text-gray-text mt-0.5">
                      {documento.categoria}
                      {documento.tamanho ? ` · ${formatBytes(documento.tamanho)}` : ''}
                      {documento.created_at
                        ? ` · ${new Date(documento.created_at).toLocaleDateString('pt-BR')}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => abrir(documento)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-faint px-3 py-2 text-xs font-medium text-black hover:border-mint-deep"
                  >
                    <ExternalLink size={14} />
                    Abrir
                  </button>
                  <button
                    type="button"
                    onClick={() => remover(documento)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-faint px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

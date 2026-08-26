'use client';

import { useState } from 'react';
import { GripVertical, X, Zap, Plus, ChevronLeft, ChevronRight, Download, Upload, FileDown } from 'lucide-react';
import { Panel, Eyebrow } from '@/components/Panel';
import * as XLSX from 'xlsx';

interface Vaga {
  id: string;
  empresa: string;
  cargo: string;
  etapa: string;
  fit_score: number | null;
  descricao_vaga: string | null;
  link_vaga: string | null;
  proximo_passo: string | null;
  observacoes: string | null;
  origem?: string;
  contato: string | null;
}

interface Props {
  vagas: Vaga[];
  onVagaAtualizada: () => void;
}

const ETAPAS = [
  { id: 'para_aplicar', label: 'Para Aplicar', bg: 'bg-white', border: 'border-gray-faint' },
  { id: 'aplicada', label: 'Aplicada', bg: 'bg-mint-light', border: 'border-mint' },
  { id: 'entrevista_agendada', label: 'Entrevista Agendada', bg: 'bg-mint-light', border: 'border-mint' },
  { id: 'aguardando_retorno', label: 'Aguardando Retorno', bg: 'bg-mint-light', border: 'border-mint' },
  { id: 'entrevista_decisor', label: 'Entrevista c/ Decisor', bg: 'bg-mint-light', border: 'border-mint-deep' },
  { id: 'case', label: 'Case', bg: 'bg-white', border: 'border-brown' },
  { id: 'oferta', label: 'Oferta', bg: 'bg-mint-light', border: 'border-mint-deep' },
  { id: 'lost', label: 'Lost', bg: 'bg-white', border: 'border-gray-faint' },
];

const ORIGEM_COLORS: Record<string, string> = {
  'organico': 'bg-green-100 text-green-800',
  'indicacao': 'bg-purple-100 text-purple-800',
};

export default function KanbanTab({ vagas, onVagaAtualizada }: Props) {
  const [draggedVaga, setDraggedVaga] = useState<Vaga | null>(null);
  const [modalVaga, setModalVaga] = useState<Vaga | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [mostraModalNova, setMostraModalNova] = useState(false);
  const [salvandoNova, setSalvandoNova] = useState(false);
  const [editandoVaga, setEditandoVaga] = useState(false);
  const [vagaEditada, setVagaEditada] = useState<Partial<Vaga>>({});
  const [deletando, setDeletando] = useState(false);
  const [mostraImportacao, setMostraImportacao] = useState(false);
  const [novaVaga, setNovaVaga] = useState({
    empresa: '',
    cargo: '',
    descricao_vaga: '',
    link_vaga: '',
    contato: '',
  });

  async function moveVaga(vaga: Vaga, novaEtapa: string) {
    setAtualizando(true);
    try {
      const res = await fetch(`/api/vagas/${vaga.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa: novaEtapa }),
      });

      if (res.ok) {
        onVagaAtualizada();
      }
    } catch (erro) {
      console.error('Erro ao mover vaga:', erro);
    } finally {
      setAtualizando(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e: React.DragEvent, etapa: string) {
    e.preventDefault();
    if (draggedVaga) {
      moveVaga(draggedVaga, etapa);
      setDraggedVaga(null);
    }
  }

  function moveToColumn(vaga: Vaga, direction: 'prev' | 'next') {
    const currentIndex = ETAPAS.findIndex((e) => e.id === vaga.etapa);
    if (direction === 'prev' && currentIndex > 0) {
      moveVaga(vaga, ETAPAS[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < ETAPAS.length - 1) {
      moveVaga(vaga, ETAPAS[currentIndex + 1].id);
    }
  }

  function exportarVagasComoTemplate() {
    if (vagas.length === 0) {
      alert('Nenhuma vaga para exportar');
      return;
    }

    const dados = vagas.map((vaga) => ({
      'Título da Vaga': vaga.cargo,
      'Empresa': vaga.empresa,
      'Descrição': vaga.descricao_vaga || '',
      'Link': vaga.link_vaga || '',
      'Contato': vaga.contato || '',
      'Etapa': ETAPAS.find((e) => e.id === vaga.etapa)?.label || vaga.etapa,
      'Fit Score': vaga.fit_score || '',
      'Próximo Passo': vaga.proximo_passo || '',
      'Observações': vaga.observacoes || '',
      'Origem': vaga.origem || 'organico',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vagas');

    const fileName = `Minhas_Vagas_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  async function handleImportarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      // Aceita tanto o template oficial (EMPRESA, NOME DA VAGA...) quanto o
      // arquivo exportado daqui (Empresa, Título da Vaga...), ignorando
      // acentos, maiúsculas e espaços extras nos cabeçalhos.
      const normaliza = (s: string) =>
        s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

      const campo = (row: any, nomes: string[]) => {
        const mapa = new Map(Object.keys(row).map((k) => [normaliza(k), k]));
        for (const nome of nomes) {
          const chave = mapa.get(normaliza(nome));
          if (chave && row[chave] != null && row[chave].toString().trim() !== '') {
            return row[chave].toString().trim();
          }
        }
        return '';
      };

      let importadas = 0;
      for (const row of rows) {
        const empresa = campo(row, ['Empresa', 'EMPRESA']);
        const cargo = campo(row, ['Título da Vaga', 'NOME DA VAGA', 'Cargo', 'Vaga']);

        if (!empresa || !cargo) continue;

        const etapaLabel = campo(row, ['Etapa', 'ETAPA DO PROCESSO']);
        const etapaId =
          ETAPAS.find((e) => normaliza(e.label) === normaliza(etapaLabel))?.id || 'para_aplicar';

        // O template tem colunas que o Kanban não guarda em campo próprio.
        // Em vez de descartar, elas viram texto rotulado nos campos existentes.
        const descricao = [
          campo(row, ['Descrição', 'Descricao']),
          campo(row, ['HARD SKILL']) && `Hard skills: ${campo(row, ['HARD SKILL'])}`,
          campo(row, ['SOFT SKILL']) && `Soft skills: ${campo(row, ['SOFT SKILL'])}`,
        ]
          .filter(Boolean)
          .join('\n');

        const observacoes = [
          campo(row, ['Observações', 'OBSERVAÇÃO', 'Observacoes']),
          campo(row, ['DATA CANDIDATURA']) &&
            `Candidatura em ${campo(row, ['DATA CANDIDATURA'])}`,
          campo(row, ['ONDE VIU A VAGA']) && `Vista em ${campo(row, ['ONDE VIU A VAGA'])}`,
        ]
          .filter(Boolean)
          .join('\n');

        try {
          await fetch('/api/vagas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              empresa,
              cargo,
              descricao_vaga: descricao,
              link_vaga: campo(row, ['Link', 'LINK DA VAGA']),
              contato: campo(row, ['Contato']),
              etapa: etapaId,
              fit_score: parseInt(campo(row, ['Fit Score', 'FIT'])) || null,
              proximo_passo: campo(row, ['Próximo Passo']),
              observacoes: observacoes,
              origem: campo(row, ['Origem']) || 'organico',
            }),
          });
          importadas++;
        } catch (erro) {
          console.error('Erro ao importar vaga:', erro);
        }
      }

      alert(`${importadas} vaga${importadas !== 1 ? 's' : ''} importada${importadas !== 1 ? 's' : ''} com sucesso!`);
      onVagaAtualizada();
      setMostraImportacao(false);
    } catch (erro) {
      console.error('Erro ao ler arquivo:', erro);
      alert('Erro ao ler o arquivo. Verifique se é um arquivo XLSX ou CSV válido.');
    }
  }

  async function handleAdicionarVaga() {
    if (!novaVaga.empresa.trim() || !novaVaga.cargo.trim()) {
      alert('Empresa e cargo são obrigatórios');
      return;
    }

    setSalvandoNova(true);
    try {
      const res = await fetch('/api/vagas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa: novaVaga.empresa,
          cargo: novaVaga.cargo,
          descricao_vaga: novaVaga.descricao_vaga,
          link_vaga: novaVaga.link_vaga,
          contato: novaVaga.contato,
          etapa: 'para_aplicar',
          origem: 'organico',
        }),
      });

      if (res.ok) {
        setMostraModalNova(false);
        setNovaVaga({ empresa: '', cargo: '', descricao_vaga: '', link_vaga: '', contato: '' });
        onVagaAtualizada();
      } else {
        alert('Erro ao adicionar vaga');
      }
    } catch (erro) {
      console.error('Erro ao adicionar vaga:', erro);
      alert('Erro ao adicionar vaga');
    } finally {
      setSalvandoNova(false);
    }
  }

  async function handleSalvarEdicao() {
    if (!modalVaga) return;

    setAtualizando(true);
    try {
      const res = await fetch(`/api/vagas/${modalVaga.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vagaEditada),
      });

      if (res.ok) {
        setEditandoVaga(false);
        setVagaEditada({});
        onVagaAtualizada();
        setModalVaga(null);
      } else {
        alert('Erro ao salvar vaga');
      }
    } catch (erro) {
      console.error('Erro ao salvar vaga:', erro);
      alert('Erro ao salvar vaga');
    } finally {
      setAtualizando(false);
    }
  }

  async function handleDeletarVaga() {
    if (!modalVaga) return;
    if (!confirm('Tem certeza que deseja deletar esta vaga?')) return;

    setDeletando(true);
    try {
      const res = await fetch(`/api/vagas/${modalVaga.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setModalVaga(null);
        onVagaAtualizada();
      } else {
        alert('Erro ao deletar vaga');
      }
    } catch (erro) {
      console.error('Erro ao deletar vaga:', erro);
      alert('Erro ao deletar vaga');
    } finally {
      setDeletando(false);
    }
  }

  const getFitColor = (score: number | null) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    if (score >= 55) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Eyebrow>
            <Zap size={14} />
            Jornada de Candidaturas
          </Eyebrow>
          <h2 className="font-display text-3xl text-black">Kanban</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportarVagasComoTemplate}
            className="flex items-center gap-2 bg-brown-deep text-white px-4 py-2 rounded-lg hover:bg-brown transition-colors text-sm font-medium"
            title="Baixa suas vagas atuais como planilha"
          >
            <Download size={16} />
            Baixar Minhas Vagas
          </button>
          <a
            href="/api/download-template-vagas"
            className="flex items-center gap-2 bg-white text-black border border-gray-faint px-4 py-2 rounded-lg hover:bg-white transition-colors text-sm font-medium"
            title="Baixa uma planilha em branco, já com as colunas certas"
          >
            <FileDown size={16} />
            Baixar Modelo Excel
          </a>
          <button
            onClick={() => setMostraImportacao(true)}
            className="flex items-center gap-2 bg-mint-light text-black border border-mint px-4 py-2 rounded-lg hover:bg-mint-light/70 transition-colors text-sm font-medium"
          >
            <Upload size={16} />
            Importar Planilha
          </button>
          <button
            onClick={() => setMostraModalNova(true)}
            className="flex items-center gap-2 bg-white text-black border border-brown-deep px-4 py-2 rounded-lg hover:bg-white transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Adicionar Vaga
          </button>
        </div>
      </div>

      {/* Modal de Importação com Template */}
      {mostraImportacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Panel className="w-full border border-gray-faint">
            <div className="sticky top-0 bg-white border-b border-gray-faint p-6 flex items-start justify-between">
              <h2 className="font-display text-2xl text-black">Template de Vagas</h2>
              <button
                onClick={() => setMostraImportacao(false)}
                className="text-gray-text hover:text-black transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-mint-light border-2 border-mint p-4 rounded-lg">
                <p className="text-sm text-mint font-medium">
                  💡 <strong>Como usar:</strong> Importe vagas de um arquivo Excel ou CSV (seu próprio ou do template abaixo)
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-black mb-3">O que está incluído no template:</h3>
                  <ul className="text-sm text-black space-y-2 ml-4">
                    <li>✓ Empresa</li>
                    <li>✓ Cargo</li>
                    <li>✓ Descrição da Vaga</li>
                    <li>✓ Link da Vaga</li>
                    <li>✓ Contato (para referência)</li>
                    <li>✓ Etapa (Para Aplicar, Aplicada, etc)</li>
                    <li>✓ Fit Score (%)</li>
                    <li>✓ Próximo Passo</li>
                    <li>✓ Observações</li>
                    <li>✓ Origem (Orgânico ou Indicação)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-black mb-3">Passo a passo:</h3>
                  <ol className="text-sm text-black space-y-2 ml-4 list-decimal">
                    <li>Baixe o template clicando no botão abaixo</li>
                    <li>Abra em Excel, Google Sheets ou Numbers</li>
                    <li>Preencha as linhas amarelas com suas vagas</li>
                    <li>Salve como CSV</li>
                    <li>Importe aqui na plataforma</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>✅ Importar seu arquivo:</strong> Selecione um arquivo CSV ou XLSX (exportado daqui ou preenchido manualmente) para importar várias vagas de uma vez.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-3">Selecione o arquivo para importar:</label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleImportarArquivo}
                    className="w-full px-4 py-3 border border-gray-faint rounded-lg cursor-pointer hover:border-brown-deep transition"
                  />
                </div>

                <div className="flex gap-3">
                  <a
                    href="/api/download-template-vagas"
                    className="flex-1 bg-mint-deep text-white px-6 py-3 rounded-lg font-medium hover:bg-mint-deep/90 transition text-center flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Baixar Template (XLSX)
                  </a>
                  <button
                    onClick={() => setMostraImportacao(false)}
                    className="flex-1 border border-gray-faint text-black px-6 py-3 rounded-lg font-medium hover:bg-white transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      <div className="overflow-x-auto pb-4 border border-gray-faint rounded-lg bg-white">
        <div className="flex gap-4 p-4 min-w-max">
          {ETAPAS.map((etapa, etapaIndex) => {
            const vagasEtapa = vagas.filter((v) => v.etapa === etapa.id);

            return (
              <div
                key={etapa.id}
                className={`flex-shrink-0 w-80 ${etapa.bg} rounded-xl p-4 border-2 ${etapa.border}`}
              >
                <div className="mb-4">
                  <h3 className="font-medium text-black">{etapa.label}</h3>
                  <p className="text-xs text-gray-text mt-1">{vagasEtapa.length} vaga{vagasEtapa.length !== 1 ? 's' : ''}</p>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, etapa.id)}
                  className="space-y-3 min-h-[400px] rounded-lg border-2 border-dashed border-gray-faint p-3"
                >
                  {vagasEtapa.length === 0 ? (
                    <div className="text-center text-gray-text text-sm py-12">
                      Nenhuma vaga
                    </div>
                  ) : (
                    vagasEtapa.map((vaga) => (
                      <div
                        key={vaga.id}
                        draggable
                        onDragStart={() => setDraggedVaga(vaga)}
                        onDragEnd={() => setDraggedVaga(null)}
                        className="bg-white p-3 rounded-lg border border-gray-faint cursor-move hover:shadow-md hover:border-mint transition group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black truncate text-sm">
                              {vaga.cargo}
                            </p>
                            <p className="text-xs text-gray-text truncate">{vaga.empresa}</p>
                          </div>
                          <button
                            onClick={() => setModalVaga(vaga)}
                            className="text-gray-text hover:text-black text-xs shrink-0"
                          >
                            ✎
                          </button>
                        </div>

                        {vaga.fit_score !== null && (
                          <div className={`inline-block ${getFitColor(vaga.fit_score)} px-2 py-1 rounded-full text-xs font-bold mb-2`}>
                            {vaga.fit_score}% fit
                          </div>
                        )}

                        {vaga.origem && (
                          <div className={`inline-block ml-2 ${ORIGEM_COLORS[vaga.origem] || 'bg-gray-100 text-gray-800'} px-2 py-1 rounded-full text-xs font-semibold`}>
                            {vaga.origem === 'organico' ? 'Orgânico' : 'Indicação'}
                          </div>
                        )}

                        {vaga.contato && (
                          <p className="text-xs text-gray-text mt-2 truncate">📱 {vaga.contato}</p>
                        )}

                        {vaga.descricao_vaga && (
                          <p className="text-xs text-gray-text mt-2 line-clamp-2">
                            {vaga.descricao_vaga}
                          </p>
                        )}

                        <div className="flex gap-1 mt-3 justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveToColumn(vaga, 'prev');
                            }}
                            disabled={etapaIndex === 0 || atualizando}
                            className="p-1 hover:bg-mint hover:bg-opacity-20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft size={16} className="text-mint" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveToColumn(vaga, 'next');
                            }}
                            disabled={etapaIndex === ETAPAS.length - 1 || atualizando}
                            className="p-1 hover:bg-mint hover:bg-opacity-20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRight size={16} className="text-mint" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {mostraModalNova && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Panel className="w-full border border-gray-faint">
            <div className="bg-white border-b border-gray-faint p-6 flex items-start justify-between">
              <h2 className="font-display text-2xl text-black">Adicionar Nova Vaga</h2>
              <button
                onClick={() => setMostraModalNova(false)}
                className="text-gray-text hover:text-black transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Empresa *</label>
                <input
                  type="text"
                  value={novaVaga.empresa}
                  onChange={(e) => setNovaVaga({ ...novaVaga, empresa: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                  placeholder="Nome da empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Cargo *</label>
                <input
                  type="text"
                  value={novaVaga.cargo}
                  onChange={(e) => setNovaVaga({ ...novaVaga, cargo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                  placeholder="Descrição do cargo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Link da Vaga</label>
                <input
                  type="url"
                  value={novaVaga.link_vaga}
                  onChange={(e) => setNovaVaga({ ...novaVaga, link_vaga: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Contato</label>
                <input
                  type="text"
                  value={novaVaga.contato}
                  onChange={(e) => setNovaVaga({ ...novaVaga, contato: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                  placeholder="Email, telefone ou nome do contato"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Descrição da Vaga</label>
                <textarea
                  value={novaVaga.descricao_vaga}
                  onChange={(e) => setNovaVaga({ ...novaVaga, descricao_vaga: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                  placeholder="Cole a descrição completa da vaga..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAdicionarVaga}
                  disabled={salvandoNova}
                  className="flex-1 bg-brown-deep text-white px-4 py-2 rounded-lg hover:bg-brown transition-colors disabled:opacity-50"
                >
                  {salvandoNova ? 'Salvando...' : 'Adicionar Vaga'}
                </button>
                <button
                  onClick={() => setMostraModalNova(false)}
                  className="flex-1 border border-gray-faint text-black px-4 py-2 rounded-lg hover:bg-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {modalVaga && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Panel className="w-full max-h-[90vh] overflow-y-auto border border-gray-faint">
            <div className="sticky top-0 bg-white border-b border-gray-faint p-6 flex items-start justify-between">
              <div>
                {editandoVaga ? (
                  <input
                    type="text"
                    value={vagaEditada.cargo ?? modalVaga.cargo}
                    onChange={(e) => setVagaEditada({ ...vagaEditada, cargo: e.target.value })}
                    className="text-2xl font-display text-black w-full mb-2 px-3 py-2 border border-gray-faint rounded-lg"
                  />
                ) : (
                  <h2 className="font-display text-2xl text-black">{modalVaga.cargo}</h2>
                )}
                {editandoVaga ? (
                  <input
                    type="text"
                    value={vagaEditada.empresa ?? modalVaga.empresa}
                    onChange={(e) => setVagaEditada({ ...vagaEditada, empresa: e.target.value })}
                    className="text-sm text-gray-text w-full px-3 py-2 border border-gray-faint rounded-lg mt-2"
                  />
                ) : (
                  <p className="text-gray-text text-sm mt-1">{modalVaga.empresa}</p>
                )}
              </div>
              <button
                onClick={() => {
                  if (editandoVaga) {
                    setEditandoVaga(false);
                    setVagaEditada({});
                  } else {
                    setModalVaga(null);
                  }
                }}
                className="text-gray-text hover:text-black transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {modalVaga.fit_score !== null && (
                <Panel className="p-4 bg-mint-light border border-mint">
                  <p className="text-sm text-mint font-medium">Compatibilidade</p>
                  <p className="text-4xl font-display text-mint mt-1">{modalVaga.fit_score}%</p>
                </Panel>
              )}

              {editandoVaga ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Descrição da Vaga</label>
                    <textarea
                      value={vagaEditada.descricao_vaga ?? modalVaga.descricao_vaga ?? ''}
                      onChange={(e) => setVagaEditada({ ...vagaEditada, descricao_vaga: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Link da Vaga</label>
                    <input
                      type="url"
                      value={vagaEditada.link_vaga ?? modalVaga.link_vaga ?? ''}
                      onChange={(e) => setVagaEditada({ ...vagaEditada, link_vaga: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Contato</label>
                    <input
                      type="text"
                      value={vagaEditada.contato ?? modalVaga.contato ?? ''}
                      onChange={(e) => setVagaEditada({ ...vagaEditada, contato: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Próximo Passo</label>
                    <input
                      type="text"
                      value={vagaEditada.proximo_passo ?? modalVaga.proximo_passo ?? ''}
                      onChange={(e) => setVagaEditada({ ...vagaEditada, proximo_passo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Observações</label>
                    <textarea
                      value={vagaEditada.observacoes ?? modalVaga.observacoes ?? ''}
                      onChange={(e) => setVagaEditada({ ...vagaEditada, observacoes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-faint rounded-lg focus:ring-2 focus:ring-brown-deep focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSalvarEdicao}
                      disabled={atualizando}
                      className="flex-1 bg-brown-deep text-white px-4 py-2 rounded-lg hover:bg-brown transition-colors disabled:opacity-50"
                    >
                      {atualizando ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                    <button
                      onClick={() => {
                        setEditandoVaga(false);
                        setVagaEditada({});
                      }}
                      className="flex-1 border border-gray-faint text-black px-4 py-2 rounded-lg hover:bg-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDeletarVaga}
                      disabled={deletando}
                      className="flex-1 border border-red-500 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletando ? 'Deletando...' : 'Deletar'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {modalVaga.descricao_vaga && (
                    <div>
                      <h3 className="font-medium text-black mb-2">Descrição da Vaga</h3>
                      <p className="text-black whitespace-pre-wrap text-sm leading-relaxed">
                        {modalVaga.descricao_vaga}
                      </p>
                    </div>
                  )}

                  {modalVaga.link_vaga && (
                    <div>
                      <h3 className="font-medium text-black mb-2">Link da Vaga</h3>
                      <a
                        href={modalVaga.link_vaga}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mint hover:text-mint/80 underline break-all text-sm"
                      >
                        {modalVaga.link_vaga}
                      </a>
                    </div>
                  )}

                  {modalVaga.contato && (
                    <div>
                      <h3 className="font-medium text-black mb-2">Contato</h3>
                      <p className="text-black text-sm">{modalVaga.contato}</p>
                    </div>
                  )}

                  {modalVaga.proximo_passo && (
                    <div>
                      <h3 className="font-medium text-black mb-2">Próximo Passo</h3>
                      <p className="text-black text-sm">{modalVaga.proximo_passo}</p>
                    </div>
                  )}

                  {modalVaga.observacoes && (
                    <div>
                      <h3 className="font-medium text-black mb-2">Observações</h3>
                      <p className="text-black text-sm">{modalVaga.observacoes}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditandoVaga(true)}
                      className="flex-1 bg-brown-deep text-white px-4 py-2 rounded-lg hover:bg-brown transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setModalVaga(null)}
                      className="flex-1 border border-gray-faint text-black px-4 py-2 rounded-lg hover:bg-white transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

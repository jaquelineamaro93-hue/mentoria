'use client';
import { useState } from 'react';
type Connection = { message: string; agents?: { id: string; name: string }[]; selectedAgent?: {id:string;name:string}|null; whatsappReady?:boolean; automaticSending?:boolean; weeklyTemplateReady?:boolean; iaConsentRequired?:boolean; topsendReady?:boolean; topsendInboundReady?:boolean };
export default function CueConnection() {
  const [result, setResult] = useState<Connection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function verify() {
    setBusy(true); setError(''); setResult(null);
    try {
      const response = await fetch('/api/admin/cue', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Falha ao verificar conexão.');
      setResult(body);
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao verificar conexão.'); }
    finally { setBusy(false); }
  }
  return <section className="my-6 rounded-xl border border-gray-faint bg-white p-5">
    <h2 className="font-semibold">Íris da Cue</h2>
    <p className="mt-1 text-sm text-gray-text">Verifique a conexão com seu agente. Esta consulta não envia dados das mentoradas nem mensagens.</p>
    <button type="button" disabled={busy} onClick={verify} className="mt-3 rounded-lg border border-gray-faint px-4 py-2 text-sm disabled:opacity-50">{busy ? 'Verificando…' : 'Verificar conexão com a Íris'}</button>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {result && <div role="status" className="mt-3 space-y-2 text-sm">
      <p>{result.message}</p>
      {result.selectedAgent && <p className="text-xs text-gray-text">Agente SOMA: {result.selectedAgent.name}</p>}
      {!result.whatsappReady && <p className="text-amber-800">Aguardando configurar o webhook de automação TopSend ou a API Meta. A credencial Manus sozinha não habilita envios.</p>}
      {result.topsendReady && <p className="text-gray-text">TopSend: webhook de automação configurado. Um disparo HTTP confirma somente o início do fluxo, não a entrega ao contato.</p>}
      {result.topsendReady && !result.topsendInboundReady && <p className="text-amber-800">Retorno das respostas: aguarda gatilho de mensagem recebida da TopSend com chamada HTTP para a SOMA.</p>}
      {result.whatsappReady && !result.automaticSending && <p className="text-gray-text">Canal disponível. Automação desligada por configuração.</p>}
      {result.automaticSending && <p className="text-gray-text">Automação habilitada somente para contatos com consentimento específico de IA.</p>}
      {!result.weeklyTemplateReady && <p className="text-xs text-gray-text">Convites semanais exigem um template aprovado no WhatsApp Business.</p>}
    </div>}
  </section>;
}

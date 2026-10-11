'use client';
import { useState } from 'react';
type Connection = { message: string; agents?: { id: string; name: string }[] };
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
    {result && <div role="status" className="mt-3 text-sm"><p>{result.message}</p>
      {result.agents?.map(agent => <p key={agent.id} className="mt-2 break-all">{agent.name} · {agent.id}</p>)}
    </div>}
  </section>;
}

'use client';
export default function HelpError({ reset }: { reset: () => void }) {
  return <div role="alert" className="rounded-xl border bg-white p-6 text-black"><h2 className="text-lg font-semibold">Não foi possível abrir a Central de Ajuda</h2><p className="mt-2 text-sm">Tente novamente em alguns instantes.</p><button type="button" onClick={reset} className="mt-4 min-h-11 rounded-lg border px-4 py-2">Tentar novamente</button></div>;
}

'use client';
import { Sparkles } from 'lucide-react';
export default function AskIris({ articleId, title }: { articleId: string; title: string }) {
  return <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('soma:iris-help', { detail: { articleId, title } }))}
    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#24594b] bg-white px-4 py-3 text-sm font-semibold text-[#183f37] focus-visible:outline-2 focus-visible:outline-offset-2">
    <Sparkles size={16} aria-hidden="true" /> Me ajude com a Íris
  </button>;
}

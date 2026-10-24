'use client';
import { useEffect } from 'react';
export default function ReleaseRead({ releaseId }: { releaseId: string }) {
  useEffect(() => {
    void fetch('/api/ajuda/lidas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ release_id: releaseId }) })
      .then(response => { if (response.ok) window.dispatchEvent(new Event('soma:help-reads')); }).catch(() => {});
  }, [releaseId]);
  return null;
}

export default function HelpWatermark({ label }: { label: string }) {
  const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] || c);
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="210"><g transform="rotate(-18 220 105)" fill="#173e35" font-family="Arial,sans-serif" text-anchor="middle"><text x="220" y="92" font-size="11">SOMA · CONFIDENCIAL · USO EXCLUSIVO DESTA CONTA</text><text x="220" y="110" font-size="10">Reprodução não autorizada</text><text x="220" y="128" font-size="9">${escape(label)}</text></g></svg>`;
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 select-none" style={{ opacity: 0.075, backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tile)}")`, backgroundRepeat: 'repeat' }} />;
}

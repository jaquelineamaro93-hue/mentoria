export default function HelpWatermark({ label }: { label: string }) {
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="200"><text x="18" y="110" transform="rotate(-18 200 100)" fill="#173e35" font-family="Arial,sans-serif" font-size="13">${label}</text></svg>`;
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 opacity-[0.14] select-none print:opacity-25"
    style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tile)}")`, backgroundRepeat: 'repeat' }} />;
}

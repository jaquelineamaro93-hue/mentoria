export default function HelpWatermark({ label }: { label: string }) {
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="360"><text x="12" y="18" transform="rotate(90 12 18)" fill="#173e35" font-family="Arial,sans-serif" font-size="9">${label}</text></svg>`;
  const image = `url("data:image/svg+xml,${encodeURIComponent(tile)}")`;
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 opacity-[0.08] select-none print:opacity-[0.14]"
    style={{ backgroundImage: `${image}, ${image}`, backgroundRepeat: 'repeat-y', backgroundPosition: 'left top, right top' }} />;
}

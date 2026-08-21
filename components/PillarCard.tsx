export function PillarCard({ letter, title, percent, color }: any) {
  return (
    <div className={`bg-gradient-to-b ${color} to-white p-6 rounded-2xl border border-line text-center`}>
      <div className="text-4xl font-bold text-brand mb-3">{letter}</div>
      <h3 className="font-semibold text-ink-deep mb-3">{title}</h3>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-brand h-2 rounded-full" style={{ width: `${percent}%` }}></div>
      </div>
      <p className="text-sm text-ink-faint mt-3">{percent}%</p>
    </div>
  );
}

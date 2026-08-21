export function PostIt({ children, color = "yellow", date, type }: any) {
  const colors: any = {
    yellow: "bg-yellow-100 shadow-lg",
    peach: "bg-amber-100 shadow-lg",
    lavender: "bg-purple-100 shadow-lg",
    mint: "bg-mint-soft shadow-lg",
  };
  return (
    <div className={`${colors[color]} p-6 rounded-lg`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-semibold text-ink-faint">{date}</span>
        <span className="text-xs font-semibold text-ink-faint">{type}</span>
      </div>
      <p className="text-sm text-ink-soft leading-relaxed">{children}</p>
    </div>
  );
}

export function Badge({ children, variant = "default" }: any) {
  const variants: any = {
    success: "bg-mint-soft text-mint-deep",
    warning: "bg-coral-soft text-coral-deep",
    primary: "bg-brand-soft text-brand",
    coral: "bg-coral-soft text-coral",
    pink: "bg-lilac text-pink-900",
    default: "bg-gray-200 text-gray-800",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}

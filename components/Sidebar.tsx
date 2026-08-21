"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <aside className="fixed left-0 top-0 w-72 h-screen bg-white border-r border-line flex flex-col">
      <div className="p-6 border-b border-line">
        <div className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
          SOMA
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Passaporte", href: "/passaporte" },
          { label: "Mapa de Quem Sou", href: "/mapa" },
          { label: "Diário de Bordo", href: "/diario" },
          { label: "SOAR Builder", href: "/soar" },
          { label: "Feedback", href: "/feedback" },
          { label: "Trilhas", href: "/onboarding" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive(item.href)
                ? "bg-brand-soft text-brand font-semibold"
                : "text-ink-soft hover:bg-brand-soft"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-line p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-coral-deep text-white flex items-center justify-center font-semibold">
            JA
          </div>
          <div>
            <div className="text-sm font-semibold text-ink-deep">Jaqueline</div>
            <div className="text-xs text-ink-faint">Mentora</div>
          </div>
        </div>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm text-ink-faint hover:text-brand transition">
            Meu Perfil
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-ink-faint hover:text-brand transition">
            Termos
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-ink-faint hover:text-brand transition">
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}

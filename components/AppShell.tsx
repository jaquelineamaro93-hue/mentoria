'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, ChevronRight } from 'lucide-react';
import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';
import { UserProvider } from '@/lib/contexts/UserContext';
import {
  getPortalLocation,
  isPortalRouteActive,
  portalNavGroups,
} from '@/lib/config/portalNavigation';
import CollapsibleSidebar from '@/components/CollapsibleSidebar';
import styles from './PortalShell.module.css';

function SectionNavigationCards({
  pathname,
  currentSearch,
}: {
  pathname: string;
  currentSearch: string;
}) {
  const group = portalNavGroups.find((candidate) =>
    candidate.items.some((item) => isPortalRouteActive(pathname, item.href, currentSearch))
  );

  if (!group) return null;

  // A página /carreira já possui um fluxo próprio em cards com CV, vagas e entrevistas.
  // Nas demais ferramentas de mercado, mantemos o seletor para conectar todo o ecossistema.
  if (group.id === 'mercado' && pathname === '/carreira') return null;

  return (
    <section className="mb-7" aria-label={`Navegação de ${group.label}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-gray-text">
            {group.label}
          </p>
          <p className="text-sm text-black mt-0.5">Acesse os outros temas desta área</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {group.items.map((item) => {
          const Icon = item.icon;
          const active = isPortalRouteActive(pathname, item.href, currentSearch);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all',
                active
                  ? 'border-mint-deep bg-mint-light/55 shadow-sm'
                  : 'border-gray-faint bg-white hover:border-mint hover:bg-[#fbfcfd]',
              ].join(' ')}
            >
              <span
                className={[
                  'w-9 h-9 rounded-lg grid place-items-center shrink-0 transition-colors',
                  active
                    ? 'bg-mint-deep text-white'
                    : 'bg-[#eef2f6] text-black group-hover:bg-mint-light',
                ].join(' ')}
              >
                <Icon size={17} strokeWidth={1.7} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-black leading-tight">
                  {item.label}
                </span>
                <span className="block text-[11px] text-gray-text mt-1">
                  {active ? 'Você está aqui' : 'Abrir'}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile, isMobileOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const location = getPortalLocation(pathname, currentSearch);
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
  }, [pathname, currentSearch]);

  return (
    <div className={`${styles.shell} ${isCollapsed ? styles.shellCompact : ''}`}>
      <a href="#portal-content" className={styles.skipLink}>
        Pular para o conteúdo
      </a>

      <CollapsibleSidebar />

      <div className={styles.workspace} inert={isMobile && isMobileOpen ? true : undefined}>
        <header className={styles.topbar}>
          <button
            type="button"
            onClick={toggleSidebar}
            className={styles.mobileToggle}
            aria-label="Abrir menu"
            aria-expanded={isMobileOpen}
            aria-controls="soma-navigation"
          >
            <Menu size={22} />
          </button>

          <nav aria-label="Localização atual" className={styles.breadcrumb}>
            <Link href="/dashboard">SOMA</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span className={styles.breadcrumbGroup}>{location.group}</span>
            <ChevronRight className={styles.breadcrumbGroup} size={14} aria-hidden="true" />
            <span aria-current="page" className={styles.currentPage}>
              {location.label}
            </span>
          </nav>

          <span className={styles.portalCaption}>Seu espaço de desenvolvimento</span>
        </header>

        <main ref={main} id="portal-content" tabIndex={-1} className={styles.main}>
          <div className={styles.pageContent}>
            <SectionNavigationCards pathname={pathname} currentSearch={currentSearch} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <SidebarProvider>
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
          <AppShellContent>{children}</AppShellContent>
        </Suspense>
      </SidebarProvider>
    </UserProvider>
  );
}

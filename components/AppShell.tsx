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
import TrialBanner from '@/components/TrialBanner';
import { getProductSessionId, resolveProductFeature } from '@/lib/product-analytics';
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
  const lastActivityPing = useRef(0);

  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
  }, [pathname, currentSearch]);

  useEffect(() => {
    const INTERVALO_MINIMO_MS = 10 * 60 * 1000;

    async function registrarAtividade() {
      if (document.visibilityState !== 'visible') return;

      const agora = Date.now();
      if (agora - lastActivityPing.current < INTERVALO_MINIMO_MS) return;

      lastActivityPing.current = agora;

      try {
        const response = await fetch('/api/activity', {
          method: 'POST',
          cache: 'no-store',
          credentials: 'same-origin',
          keepalive: true,
        });

        if (!response.ok && response.status !== 401) {
          lastActivityPing.current = 0;
        }
      } catch {
        lastActivityPing.current = 0;
      }
    }

    void registrarAtividade();

    const interval = window.setInterval(() => {
      void registrarAtividade();
    }, INTERVALO_MINIMO_MS);

    const registrarSeVoltar = () => {
      if (document.visibilityState === 'visible') {
        void registrarAtividade();
      }
    };

    document.addEventListener('visibilitychange', registrarSeVoltar);
    window.addEventListener('focus', registrarSeVoltar);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', registrarSeVoltar);
      window.removeEventListener('focus', registrarSeVoltar);
    };
  }, [pathname]);

  useEffect(() => {
    const feature = resolveProductFeature(pathname, currentSearch);
    if (!feature || pathname.startsWith('/admin')) return;

    const sessionId = getProductSessionId();
    const dedupeKey = `feature_view:${feature.key}:${pathname}:${currentSearch}:${sessionId ?? 'session'}`;

    void fetch('/api/product-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      keepalive: true,
      body: JSON.stringify({
        eventName: 'feature_view',
        featureKey: feature.key,
        path: currentSearch ? `${pathname}?${currentSearch}` : pathname,
        sessionId,
        metadata: {
          feature_label: feature.label,
          feature_group: feature.group,
        },
        dedupeKey,
      }),
    }).catch(() => {
      // Analytics nunca deve bloquear a navegação.
    });
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
            {!pathname.startsWith('/admin') && <TrialBanner pathname={pathname} />}
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

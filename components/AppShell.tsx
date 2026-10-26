'use client';
import { SaasAccessContext, useSaasAccess } from '@/lib/contexts/SaasAccessContext';
import { saasCanVisit, type SaasAccess } from '@/lib/saas-access';

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
import InspecaoBanner from '@/components/InspecaoBanner';
import ConfirmacaoContatoModal from '@/components/ConfirmacaoContatoModal';
import EntrevistaInicialModal from '@/components/EntrevistaInicialModal';
import IrisCopiloto from '@/components/IrisCopiloto';
import NewsBell from '@/components/help/NewsBell';
import { getProductSessionId, resolveProductFeature } from '@/lib/product-analytics';
import styles from './PortalShell.module.css';
import { useLocale, translatedNav } from '@/components/LocaleProvider';
import type { Profile } from '@/lib/types';

function SectionNavigationCards({
  pathname,
  currentSearch,
}: {
  pathname: string;
  currentSearch: string;
}) {
  const access = useSaasAccess();
  const {locale} = useLocale();
  const group = portalNavGroups.find((candidate) =>
    candidate.items.some((item) => isPortalRouteActive(pathname, item.href, currentSearch))
  );

  if (!group || (pathname === '/plataforma' && !access?.mentorship)) return null;

  // A página /carreira já possui um fluxo próprio em cards com CV, vagas e entrevistas.
  // Nas demais ferramentas de mercado, mantemos o seletor para conectar todo o ecossistema.
  if (group.id === 'mercado' && pathname === '/carreira') return null;

  return (
    <nav className="mb-5 min-w-0" aria-label={translatedNav(group.label, locale)}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-text">
          {translatedNav(group.label, locale)}
        </span>
      </div>
      <div className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-gray-faint bg-white p-1.5" style={{ scrollbarWidth: 'thin' }}>
        {group.items.filter(item => !access || saasCanVisit(access, item.href.split('?')[0], item.href.split('?')[1])).map((item) => {
          const Icon = item.icon;
          const active = isPortalRouteActive(pathname, item.href, currentSearch);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-deep',
                active
                  ? 'bg-mint-light text-black shadow-sm'
                  : 'text-gray-text hover:bg-[#f2f7f5] hover:text-black',
              ].join(' ')}
            >
              <Icon size={16} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
              <span className="whitespace-nowrap">{translatedNav(item.label, locale)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AppShellContent({ children, initialProfile, copilotoLiberado }: { children: React.ReactNode; initialProfile: Profile | null; copilotoLiberado: boolean }) {
  const access = useSaasAccess();
  const {locale} = useLocale();

  const { isCollapsed, isMobile, isMobileOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const helpPage = pathname === '/ajuda' || pathname.startsWith('/ajuda/') || pathname === '/novidades';
  const saasOnly = (!!access?.saas || pathname === '/plataforma') && !access?.mentorship;
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
      {!helpPage && <ConfirmacaoContatoModal profile={initialProfile} />}
      {!helpPage && !saasOnly && <EntrevistaInicialModal profile={initialProfile} />}

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
            <span className={styles.breadcrumbGroup}>{translatedNav(location.group,locale)}</span>
            <ChevronRight className={styles.breadcrumbGroup} size={14} aria-hidden="true" />
            <span aria-current="page" className={styles.currentPage}>
              {translatedNav(location.label,locale)}
            </span>
          </nav>

          <div className="ml-auto flex items-center gap-3"><span className={styles.portalCaption}>Seu espaço de desenvolvimento</span>{initialProfile && <NewsBell />}</div>
        </header>

        <main ref={main} id="portal-content" tabIndex={-1} className={styles.main}>
          <div className={styles.pageContent}>
            <InspecaoBanner />
            {!saasOnly && !pathname.startsWith('/admin') && <TrialBanner pathname={pathname} />}
            <SectionNavigationCards pathname={pathname} currentSearch={currentSearch} />
            {children}
          </div>
        </main>
        {!pathname.startsWith('/admin') && copilotoLiberado && <IrisCopiloto />}
      </div>
    </div>
  );
}

export default function AppShell({
  children,
  initialProfile = null,
  copilotoLiberado = false,
  access = null,
}: {
  children: React.ReactNode;
  initialProfile?: Profile | null;
  copilotoLiberado?: boolean;
  access?: SaasAccess | null;
}) {
  return (
    <SaasAccessContext.Provider value={access}><UserProvider initialProfile={initialProfile}>
      <SidebarProvider>
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
          <AppShellContent initialProfile={initialProfile} copilotoLiberado={copilotoLiberado}>{children}</AppShellContent>
        </Suspense>
      </SidebarProvider>
    </UserProvider></SaasAccessContext.Provider>
  );
}

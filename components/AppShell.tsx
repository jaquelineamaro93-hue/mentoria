'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ChevronRight } from 'lucide-react';
import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';
import { UserProvider } from '@/lib/contexts/UserContext';
import { getPortalLocation } from '@/lib/config/portalNavigation';
import CollapsibleSidebar from '@/components/CollapsibleSidebar';
import { QuickTip } from '@/components/ui/QuickTip';
import styles from './PortalShell.module.css';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile, isMobileOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const location = getPortalLocation(pathname);
  const main = useRef<HTMLElement>(null);
  useEffect(() => { main.current?.scrollTo({ top: 0 }); }, [pathname]);

  return <div className={`${styles.shell} ${isCollapsed ? styles.shellCompact : ''}`}>
    <a href="#portal-content" className={styles.skipLink}>Pular para o conteúdo</a>
    <CollapsibleSidebar />
    <div className={styles.workspace} inert={isMobile && isMobileOpen ? true : undefined}>
      <header className={styles.topbar}>
        <button type="button" onClick={toggleSidebar} className={styles.mobileToggle} aria-label="Abrir menu" aria-expanded={isMobileOpen} aria-controls="soma-navigation"><Menu size={22} /></button>
        <nav aria-label="Localização atual" className={styles.breadcrumb}>
          <Link href="/dashboard">SOMA</Link><ChevronRight size={14} aria-hidden="true" />
          <span className={styles.breadcrumbGroup}>{location.group}</span><ChevronRight className={styles.breadcrumbGroup} size={14} aria-hidden="true" />
          <span aria-current="page" className={styles.currentPage}>{location.label}</span>
        </nav>
        <span className={styles.portalCaption}>Seu espaço de desenvolvimento</span>
      </header>
      <main ref={main} id="portal-content" tabIndex={-1} className={styles.main}>
        <div className={styles.pageContent}>
          <div className={styles.quickTip}><QuickTip /></div>
          {children}
        </div>
      </main>
    </div>
  </div>;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return <UserProvider><SidebarProvider><AppShellContent>{children}</AppShellContent></SidebarProvider></UserProvider>;
}

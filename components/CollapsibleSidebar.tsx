'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, UserRound, X } from 'lucide-react';
import { useSidebar } from '@/lib/contexts/SidebarContext';
import { useUser } from '@/lib/contexts/UserContext';
import { createClient } from '@/lib/supabase/client';
import { limparIdentidade } from '@/lib/posthog';
import { overviewItem, adminItem, portalNavGroups, supportItems, isPortalRouteActive, type PortalNavItem } from '@/lib/config/portalNavigation';
import styles from './PortalShell.module.css';

export default function CollapsibleSidebar() {
  const { isCollapsed, isMobile, isMobileOpen, toggleSidebar, closeMobileSidebar } = useSidebar();
  const { profile, initials, isLoading } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const router = useRouter();
  const compact = isCollapsed && !isMobile;
  const sidebar = useRef<HTMLElement>(null);
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('soma_navigation_groups') || '{}');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        setClosedGroups(Object.fromEntries(Object.entries(saved).filter(([key, value]) => portalNavGroups.some((group) => group.id === key) && typeof value === 'boolean')));
      }
    } catch { /* Ignore invalid preferences. */ }
  }, []);

  useEffect(() => { closeMobileSidebar(); }, [pathname, closeMobileSidebar]);

  useEffect(() => {
    if (!isMobileOpen || !isMobile) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = sidebar.current;
    panel?.querySelector<HTMLElement>('button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeMobileSidebar(); }
      if (event.key !== 'Tab' || !panel) return;
      const elements = Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter((element) => element.getClientRects().length > 0);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus(); };
  }, [isMobile, isMobileOpen, closeMobileSidebar]);

  function toggleGroup(id: string, currentlyOpen: boolean) {
    const next = { ...closedGroups, [id]: currentlyOpen };
    setClosedGroups(next);
    try { localStorage.setItem('soma_navigation_groups', JSON.stringify(next)); } catch { /* Optional device preference. */ }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError('');
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      limparIdentidade();
      router.replace('/login');
      router.refresh();
    } catch {
      setSignOutError('Não foi possível sair. Tente novamente.');
      setSigningOut(false);
    }
  }

  function navLink(item: PortalNavItem) {
    const active = isPortalRouteActive(pathname, item.href, currentSearch);
    const Icon = item.icon;
    return <Link key={item.href} href={item.href} prefetch={false} onClick={closeMobileSidebar}
      className={`${styles.navLink} ${active ? styles.active : ''}`}
      aria-current={active ? 'page' : undefined} aria-label={compact ? item.label : undefined}
      title={compact ? item.label : undefined}>
      <Icon size={20} strokeWidth={1.65} aria-hidden="true" />
      <span className={styles.linkLabel}>{item.label}</span>
    </Link>;
  }

  return <>
    {isMobile && isMobileOpen && <div className={styles.backdrop} onClick={closeMobileSidebar} aria-hidden="true" />}
    <aside ref={sidebar} id="soma-navigation" aria-label="Navegação da mentoria"
      role={isMobile && isMobileOpen ? 'dialog' : undefined} aria-modal={isMobile && isMobileOpen ? true : undefined}
      inert={isMobile && !isMobileOpen ? true : undefined}
      className={`${styles.sidebar} ${compact ? styles.compact : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>
      <div className={styles.brandRow}>
        <Link href="/dashboard" onClick={closeMobileSidebar} aria-label="SOMA — Visão geral" className={styles.brand}>
          <span className={styles.wordmark}>SOMA<span>.</span></span>
          <span className={styles.brandCaption}>MENTORIA & CARREIRA</span>
          <span className={styles.smallMark} aria-hidden="true">S<span>.</span></span>
        </Link>
        <button type="button" className={styles.iconButton} onClick={isMobile ? closeMobileSidebar : toggleSidebar}
          aria-label={isMobile ? 'Fechar menu' : compact ? 'Expandir menu' : 'Recolher menu'}
          title={isMobile ? 'Fechar menu' : 'Alternar menu (Ctrl ou ⌘ + B)'}
          aria-expanded={isMobile ? isMobileOpen : !isCollapsed} aria-controls="soma-menu-items">
          {isMobile ? <X size={20} /> : compact ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav id="soma-menu-items" className={styles.navigation} aria-label="Menu principal">
        <div className={styles.primaryLinks}>
          {navLink(overviewItem)}
          {profile?.is_admin === true && navLink(adminItem)}
        </div>
        {portalNavGroups.map((group) => {
          // A group containing the current page stays discoverable, even after a saved collapse.
          const containsActive = group.items.some((item) => isPortalRouteActive(pathname, item.href, currentSearch));
          const open = compact || containsActive || !closedGroups[group.id];
          return <section key={group.id} className={styles.navGroup} aria-label={group.label}>
            {!compact && <button type="button" className={styles.groupToggle}
              aria-expanded={open} aria-controls={`nav-group-${group.id}`}
              onClick={() => toggleGroup(group.id, open)} disabled={containsActive}>
              <ChevronDown size={14} className={!open ? styles.chevronClosed : ''} aria-hidden="true" />
              <span>{group.label}</span><span className={styles.groupRule} aria-hidden="true" />
            </button>}
            <div id={`nav-group-${group.id}`} hidden={!open} className={styles.groupLinks}>{group.items.map(navLink)}</div>
          </section>;
        })}
        <div className={styles.supportLinks}>{supportItems.map(navLink)}</div>
      </nav>

      <footer className={styles.sidebarFooter}>
        <Link href="/perfil" onClick={closeMobileSidebar} className={styles.profileLink} aria-label="Meu perfil" title={compact ? 'Meu perfil' : undefined}>
          {profile?.foto_url ? <img src={profile.foto_url} alt="" className={styles.avatar} /> : <span className={styles.avatar}>{initials || <UserRound size={18} />}</span>}
          <span className={styles.profileText}><strong>{isLoading ? 'Carregando perfil…' : profile?.nome || 'Meu perfil'}</strong><span>{profile?.is_admin ? 'Administração' : profile?.tipo_pacote === 'presencial' ? 'Mentoria presencial' : 'Mentoria online'}</span></span>
        </Link>
        <button type="button" className={styles.signOut} onClick={handleSignOut} disabled={signingOut} title="Sair da conta" aria-label={signingOut ? 'Saindo da conta' : 'Sair da conta'}><LogOut size={18} /></button>
        {signOutError && <p role="alert" className={styles.signOutError}>{signOutError}</p>}
      </footer>
    </aside>
  </>;
}

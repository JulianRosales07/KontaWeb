import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Home,
  Wallet,
  Users,
  Plus,
  Minus,
  User as UserIcon,
  LogOut,
  FileSpreadsheet,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  ShieldCheck,
  X,
  Trash2,
} from 'lucide-react';
import { KontaLogo } from './KontaLogo';
import type { AuthUser } from '../../../modules/auth/domain/models/AuthUser';

export type NavTab =
  | 'dashboard'
  | 'cartera'
  | 'contabilidad'
  | 'terceros'
  | 'reportes'
  | 'accesos'
  | 'perfil'
  // Rutas heredadas que siguen existiendo en el código
  | 'equivalente'
  | 'reportes-terceros'
  | 'compras'
  | 'nomina'
  | 'inventario';

interface NavLeaf {
  id: string;
  label: string;
  tab: NavTab;
  subtab?: string;
  /** El ítem se muestra si el usuario tiene al menos uno de estos permisos. */
  permissions: string[];
  badge?: string;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconClass: string;
  tab: NavTab;
  items: NavLeaf[];
}

/** Menú principal. Ocultar ítems es solo presentación: el backend valida cada permiso (403). */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'cartera',
    label: 'Recaudo y Cartera',
    icon: Wallet,
    iconClass: 'text-indigo-600',
    tab: 'cartera',
    items: [
      { id: 'cartera-recaudos', label: 'Recaudos y Abonos', tab: 'cartera', subtab: 'recaudo-asociados', permissions: ['COLLECTIONS_VIEW'] },
      { id: 'cartera-prestamos', label: 'Préstamos y Plan de Pagos', tab: 'cartera', subtab: 'prestamos-asociados', permissions: ['LOANS_VIEW'] },
      { id: 'cartera-cxc', label: 'Cuentas por Cobrar', tab: 'cartera', subtab: 'cuentas-por-cobrar', permissions: ['RECEIVABLES_VIEW'] },
      { id: 'cartera-cxp', label: 'Cuentas por Pagar', tab: 'cartera', subtab: 'cuentas-por-pagar', permissions: ['PAYABLES_VIEW'], badge: 'Aportes' },
      { id: 'cartera-multas', label: 'Multas', tab: 'cartera', subtab: 'multas', permissions: ['FINES_VIEW'] },
      { id: 'cartera-config', label: 'Configuración de Cuotas', tab: 'cartera', subtab: 'configuracion', permissions: ['SETTINGS_VIEW'] },
    ],
  },
  {
    id: 'contabilidad',
    label: 'Contabilidad y PUC',
    icon: FileSpreadsheet,
    iconClass: 'text-emerald-600',
    tab: 'contabilidad',
    items: [
      { id: 'contabilidad-base', label: 'Plan de Cuentas (PUC)', tab: 'contabilidad', subtab: 'base', permissions: ['PUC_VIEW'] },
      { id: 'contabilidad-ingresos', label: 'Ingresos por Cuenta PUC', tab: 'contabilidad', subtab: 'ingresos', permissions: ['ACCOUNTING_VIEW'] },
      { id: 'contabilidad-asientos', label: 'Asientos y Comprobantes', tab: 'contabilidad', subtab: 'asientos', permissions: ['ACCOUNTING_VIEW'] },
      { id: 'contabilidad-niif', label: 'Estados Financieros NIIF', tab: 'contabilidad', subtab: 'reportes', permissions: ['REPORTS_VIEW'] },
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes Financieros',
    icon: BarChart3,
    iconClass: 'text-sky-600',
    tab: 'reportes',
    items: [{ id: 'reportes-financieros', label: 'Reportes de caja, cartera y más', tab: 'reportes', permissions: ['REPORTS_VIEW'] }],
  },
  {
    id: 'terceros',
    label: 'Asociados',
    icon: Users,
    iconClass: 'text-purple-600',
    tab: 'terceros',
    items: [
      { id: 'terceros-listado', label: 'Listado de Asociados', tab: 'terceros', subtab: 'listado', permissions: ['ASSOCIATES_VIEW'] },
      { id: 'terceros-nuevo', label: 'Nuevo Asociado', tab: 'terceros', subtab: 'nuevo', permissions: ['ASSOCIATES_CREATE'], badge: 'Crear' },
    ],
  },
  {
    id: 'accesos',
    label: 'Gestión de Accesos',
    icon: ShieldCheck,
    iconClass: 'text-rose-600',
    tab: 'accesos',
    items: [
      { id: 'accesos-usuarios', label: 'Usuarios', tab: 'accesos', subtab: 'usuarios', permissions: ['USERS_VIEW'] },
      { id: 'accesos-roles', label: 'Roles', tab: 'accesos', subtab: 'roles', permissions: ['ROLES_VIEW'] },
      { id: 'accesos-permisos', label: 'Permisos', tab: 'accesos', subtab: 'permisos', permissions: ['PERMISSIONS_VIEW'] },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMINISTRADOR: 'Administrador',
};

export const roleLabel = (role?: string | null) => (role ? ROLE_LABELS[role] ?? role : 'Pendiente de aprobación');

interface SidebarProps {
  currentTab: NavTab;
  activeSubtab?: string;
  onNavigate: (tab: NavTab, subtab?: string) => void;
  onBackToLanding: () => void;
  backendOnline: boolean;
  currentUser: AuthUser | null;
  onLogout?: () => void;
  hasAnyPermission: (...permissions: string[]) => boolean;
  /** Estado del cajón en pantallas < 1024px. */
  mobileOpen: boolean;
  onMobileClose: () => void;
  onOpenCleanup?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeSubtab,
  onNavigate,
  onBackToLanding,
  backendOnline,
  currentUser,
  onLogout,
  hasAnyPermission,
  mobileOpen,
  onMobileClose,
  onOpenCleanup,
}) => {
  const [isSubpanelOpen, setIsSubpanelOpen] = useState<boolean>(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ cartera: true });
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

  const sections = useMemo(
    () =>
      NAV_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => hasAnyPermission(...i.permissions)) })).filter(
        (s) => s.items.length > 0
      ),
    [hasAnyPermission]
  );
  const canSeeDashboard = hasAnyPermission('DASHBOARD_VIEW');

  // Expande la sección del módulo activo
  useEffect(() => {
    const active = NAV_SECTIONS.find((s) => s.tab === currentTab);
    if (active) setExpanded((prev) => ({ ...prev, [active.id]: true }));
  }, [currentTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        avatarButtonRef.current &&
        !avatarButtonRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
        onMobileClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onMobileClose]);

  const isLeafActive = (leaf: NavLeaf) =>
    leaf.tab === currentTab && (leaf.subtab === undefined || leaf.subtab === activeSubtab);

  const go = (tab: NavTab, subtab?: string) => {
    onNavigate(tab, subtab);
    onMobileClose();
  };

  const goSection = (s: (typeof sections)[number]) => {
    setExpanded((prev) => ({ ...prev, [s.id]: true }));
    setIsSubpanelOpen(true);
    go(s.items[0].tab, s.items[0].subtab);
  };

  const userName = currentUser?.fullName || currentUser?.username || 'Usuario';
  const userEmail = currentUser?.email || '';
  const userInitials = (currentUser?.fullName || currentUser?.username || 'US').substring(0, 2).toUpperCase();
  const userAvatar = currentUser?.picture || currentUser?.avatarUrl;

  const handleLogoClick = () => {
    if (currentUser && canSeeDashboard) go('dashboard');
    else if (!currentUser) onBackToLanding();
  };

  const subpanel = (inDrawer: boolean) => (
    <div className={`flex h-full flex-col justify-between overflow-y-auto bg-white px-3.5 py-5 ${inDrawer ? 'w-full' : 'w-[254px] shrink-0'}`}>
      <div>
        <div className="mb-4 flex items-center justify-between px-1">
          <button type="button" className="flex items-center cursor-pointer" onClick={handleLogoClick} title="Ir al inicio">
            <KontaLogo size={24} showText={true} textColor="#0f172a" subtext="ERP Asociaciones" />
          </button>
          {inDrawer ? (
            <button
              type="button"
              onClick={onMobileClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSubpanelOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
              title="Contraer barra lateral"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>

        <nav className="flex flex-col space-y-1" aria-label="Menú principal">
          {canSeeDashboard && (
            <button
              type="button"
              onClick={() => go('dashboard')}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors cursor-pointer ${
                currentTab === 'dashboard' ? 'bg-slate-100 font-semibold text-slate-900' : 'font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Home size={16} className="text-slate-500" />
              <span>Dashboard</span>
            </button>
          )}

          {sections.map((s) => {
            const Icon = s.icon;
            const open = !!expanded[s.id];
            const isActive = currentTab === s.tab;
            if (s.items.length === 1 && s.items[0].subtab === undefined) {
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(s.items[0].tab, s.items[0].subtab)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors cursor-pointer ${
                    isActive ? 'bg-slate-100 font-bold text-slate-900' : 'font-semibold text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} className={s.iconClass} />
                  <span>{s.label}</span>
                </button>
              );
            }
            return (
              <div key={s.id}>
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                  aria-expanded={open}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors cursor-pointer ${
                    isActive ? 'bg-slate-50 font-bold text-slate-900' : 'font-semibold text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={16} className={s.iconClass} />
                    <span>{s.label}</span>
                  </span>
                  {open ? <Minus size={14} className="text-slate-600" /> : <Plus size={14} className="text-slate-400" />}
                </button>
                {open && (
                  <div className="relative my-1 ml-4.5 flex flex-col gap-0.5 border-l border-slate-200 pl-6">
                    {s.items.map((leaf) => (
                      <button
                        key={leaf.id}
                        type="button"
                        onClick={() => go(leaf.tab, leaf.subtab)}
                        className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors cursor-pointer lg:py-1.5 lg:text-xs ${
                          isLeafActive(leaf) ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span>{leaf.label}</span>
                        {leaf.badge && (
                          <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                            {leaf.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {inDrawer && currentUser && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#5850ec] text-xs font-bold text-white">
              {userAvatar ? <img src={userAvatar} alt="" className="h-full w-full object-cover" /> : userInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
              <p className="truncate text-xs text-slate-500">{roleLabel(currentUser.role)}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => go('perfil')} className="h-10 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
              Mi perfil
            </button>
            <button type="button" onClick={onLogout} className="h-10 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer">
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ===== Escritorio (≥1024px): riel de iconos + panel ===== */}
      <aside
        className={`sidebar print:hidden z-40 hidden h-[100dvh] max-h-[100dvh] shrink-0 select-none border-r border-[#eaecf0] bg-white transition-all duration-300 ease-in-out lg:flex ${
          isSubpanelOpen ? 'w-[326px]' : 'w-[72px]'
        }`}
      >
        <div className="z-20 flex h-full w-[72px] shrink-0 flex-col items-center justify-between border-r border-[#f1f3f5] bg-white py-5">
          <div className="flex flex-col items-center gap-5">
            <button
              type="button"
              onClick={handleLogoClick}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 shadow-xs transition-transform hover:scale-105 hover:bg-slate-50 cursor-pointer"
              title="Inicio"
            >
              <KontaLogo size={28} showText={false} />
            </button>
            <nav className="flex flex-col items-center gap-2" aria-label="Módulos">
              {canSeeDashboard && (
                <button
                  type="button"
                  onClick={() => go('dashboard')}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer ${
                    currentTab === 'dashboard' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Dashboard"
                >
                  <Home size={19} />
                </button>
              )}
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goSection(s)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer ${
                      currentTab === s.tab ? 'bg-[#0f172a] text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title={s.label}
                  >
                    <Icon size={19} />
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col items-center gap-2 pb-2">
            {!isSubpanelOpen && (
              <button
                type="button"
                onClick={() => setIsSubpanelOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                title="Expandir barra lateral"
              >
                <PanelLeftOpen size={19} />
              </button>
            )}
            <div className="relative">
              <button
                ref={avatarButtonRef}
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#5850ec] text-xs font-bold text-white shadow-xs ring-1 ring-slate-200 transition-transform hover:scale-105 focus:outline-none cursor-pointer"
                title={`${userName} (${roleLabel(currentUser?.role)})`}
              >
                {userAvatar ? <img src={userAvatar} alt={userName} className="h-full w-full rounded-full object-cover" /> : <span>{userInitials}</span>}
              </button>
              <span
                className={`pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                  backendOnline ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
            </div>
          </div>
        </div>
        {isSubpanelOpen && subpanel(false)}
      </aside>

      {/* ===== Tablet / celular (<1024px): cajón superpuesto ===== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="absolute inset-0 bg-slate-900/40" onClick={onMobileClose} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex h-[100dvh] w-[min(300px,86vw)] flex-col bg-white shadow-2xl">
            {subpanel(true)}
          </aside>
        </div>
      )}

      {/* ===== Menú flotante de perfil (escritorio) ===== */}
      {isProfileMenuOpen && (
        <div
          ref={profileMenuRef}
          className="fixed bottom-6 left-20 z-50 w-64 rounded-2xl border border-slate-200/90 bg-white p-2 text-slate-700 shadow-2xl"
        >
          <div className="flex items-center gap-3 p-2">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#5850ec] text-xs font-bold text-white ring-1 ring-slate-200">
              {userAvatar ? <img src={userAvatar} alt={userName} className="h-full w-full rounded-full object-cover" /> : <span>{userInitials}</span>}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-slate-900">{userName}</span>
              <span className="truncate text-xs text-slate-400">{userEmail}</span>
              <span className="truncate text-[11px] font-semibold text-indigo-600">{roleLabel(currentUser?.role)}</span>
            </div>
          </div>
          <div className="my-1.5 h-px bg-slate-100" />
          <button
            type="button"
            onClick={() => {
              setIsProfileMenuOpen(false);
              go('perfil');
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            <UserIcon size={15} className="text-slate-500" />
            <span>Ver perfil</span>
          </button>
          {hasAnyPermission('SETTINGS_MANAGE') && onOpenCleanup && (
            <>
              <div className="my-1.5 h-px bg-slate-100" />
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onOpenCleanup();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 size={15} className="text-rose-500" />
                <span>Limpiar base de datos</span>
              </button>
            </>
          )}
          <div className="my-1.5 h-px bg-slate-100" />
          <button
            type="button"
            onClick={() => {
              setIsProfileMenuOpen(false);
              if (onLogout) onLogout();
              else onBackToLanding();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
          >
            <LogOut size={15} className="text-slate-400" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { Sidebar, NAV_SECTIONS, roleLabel } from './shared/ui/components/Sidebar';
import type { NavTab } from './shared/ui/components/Sidebar';
import { DashboardPage } from './modules/dashboard/ui/pages/DashboardPage';

import { ComprasPage, type ComprasTab } from './modules/compras/ui/pages/ComprasPage';
import { CarteraModulePage, type CarteraTab } from './modules/cartera/ui/pages/CarteraModulePage';
import { ContabilidadPage, type ContabilidadTab } from './modules/contabilidad/ui/pages/ContabilidadPage';
import { NominaPage, type NominaTab } from './modules/nomina/ui/pages/NominaPage';
import { TercerosPage } from './modules/terceros/ui/pages/TercerosPage';
import { LandingPage } from './modules/landing/ui/pages/LandingPage';
import { LoginModal } from './modules/auth/ui/components/LoginModal';
import { httpClient, getBaseUrl } from './shared/infrastructure/http/httpClient';
import { securePayloadService } from './shared/infrastructure/security/securePayloadService';
import { useAuth } from './modules/auth/application/hooks/useAuth';
import { CustomCursor } from './shared/ui/components/ui/custom-cursor';
import { ProfilePage } from './modules/profile/ui/pages/ProfilePage';
import { InitialPucSetupWizard, ONBOARDING_KEY } from './modules/associates/ui/components/InitialPucSetupWizard';
import { FinancialReportsCenterPage } from './modules/reports/ui/pages/FinancialReportsCenterPage';
import { AccessManagementPage, type AccessTab } from './modules/access/ui/pages/AccessManagementPage';
import { LogOut, Menu, ArrowRight, ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';
import { DatabaseCleanupModal } from './shared/ui/components/DatabaseCleanupModal';
import {
  SessionTransitionOverlay,
  SESSION_TRANSITION_MS,
  type SessionTransition,
} from './shared/ui/components/SessionTransitionOverlay';

const TAB_TITLES: Record<NavTab, string> = {
  dashboard: 'Dashboard',
  cartera: 'Recaudo y Cartera',
  contabilidad: 'Contabilidad y PUC',
  terceros: 'Asociados',
  reportes: 'Reportes Financieros',
  accesos: 'Gestión de Accesos',
  perfil: 'Mi Perfil',
  equivalente: 'Documento Soporte',
  'reportes-terceros': 'Estados Financieros NIIF',
  compras: 'Compras y Gastos',
  nomina: 'Nómina Electrónica',
  inventario: 'Productos e Inventario',
};

const DEFAULT_SUBTABS: Partial<Record<NavTab, string>> = {
  cartera: 'recaudo-asociados',
  contabilidad: 'base',
  terceros: 'listado',
  accesos: 'usuarios',
  compras: 'base',
  nomina: 'base',
};

export function App() {
  const { currentUser, logout, hasAnyPermission, refreshProfile } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'app'>(() => {
    return localStorage.getItem('accounting_jwt_token') ? 'app' : 'landing';
  });
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [subtabs, setSubtabs] = useState<Partial<Record<NavTab, string>>>(DEFAULT_SUBTABS);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isSetupDone, setIsSetupDone] = useState<boolean>(() => localStorage.getItem(ONBOARDING_KEY) === 'true');
  const [isInitialWizardOpen, setIsInitialWizardOpen] = useState<boolean>(() => localStorage.getItem(ONBOARDING_KEY) !== 'true');
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState<boolean>(false);
  const [sessionTransition, setSessionTransition] = useState<SessionTransition>(null);

  /** Muestra la animación de sesión y ejecuta `after` (si se indica) cuando termina. */
  const playSessionTransition = useCallback((kind: Exclude<SessionTransition, null>, after?: () => void) => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setSessionTransition(kind);
    window.setTimeout(() => {
      after?.();
      setSessionTransition(null);
    }, reduceMotion ? 600 : SESSION_TRANSITION_MS);
  }, []);

  const hasAnyAccess = (currentUser?.permissions?.length ?? 0) > 0;

  useEffect(() => {
    // Inicializar cifrado en memoria y despertar servidor en la nube preventivamente
    securePayloadService.warmUp(getBaseUrl());

    const pingServer = () => {
      httpClient
        .get('/organization', { timeout: 45000 })
        .then(() => setBackendOnline(true))
        .catch((err) => setBackendOnline(!!err?.response));
    };

    pingServer();
    // Mantiene despierto el backend en Render evitando la suspensión de 15 minutos
    const keepAliveTimer = setInterval(pingServer, 8 * 60 * 1000);
    return () => clearInterval(keepAliveTimer);
  }, []);

  /** Primer módulo al que el usuario tiene acceso. */
  const firstAllowed = useCallback((): { tab: NavTab; subtab?: string } => {
    if (hasAnyPermission('DASHBOARD_VIEW')) return { tab: 'dashboard' };
    for (const s of NAV_SECTIONS) {
      const leaf = s.items.find((i) => hasAnyPermission(...i.permissions));
      if (leaf) return { tab: leaf.tab, subtab: leaf.subtab };
    }
    return { tab: 'perfil' };
  }, [hasAnyPermission]);

  const navigate = useCallback((tab: NavTab, subtab?: string) => {
    setCurrentTab(tab);
    if (subtab) setSubtabs((prev) => ({ ...prev, [tab]: subtab }));
    document.querySelector('.main-content')?.scrollTo({ top: 0 });
  }, []);

  // Si el módulo actual deja de estar permitido (cambio de rol), redirige al primero permitido
  useEffect(() => {
    if (currentView !== 'app' || !currentUser) return;
    const section = NAV_SECTIONS.find((s) => s.tab === currentTab);
    if (!section) {
      if (currentTab === 'dashboard' && !hasAnyPermission('DASHBOARD_VIEW')) {
        const f = firstAllowed();
        navigate(f.tab, f.subtab);
      }
      return;
    }
    const sub = subtabs[currentTab];
    const leaf = section.items.find((i) => i.subtab === sub) ?? section.items[0];
    if (!hasAnyPermission(...leaf.permissions)) {
      const f = firstAllowed();
      navigate(f.tab, f.subtab);
    }
  }, [currentView, currentUser, currentTab, subtabs, hasAnyPermission, firstAllowed, navigate]);

  const handleEnterApp = (targetTab: NavTab = 'dashboard') => {
    setCurrentTab(targetTab);
    setSubtabs(DEFAULT_SUBTABS);
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }
    setCurrentView('app');
    if (localStorage.getItem(ONBOARDING_KEY) !== 'true') {
      setIsInitialWizardOpen(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    if (sessionTransition) return;
    setMobileNavOpen(false);
    // La animación se muestra sobre la aplicación y, al terminar, se cierra la sesión y se vuelve al portal
    playSessionTransition('logout', () => {
      logout();
      setCurrentTab('dashboard');
      setSubtabs(DEFAULT_SUBTABS);
      setCurrentView('landing');
    });
  };

  // Sesión cerrada por logout o expiración de token: vuelve al portal
  useEffect(() => {
    const token = localStorage.getItem('accounting_jwt_token');
    if (!token && currentView === 'app') {
      setCurrentTab('dashboard');
      setSubtabs(DEFAULT_SUBTABS);
      setCurrentView('landing');
    }
  }, [currentUser, currentView]);

  const carteraSubtab = (subtabs.cartera ?? 'recaudo-asociados') as CarteraTab;
  const contabilidadSubtab = (subtabs.contabilidad ?? 'base') as ContabilidadTab;

  return (
    <>
      <SessionTransitionOverlay transition={sessionTransition} />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          // La aplicación se prepara detrás de la animación de inicio de sesión
          playSessionTransition('login');
          setCurrentTab('dashboard');
          setSubtabs(DEFAULT_SUBTABS);
          setCurrentView('app');
          if (localStorage.getItem(ONBOARDING_KEY) !== 'true') {
            setIsInitialWizardOpen(true);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {currentView === 'app' && hasAnyAccess && isInitialWizardOpen && hasAnyPermission('SETTINGS_MANAGE') && (
        <InitialPucSetupWizard
          isOpen={isInitialWizardOpen}
          onClose={() => setIsInitialWizardOpen(false)}
          onComplete={() => {
            setIsSetupDone(true);
            setIsInitialWizardOpen(false);
            navigate('cartera', 'recaudo-asociados');
          }}
        />
      )}

      {isCleanupModalOpen && (
        <DatabaseCleanupModal
          isOpen={isCleanupModalOpen}
          onClose={() => setIsCleanupModalOpen(false)}
        />
      )}

      {currentView === 'landing' ? (
        <LandingPage
          onEnterApp={handleEnterApp}
          onOpenLogin={() => {
            setCurrentTab('dashboard');
            setSubtabs(DEFAULT_SUBTABS);
            setIsLoginModalOpen(true);
          }}
          isLoginModalOpen={isLoginModalOpen}
        />
      ) : !hasAnyAccess ? (
        <PendingApprovalScreen
          outdatedServer={!!currentUser?.outdatedServer}
          name={currentUser?.fullName || currentUser?.username || ''}
          email={currentUser?.email || ''}
          onRetry={() => void refreshProfile()}
          onLogout={handleLogout}
        />
      ) : (
        <CustomCursor color="#5850ec" layout="default" enabled={!isLoginModalOpen} className="h-[100dvh] w-full overflow-hidden">
          <div className="app-layout">
            <Sidebar
              currentTab={currentTab}
              activeSubtab={subtabs[currentTab]}
              onNavigate={navigate}
              onBackToLanding={() => {
                setCurrentTab('dashboard');
                setSubtabs(DEFAULT_SUBTABS);
                setCurrentView('landing');
              }}
              backendOnline={backendOnline}
              currentUser={currentUser}
              onLogout={handleLogout}
              hasAnyPermission={hasAnyPermission}
              mobileOpen={mobileNavOpen}
              onMobileClose={() => setMobileNavOpen(false)}
              onOpenCleanup={() => setIsCleanupModalOpen(true)}
            />

            <main className="main-content">
              <header className="topbar print:hidden">
                <div className="topbar-left min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
                    aria-label="Abrir menú"
                  >
                    <Menu size={20} />
                  </button>
                  <h1 className="truncate text-sm font-bold tracking-tight text-slate-800">{TAB_TITLES[currentTab] || 'Módulo'}</h1>
                </div>

                <div className="topbar-right">
                  {hasAnyPermission('SETTINGS_MANAGE') && (
                    <button
                      type="button"
                      onClick={() => setIsCleanupModalOpen(true)}
                      className="hidden items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 sm:inline-flex cursor-pointer transition-colors"
                      title="Depurar / Limpiar base de datos"
                    >
                      <Trash2 size={13} className="text-rose-600" />
                      <span>Limpiar BD</span>
                    </button>
                  )}

                  {!isSetupDone && hasAnyPermission('SETTINGS_MANAGE') && (
                    <button
                      type="button"
                      onClick={() => setIsInitialWizardOpen(true)}
                      className="hidden items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 sm:inline-flex cursor-pointer"
                      title="Configuración P.U.C. pendiente"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span>Configurar P.U.C.</span>
                    </button>
                  )}

                  {currentUser && (
                    <div className="flex items-center gap-2.5">
                      <span className="hidden text-xs font-medium text-slate-500 md:inline">
                        {currentUser.fullName || currentUser.username}
                        <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {roleLabel(currentUser.role)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('perfil')}
                        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-xs font-bold tracking-tight text-white ring-1 ring-slate-200 transition-all hover:ring-2 hover:ring-indigo-500 cursor-pointer"
                        title="Ver mi perfil"
                      >
                        {currentUser.picture || currentUser.avatarUrl ? (
                          <img
                            src={currentUser.picture || currentUser.avatarUrl}
                            alt={currentUser.fullName || currentUser.username}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          currentUser.username.substring(0, 2).toUpperCase()
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                        title="Cerrar sesión"
                      >
                        <LogOut size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </header>

              {!isSetupDone && hasAnyPermission('SETTINGS_MANAGE') && (
                <div className="sticky top-12 z-20 flex flex-col justify-between gap-3 border-b border-amber-200 bg-amber-50/95 px-4 py-2.5 text-xs text-amber-900 sm:flex-row sm:items-center sm:px-6 print:hidden">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    <span>
                      <strong className="font-extrabold text-amber-950">Configuración P.U.C. pendiente: </strong>
                      aún no se han configurado las cuentas del P.U.C. ni los valores de la cuota de asociados.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInitialWizardOpen(true)}
                    className="flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 sm:self-auto cursor-pointer"
                  >
                    <span>Configurar ahora</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}

              <div className="view-content">
                {currentTab === 'dashboard' && (
                  <DashboardPage onNavigate={(tab, subtab) => navigate(tab as NavTab, subtab)} />
                )}
                {currentTab === 'cartera' && (
                  <CarteraModulePage initialTab={carteraSubtab} onTabChange={(tab) => navigate('cartera', tab)} />
                )}
                {currentTab === 'contabilidad' && (
                  <ContabilidadPage initialTab={contabilidadSubtab} onTabChange={(tab) => navigate('contabilidad', tab)} />
                )}
                {currentTab === 'terceros' && (
                  <TercerosPage initialTab={subtabs.terceros ?? 'listado'} onTabChange={(tab) => navigate('terceros', tab)} />
                )}
                {currentTab === 'reportes' && <FinancialReportsCenterPage />}
                {currentTab === 'accesos' && <AccessManagementPage tab={(subtabs.accesos ?? 'usuarios') as AccessTab} onTabChange={(t) => navigate('accesos', t)} />}
                {currentTab === 'compras' && (
                  <ComprasPage initialTab={(subtabs.compras ?? 'base') as ComprasTab} onTabChange={(tab) => navigate('compras', tab)} />
                )}
                {currentTab === 'nomina' && (
                  <NominaPage initialTab={(subtabs.nomina ?? 'base') as NominaTab} onTabChange={(tab) => navigate('nomina', tab)} />
                )}
                {currentTab === 'equivalente' && (
                  <ComprasPage initialTab="documentos-soporte" onTabChange={(tab) => navigate('compras', tab)} />
                )}
                {currentTab === 'reportes-terceros' && (
                  <ContabilidadPage initialTab="reportes" onTabChange={(tab) => navigate('contabilidad', tab)} />
                )}
                {currentTab === 'perfil' && (
                  <ProfilePage
                    currentUser={currentUser}
                    onBackToDashboard={() => {
                      const f = firstAllowed();
                      navigate(f.tab, f.subtab);
                    }}
                    onLogout={handleLogout}
                  />
                )}
              </div>
            </main>
          </div>
        </CustomCursor>
      )}
    </>
  );
}

/** Cuenta creada (Google / registro) que aún no tiene rol asignado por un SUPER_ADMIN. */
function PendingApprovalScreen({
  outdatedServer,
  name,
  email,
  onRetry,
  onLogout,
}: {
  outdatedServer: boolean;
  name: string;
  email: string;
  onRetry: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <ShieldAlert size={24} />
        </div>
        {outdatedServer ? (
          <>
            <h1 className="mt-4 text-lg font-bold text-slate-900">Servidor desactualizado</h1>
            <p className="mt-2 text-sm text-slate-600">
              Iniciaste sesión como <strong className="break-all">{email}</strong>, pero el servidor al que está conectada esta aplicación
              no envía roles ni permisos (corre una versión anterior). Despliega la versión actual del backend o conecta la
              aplicación a un backend actualizado.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-lg font-bold text-slate-900">Cuenta pendiente de aprobación</h1>
            <p className="mt-2 text-sm text-slate-600">
              Hola{name ? `, ${name}` : ''}. Tu cuenta <strong className="break-all">{email}</strong> fue creada, pero todavía no tiene un rol asignado.
              Un super administrador debe asignarte acceso antes de que puedas usar el sistema.
            </p>
          </>
        )}
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw size={15} /> Verificar de nuevo
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 cursor-pointer"
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

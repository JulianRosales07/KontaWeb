import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Encabezado de página: título + acciones que bajan a una segunda fila en pantallas angostas. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, actions }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 items-start gap-3">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
  </div>
);

/** Contenedor estándar de página con márgenes responsivos y sin desbordes horizontales. */
export const PageContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-4 sm:gap-5 ${className}`}>
    {children}
  </div>
);

/** Tarjeta indicador (KPI). */
export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: 'neutral' | 'positive' | 'negative' | 'primary' | 'warning';
  icon?: React.ReactNode;
}> = ({ label, value, hint, tone = 'neutral', icon }) => {
  const tones: Record<string, string> = {
    neutral: 'text-slate-900',
    positive: 'text-emerald-700',
    negative: 'text-red-700',
    primary: 'text-indigo-700',
    warning: 'text-amber-700',
  };
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-xs sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-slate-500 sm:truncate sm:text-xs">{label}</p>
        {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
      </div>
      <p className={`mt-1 break-words text-base font-bold tabular-nums sm:mt-1.5 sm:text-xl ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
};

/** Botones estándar. */
export const buttonClass = {
  primary:
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap',
  secondary:
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap',
  accent:
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap',
  danger:
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap',
  ghost:
    'inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap',
};

/** Mensaje de error/aviso en línea. */
export const Alert: React.FC<{ tone?: 'error' | 'success' | 'info' | 'warning'; children: React.ReactNode; onClose?: () => void }> = ({
  tone = 'info',
  children,
  onClose,
}) => {
  const tones: Record<string, string> = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm ${tones[tone]}`}>
      <div className="min-w-0 break-words">{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} className="shrink-0 text-xs font-semibold opacity-70 hover:opacity-100 cursor-pointer" aria-label="Cerrar">
          ✕
        </button>
      )}
    </div>
  );
};

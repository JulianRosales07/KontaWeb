import React from 'react';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

const TONES: Record<Tone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  primary: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
};

/** Estados conocidos del sistema → etiqueta y color. */
const KNOWN: Record<string, { label: string; tone: Tone }> = {
  PAID: { label: 'Pagada', tone: 'success' },
  PAGADO: { label: 'Pagado', tone: 'success' },
  PARTIAL: { label: 'Parcial', tone: 'warning' },
  PENDING: { label: 'Pendiente', tone: 'neutral' },
  OVERDUE: { label: 'Vencida', tone: 'danger' },
  ACTIVE: { label: 'Activo', tone: 'success' },
  INACTIVE: { label: 'Inactivo', tone: 'neutral' },
  CANCELLED: { label: 'Anulado', tone: 'neutral' },
  ANULADO: { label: 'Anulado', tone: 'neutral' },
  AL_DIA: { label: 'Al día', tone: 'success' },
  EN_MORA: { label: 'En mora', tone: 'danger' },
  POSTED: { label: 'Contabilizado', tone: 'success' },
  DRAFT: { label: 'Borrador', tone: 'warning' },
  VOIDED: { label: 'Anulado', tone: 'danger' },
  BALANCED: { label: 'Cuadrado', tone: 'success' },
  UNBALANCED: { label: 'Descuadrado', tone: 'danger' },
};

export interface StatusBadgeProps {
  status?: string | null;
  label?: string;
  tone?: Tone;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, tone, className = '' }) => {
  const known = status ? KNOWN[status.toUpperCase()] : undefined;
  const finalTone = tone ?? known?.tone ?? 'neutral';
  const text = label ?? known?.label ?? status ?? '';
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${TONES[finalTone]} ${className}`}
    >
      {text}
    </span>
  );
};

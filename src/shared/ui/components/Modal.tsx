import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { buttonClass } from './PageHeader';

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl sm:min-h-[380px]',
  lg: 'sm:max-w-3xl sm:min-h-[480px]',
  xl: 'sm:max-w-5xl sm:min-h-[580px]',
  full: 'sm:max-w-[min(1200px,calc(100vw-2rem))] sm:min-h-[620px]',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: keyof typeof SIZES;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Evita cerrar con clic fuera/Escape (p. ej. mientras se guarda). */
  locked?: boolean;
  className?: string;
  zIndexClass?: string;
}

/**
 * Modal responsivo: en celular ocupa toda la pantalla, en escritorio se centra con ancho máximo.
 * El cuerpo hace scroll interno; el encabezado y el pie siempre quedan visibles.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  footer,
  children,
  locked,
  className = '',
  zIndexClass,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !locked) onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, locked]);

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClass || 'z-[60]'} flex items-end justify-center bg-slate-900/50 backdrop-blur-[2px] sm:items-center sm:p-4`}
      data-print-hide="true"
    >
      <div className="absolute inset-0" onClick={locked ? undefined : onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex h-[100dvh] w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[min(92dvh,900px)] sm:rounded-2xl ${SIZES[size]} ${className}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 pb-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] sm:px-6 sm:pt-3.5">
          <div className="min-w-0">
            <h3 className="break-words text-base font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={locked}
            className="-m-1 shrink-0 rounded-lg p-2.5 text-slate-400 sm:m-0 sm:p-1.5 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 cursor-pointer"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-4 sm:px-6 sm:pb-4 ${
            footer ? 'pb-4' : 'pb-[max(1rem,env(safe-area-inset-bottom))]'
          }`}
        >
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6 sm:pb-3 [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export interface ConfirmationModalProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  loading,
  onConfirm,
  onCancel,
}) => (
  <Modal
    open={open}
    onClose={onCancel}
    title={title}
    size="sm"
    locked={loading}
    footer={
      <>
        <button type="button" className={buttonClass.secondary} onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </button>
        <button type="button" className={tone === 'danger' ? buttonClass.danger : buttonClass.primary} onClick={onConfirm} disabled={loading}>
          {loading ? 'Procesando…' : confirmLabel}
        </button>
      </>
    }
  >
    <div className="text-sm text-slate-700">{message}</div>
  </Modal>
);

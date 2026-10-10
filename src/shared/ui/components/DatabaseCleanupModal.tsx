import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Receipt,
  HandCoins,
  FileSpreadsheet,
  Wallet,
  Users,
  Settings2,
} from 'lucide-react';
import { Modal } from './Modal';
import { Alert, buttonClass } from './PageHeader';
import {
  systemMaintenanceApi,
  type DatabaseCleanupOptions,
  type DatabaseCleanupResult,
} from '../../infrastructure/api/systemMaintenanceApi';
import { apiErrorMessage } from '../../infrastructure/http/apiError';

interface DatabaseCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DatabaseCleanupModal: React.FC<DatabaseCleanupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [options, setOptions] = useState<DatabaseCleanupOptions>({
    cleanAssociateReceipts: true,
    cleanLoans: true,
    cleanJournalVouchers: true,
    cleanDebtAndTreasury: true,
    cleanThirdParties: false,
    cleanQuotaTemplates: false,
  });

  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DatabaseCleanupResult | null>(null);

  const toggleOption = (key: keyof DatabaseCleanupOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedCount = Object.values(options).filter(Boolean).length;
  const isConfirmed = confirmText.trim().toUpperCase() === 'LIMPIAR';

  const handleExecuteCleanup = async () => {
    if (!isConfirmed) return;
    setError(null);
    setLoading(true);
    try {
      const res = await systemMaintenanceApi.cleanupDatabase(options);
      setResult(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo realizar la limpieza de la base de datos.'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setConfirmText('');
    setError(null);
    setResult(null);
    onClose();
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (result) {
    return (
      <Modal
        open={isOpen}
        onClose={handleClose}
        size="md"
        title="Limpieza completada"
        subtitle="Los registros seleccionados han sido depurados exitosamente."
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <button type="button" className={buttonClass.secondary} onClick={handleClose}>
              Cerrar
            </button>
            <button type="button" className={buttonClass.primary} onClick={handleReload}>
              <RefreshCw size={14} /> Recargar aplicación
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <Alert tone="success">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} /> Base de datos depurada correctamente.
            </span>
          </Alert>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Resumen de registros eliminados:
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-600">
              {Object.entries(result.deletedCounts).map(([label, count]) => (
                <li key={label} className="flex items-center justify-between border-b border-slate-200/60 pb-1">
                  <span>{label}</span>
                  <strong className="font-mono text-slate-900">{count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      locked={loading}
      size="lg"
      title={
        <span className="flex items-center gap-2 text-rose-700">
          <Trash2 size={20} /> Depurar Base de Datos
        </span>
      }
      subtitle="Selecciona qué información deseas borrar. Las cuentas PUC y los usuarios están protegidos."
      footer={
        <>
          <button type="button" className={buttonClass.secondary} onClick={handleClose} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExecuteCleanup}
            disabled={loading || selectedCount === 0 || !isConfirmed}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-rose-700 disabled:opacity-40 cursor-pointer"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span>{loading ? 'Depurando datos…' : 'Ejecutar limpieza'}</span>
          </button>
        </>
      }
    >
      <div className="flex min-w-0 flex-col gap-4">
        {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

        {/* 1. Protección del PUC explícita */}
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="font-bold">Plan Único de Cuentas (P.U.C.): PROTEGIDO</p>
              <p className="text-[11px] text-emerald-700">
                La estructura del catálogo de cuentas PUC nunca se elimina ni se modifica.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
            Intacto
          </span>
        </div>

        {/* 2. Opciones de borrado */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-bold text-slate-800 mb-1">
            Módulos y datos a eliminar ({selectedCount} seleccionados):
          </legend>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {/* Recaudos */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                options.cleanAssociateReceipts ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-rose-600"
                checked={options.cleanAssociateReceipts}
                onChange={() => toggleOption('cleanAssociateReceipts')}
              />
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Receipt size={14} className="text-rose-600" /> Recaudos y recibos de asociados
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Recibos de caja emitidos y conceptos de cuotas cobrados.
                </p>
              </div>
            </label>

            {/* Préstamos */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                options.cleanLoans ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-rose-600"
                checked={options.cleanLoans}
                onChange={() => toggleOption('cleanLoans')}
              />
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <HandCoins size={14} className="text-rose-600" /> Préstamos y abonos de cartera
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Créditos activos, cronogramas de cuotas y abonos de capital/interés.
                </p>
              </div>
            </label>

            {/* Comprobantes */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                options.cleanJournalVouchers ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-rose-600"
                checked={options.cleanJournalVouchers}
                onChange={() => toggleOption('cleanJournalVouchers')}
              />
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <FileSpreadsheet size={14} className="text-rose-600" /> Comprobantes y asientos
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Comprobantes contables de ingreso, egreso, notas y partidas dobles.
                </p>
              </div>
            </label>

            {/* Cartera y tesorería */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                options.cleanDebtAndTreasury ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-rose-600"
                checked={options.cleanDebtAndTreasury}
                onChange={() => toggleOption('cleanDebtAndTreasury')}
              />
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Wallet size={14} className="text-rose-600" /> Cartera y tesorería
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Facturas por cobrar/pagar y movimientos de caja/bancos.
                </p>
              </div>
            </label>

            {/* Asociados y Terceros */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                options.cleanThirdParties ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-rose-600"
                checked={options.cleanThirdParties}
                onChange={() => toggleOption('cleanThirdParties')}
              />
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Users size={14} className="text-rose-600" /> Asociados y terceros
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Directorio de asociados, clientes y proveedores registrados.
                </p>
              </div>
            </label>

            {/* Plantillas de cuotas */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                options.cleanQuotaTemplates ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-rose-600"
                checked={options.cleanQuotaTemplates}
                onChange={() => toggleOption('cleanQuotaTemplates')}
              />
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Settings2 size={14} className="text-rose-600" /> Plantillas de cuotas
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Estructuras y valores de cuotas mensuales configuradas.
                </p>
              </div>
            </label>
          </div>
        </fieldset>

        {/* 3. Confirmación de seguridad */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 text-xs">
          <div className="flex items-center gap-2 text-rose-800 font-bold mb-1.5">
            <AlertTriangle size={16} /> Confirmación de seguridad
          </div>
          <p className="text-rose-700 mb-2 leading-relaxed">
            Esta acción es definitiva. Para habilitar la limpieza, escribe la palabra{' '}
            <strong className="underline uppercase tracking-wide">LIMPIAR</strong> a continuación:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Escribe LIMPIAR para confirmar"
            className="w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-900 placeholder:text-rose-300 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
      </div>
    </Modal>
  );
};

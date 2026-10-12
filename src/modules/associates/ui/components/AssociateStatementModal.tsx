import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  PiggyBank,
  HeartHandshake,
  Building2,
  Download,
  FileSpreadsheet,
  RefreshCw,
  CreditCard,
  Printer,
  Search,
  Receipt,
  Clock,
  Calendar,
} from 'lucide-react';
import type { AssociateStatement, AssociateReceipt } from '../../types/associate';
import { associateApi } from '../../infrastructure/associateApi';
import { documentExportService } from '../../../../services/documentExportService';
import { AssociateVoucherPrintModal } from './AssociateVoucherPrintModal';
import { TablePagination, usePagedRows } from '../../../../shared/ui/components/TablePagination';

interface AssociateStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  thirdPartyId: string;
}

export const AssociateStatementModal: React.FC<AssociateStatementModalProps> = ({
  isOpen,
  onClose,
  thirdPartyId,
}) => {
  const [statement, setStatement] = useState<AssociateStatement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'excel' | null>(null);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<AssociateReceipt | null>(null);
  const [historySearch, setHistorySearch] = useState<string>('');

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setExportingFormat(format);
      await documentExportService.downloadAssociateStatement(
        thirdPartyId,
        format,
        statement?.fullName
      );
    } catch (err) {
      console.warn('Export failed:', err);
      alert('No se pudo generar el extracto desde el servidor.');
    } finally {
      setExportingFormat(null);
    }
  };

  useEffect(() => {
    if (isOpen && thirdPartyId) {
      setLoading(true);
      associateApi.getStatement(thirdPartyId).then((res) => {
        setStatement(res);
        setLoading(false);
      });
    }
  }, [isOpen, thirdPartyId]);

  const filteredHistory = (statement?.receiptsHistory || []).filter((rc) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      rc.receiptNumber.toLowerCase().includes(q) ||
      (rc.voucherNumber && rc.voucherNumber.toLowerCase().includes(q)) ||
      rc.paymentDate.includes(q) ||
      (rc.notes && rc.notes.toLowerCase().includes(q))
    );
  });
  const historyPaged = usePagedRows(filteredHistory, 10);

  // Cálculo detallado de Ahorros del Socio: Aportes Ordinarios (311505) + Aporte Extra (311510) + Turismo y Recreación (238035)
  const savingsBreakdown = useMemo(() => {
    let ordinary = 0;
    let extra = 0;
    let tourism = 0;
    let solidarity = 0;
    let otherSocial = 0;

    for (const rc of statement?.receiptsHistory || []) {
      for (const item of rc.items || []) {
        const code = item.accountCode || '';
        const name = (item.conceptName || '').toLowerCase();
        const amt = Number(item.amount || 0);

        if (code === '311505' || (name.includes('ordinario') && name.includes('aporte'))) {
          ordinary += amt;
        } else if (code === '311510' || name.includes('extra')) {
          extra += amt;
        } else if (code === '238035' || name.includes('turismo') || name.includes('recreaci')) {
          tourism += amt;
        } else if (code === '238025' || name.includes('solidaridad')) {
          solidarity += amt;
        } else if (item.category === 'SOCIAL_FUND') {
          otherSocial += amt;
        }
      }
    }

    // Si los recibos históricos antiguos no tenían ítems desglosados, recurrir a los saldos totales
    if (ordinary === 0 && extra === 0 && Number(statement?.totalEquitySavings || 0) > 0) {
      ordinary = Number(statement?.totalEquitySavings || 0);
    }

    const totalSavings = ordinary + extra + tourism;
    const totalSocialExcludingTourism = Math.max(0, Number(statement?.totalSocialFunds || 0) - tourism);

    return {
      ordinary,
      extra,
      tourism,
      totalSavings,
      totalSocialExcludingTourism,
      solidarity,
      otherSocial,
    };
  }, [statement]);

  // Todos los hooks van antes de este retorno (React exige el mismo orden en cada render).
  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      {/* Modal de Impresión de Recibo Individual */}
      <AssociateVoucherPrintModal
        isOpen={!!selectedReceiptForPrint}
        onClose={() => setSelectedReceiptForPrint(null)}
        receipt={selectedReceiptForPrint}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full pb-[env(safe-area-inset-bottom)] sm:pb-0 max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[92dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
              <Receipt size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Historial de Recibos y Estado de Cuenta
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Asociado
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulta los abonos registrados, aportes a fondos, patrimonio y cartera en préstamos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Cargando estado de cuenta y recibos...</div>
          ) : !statement ? (
            <div className="py-12 text-center text-slate-400 text-xs">No se encontró información para este asociado.</div>
          ) : (
            <>
              {/* Member Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{statement.fullName}</h3>
                    {statement.pucAccountCode && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        PUC Aportes: {statement.pucAccountCode}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    C.C. <strong className="text-slate-700 font-mono">{statement.identificationNumber}</strong>
                    {statement.email ? ` • ${statement.email}` : ''}
                    {statement.phone ? ` • Tel: ${statement.phone}` : ''}
                  </div>
                  {statement.pucAccountName && (
                    <div className="text-[11px] text-slate-600 mt-1 font-mono">
                      Subcuenta Auxiliar: <span className="font-semibold text-slate-800">{statement.pucAccountName}</span>
                    </div>
                  )}
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block">
                    Asociado Activo
                  </span>
                  <div className="text-xs text-slate-500 mt-1 font-mono">
                    {statement.receiptsHistory.length} recibo{statement.receiptsHistory.length !== 1 ? 's' : ''} emitido{statement.receiptsHistory.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* 4 Metrics Cards (Including Loans) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Total Ahorros del Socio */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-50/70 to-indigo-50/40 border border-purple-200 shadow-2xs">
                  <div className="flex items-center justify-between text-purple-700 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Ahorros del Socio</span>
                    <PiggyBank size={16} className="text-purple-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-purple-950">
                    ${Number(savingsBreakdown.totalSavings || 0).toLocaleString('es-CO')}
                  </div>
                  <div className="text-[10px] text-purple-800/90 mt-1.5 flex flex-col gap-0.5 font-medium">
                    <span className="truncate">• Aporte Ordinario: ${Number(savingsBreakdown.ordinary).toLocaleString('es-CO')}</span>
                    <span className="truncate">• Aporte Extra: ${Number(savingsBreakdown.extra).toLocaleString('es-CO')}</span>
                    <span className="truncate">• Turismo y Rec.: ${Number(savingsBreakdown.tourism).toLocaleString('es-CO')}</span>
                  </div>
                </div>

                {/* 2. Social Funds (Solidaridad y Auxilios) */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Fondos Sociales</span>
                    <HeartHandshake size={15} className="text-sky-600" />
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-900">
                    ${Number(savingsBreakdown.totalSocialExcludingTourism || 0).toLocaleString('es-CO')}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Solidaridad & Auxilios (Clase 2)
                  </span>
                </div>

                {/* 3. Administration Fees */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cuotas Sostenimiento</span>
                    <Building2 size={15} className="text-emerald-600" />
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-900">
                    ${Number(statement.totalAdministrationFees || 0).toLocaleString('es-CO')}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Ingreso Operacional (Clase 4)
                  </span>
                </div>

                {/* 4. Cartera en Préstamos */}
                <div className={`p-3.5 rounded-xl border shadow-2xs ${
                  (statement.totalLoansBalance || 0) > 0
                    ? 'bg-indigo-50/60 border-indigo-200'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Saldo Préstamos</span>
                    <CreditCard size={15} className="text-indigo-600" />
                  </div>
                  <div className="text-lg font-bold font-mono text-indigo-950">
                    ${Number(statement.totalLoansBalance || 0).toLocaleString('es-CO')}
                  </div>
                  <span className="text-[10px] text-indigo-700/80 block mt-0.5">
                    Cuenta PUC 136505 ({statement.activeLoansCount || 0} activo{(statement.activeLoansCount || 0) !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>

              {/* Total Historical Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 text-white shadow-2xs">
                <span className="text-xs font-medium text-slate-200">Total Histórico Recaudado en Caja/Bancos:</span>
                <span className="text-base font-bold font-mono text-emerald-300">
                  ${Number(statement.totalPaidOverall || 0).toLocaleString('es-CO')} COP
                </span>
              </div>

              {/* History Table */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt size={14} className="text-indigo-600" />
                    <span>Historial de Recibos de Caja Emitidos</span>
                  </h4>

                  <div className="relative w-full sm:w-64">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por N° recibo, comprobante..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-x-auto overscroll-x-contain">
                  <table className="table-stack w-full min-w-[640px] text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <th className="py-2.5 px-3 text-left font-semibold">N° Recibo</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Fecha</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Comprobante</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Medio / Cuenta</th>
                        <th className="py-2.5 px-3 text-right font-semibold">Monto Total</th>
                        <th className="py-2.5 px-3 text-center font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                            No se encontraron recibos para este asociado con los criterios aplicados.
                          </td>
                        </tr>
                      ) : (
                        historyPaged.pageRows.map((rc, idx) => (
                          <tr key={rc.id || idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {rc.receiptNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              <div className="flex items-center gap-1">
                                <Calendar size={12} className="text-slate-400" />
                                <span>{rc.paymentDate}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                                {rc.voucherNumber || 'CP-ING-AUTO'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                              {rc.cashAccountName || 'Caja General (110505)'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              ${Number(rc.totalAmount).toLocaleString('es-CO')}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => setSelectedReceiptForPrint(rc)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer border border-slate-200 hover:border-indigo-300"
                                title="Ver e imprimir recibo oficial"
                              >
                                <Printer size={12} />
                                <span>Recibo</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <TablePagination {...historyPaged} pageSizeOptions={[10, 25, 50]} itemLabel="recibos" />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer with Exports */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleExport('pdf')}
              disabled={exportingFormat !== null || !statement}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {exportingFormat === 'pdf' ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span>Exportar PDF</span>
            </button>

            <button
              onClick={() => handleExport('excel')}
              disabled={exportingFormat !== null || !statement}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {exportingFormat === 'excel' ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={14} />
              )}
              <span>Exportar Excel</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

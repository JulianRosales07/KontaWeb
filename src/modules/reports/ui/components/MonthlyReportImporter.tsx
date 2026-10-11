import React, { useState } from 'react';
import { CheckCircle2, FileUp, FlaskConical, Upload, XCircle } from 'lucide-react';
import { monthlyImportApi, type MonthlyImportResult } from '../../api/reportApi';
import { apiErrorMessage } from '../../../../shared/infrastructure/http/apiError';
import { formatCOP, formatDate } from '../../../../shared/lib/format';
import { Alert, StatCard, buttonClass } from '../../../../shared/ui/components/PageHeader';
import { ConfirmationModal } from '../../../../shared/ui/components/Modal';

/**
 * Importa el informe mensual en Excel (PLANILLA, BAL,PRUEBA, ESFA…). Primero se simula: el servidor ejecuta la
 * importación completa, concilia los reportes contra las cifras del propio Excel y revierte. Solo después se aplica.
 */
export const MonthlyReportImporter: React.FC<{ onImported: () => void }> = ({ onImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<MonthlyImportResult | null>(null);
  const [busy, setBusy] = useState<'simulate' | 'apply' | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(dryRun ? 'simulate' : 'apply');
    setError(null);
    try {
      const r = await monthlyImportApi.run(file, dryRun);
      setResult(r);
      if (r.applied) onImported();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo procesar el archivo.'));
    } finally {
      setBusy(null);
      setConfirm(false);
    }
  };

  const canApply = !!result && result.dryRun && result.errors.length === 0;
  const failures = result?.reconciliation.filter((l) => !l.ok).length ?? 0;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-bold text-slate-900">Importar informe mensual (Excel)</h3>
        <p className="mt-1 text-sm text-slate-600">
          Se crea el comprobante de apertura al cierre del mes anterior, un ingreso por cada recibo de la PLANILLA, un egreso por cada CE,
          los movimientos bancarios y la depreciación. La simulación no guarda nada y muestra la conciliación contra el Excel.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className={`${buttonClass.secondary} w-full sm:w-auto`}>
            <FileUp size={16} />
            <span className="truncate">{file ? file.name : 'Seleccionar archivo .xlsx'}</span>
            <input
              type="file"
              accept=".xlsx"
              className="sr-only"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
              }}
            />
          </label>
          <button type="button" className={buttonClass.primary} disabled={!file || !!busy} onClick={() => run(true)}>
            <FlaskConical size={16} /> {busy === 'simulate' ? 'Simulando…' : 'Simular y conciliar'}
          </button>
          <button type="button" className={buttonClass.accent} disabled={!canApply || !!busy} onClick={() => setConfirm(true)}>
            <Upload size={16} /> {busy === 'apply' ? 'Importando…' : 'Importar definitivamente'}
          </button>
        </div>
        {!canApply && file && !result && <p className="mt-2 text-xs text-slate-500">Simule primero; la importación se habilita si no hay errores.</p>}
      </div>

      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

      {result && (
        <>
          <Alert tone={result.errors.length ? 'error' : failures ? 'warning' : 'success'}>
            {result.message}
            {result.period && ` · Periodo ${result.period}`}
            {result.organizationName && ` · ${result.organizationName}`}
          </Alert>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
            <StatCard label="Comprobantes" value={result.vouchers.length} />
            <StatCard label="Asociados identificados" value={result.associatesMatched} />
            <StatCard label="Asociados nuevos" value={result.associatesCreated.length} tone={result.associatesCreated.length ? 'warning' : 'neutral'} />
            <StatCard
              label="Conciliación"
              value={`${result.reconciliation.length - failures} / ${result.reconciliation.length} cuadran`}
              tone={failures ? 'negative' : 'positive'}
            />
          </div>

          {result.errors.length > 0 && (
            <List title="Errores (la importación no se realizó)" tone="error" items={result.errors} />
          )}

          {result.reconciliation.length > 0 && (
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="mb-3 text-sm font-bold text-slate-800">Conciliación: reportes del sistema vs. Excel</h4>
              <div className="table-scroll rounded-lg border border-slate-200">
                <table className="table-stack w-full min-w-[760px] border-collapse text-sm">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      {['', 'Hoja Excel', 'Reporte', 'Concepto'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-[11px] font-bold uppercase">{h}</th>
                      ))}
                      {['Excel', 'Sistema', 'Diferencia'].map((h) => (
                        <th key={h} className="px-3 py-2 text-right text-[11px] font-bold uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.reconciliation.map((l, i) => (
                      <tr key={i} className={`border-b border-slate-100 ${l.ok ? '' : 'bg-red-50'}`}>
                        <td className="px-3 py-2">
                          {l.ok ? <CheckCircle2 size={16} className="text-emerald-600" aria-label="Cuadra" /> : <XCircle size={16} className="text-red-600" aria-label="Diferencia" />}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">{l.sheet}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{l.report}</td>
                        <td className="min-w-[200px] px-3 py-2">{l.concept}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatCOP(l.excel, '$0')}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatCOP(l.system, '$0')}</td>
                        <td className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${l.ok ? 'text-slate-500' : 'font-bold text-red-700'}`}>
                          {formatCOP(l.difference, '$0')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.warnings.length > 0 && <List title="Observaciones para revisar con la contadora" tone="warning" items={result.warnings} />}

          {result.vouchers.length > 0 && (
            <details className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-bold text-slate-800">
                Comprobantes {result.dryRun ? 'que se crearán' : 'creados'} ({result.vouchers.length})
              </summary>
              <div className="table-scroll mt-3 rounded-lg border border-slate-200">
                <table className="table-stack w-full min-w-[640px] border-collapse text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-bold uppercase">Número</th>
                      <th className="px-3 py-2 text-left text-[11px] font-bold uppercase">Tipo</th>
                      <th className="px-3 py-2 text-left text-[11px] font-bold uppercase">Fecha</th>
                      <th className="px-3 py-2 text-left text-[11px] font-bold uppercase">Descripción</th>
                      <th className="px-3 py-2 text-right text-[11px] font-bold uppercase">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.vouchers.map((v) => (
                      <tr key={v.number} className="border-b border-slate-100">
                        <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs">{v.number}</td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-xs">{v.type}</td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-xs">{formatDate(v.date)}</td>
                        <td className="min-w-[240px] px-3 py-1.5 text-xs text-slate-600">{v.description}</td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">{formatCOP(v.total, '$0')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      )}

      <ConfirmationModal
        open={confirm}
        onCancel={() => setConfirm(false)}
        onConfirm={() => run(false)}
        title="Importar el informe definitivamente"
        message={`Se registrarán ${result?.vouchers.length ?? 0} comprobantes contabilizados del periodo ${result?.period ?? ''}. `
          + 'Para deshacerlo habría que anular cada comprobante. ¿Continuar?'}
        confirmLabel="Importar"
        loading={busy === 'apply'}
      />
    </section>
  );
};

const List: React.FC<{ title: string; tone: 'error' | 'warning'; items: string[] }> = ({ title, tone, items }) => (
  <div className={`rounded-xl border p-4 ${tone === 'error' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
    <h4 className={`mb-2 text-sm font-bold ${tone === 'error' ? 'text-red-900' : 'text-amber-900'}`}>{title}</h4>
    <ul className={`list-disc space-y-1 pl-5 text-sm ${tone === 'error' ? 'text-red-900' : 'text-amber-900'}`}>
      {items.map((w, i) => (
        <li key={i}>{w}</li>
      ))}
    </ul>
  </div>
);

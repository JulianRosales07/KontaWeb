import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BarChart3, ChevronLeft, ChevronRight, FileDown, FileSpreadsheet, Landmark, Maximize2, Minimize2, Play, Printer } from 'lucide-react';
import { reportApi, type FinancialReport, type ReportColumn, type ReportFilters, type ReportRow } from '../../api/reportApi';
import { directoryApi, type AssociateSummary } from '../../../associates/infrastructure/directoryApi';
import { voucherApi, type JournalVoucher } from '../../../contabilidad/api/voucherApi';
import { VoucherDetailModal } from '../../../contabilidad/ui/components/JournalVouchersView';
import { useAuth } from '../../../auth/application/hooks/useAuth';
import { apiErrorMessage } from '../../../../shared/infrastructure/http/apiError';
import { formatCOP, formatDate, formatDateTime, formatNumber, formatPercent, todayISO } from '../../../../shared/lib/format';
import { Alert, PageContainer, PageHeader, StatCard, buttonClass } from '../../../../shared/ui/components/PageHeader';
import { FormField, inputClass, selectClass } from '../../../../shared/ui/components/MoneyInput';
import { PrintDocumentLayout, usePrintDocument } from '../../../../shared/ui/components/PrintDocumentLayout';
import { ReportsDashboard } from '../components/ReportsDashboard';
import { MonthlyReportImporter } from '../components/MonthlyReportImporter';
import { InvestmentsManager } from '../components/InvestmentsManager';
import { ReportsMenu } from '../components/ReportsMenu';
import { TablePagination, TableSearchInput, usePagedRows, useTableSearch } from '../../../../shared/ui/components/TablePagination';

type FilterKey = 'account' | 'voucherType' | 'party' | 'partyRequired' | 'method' | 'level' | 'byParty' | 'cutOnly';

interface ReportDef {
  code: string;
  title: string;
  description: string;
  filters: FilterKey[];
  group: string;
  /** Hoja equivalente del informe mensual en Excel. */
  sheet?: string;
}

/** Vistas especiales que no son un reporte tabular. */
const DASHBOARD = 'TABLERO';
const IMPORTER = 'IMPORTAR_INFORME';

const REPORTS: ReportDef[] = [
  { code: DASHBOARD, title: 'Tablero', description: 'Indicadores y gráficas a la fecha de corte', filters: ['cutOnly'], group: 'Inicio' },
  { code: 'ESTADO_SITUACION', title: 'Estado de situación financiera', description: 'Activos, pasivos y patrimonio a la fecha de corte (ESFA)', filters: ['level', 'cutOnly'], group: 'Estados financieros', sheet: 'ESFA' },
  { code: 'ESTADO_RESULTADOS', title: 'Estado de resultados', description: 'Ingresos, gastos y excedente: acumulado anterior, periodo y acumulado del año', filters: [], group: 'Estados financieros', sheet: 'ESTADO RESULTADOS' },
  { code: 'BALANCE_PRUEBA', title: 'Balance de prueba', description: 'Saldo anterior, débitos, créditos y saldo final por cuenta PUC jerárquica', filters: ['account', 'level', 'byParty'], group: 'Estados financieros', sheet: 'BAL,PRUEBA' },
  { code: 'PLANILLA_RECAUDOS', title: 'Planilla de recaudos', description: 'Recibos del periodo distribuidos por concepto, con caja y bancos', filters: ['party'], group: 'Recaudos y asociados', sheet: 'PLANILLA' },
  { code: 'RECAUDOS', title: 'Recaudos (cuotas y préstamos)', description: 'Recibos de cuotas y abonos a préstamos', filters: ['party', 'method'], group: 'Recaudos y asociados' },
  { code: 'ESTADO_CUENTA_ASOCIADO', title: 'Estado de cuenta del asociado', description: 'Aportes, fondos, préstamos y movimientos de un asociado', filters: ['partyRequired'], group: 'Recaudos y asociados' },
  { code: 'APORTES_SOCIALES', title: 'Aportes sociales', description: 'Saldo anterior, retiros, aportes y saldo por asociado', filters: ['party'], group: 'Recaudos y asociados', sheet: 'APORTES' },
  { code: 'APORTES_EXTRAS', title: 'Aportes extraordinarios', description: 'Excedente de aportes por asociado (pasivo)', filters: ['party'], group: 'Recaudos y asociados', sheet: 'APORTES EXTRAS' },
  { code: 'APORTES', title: 'Aportes en recibos', description: 'Aportes recibidos en recibos de cuota', filters: ['party'], group: 'Recaudos y asociados' },
  { code: 'AHORROS', title: 'Ahorros', description: 'Ahorros recibidos por asociado', filters: ['party'], group: 'Recaudos y asociados' },
  { code: 'CUENTAS_POR_PAGAR', title: 'Cuentas por pagar', description: 'Aportes y ahorros acumulados a favor de los asociados', filters: ['party'], group: 'Recaudos y asociados' },
  { code: 'CXC_ASOCIADOS', title: 'Cuentas por cobrar a asociados', description: 'Saldo anterior, cargos, abonos y saldo por asociado', filters: ['party'], group: 'Cartera', sheet: 'CUENTAS POR C' },
  { code: 'CUENTAS_POR_COBRAR', title: 'Préstamos activos', description: 'Saldos pendientes de préstamos activos', filters: ['party'], group: 'Cartera' },
  { code: 'CARTERA', title: 'Cartera por edades', description: 'Préstamos activos por días de mora a la fecha de corte', filters: ['party'], group: 'Cartera' },
  { code: 'PRESTAMOS', title: 'Préstamos desembolsados', description: 'Préstamos desembolsados en el periodo', filters: ['party'], group: 'Cartera' },
  { code: 'INTERESES', title: 'Intereses recaudados', description: 'Intereses efectivamente pagados por cuota', filters: ['party'], group: 'Cartera' },
  { code: 'FONDO_SOLIDARIDAD', title: 'Fondo de solidaridad', description: 'Aportes al fondo y auxilios por asociado', filters: ['party'], group: 'Fondos y actividades', sheet: 'BAL,PRUEBA' },
  { code: 'TURISMO_RECREACION', title: 'Turismo y recreación', description: 'Fondo de turismo y recreación por asociado', filters: ['party'], group: 'Fondos y actividades', sheet: 'TURISMO Y R' },
  { code: 'PREEXEQUIALES', title: 'Preexequiales', description: 'Recaudos para terceros y pagos a la funeraria', filters: ['party'], group: 'Fondos y actividades', sheet: 'BAL,PRUEBA' },
  { code: 'FONDOS', title: 'Fondos y actividades', description: 'Saldos de fondos y resultado de bingos, eventos y actividades', filters: [], group: 'Fondos y actividades' },
  { code: 'CAJA', title: 'Caja', description: 'Saldo inicial, ingresos, egresos y saldo final del disponible', filters: ['account', 'voucherType', 'party', 'method'], group: 'Tesorería', sheet: 'BAL,PRUEBA' },
  { code: 'BANCOS', title: 'Bancos', description: 'Movimientos y saldo por cuenta bancaria', filters: ['account', 'voucherType', 'party'], group: 'Tesorería', sheet: 'BAL,PRUEBA' },
  { code: 'MOVIMIENTOS_CAJA', title: 'Movimientos del disponible', description: 'Detalle agrupado por cuenta de caja y bancos', filters: ['account', 'voucherType', 'party', 'method'], group: 'Tesorería' },
  { code: 'INVERSIONES', title: 'Inversiones (CDT)', description: 'Títulos registrados frente al saldo contable', filters: ['cutOnly'], group: 'Tesorería', sheet: 'BAL,PRUEBA' },
  { code: 'PROPIEDAD_PLANTA', title: 'Propiedad, planta y equipo', description: 'Costo, depreciación acumulada y valor neto', filters: [], group: 'Activos', sheet: 'ESFA' },
  { code: 'INGRESOS', title: 'Ingresos por cuenta', description: 'Ingresos por cuenta PUC (clase 4)', filters: ['account', 'voucherType', 'party'], group: 'Ingresos y gastos' },
  { code: 'EGRESOS', title: 'Gastos por cuenta', description: 'Gastos y costos por cuenta PUC (clases 5 y 6)', filters: ['account', 'voucherType', 'party'], group: 'Ingresos y gastos' },
  { code: IMPORTER, title: 'Importar informe mensual', description: 'Carga el Excel del informe mensual con conciliación', filters: [], group: 'Herramientas' },
];

/** Auxiliares por asociado: al hacer clic en un asociado se ve su movimiento en el mismo reporte. */
const PARTY_LEDGERS = new Set(['CXC_ASOCIADOS', 'APORTES_SOCIALES', 'APORTES_EXTRAS', 'TURISMO_RECREACION', 'FONDO_SOLIDARIDAD', 'PREEXEQUIALES']);

const firstOfMonth = () => `${todayISO().slice(0, 8)}01`;

function formatCell(col: ReportColumn, value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  switch (col.type) {
    case 'MONEY':
      return formatCOP(value as number, '');
    case 'DATE':
      return formatDate(String(value));
    case 'NUMBER':
      return typeof value === 'number' ? formatNumber(value) : String(value);
    case 'PERCENT':
      return typeof value === 'number' ? formatPercent(value) : String(value);
    default:
      return String(value);
  }
}

const NOWRAP_KEYS = new Set(['voucher', 'receipt', 'loan', 'type', 'document', 'installments', 'method', 'code']);
const WIDE_KEYS = new Set(['concept', 'detail', 'party', 'account', 'name', 'entity']);

const isNumeric = (c: ReportColumn) => c.type === 'MONEY' || c.type === 'NUMBER' || c.type === 'PERCENT';

/** Fila con destino de navegación. */
const isNavigable = (r: ReportRow) => !!(r.cells._voucherId || r.cells._partyId || r.cells._accountCode);

interface View {
  code: string;
  filters: ReportFilters;
}

export const FinancialReportsCenterPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canExport = hasPermission('REPORTS_EXPORT');
  const canImport = hasPermission('ACCOUNTING_CREATE');
  const [code, setCode] = useState(DASHBOARD);
  const [filters, setFilters] = useState<ReportFilters>({ from: firstOfMonth(), to: todayISO() });
  const [history, setHistory] = useState<View[]>([]);
  const [associates, setAssociates] = useState<AssociateSummary[]>([]);
  const [report, setReport] = useState<FinancialReport | null>(null);
  // Vista ampliada: oculta el menú lateral para dar todo el ancho a la tabla (se recuerda por navegador).
  const [wide, setWide] = useState<boolean>(() => {
    try {
      return localStorage.getItem('konta.reports.wide') === '1';
    } catch {
      return false;
    }
  });
  const toggleWide = () =>
    setWide((w) => {
      try {
        localStorage.setItem('konta.reports.wide', w ? '0' : '1');
      } catch {
        /* sin almacenamiento: solo dura la sesión */
      }
      return !w;
    });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'xlsx' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voucher, setVoucher] = useState<JournalVoucher | null>(null);
  const [investmentsOpen, setInvestmentsOpen] = useState(false);
  const { documentId, print } = usePrintDocument();

  const menu = REPORTS.filter((r) => r.code !== IMPORTER || canImport);
  const def = REPORTS.find((r) => r.code === code)!;
  const isTabular = code !== DASHBOARD && code !== IMPORTER;

  useEffect(() => {
    directoryApi.search({ associatesOnly: true }).then(setAssociates).catch(() => setAssociates([]));
  }, []);

  const effectiveFor = (d: ReportDef, f: ReportFilters): ReportFilters => {
    // Reportes a fecha de corte: el periodo es el mes del corte (la fecha "desde" no se muestra)
    const from = d.filters.includes('cutOnly') && f.to ? `${f.to.slice(0, 8)}01` : f.from;
    const out: ReportFilters = { from, to: f.to };
    if (d.filters.includes('account')) out.accountCode = f.accountCode;
    if (d.filters.includes('voucherType')) out.voucherType = f.voucherType;
    if (d.filters.includes('party') || d.filters.includes('partyRequired')) out.thirdPartyId = f.thirdPartyId;
    if (d.filters.includes('method')) out.paymentMethod = f.paymentMethod;
    if (d.filters.includes('level')) out.level = f.level;
    if (d.filters.includes('byParty')) out.byParty = f.byParty;
    return out;
  };
  const effectiveFilters = useMemo(() => effectiveFor(def, filters), [filters, def]);

  const generate = async (reportCode = code, f = filters) => {
    const d = REPORTS.find((r) => r.code === reportCode)!;
    if (reportCode === DASHBOARD || reportCode === IMPORTER) return;
    if (!d.filters.includes('cutOnly') && f.from && f.to && f.from > f.to) {
      setError('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }
    if (d.filters.includes('partyRequired') && !f.thirdPartyId) {
      setReport(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setReport(await reportApi.generate(reportCode, effectiveFor(d, f)));
    } catch (e) {
      setReport(null);
      setError(apiErrorMessage(e, 'No se pudo generar el reporte.'));
    } finally {
      setLoading(false);
    }
  };

  /** Cambia de reporte desde el menú (reinicia la navegación). */
  const select = (next: string) => {
    setHistory([]);
    setReport(null);
    setCode(next);
    const f = { ...filters, thirdPartyId: undefined, accountCode: undefined, byParty: undefined };
    setFilters(f);
    void generate(next, f);
  };

  /** Navega a otro reporte/filtro guardando el actual para "Volver". */
  const drill = (next: string, patch: Partial<ReportFilters>) => {
    setHistory((h) => [...h, { code, filters }]);
    const f = { ...filters, ...patch };
    setCode(next);
    setFilters(f);
    void generate(next, f);
  };

  const back = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setCode(prev.code);
    setFilters(prev.filters);
    void generate(prev.code, prev.filters);
  };

  const onRowClick = async (row: ReportRow) => {
    const c = row.cells;
    if (c._voucherId) {
      try {
        setVoucher(await voucherApi.get(String(c._voucherId)));
      } catch (e) {
        setError(apiErrorMessage(e, 'No se pudo abrir el comprobante.'));
      }
    } else if (c._partyId) {
      if (PARTY_LEDGERS.has(code) && !filters.thirdPartyId) drill(code, { thirdPartyId: String(c._partyId) });
      else drill('ESTADO_CUENTA_ASOCIADO', { thirdPartyId: String(c._partyId) });
    } else if (c._accountCode) {
      drill('BALANCE_PRUEBA', { accountCode: String(c._accountCode), byParty: true, level: undefined });
    }
  };

  useEffect(() => {
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const download = async (format: 'pdf' | 'xlsx') => {
    setExporting(format);
    setError(null);
    try {
      await reportApi.download(code, format, effectiveFilters);
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo exportar el reporte.'));
    } finally {
      setExporting(null);
    }
  };

  const groups = [...new Set(menu.map((r) => r.group))];
  const cutOnly = def.filters.includes('cutOnly');

  return (
    <PageContainer className={wide ? 'max-w-none!' : ''}>
      <PageHeader
        title="Reportes financieros"
        subtitle="Cifras calculadas en el servidor a partir de los comprobantes contabilizados."
        icon={<BarChart3 size={20} />}
        actions={
          report && isTabular && (
            <>
              <button type="button" className={buttonClass.secondary} onClick={print}>
                <Printer size={16} /> Imprimir
              </button>
              {canExport && (
                <>
                  <button type="button" className={buttonClass.secondary} onClick={() => download('pdf')} disabled={!!exporting}>
                    <FileDown size={16} /> {exporting === 'pdf' ? 'Generando…' : 'PDF'}
                  </button>
                  <button type="button" className={buttonClass.secondary} onClick={() => download('xlsx')} disabled={!!exporting}>
                    <FileSpreadsheet size={16} /> {exporting === 'xlsx' ? 'Generando…' : 'Excel'}
                  </button>
                </>
              )}
            </>
          )
        }
      />

      <div className={`grid min-w-0 grid-cols-1 gap-5 lg:items-start ${wide ? '' : 'lg:grid-cols-[280px_minmax(0,1fr)]'}`}>
        <div className={wide ? 'lg:max-w-md' : 'lg:hidden'}>
          <FormField label="Reporte" htmlFor="report-select">
            <select id="report-select" className={selectClass} value={code} onChange={(e) => select(e.target.value)}>
              {groups.map((g) => (
                <optgroup key={g} label={g}>
                  {menu.filter((r) => r.group === g).map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </FormField>
        </div>
        {!wide && <ReportsMenu items={menu} current={code} onSelect={select} />}

        <div className="flex min-w-0 flex-col gap-4">
          {history.length > 0 && (
            <div>
              <button type="button" className={buttonClass.ghost} onClick={back}>
                <ArrowLeft size={14} /> Volver a {REPORTS.find((r) => r.code === history[history.length - 1].code)?.title}
              </button>
            </div>
          )}

          {code !== IMPORTER && (
            <form
              className="rounded-xl border border-slate-200 bg-white p-4"
              onSubmit={(e) => {
                e.preventDefault();
                void generate();
              }}
            >
              <p className="mb-3 text-sm text-slate-600">
                {def.description}
                {def.sheet && <span className="ml-1 text-xs text-emerald-700">· Hoja del Excel: {def.sheet}</span>}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {!cutOnly && (
                  <FormField label="Fecha desde" htmlFor="r-from">
                    <input id="r-from" type="date" className={inputClass} value={filters.from ?? ''} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
                  </FormField>
                )}
                <FormField label={cutOnly || code === 'CARTERA' ? 'Fecha de corte' : 'Fecha hasta'} htmlFor="r-to">
                  <input id="r-to" type="date" className={inputClass} value={filters.to ?? ''} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
                </FormField>
                {def.filters.includes('account') && (
                  <FormField label="Cuenta PUC" htmlFor="r-account" hint="Código o prefijo, p. ej. 110505">
                    <input
                      id="r-account"
                      className={inputClass}
                      inputMode="numeric"
                      placeholder="Todas"
                      value={filters.accountCode ?? ''}
                      onChange={(e) => setFilters({ ...filters, accountCode: e.target.value.replace(/[^\d]/g, '') })}
                    />
                  </FormField>
                )}
                {def.filters.includes('level') && (
                  <FormField label="Nivel de detalle" htmlFor="r-level">
                    <select
                      id="r-level"
                      className={selectClass}
                      value={filters.level ?? ''}
                      onChange={(e) => setFilters({ ...filters, level: e.target.value ? Number(e.target.value) : undefined })}
                    >
                      <option value="">{code === 'ESTADO_SITUACION' ? 'Subcuenta (6 dígitos)' : 'Todos los niveles'}</option>
                      <option value="1">Clase</option>
                      <option value="2">Grupo</option>
                      <option value="3">Cuenta (4 dígitos)</option>
                      <option value="4">Subcuenta (6 dígitos)</option>
                      <option value="5">Auxiliar</option>
                    </select>
                  </FormField>
                )}
                {def.filters.includes('voucherType') && (
                  <FormField label="Tipo de movimiento" htmlFor="r-type">
                    <select id="r-type" className={selectClass} value={filters.voucherType ?? ''} onChange={(e) => setFilters({ ...filters, voucherType: e.target.value })}>
                      <option value="">Todos</option>
                      <option value="INGRESO">Ingreso</option>
                      <option value="EGRESO">Egreso</option>
                      <option value="NOTA_CONTABLE">Nota contable</option>
                      <option value="APERTURA">Apertura</option>
                    </select>
                  </FormField>
                )}
                {(def.filters.includes('party') || def.filters.includes('partyRequired')) && (
                  <FormField label={def.filters.includes('partyRequired') ? 'Asociado (obligatorio)' : 'Asociado'} htmlFor="r-party">
                    <select id="r-party" className={selectClass} value={filters.thirdPartyId ?? ''} onChange={(e) => setFilters({ ...filters, thirdPartyId: e.target.value || undefined })}>
                      <option value="">{def.filters.includes('partyRequired') ? 'Seleccione…' : 'Todos'}</option>
                      {associates.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.fullName} · {a.identificationNumber}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}
                {def.filters.includes('method') && (
                  <FormField label="Medio de pago" htmlFor="r-method">
                    <select id="r-method" className={selectClass} value={filters.paymentMethod ?? ''} onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}>
                      <option value="">Todos</option>
                      <option value="CASH">Efectivo (caja)</option>
                      <option value="BANK">Bancos / transferencia</option>
                    </select>
                  </FormField>
                )}
                {def.filters.includes('byParty') && (
                  <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-slate-700">
                    <input type="checkbox" className="size-4" checked={!!filters.byParty} onChange={(e) => setFilters({ ...filters, byParty: e.target.checked })} />
                    Detallar por tercero
                  </label>
                )}
              </div>
              {code !== DASHBOARD && (
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  {code === 'INVERSIONES' && (
                    <button type="button" className={buttonClass.secondary} onClick={() => setInvestmentsOpen(true)}>
                      <Landmark size={15} /> Registro de inversiones
                    </button>
                  )}
                  <button type="submit" className={buttonClass.primary} disabled={loading}>
                    <Play size={15} /> {loading ? 'Generando…' : 'Generar reporte'}
                  </button>
                </div>
              )}
            </form>
          )}

          {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

          {code === DASHBOARD && <ReportsDashboard to={filters.to ?? todayISO()} onOpenReport={(c) => drill(c, {})} />}
          {code === IMPORTER && <MonthlyReportImporter onImported={() => undefined} />}
          {isTabular && def.filters.includes('partyRequired') && !filters.thirdPartyId && (
            <Alert tone="info">Seleccione un asociado y genere el reporte.</Alert>
          )}

          {isTabular && report && <ReportView report={report} onRowClick={onRowClick} wide={wide} onToggleWide={toggleWide} />}

          {isTabular && report && (
            <PrintDocumentLayout
              documentId={documentId}
              title={report.title}
              orientation={report.columns.length > 6 ? 'landscape' : 'portrait'}
              meta={[
                { label: 'Periodo', value: `${formatDate(report.periodFrom)} - ${formatDate(report.periodTo)}` },
                { label: 'Generado', value: formatDateTime(report.generatedAt) },
                { label: 'Usuario', value: report.generatedBy },
                ...Object.entries(report.filters).map(([k, v]) => ({ label: k, value: v })),
              ]}
            >
              {report.subtitle && <p className="print-doc-muted">{report.subtitle}</p>}
              {report.summary.length > 0 && (
                <table>
                  <tbody>
                    <tr>
                      {report.summary.map((s) => (
                        <td key={s.label}>
                          <div className="print-doc-muted">{s.label}</div>
                          <strong>{s.type === 'NUMBER' ? formatNumber(s.value) : formatCOP(s.value, '$0')}</strong>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
              <ReportTable report={report} printable />
            </PrintDocumentLayout>
          )}
        </div>
      </div>

      <VoucherDetailModal voucher={voucher} onClose={() => setVoucher(null)} onReversed={() => { setVoucher(null); void generate(); }} />
      <InvestmentsManager open={investmentsOpen} onClose={() => setInvestmentsOpen(false)} canEdit={canImport} onChanged={() => void generate()} />
    </PageContainer>
  );
};

const ReportView: React.FC<{
  report: FinancialReport;
  onRowClick: (r: ReportRow) => void;
  wide: boolean;
  onToggleWide: () => void;
}> = ({ report, onRowClick, wide, onToggleWide }) => (
  <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
    <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {report.organizationName}
          {report.organizationNit ? ` · NIT ${report.organizationNit}` : ''}
        </p>
        <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">{report.title}</h3>
        {report.subtitle && <p className="text-xs text-slate-500">{report.subtitle}</p>}
      </div>
      <div className="text-xs text-slate-600 sm:text-right">
        <p>
          <strong>Periodo:</strong> {formatDate(report.periodFrom)} - {formatDate(report.periodTo)}
        </p>
        <p>
          <strong>Generado:</strong> {formatDateTime(report.generatedAt)}
        </p>
        <p>
          <strong>Usuario:</strong> {report.generatedBy}
        </p>
        {Object.entries(report.filters).map(([k, v]) => (
          <p key={k}>
            <strong>{k}:</strong> {v}
          </p>
        ))}
      </div>
    </div>

    {report.summary.length > 0 && (
      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {report.summary.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.type === 'NUMBER' ? formatNumber(s.value) : formatCOP(s.value, '$0')}
            tone={(s.tone as 'neutral' | 'positive' | 'negative' | 'primary') ?? 'neutral'}
          />
        ))}
      </div>
    )}

    {report.rows.some(isNavigable) && (
      <p className="text-xs text-slate-500">Haga clic en una fila para ver su comprobante, el detalle del asociado o los terceros de la cuenta.</p>
    )}
    <ReportTable report={report} onRowClick={onRowClick} wide={wide} onToggleWide={onToggleWide} />
  </section>
);

/** Sangría por nivel PUC en la primera columna de texto. */
const indent = (r: ReportRow, firstTextKey: string, key: string) => {
  const level = Number(r.cells._level ?? 0);
  return key === firstTextKey && level > 1 ? { paddingLeft: `${0.75 + (level - 1) * 0.75}rem` } : undefined;
};

const ReportTable: React.FC<{
  report: FinancialReport;
  printable?: boolean;
  onRowClick?: (r: ReportRow) => void;
  wide?: boolean;
  onToggleWide?: () => void;
}> = ({ report, printable, onRowClick, wide, onToggleWide }) => {
  const cols = report.columns;
  const firstTextKey = cols.find((c) => c.key === 'name')?.key ?? '';
  if (printable) {
    return (
      <table>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} className={isNumeric(c) ? 'num' : ''}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((r, i) => (
            <tr key={i} className={r.rowType === 'GROUP' ? 'row-group' : r.rowType === 'SUBTOTAL' ? 'row-total' : ''}>
              {cols.map((c) => (
                <td key={c.key} className={isNumeric(c) ? 'num' : ''} style={indent(r, firstTextKey, c.key)}>
                  {formatCell(c, r.cells[c.key])}
                </td>
              ))}
            </tr>
          ))}
          {Object.keys(report.totals).length > 0 && (
            <tr className="row-total">
              {cols.map((c, i) => (
                <td key={c.key} className={isNumeric(c) ? 'num' : ''}>
                  {i === 0 ? 'TOTALES' : report.totals[c.key] !== undefined ? formatCell(c, report.totals[c.key]) : ''}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  return <ScreenReportTable report={report} onRowClick={onRowClick} wide={!!wide} onToggleWide={onToggleWide} />;
};

/** Ancho mínimo de cada columna en escritorio; la suma define cuándo hace falta scroll horizontal. */
const columnWidth = (c: ReportColumn, dense: boolean) =>
  WIDE_KEYS.has(c.key) ? (dense ? 180 : 220) : c.type === 'DATE' ? 96 : isNumeric(c) ? 112 : dense ? 100 : 120;

/**
 * Tabla del reporte en pantalla.
 * - Escritorio/tablet: alto limitado (la barra de scroll horizontal siempre queda a la vista), encabezado y
 *   totales fijos, primera columna fija, sombras y botones cuando hay columnas fuera de vista.
 * - Celular (<768px): cada fila es una tarjeta (`table-stack`).
 */
const ScreenReportTable: React.FC<{
  report: FinancialReport;
  onRowClick?: (r: ReportRow) => void;
  wide: boolean;
  onToggleWide?: () => void;
}> = ({ report, onRowClick, wide, onToggleWide }) => {
  const cols = report.columns;
  const firstTextKey = cols.find((c) => c.key === 'name')?.key ?? '';
  const dense = cols.length >= 8;
  const minWidth = cols.reduce((sum, c) => sum + columnWidth(c, dense), 0);
  const cellPad = dense ? 'px-2.5 py-1.5' : 'px-3 py-2';

  const search = useTableSearch(report.rows, (r) =>
    cols
      .map((c) => {
        const raw = r.cells[c.key];
        const shown = formatCell(c, raw);
        return `${raw ?? ''} ${typeof shown === 'string' ? shown : ''}`;
      })
      .join(' '),
  );
  const paged = usePagedRows(search.filtered, 50);
  const { setQuery } = search;
  useEffect(() => setQuery(''), [report, setQuery]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [paged.page, paged.pageSize]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () =>
      setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro?.disconnect();
    };
  }, [report, paged.page, paged.pageSize, search.query]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.6), behavior: 'smooth' });
  };
  const overflowing = edges.left || edges.right;

  /** Fondo opaco para la primera columna fija (si no, el contenido se ve por debajo al desplazar). */
  const stickyBg = (r: ReportRow, nav: boolean) =>
    r.rowType === 'GROUP'
      ? 'bg-slate-100'
      : r.rowType === 'SUBTOTAL'
        ? 'bg-slate-50'
        : `bg-white ${nav ? 'group-hover:bg-indigo-50' : 'group-hover:bg-slate-50'}`;

  const arrowClass =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-default disabled:opacity-40 cursor-pointer';

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <TableSearchInput
          value={search.query}
          onChange={search.setQuery}
          placeholder="Buscar en el reporte (cuenta, tercero, concepto, comprobante…)"
          className="w-full sm:max-w-md sm:flex-1"
        />
        <div className="hidden items-center gap-1.5 md:flex">
          {overflowing && (
            <>
              <button type="button" onClick={() => scrollBy(-1)} disabled={!edges.left} className={arrowClass} aria-label="Ver columnas anteriores">
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={() => scrollBy(1)} disabled={!edges.right} className={arrowClass} aria-label="Ver más columnas">
                <ChevronRight size={16} />
              </button>
            </>
          )}
          {onToggleWide && (
            <button
              type="button"
              onClick={onToggleWide}
              className={`${buttonClass.ghost} hidden lg:inline-flex`}
              title={wide ? 'Mostrar el menú de reportes' : 'Ocultar el menú y usar todo el ancho'}
            >
              {wide ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {wide ? 'Mostrar menú' : 'Ampliar tabla'}
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500">
        {search.query ? (
          <>
            <strong className="font-semibold text-slate-800">{search.filtered.length}</strong> de {report.rows.length} filas coinciden con «{search.query}»
          </>
        ) : (
          <>
            {cols.length} columnas · {report.rows.length} filas
          </>
        )}
        {overflowing && <span className="ml-1 hidden font-medium text-indigo-600 md:inline">· Desliza horizontalmente para ver todas las columnas</span>}
      </p>

      <div className="relative min-w-0">
        <div ref={scrollRef} className="table-scroll max-h-[min(70dvh,820px)] overflow-y-auto rounded-lg border border-slate-200">
          <table className={`table-stack w-full border-separate border-spacing-0 ${dense ? 'text-xs' : 'text-sm'}`} style={{ minWidth }}>
            <thead className="sticky top-0 z-20 bg-slate-800 text-white">
              <tr>
                {cols.map((c, ci) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={`${cellPad} whitespace-nowrap bg-slate-800 py-2.5 text-[11px] font-bold uppercase tracking-wide ${isNumeric(c) ? 'text-right' : 'text-left'} ${
                      ci === 0 ? 'sticky left-0 z-30 shadow-[1px_0_0_#475569]' : ''
                    }`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.pageRows.length === 0 ? (
                <tr>
                  <td colSpan={cols.length} className="px-4 py-10 text-center text-sm text-slate-500">
                    {search.query ? `Ninguna fila coincide con «${search.query}».` : 'Sin movimientos para los filtros seleccionados.'}
                  </td>
                </tr>
              ) : (
                paged.pageRows.map((r, i) => {
                  const nav = !!onRowClick && isNavigable(r);
                  const level = Number(r.cells._level ?? 0);
                  const rowBorder = r.rowType === 'SUBTOTAL' ? 'border-b-2 border-slate-300' : 'border-b border-slate-100';
                  return (
                    <tr
                      key={i}
                      onClick={nav ? () => onRowClick!(r) : undefined}
                      tabIndex={nav ? 0 : undefined}
                      onKeyDown={nav ? (e) => e.key === 'Enter' && onRowClick!(r) : undefined}
                      className={`group ${
                        r.rowType === 'GROUP'
                          ? 'bg-slate-100 font-bold text-slate-900'
                          : r.rowType === 'SUBTOTAL'
                            ? 'bg-slate-50 font-semibold text-slate-900'
                            : `text-slate-700 hover:bg-slate-50 ${level === 2 ? 'font-semibold text-slate-900' : ''}`
                      } ${nav ? 'cursor-pointer hover:bg-indigo-50/60' : ''}`}
                    >
                      {cols.map((c, ci) => (
                        <td
                          key={c.key}
                          style={indent(r, firstTextKey, c.key)}
                          className={`${cellPad} ${rowBorder} align-top ${
                            isNumeric(c) || c.type === 'DATE' || NOWRAP_KEYS.has(c.key)
                              ? `whitespace-nowrap ${isNumeric(c) ? 'text-right tabular-nums' : ''}`
                              : WIDE_KEYS.has(c.key)
                                ? dense
                                  ? 'min-w-[180px]'
                                  : 'min-w-[220px]'
                                : ''
                          } ${c.key === 'voucher' && r.cells._voucherId ? 'font-mono text-indigo-700 underline decoration-dotted' : ''} ${
                            ci === 0 ? `md:sticky md:left-0 md:z-10 md:shadow-[1px_0_0_#e2e8f0] ${stickyBg(r, nav)}` : ''
                          }`}
                        >
                          {formatCell(c, r.cells[c.key])}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
            {Object.keys(report.totals).length > 0 && paged.pageRows.length > 0 && (
              <tfoot className="md:sticky md:bottom-0 md:z-20">
                <tr className="bg-slate-900 font-bold text-white">
                  {cols.map((c, i) => (
                    <td
                      key={c.key}
                      className={`${cellPad} bg-slate-900 py-2.5 ${isNumeric(c) ? 'whitespace-nowrap text-right tabular-nums' : ''} ${
                        i === 0 ? 'md:sticky md:left-0 md:z-10 md:shadow-[1px_0_0_#475569]' : ''
                      }`}
                    >
                      {i === 0
                        ? search.query || paged.pageCount > 1
                          ? 'TOTALES DEL REPORTE'
                          : 'TOTALES'
                        : report.totals[c.key] !== undefined
                          ? formatCell(c, report.totals[c.key])
                          : ''}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {/* Sombras que indican columnas fuera de vista */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 right-0 hidden w-10 rounded-r-lg bg-linear-to-l from-slate-900/15 to-transparent transition-opacity md:block ${
            edges.right ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 hidden w-6 rounded-l-lg bg-linear-to-r from-slate-900/10 to-transparent transition-opacity md:block ${
            edges.left ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
      <TablePagination {...paged} pageSizeOptions={[25, 50, 100, 200]} itemLabel="filas" />
    </div>
  );
};

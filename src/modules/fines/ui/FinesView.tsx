import React, { useEffect, useMemo, useState } from 'react';
import { Ban, CheckSquare, Gavel, HandCoins, Pencil, Plus, Search, Square, Trash2, UserX } from 'lucide-react';
import { fineApi, FINE_STATUS_LABELS, type Fine, type FineStatus, type FineSummary, type FineType, type FineTypeInput } from '../api/fineApi';
import { directoryApi, type AssociateSummary } from '../../associates/infrastructure/directoryApi';
import { voucherApi, type JournalVoucher } from '../../contabilidad/api/voucherApi';
import { VoucherDetailModal } from '../../contabilidad/ui/components/JournalVouchersView';
import { useAuth } from '../../auth/application/hooks/useAuth';
import { apiErrorMessage } from '../../../shared/infrastructure/http/apiError';
import { formatCOP, formatDate, normalizeText, todayISO } from '../../../shared/lib/format';
import { Alert, PageContainer, PageHeader, StatCard, buttonClass } from '../../../shared/ui/components/PageHeader';
import { FormField, MoneyInput, inputClass, selectClass } from '../../../shared/ui/components/MoneyInput';
import { Modal } from '../../../shared/ui/components/Modal';
import { StatusBadge } from '../../../shared/ui/components/StatusBadge';
import { TablePagination, TableSearchInput, usePagedRows, useTableSearch } from '../../../shared/ui/components/TablePagination';

type Tab = 'multas' | 'registrar' | 'tipos';

/**
 * Multas de asociados: registro de inasistentes, cobro (ingreso 429510), condonación y tipos de multa.
 * Una multa pendiente no afecta la contabilidad; se contabiliza cuando se paga.
 */
export const FinesView: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('FINES_MANAGE');
  const [tab, setTab] = useState<Tab>('multas');
  const [types, setTypes] = useState<FineType[]>([]);
  const [associates, setAssociates] = useState<AssociateSummary[]>([]);
  const [summary, setSummary] = useState<FineSummary | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadTypes = () => fineApi.types().then(setTypes).catch(() => setTypes([]));
  const loadSummary = () => fineApi.summary().then(setSummary).catch(() => setSummary(null));

  useEffect(() => {
    void loadTypes();
    void loadSummary();
    directoryApi.search({ associatesOnly: true }).then(setAssociates).catch(() => setAssociates([]));
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: 'multas', label: 'Multas', icon: <Gavel size={15} />, show: true },
    { id: 'registrar', label: 'Registrar inasistencia', icon: <UserX size={15} />, show: canManage },
    { id: 'tipos', label: 'Tipos de multa', icon: <Pencil size={15} />, show: true },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Multas de asociados"
        subtitle="Inasistencia a reuniones y otras multas. Se contabilizan como ingreso (429510) cuando se pagan."
        icon={<Gavel size={20} />}
      />

      {summary && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          <StatCard label="Pendientes por cobrar" value={formatCOP(summary.pendingTotal, '$0')} hint={`${summary.pendingCount} multa(s)`} tone="warning" />
          <StatCard label="Asociados con multas" value={summary.associatesWithPending} tone="neutral" />
          <StatCard label="Cobradas" value={formatCOP(summary.paidTotal, '$0')} hint={`${summary.paidCount} multa(s)`} tone="positive" />
          <StatCard label="Condonadas" value={formatCOP(summary.voidedTotal, '$0')} hint={`${summary.voidedCount} multa(s)`} />
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px inline-flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {notice && <Alert tone="success" onClose={() => setNotice(null)}>{notice}</Alert>}

      {tab === 'multas' && <FinesList types={types} associates={associates} canManage={canManage} onChanged={loadSummary} />}
      {tab === 'registrar' && canManage && (
        <RegisterAbsences
          types={types.filter((t) => t.active)}
          associates={associates}
          onDone={(msg) => {
            setNotice(msg);
            void loadSummary();
            setTab('multas');
          }}
        />
      )}
      {tab === 'tipos' && <FineTypesManager types={types} canManage={canManage} onChanged={loadTypes} />}
    </PageContainer>
  );
};

// ======================================================================== listado, cobro y condonación

const FinesList: React.FC<{ types: FineType[]; associates: AssociateSummary[]; canManage: boolean; onChanged: () => void }> = ({
  types,
  associates,
  canManage,
  onChanged,
}) => {
  const [status, setStatus] = useState<FineStatus | ''>('PENDING');
  const [partyId, setPartyId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [paying, setPaying] = useState(false);
  const [voiding, setVoiding] = useState<Fine | null>(null);
  const [voucher, setVoucher] = useState<JournalVoucher | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setFines(await fineApi.list({ status: status || undefined, thirdPartyId: partyId || undefined, fineTypeId: typeId || undefined, from: from || undefined, to: to || undefined }));
      setSelected([]);
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudieron cargar las multas.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, partyId, typeId, from, to]);

  const search = useTableSearch(fines, (f) =>
    [f.thirdPartyName, f.thirdPartyDocument, f.fineTypeName, f.description, f.voidReason, f.receiptNumber, FINE_STATUS_LABELS[f.status]].join(' '),
  );
  const visible = search.filtered;
  const paged = usePagedRows(visible, 25);
  const pending = visible.filter((f) => f.status === 'PENDING');
  const selectedFines = fines.filter((f) => selected.includes(f.id));
  const selectedTotal = selectedFines.reduce((s, f) => s + f.amount, 0);
  const listTotal = visible.reduce((s, f) => s + f.amount, 0);
  const allPendingSelected = pending.length > 0 && pending.every((f) => selected.includes(f.id));

  const openVoucher = async (id: string) => {
    try {
      setVoucher(await voucherApi.get(id));
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo abrir el comprobante.'));
    }
  };

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
        <FormField label="Estado" htmlFor="f-status">
          <select id="f-status" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as FineStatus | '')}>
            <option value="">Todas</option>
            <option value="PENDING">Pendientes</option>
            <option value="PAID">Pagadas</option>
            <option value="VOIDED">Condonadas</option>
          </select>
        </FormField>
        <FormField label="Asociado" htmlFor="f-party">
          <select id="f-party" className={selectClass} value={partyId} onChange={(e) => setPartyId(e.target.value)}>
            <option value="">Todos</option>
            {associates.map((a) => (
              <option key={a.id} value={a.id}>{a.fullName}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Tipo de multa" htmlFor="f-type">
          <select id="f-type" className={selectClass} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            <option value="">Todos</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Desde" htmlFor="f-from">
          <input id="f-from" type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
        </FormField>
        <FormField label="Hasta" htmlFor="f-to">
          <input id="f-to" type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
        </FormField>
      </div>

      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <TableSearchInput
          value={search.query}
          onChange={search.setQuery}
          placeholder="Buscar por asociado, documento, multa, detalle o recibo…"
          className="w-full sm:max-w-md sm:flex-1"
        />
        {search.query && (
          <p className="text-xs text-slate-500">
            <strong className="font-semibold text-slate-800">{visible.length}</strong> de {fines.length} multas coinciden
          </p>
        )}
      </div>

      {canManage && pending.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-indigo-900">
            {selected.length > 0
              ? <>Seleccionadas <strong>{selected.length}</strong> multa(s) por <strong>{formatCOP(selectedTotal)}</strong></>
              : 'Seleccione las multas pendientes que va a cobrar.'}
          </p>
          <button type="button" className={buttonClass.primary} disabled={selected.length === 0} onClick={() => setPaying(true)}>
            <HandCoins size={16} /> Cobrar seleccionadas
          </button>
        </div>
      )}

      <div className="table-scroll rounded-xl border border-slate-200 bg-white">
        <table className="table-stack w-full min-w-[860px] border-collapse text-sm">
          <thead className="bg-slate-800 text-white">
            <tr>
              {canManage && (
                <th className="w-10 px-3 py-2.5">
                  {pending.length > 0 && (
                    <button
                      type="button"
                      aria-label={allPendingSelected ? 'Quitar selección' : 'Seleccionar todas las pendientes'}
                      className="cursor-pointer"
                      onClick={() => setSelected(allPendingSelected ? [] : pending.map((f) => f.id))}
                    >
                      {allPendingSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  )}
                </th>
              )}
              {['Fecha', 'Asociado', 'Multa', 'Detalle', 'Estado', 'Recibo'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide">{h}</th>
              ))}
              <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide">Valor</th>
              {canManage && <th className="px-3 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">Cargando multas…</td></tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  {search.query ? `Ninguna multa coincide con «${search.query}».` : 'No hay multas para los filtros seleccionados.'}
                </td>
              </tr>
            ) : (
              paged.pageRows.map((f) => (
                <tr key={f.id} className={`border-b border-slate-100 ${selected.includes(f.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                  {canManage && (
                    <td className="px-3 py-2">
                      {f.status === 'PENDING' && (
                        <input
                          type="checkbox"
                          className="size-4 cursor-pointer"
                          aria-label={`Seleccionar multa de ${f.thirdPartyName}`}
                          checked={selected.includes(f.id)}
                          onChange={(e) => setSelected((s) => (e.target.checked ? [...s, f.id] : s.filter((x) => x !== f.id)))}
                        />
                      )}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-3 py-2">{formatDate(f.fineDate)}</td>
                  <td className="min-w-[200px] px-3 py-2">
                    <span className="font-semibold text-slate-800">{f.thirdPartyName}</span>
                    <span className="block text-xs text-slate-500">{f.thirdPartyDocument}</span>
                  </td>
                  <td className="px-3 py-2">{f.fineTypeName}</td>
                  <td className="min-w-[160px] px-3 py-2 text-xs text-slate-600">{f.status === 'VOIDED' ? `Condonada: ${f.voidReason ?? ''}` : f.description ?? ''}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={f.status} label={FINE_STATUS_LABELS[f.status]} tone={f.status === 'PENDING' ? 'warning' : f.status === 'PAID' ? 'success' : 'neutral'} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {f.receiptNumber && f.voucherId ? (
                      <button type="button" className="cursor-pointer font-mono text-xs text-indigo-700 underline decoration-dotted" onClick={() => openVoucher(f.voucherId!)}>
                        {f.receiptNumber}
                      </button>
                    ) : f.receiptNumber ? <span className="font-mono text-xs">{f.receiptNumber}</span> : '—'}
                    {f.paidDate && <span className="block text-[11px] text-slate-500">{formatDate(f.paidDate)}</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">{formatCOP(f.amount)}</td>
                  {canManage && (
                    <td className="px-3 py-2 text-right">
                      {f.status === 'PENDING' && (
                        <button type="button" className={buttonClass.ghost} onClick={() => setVoiding(f)}>
                          <Ban size={14} /> Condonar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {visible.length > 0 && (
            <tfoot>
              <tr className="bg-slate-900 font-bold text-white">
                <td colSpan={canManage ? 7 : 6} className="px-3 py-2.5 text-xs uppercase">Total ({visible.length})</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{formatCOP(listTotal)}</td>
                {canManage && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {!loading && <TablePagination {...paged} itemLabel="multas" />}

      <PayFinesModal
        open={paying}
        fines={selectedFines}
        onClose={() => setPaying(false)}
        onPaid={() => {
          setPaying(false);
          void load();
          onChanged();
        }}
      />
      <VoidFineModal
        fine={voiding}
        onClose={() => setVoiding(null)}
        onVoided={() => {
          setVoiding(null);
          void load();
          onChanged();
        }}
      />
      <VoucherDetailModal voucher={voucher} onClose={() => setVoucher(null)} onReversed={() => { setVoucher(null); void load(); onChanged(); }} />
    </section>
  );
};

const PayFinesModal: React.FC<{ open: boolean; fines: Fine[]; onClose: () => void; onPaid: () => void }> = ({ open, fines, onClose, onPaid }) => {
  const [date, setDate] = useState(todayISO());
  const [account, setAccount] = useState('110505');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string[] | null>(null);
  const total = fines.reduce((s, f) => s + f.amount, 0);
  const people = new Set(fines.map((f) => f.thirdPartyId)).size;

  useEffect(() => {
    if (open) {
      setError(null);
      setDone(null);
    }
  }, [open]);

  const pay = async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await fineApi.pay({ fineIds: fines.map((f) => f.id), paymentDate: date, cashAccountCode: account });
      setDone(r.receipts);
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo registrar el cobro.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={done ? onPaid : onClose}
      locked={saving}
      size="md"
      title={done ? 'Multas cobradas' : 'Cobrar multas'}
      subtitle={done ? undefined : `${fines.length} multa(s) de ${people} asociado(s)`}
      footer={
        done ? (
          <button type="button" className={buttonClass.primary} onClick={onPaid}>Listo</button>
        ) : (
          <>
            <button type="button" className={buttonClass.secondary} onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="button" className={buttonClass.primary} onClick={pay} disabled={saving || fines.length === 0}>
              {saving ? 'Registrando…' : `Cobrar ${formatCOP(total)}`}
            </button>
          </>
        )
      }
    >
      {done ? (
        <Alert tone="success">
          Se registraron {done.length} comprobante(s) de ingreso: {done.join(', ')}. Ya aparecen en la columna Multas de la planilla de recaudos.
        </Alert>
      ) : (
        <div className="flex flex-col gap-3">
          {error && <Alert tone="error">{error}</Alert>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Fecha de pago" htmlFor="p-date">
              <input id="p-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
            </FormField>
            <FormField label="Recibido en" htmlFor="p-account">
              <select id="p-account" className={selectClass} value={account} onChange={(e) => setAccount(e.target.value)}>
                <option value="110505">Caja general (110505)</option>
                <option value="112005">Bancos (112005)</option>
              </select>
            </FormField>
          </div>
          <p className="text-xs text-slate-500">
            Se crea un comprobante de ingreso por asociado: débito a caja/bancos y crédito a 429510 Multas e inasistencia.
          </p>
          <ul className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 text-sm">
            {fines.map((f) => (
              <li key={f.id} className="flex justify-between gap-3 border-b border-slate-100 px-3 py-2 last:border-0">
                <span className="min-w-0">{f.thirdPartyName} · <span className="text-slate-500">{f.fineTypeName} {formatDate(f.fineDate)}</span></span>
                <span className="shrink-0 tabular-nums">{formatCOP(f.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
};

const VoidFineModal: React.FC<{ fine: Fine | null; onClose: () => void; onVoided: () => void }> = ({ fine, onClose, onVoided }) => {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setReason('');
    setError(null);
  }, [fine]);
  if (!fine) return null;
  const confirm = async () => {
    if (!reason.trim()) return setError('Indique el motivo de la condonación.');
    setSaving(true);
    try {
      await fineApi.void(fine.id, reason.trim());
      onVoided();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo condonar la multa.'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      locked={saving}
      size="sm"
      title="Condonar multa"
      subtitle={`${fine.thirdPartyName} · ${fine.fineTypeName} · ${formatCOP(fine.amount)}`}
      footer={
        <>
          <button type="button" className={buttonClass.secondary} onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="button" className={buttonClass.danger} onClick={confirm} disabled={saving}>{saving ? 'Guardando…' : 'Condonar'}</button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {error && <Alert tone="error">{error}</Alert>}
        <FormField label="Motivo" htmlFor="v-reason">
          <input id="v-reason" className={inputClass} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej.: excusa justificada, calamidad doméstica" />
        </FormField>
      </div>
    </Modal>
  );
};

// ======================================================================== registro de inasistentes

const RegisterAbsences: React.FC<{ types: FineType[]; associates: AssociateSummary[]; onDone: (message: string) => void }> = ({
  types,
  associates,
  onDone,
}) => {
  const [typeId, setTypeId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);

  useEffect(() => {
    if (!typeId && types.length > 0) setTypeId(types[0].id);
  }, [types, typeId]);

  const type = types.find((t) => t.id === typeId);
  useEffect(() => setAmount(type?.amount ?? null), [type]);

  const active = useMemo(() => associates.filter((a) => a.status !== 'INACTIVE'), [associates]);
  const q = normalizeText(query);
  const visible = q ? active.filter((a) => normalizeText(`${a.fullName} ${a.identificationNumber} ${a.associateCode ?? ''}`).includes(q)) : active;
  const allVisibleSelected = visible.length > 0 && visible.every((a) => selected.includes(a.id));

  const toggleVisible = () =>
    setSelected((s) => (allVisibleSelected ? s.filter((id) => !visible.some((a) => a.id === id)) : [...new Set([...s, ...visible.map((a) => a.id)])]));

  const save = async () => {
    setError(null);
    setSkipped([]);
    if (!type) return setError('Seleccione el tipo de multa.');
    if (!amount || amount <= 0) return setError('Ingrese el valor de la multa.');
    if (selected.length === 0) return setError('Marque los asociados que no asistieron.');
    setSaving(true);
    try {
      const r = await fineApi.register({
        fineTypeId: type.id,
        fineDate: date,
        description: description.trim() || undefined,
        amount: amount !== type.amount ? amount : undefined,
        thirdPartyIds: selected,
      });
      if (r.skipped.length > 0 && r.created === 0) {
        setSkipped(r.skipped);
        return;
      }
      onDone(`Se registraron ${r.created} multa(s) por ${formatCOP(r.total)}.` + (r.skipped.length ? ` Omitidas por estar ya registradas: ${r.skipped.length}.` : ''));
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudieron registrar las multas.'));
    } finally {
      setSaving(false);
    }
  };

  if (types.length === 0) {
    return <Alert tone="info">No hay tipos de multa activos. Créelos en la pestaña “Tipos de multa”.</Alert>;
  }

  return (
    <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 xl:self-start">
        <h3 className="text-sm font-bold text-slate-900">Datos de la reunión</h3>
        <FormField label="Tipo de multa" htmlFor="r-type">
          <select id="r-type" className={selectClass} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name} · {formatCOP(t.amount)}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Fecha de la reunión" htmlFor="r-date">
          <input id="r-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
        <FormField label="Valor por asociado" htmlFor="r-amount" hint={type && amount !== type.amount ? `El valor del tipo es ${formatCOP(type.amount)}` : undefined}>
          <MoneyInput id="r-amount" value={amount} onChange={setAmount} />
        </FormField>
        <FormField label="Detalle (opcional)" htmlFor="r-desc">
          <input id="r-desc" className={inputClass} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej.: Asamblea ordinaria de abril" />
        </FormField>
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex justify-between"><span className="text-slate-600">Inasistentes marcados</span><strong>{selected.length}</strong></div>
          <div className="flex justify-between"><span className="text-slate-600">Total a registrar</span><strong className="tabular-nums">{formatCOP((amount ?? 0) * selected.length, '$0')}</strong></div>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        {skipped.length > 0 && (
          <Alert tone="warning">Estas multas ya estaban registradas para esa fecha: {skipped.join('; ')}</Alert>
        )}
        <button type="button" className={buttonClass.primary} onClick={save} disabled={saving}>
          <Gavel size={16} /> {saving ? 'Registrando…' : `Registrar ${selected.length} multa(s)`}
        </button>
        <p className="text-xs text-slate-500">Las multas quedan pendientes; se cobran aquí o en el recibo de cuota del asociado.</p>
      </div>

      <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold text-slate-900">Marque los asociados que no asistieron</h3>
          <button type="button" className={buttonClass.ghost} onClick={toggleVisible}>
            {allVisibleSelected ? <CheckSquare size={14} /> : <Square size={14} />} {allVisibleSelected ? 'Desmarcar' : 'Marcar'} {q ? 'resultados' : 'todos'}
          </button>
        </div>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputClass} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, documento o código" aria-label="Buscar asociado" />
        </div>
        <ul className="grid max-h-[520px] grid-cols-1 gap-1.5 overflow-y-auto pr-1 md:grid-cols-2">
          {visible.map((a) => {
            const on = selected.includes(a.id);
            return (
              <li key={a.id}>
                <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${on ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={on}
                    onChange={(e) => setSelected((s) => (e.target.checked ? [...s, a.id] : s.filter((x) => x !== a.id)))}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-800">{a.fullName}</span>
                    <span className="block text-xs text-slate-500">{a.identificationNumber}</span>
                  </span>
                </label>
              </li>
            );
          })}
          {visible.length === 0 && <li className="py-6 text-center text-sm text-slate-500 md:col-span-2">Sin asociados para la búsqueda.</li>}
        </ul>
      </div>
    </section>
  );
};

// ======================================================================== tipos de multa

const EMPTY_TYPE: FineTypeInput = { name: '', description: '', amount: 5000, active: true };

const FineTypesManager: React.FC<{ types: FineType[]; canManage: boolean; onChanged: () => void }> = ({ types, canManage, onChanged }) => {
  const [editing, setEditing] = useState<{ id?: string; data: FineTypeInput } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!editing) return;
    if (!editing.data.name.trim()) return setError('Indique el nombre de la multa.');
    if (!editing.data.amount || editing.data.amount <= 0) return setError('Indique el valor.');
    setSaving(true);
    setError(null);
    try {
      if (editing.id) await fineApi.updateType(editing.id, editing.data);
      else await fineApi.createType(editing.data);
      setEditing(null);
      onChanged();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo guardar la multa.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: FineType) => {
    const msg = t.used
      ? `"${t.name}" ya tiene multas registradas: se desactivará y dejará de ofrecerse. ¿Continuar?`
      : `¿Eliminar el tipo de multa "${t.name}"?`;
    if (!window.confirm(msg)) return;
    try {
      await fineApi.deleteType(t.id);
      onChanged();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo eliminar.'));
    }
  };

  return (
    <section className="flex min-w-0 flex-col gap-3">
      {error && !editing && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}
      {canManage && (
        <div className="flex justify-end">
          <button type="button" className={buttonClass.primary} onClick={() => { setError(null); setEditing({ data: { ...EMPTY_TYPE } }); }}>
            <Plus size={16} /> Nueva multa
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {types.map((t) => (
          <div key={t.id} className={`flex flex-col gap-2 rounded-xl border bg-white p-4 ${t.active ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-70'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-slate-900">{t.name}</p>
                {t.description && <p className="text-xs text-slate-500">{t.description}</p>}
              </div>
              <StatusBadge status={t.active ? 'ACTIVE' : 'INACTIVE'} label={t.active ? 'Activa' : 'Inactiva'} />
            </div>
            <p className="text-2xl font-extrabold tabular-nums text-slate-900">{formatCOP(t.amount)}</p>
            <p className="text-[11px] text-slate-500">Cuenta contable al cobrar: 429510 Multas e inasistencia</p>
            {canManage && (
              <div className="mt-1 flex gap-2 border-t border-slate-100 pt-2">
                <button type="button" className={buttonClass.ghost} onClick={() => { setError(null); setEditing({ id: t.id, data: { name: t.name, description: t.description ?? '', amount: t.amount, active: t.active } }); }}>
                  <Pencil size={14} /> Editar
                </button>
                <button type="button" className={buttonClass.ghost} onClick={() => remove(t)}>
                  <Trash2 size={14} /> {t.used ? 'Desactivar' : 'Eliminar'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        locked={saving}
        size="sm"
        title={editing?.id ? 'Editar multa' : 'Nueva multa'}
        subtitle="El valor se aplica a las multas nuevas; las ya registradas conservan su valor"
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setEditing(null)} disabled={saving}>Cancelar</button>
            <button type="button" className={buttonClass.primary} onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </>
        }
      >
        {editing && (
          <div className="flex flex-col gap-3">
            {error && <Alert tone="error">{error}</Alert>}
            <FormField label="Nombre" htmlFor="t-name">
              <input id="t-name" className={inputClass} maxLength={120} value={editing.data.name} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, name: e.target.value } })} placeholder="Ej.: Llegada tarde" />
            </FormField>
            <FormField label="Valor" htmlFor="t-amount">
              <MoneyInput id="t-amount" value={editing.data.amount} onChange={(v) => setEditing({ ...editing, data: { ...editing.data, amount: v ?? 0 } })} />
            </FormField>
            <FormField label="Descripción (opcional)" htmlFor="t-desc">
              <input id="t-desc" className={inputClass} maxLength={300} value={editing.data.description ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, description: e.target.value } })} />
            </FormField>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="size-4" checked={editing.data.active} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, active: e.target.checked } })} />
              Activa (se ofrece al registrar multas)
            </label>
          </div>
        )}
      </Modal>
    </section>
  );
};

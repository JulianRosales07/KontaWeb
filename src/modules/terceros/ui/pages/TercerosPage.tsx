import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText, HandCoins, Pencil, Plus, Power, Upload, Users } from 'lucide-react';
import { NuevoTerceroForm } from '../components/NuevoTerceroForm';
import { AssociateStatementModal } from '../../../associates/ui/components/AssociateStatementModal';
import { directoryApi, ID_TYPES, idTypeLabel, type AssociateSummary, type DirectoryFilters } from '../../../associates/infrastructure/directoryApi';
import { httpClient } from '../../../../shared/infrastructure/http/httpClient';
import { CreateLoanModal } from '../../../loans/ui/CreateLoanModal';
import { NewLoanPaymentModal } from '../../../loans/ui/NewLoanPaymentModal';
import { useAuth } from '../../../auth/application/hooks/useAuth';
import { apiErrorMessage } from '../../../../shared/infrastructure/http/apiError';
import { formatCOP } from '../../../../shared/lib/format';
import { Alert, PageContainer, PageHeader, StatCard, buttonClass } from '../../../../shared/ui/components/PageHeader';
import { SearchFilterBar } from '../../../../shared/ui/components/SearchFilterBar';
import { ResponsiveTable, type TableColumn } from '../../../../shared/ui/components/ResponsiveTable';
import { StatusBadge } from '../../../../shared/ui/components/StatusBadge';
import { ConfirmationModal, Modal } from '../../../../shared/ui/components/Modal';
import { FormField, inputClass, selectClass } from '../../../../shared/ui/components/MoneyInput';

/** Clave de la versión anterior (directorio guardado solo en el navegador). */
export const THIRD_PARTIES_STORAGE_KEY = 'konta_third_parties_v1';
const LOCAL_IMPORTED_FLAG = 'konta_local_parties_imported_v1';
const DEMO_IDS = new Set(['asoc-1', 'asoc-2', 'asoc-3', '1', '2', '3', '4']);

interface LocalParty {
  id?: string;
  name: string;
  idType?: string;
  idNumber: string;
  dv?: string;
  email?: string;
  phone?: string;
  address?: string;
  classification?: string;
  status?: string;
}

const LOCAL_ID_TYPES: Record<string, string> = {
  'Cédula de ciudadanía': 'CC',
  'Cédula de extranjería': 'CE',
  'Tarjeta de identidad': 'TI',
  Pasaporte: 'PASAPORTE',
  NIT: 'NIT',
};

function readLocalParties(): LocalParty[] {
  if (localStorage.getItem(LOCAL_IMPORTED_FLAG) === 'true') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(THIRD_PARTIES_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((p: LocalParty) => p?.idNumber && p?.name && !DEMO_IDS.has(String(p.id))) : [];
  } catch {
    return [];
  }
}

type TriState = '' | 'true' | 'false';

interface TercerosPageProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const TercerosPage: React.FC<TercerosPageProps> = ({ initialTab = 'listado', onTabChange }) => {
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState<AssociateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [idType, setIdType] = useState('');
  const [scope, setScope] = useState<'associates' | 'all'>('associates');
  const [hasLoan, setHasLoan] = useState<TriState>('');
  const [hasSavings, setHasSavings] = useState<TriState>('');
  const [hasContributions, setHasContributions] = useState<TriState>('');

  const [statementId, setStatementId] = useState<string | null>(null);
  const [loanFor, setLoanFor] = useState<AssociateSummary | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editing, setEditing] = useState<AssociateSummary | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AssociateSummary | null>(null);
  const [localParties, setLocalParties] = useState<LocalParty[]>(readLocalParties);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(h);
  }, [search]);

  const filters = useMemo<DirectoryFilters>(
    () => ({
      q: debounced.trim() || undefined,
      status: status || undefined,
      idType: idType || undefined,
      associatesOnly: scope === 'associates',
      hasLoan: hasLoan === '' ? undefined : hasLoan === 'true',
      hasSavings: hasSavings === '' ? undefined : hasSavings === 'true',
      hasContributions: hasContributions === '' ? undefined : hasContributions === 'true',
    }),
    [debounced, status, idType, scope, hasLoan, hasSavings, hasContributions]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await directoryApi.search(filters));
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo cargar el directorio.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (initialTab !== 'nuevo') void load();
  }, [load, initialTab]);

  const activeFilters = [status !== 'ACTIVE', !!idType, scope !== 'associates', !!hasLoan, !!hasSavings, !!hasContributions].filter(Boolean).length;
  const clearFilters = () => {
    setStatus('ACTIVE');
    setIdType('');
    setScope('associates');
    setHasLoan('');
    setHasSavings('');
    setHasContributions('');
  };

  const exportCsv = () => {
    const header = ['CODIGO', 'NOMBRE', 'TIPO_DOC', 'DOCUMENTO', 'CORREO', 'TELEFONO', 'ESTADO', 'PRESTAMOS_ACTIVOS', 'SALDO_PRESTAMOS', 'APORTES', 'AHORROS'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map((r) =>
      [r.associateCode, r.fullName, r.idType, r.identificationNumber, r.email, r.phone, r.status, r.activeLoans, r.loansBalance, r.contributions, r.savings].map(esc).join(';')
    );
    const blob = new Blob(['﻿' + [header.join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asociados.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const runImport = async () => {
    setBusy(true);
    try {
      const res = await directoryApi.importLocal(
        localParties.map((p) => ({
          identificationNumber: p.idNumber,
          fullName: p.name,
          dv: p.dv,
          idType: p.idType ? LOCAL_ID_TYPES[p.idType] ?? p.idType : undefined,
          email: p.email,
          phone: p.phone,
          address: p.address,
          classification: p.classification,
          status: p.status,
        }))
      );
      localStorage.setItem(LOCAL_IMPORTED_FLAG, 'true');
      setLocalParties([]);
      setNotice(`${res.imported} tercero(s) importado(s); ${res.skipped} ya existían.`);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo importar.'));
    } finally {
      setBusy(false);
      setImportOpen(false);
    }
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    setBusy(true);
    try {
      const current = (await httpClient.get(`/parties/${toggleTarget.id}`)).data;
      await directoryApi.updateParty(toggleTarget.id, { ...current, status: toggleTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
      setNotice(`${toggleTarget.fullName} quedó ${toggleTarget.status === 'ACTIVE' ? 'inactivo' : 'activo'}.`);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusy(false);
      setToggleTarget(null);
    }
  };

  const actions = (r: AssociateSummary) => (
    <div className="flex flex-wrap justify-end gap-1">
      <button type="button" className={buttonClass.ghost} onClick={() => setStatementId(r.id)} title="Estado de cuenta">
        <FileText size={14} /> Estado de cuenta
      </button>
      {hasPermission('LOANS_CREATE') && r.status === 'ACTIVE' && (
        <button type="button" className={buttonClass.ghost} onClick={() => setLoanFor(r)}>
          <Plus size={14} /> Préstamo
        </button>
      )}
      {hasPermission('ASSOCIATES_UPDATE') && (
        <>
          <button type="button" className={buttonClass.ghost} onClick={() => setEditing(r)}>
            <Pencil size={14} /> Editar
          </button>
          <button type="button" className={buttonClass.ghost} onClick={() => setToggleTarget(r)}>
            <Power size={14} /> {r.status === 'ACTIVE' ? 'Inactivar' : 'Activar'}
          </button>
        </>
      )}
    </div>
  );

  const columns: TableColumn<AssociateSummary>[] = [
    {
      key: 'name',
      header: 'Asociado',
      hideOnMobile: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{r.fullName}</p>
          <p className="text-xs text-slate-500">{r.associateCode ? `Código ${r.associateCode}` : r.classification ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'doc',
      header: 'Documento',
      render: (r) => (
        <span className="whitespace-nowrap">
          <span className="text-xs text-slate-500">{r.idType ?? ''} </span>
          {r.identificationNumber}
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'Contacto',
      render: (r) => (
        <div className="min-w-0 text-right md:text-left">
          <p className="break-all text-xs">{r.email || '—'}</p>
          <p className="text-xs text-slate-500">{r.phone || ''}</p>
        </div>
      ),
    },
    {
      key: 'loans',
      header: 'Préstamos',
      align: 'right',
      render: (r) => (r.activeLoans > 0 ? <span>{r.activeLoans} · {formatCOP(r.loansBalance)}</span> : <span className="text-slate-400">—</span>),
    },
    { key: 'contributions', header: 'Aportes', align: 'right', render: (r) => formatCOP(r.contributions, '$0') },
    { key: 'savings', header: 'Ahorros', align: 'right', render: (r) => formatCOP(r.savings, '$0') },
    { key: 'status', header: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', align: 'right', hideOnMobile: true, render: actions },
  ];

  if (initialTab === 'nuevo') {
    return (
      <PageContainer>
        <NuevoTerceroForm
          onCancel={() => onTabChange?.('listado')}
          onSuccess={(p) => {
            setNotice(`"${p.name ?? p.fullName}" registrado correctamente.`);
            onTabChange?.('listado');
          }}
        />
      </PageContainer>
    );
  }

  const totals = {
    count: rows.length,
    withLoans: rows.filter((r) => r.activeLoans > 0).length,
    contributions: rows.reduce((s, r) => s + r.contributions, 0),
    savings: rows.reduce((s, r) => s + r.savings, 0),
  };

  return (
    <PageContainer>
      <PageHeader
        title="Listado de asociados"
        subtitle="Directorio central de asociados con sus préstamos, aportes y ahorros."
        icon={<Users size={20} />}
        actions={
          <>
            {localParties.length > 0 && hasPermission('ASSOCIATES_CREATE') && (
              <button type="button" className={buttonClass.secondary} onClick={() => setImportOpen(true)}>
                <Upload size={16} /> Importar {localParties.length} local(es)
              </button>
            )}
            <button type="button" className={buttonClass.secondary} onClick={exportCsv} disabled={rows.length === 0}>
              <Download size={16} /> Exportar
            </button>
            {hasPermission('COLLECTIONS_CREATE') && (
              <button type="button" className={buttonClass.secondary} onClick={() => setPaymentOpen(true)}>
                <HandCoins size={16} /> Abono
              </button>
            )}
            {hasPermission('ASSOCIATES_CREATE') && (
              <button type="button" className={buttonClass.primary} onClick={() => onTabChange?.('nuevo')}>
                <Plus size={16} /> Nuevo asociado
              </button>
            )}
          </>
        }
      />

      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert tone="success" onClose={() => setNotice(null)}>{notice}</Alert>}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <StatCard label="Resultados" value={totals.count} />
        <StatCard label="Con préstamo activo" value={totals.withLoans} />
        <StatCard label="Aportes" value={formatCOP(totals.contributions, '$0')} tone="primary" />
        <StatCard label="Ahorros" value={formatCOP(totals.savings, '$0')} tone="primary" />
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar asociado… (nombre, apellido, documento, correo, teléfono o código)"
        activeFilters={activeFilters}
        onClear={clearFilters}
      >
        <FormField label="Estado">
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </FormField>
        <FormField label="Tipo documento">
          <select className={selectClass} value={idType} onChange={(e) => setIdType(e.target.value)}>
            <option value="">Todos</option>
            {ID_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Tiene préstamo">
          <TriSelect value={hasLoan} onChange={setHasLoan} />
        </FormField>
        <FormField label="Tiene ahorro">
          <TriSelect value={hasSavings} onChange={setHasSavings} />
        </FormField>
        <FormField label="Tiene aportes">
          <TriSelect value={hasContributions} onChange={setHasContributions} />
        </FormField>
        <FormField label="Mostrar">
          <select className={selectClass} value={scope} onChange={(e) => setScope(e.target.value as 'associates' | 'all')}>
            <option value="associates">Solo asociados</option>
            <option value="all">Todos los terceros</option>
          </select>
        </FormField>
      </SearchFilterBar>

      <ResponsiveTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        minWidth={1050}
        cardTitle={(r) => (
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="block">{r.fullName}</span>
              {r.associateCode && <span className="block text-xs font-normal text-slate-500">Código {r.associateCode}</span>}
            </span>
          </span>
        )}
        cardActions={actions}
        emptyMessage={debounced ? `No se encontraron asociados para "${debounced}".` : 'No hay asociados con los filtros seleccionados.'}
      />

      {statementId && <AssociateStatementModal isOpen={!!statementId} onClose={() => setStatementId(null)} thirdPartyId={statementId} />}
      <CreateLoanModal
        open={!!loanFor}
        initialAssociate={loanFor}
        onClose={() => setLoanFor(null)}
        onCreated={(loan) => {
          setLoanFor(null);
          setNotice(`Préstamo ${loan.loanNumber} creado para ${loan.thirdPartyName}.`);
          void load();
        }}
      />
      <NewLoanPaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} onRegistered={() => void load()} />
      <EditAssociateModal
        associate={editing}
        onClose={() => setEditing(null)}
        onSaved={(name) => {
          setEditing(null);
          setNotice(`${name} actualizado.`);
          void load();
        }}
      />
      <ConfirmationModal
        open={!!toggleTarget}
        title={toggleTarget?.status === 'ACTIVE' ? 'Inactivar asociado' : 'Activar asociado'}
        message={
          toggleTarget?.status === 'ACTIVE'
            ? `¿Inactivar a ${toggleTarget?.fullName}? No podrá recibir nuevos préstamos; su historial se conserva.`
            : `¿Activar nuevamente a ${toggleTarget?.fullName}?`
        }
        tone={toggleTarget?.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={busy}
        onConfirm={confirmToggle}
        onCancel={() => setToggleTarget(null)}
      />
      <ConfirmationModal
        open={importOpen}
        title="Importar terceros guardados en este navegador"
        confirmLabel="Importar"
        loading={busy}
        onCancel={() => setImportOpen(false)}
        onConfirm={runImport}
        message={
          <div className="flex flex-col gap-2">
            <p>Se registrarán en el servidor (por número de documento; los existentes no se duplican):</p>
            <ul className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 text-xs">
              {localParties.map((p) => (
                <li key={p.idNumber} className="flex justify-between gap-2 border-b border-slate-100 px-3 py-1.5 last:border-0">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className="shrink-0">{p.idNumber}</span>
                </li>
              ))}
            </ul>
          </div>
        }
      />
    </PageContainer>
  );
};

const TriSelect: React.FC<{ value: TriState; onChange: (v: TriState) => void }> = ({ value, onChange }) => (
  <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value as TriState)}>
    <option value="">Indiferente</option>
    <option value="true">Sí</option>
    <option value="false">No</option>
  </select>
);

const EditAssociateModal: React.FC<{ associate: AssociateSummary | null; onClose: () => void; onSaved: (name: string) => void }> = ({
  associate,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState({ fullName: '', idType: '', email: '', phone: '', address: '', associateCode: '', associate: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (associate) {
      setForm({
        fullName: associate.fullName,
        idType: associate.idType ?? '',
        email: associate.email ?? '',
        phone: associate.phone ?? '',
        address: associate.address ?? '',
        associateCode: associate.associateCode ?? '',
        associate: associate.associate,
      });
      setError(null);
    }
  }, [associate]);

  const save = async () => {
    if (!associate) return;
    if (!form.fullName.trim()) return setError('El nombre es obligatorio.');
    setSaving(true);
    try {
      const current = (await httpClient.get(`/parties/${associate.id}`)).data;
      await directoryApi.updateParty(associate.id, {
        ...current,
        fullName: form.fullName.trim(),
        idType: form.idType || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        associateCode: form.associateCode.trim() || undefined,
        associate: form.associate,
      });
      onSaved(form.fullName.trim());
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo actualizar.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!associate}
      onClose={onClose}
      locked={saving}
      title="Editar asociado"
      subtitle={associate ? `${idTypeLabel(associate.idType)} ${associate.identificationNumber}` : undefined}
      footer={
        <>
          <button type="button" className={buttonClass.secondary} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className={buttonClass.primary} onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {error && (
          <div className="sm:col-span-2">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        <FormField label="Nombre completo" required className="sm:col-span-2">
          <input className={inputClass} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </FormField>
        <FormField label="Tipo de documento">
          <select className={selectClass} value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })}>
            <option value="">Sin especificar</option>
            {ID_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Código de asociado">
          <input className={inputClass} value={form.associateCode} maxLength={30} onChange={(e) => setForm({ ...form, associateCode: e.target.value })} />
        </FormField>
        <FormField label="Correo">
          <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </FormField>
        <FormField label="Teléfono">
          <input type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </FormField>
        <FormField label="Dirección" className="sm:col-span-2">
          <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </FormField>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={form.associate} onChange={(e) => setForm({ ...form, associate: e.target.checked })} />
          Es asociado de la organización
        </label>
      </div>
    </Modal>
  );
};

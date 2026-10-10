import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { investmentApi, type Investment, type InvestmentInput } from '../../api/reportApi';
import { apiErrorMessage } from '../../../../shared/infrastructure/http/apiError';
import { formatCOP, formatDate, formatPercent } from '../../../../shared/lib/format';
import { Alert, buttonClass } from '../../../../shared/ui/components/PageHeader';
import { FormField, MoneyInput, NumberInput, inputClass, selectClass } from '../../../../shared/ui/components/MoneyInput';
import { Modal } from '../../../../shared/ui/components/Modal';

const EMPTY: InvestmentInput = {
  entityName: '',
  instrumentType: 'CDT',
  instrumentNumber: '',
  accountCode: '122505',
  principal: null as unknown as number,
  accruedInterest: null as unknown as number,
  annualRate: null,
  startDate: '',
  maturityDate: '',
  status: 'ACTIVE',
  notes: '',
};

/**
 * Registro mínimo de inversiones (CDT): entidad, número, tasa y fechas. El saldo contable sigue en la cuenta PUC;
 * el reporte de inversiones compara ambos.
 */
export const InvestmentsManager: React.FC<{ open: boolean; onClose: () => void; canEdit: boolean; onChanged: () => void }> = ({
  open,
  onClose,
  canEdit,
  onChanged,
}) => {
  const [items, setItems] = useState<Investment[]>([]);
  const [editing, setEditing] = useState<{ id?: string; data: InvestmentInput } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => investmentApi.list().then(setItems).catch((e) => setError(apiErrorMessage(e, 'No se pudieron cargar las inversiones.')));

  useEffect(() => {
    if (open) {
      setEditing(null);
      setError(null);
      void load();
    }
  }, [open]);

  const save = async () => {
    if (!editing) return;
    const d = editing.data;
    if (!d.entityName.trim() || d.principal == null) {
      setError('Indique la entidad y el capital.');
      return;
    }
    setSaving(true);
    setError(null);
    const body: InvestmentInput = {
      ...d,
      accruedInterest: d.accruedInterest ?? 0,
      startDate: d.startDate || null,
      maturityDate: d.maturityDate || null,
      instrumentNumber: d.instrumentNumber || null,
      notes: d.notes || null,
    };
    try {
      if (editing.id) await investmentApi.update(editing.id, body);
      else await investmentApi.create(body);
      setEditing(null);
      await load();
      onChanged();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo guardar la inversión.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (inv: Investment) => {
    if (!window.confirm(`¿Eliminar el registro de ${inv.entityName}? La contabilidad no cambia.`)) return;
    try {
      await investmentApi.remove(inv.id);
      await load();
      onChanged();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo eliminar.'));
    }
  };

  const set = (patch: Partial<InvestmentInput>) => editing && setEditing({ ...editing, data: { ...editing.data, ...patch } });

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={saving}
      size="lg"
      title="Registro de inversiones"
      subtitle="Datos del título; el saldo contable vive en la cuenta PUC del grupo 12"
      footer={
        editing ? (
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setEditing(null)} disabled={saving}>Cancelar</button>
            <button type="button" className={buttonClass.primary} onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </>
        ) : (
          <>
            <button type="button" className={buttonClass.secondary} onClick={onClose}>Cerrar</button>
            {canEdit && (
              <button type="button" className={buttonClass.primary} onClick={() => setEditing({ data: { ...EMPTY } })}>
                <Plus size={16} /> Nueva inversión
              </button>
            )}
          </>
        )
      }
    >
      <div className="flex min-w-0 flex-col gap-4">
        {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}
        {editing ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Entidad" htmlFor="inv-entity">
              <input id="inv-entity" className={inputClass} value={editing.data.entityName} onChange={(e) => set({ entityName: e.target.value })} />
            </FormField>
            <FormField label="Tipo" htmlFor="inv-type">
              <select id="inv-type" className={selectClass} value={editing.data.instrumentType} onChange={(e) => set({ instrumentType: e.target.value })}>
                <option value="CDT">CDT</option>
                <option value="BONO">Bono</option>
                <option value="FONDO">Fondo de inversión</option>
                <option value="OTRA">Otra</option>
              </select>
            </FormField>
            <FormField label="Número del título" htmlFor="inv-number">
              <input id="inv-number" className={inputClass} value={editing.data.instrumentNumber ?? ''} onChange={(e) => set({ instrumentNumber: e.target.value })} />
            </FormField>
            <FormField label="Cuenta PUC" htmlFor="inv-account" hint="Grupo 12, p. ej. 122505">
              <input id="inv-account" className={inputClass} inputMode="numeric" value={editing.data.accountCode} onChange={(e) => set({ accountCode: e.target.value.replace(/\D/g, '') })} />
            </FormField>
            <FormField label="Capital" htmlFor="inv-principal">
              <MoneyInput id="inv-principal" value={editing.data.principal} onChange={(v) => set({ principal: v as number })} />
            </FormField>
            <FormField label="Intereses causados" htmlFor="inv-interest">
              <MoneyInput id="inv-interest" value={editing.data.accruedInterest} onChange={(v) => set({ accruedInterest: v as number })} />
            </FormField>
            <FormField label="Tasa efectiva anual" htmlFor="inv-rate">
              <NumberInput id="inv-rate" decimals suffix="%" value={editing.data.annualRate ?? null} onChange={(v) => set({ annualRate: v })} />
            </FormField>
            <FormField label="Estado" htmlFor="inv-status">
              <select id="inv-status" className={selectClass} value={editing.data.status} onChange={(e) => set({ status: e.target.value as 'ACTIVE' | 'REDEEMED' })}>
                <option value="ACTIVE">Vigente</option>
                <option value="REDEEMED">Redimida</option>
              </select>
            </FormField>
            <FormField label="Fecha de constitución" htmlFor="inv-start">
              <input id="inv-start" type="date" className={inputClass} value={editing.data.startDate ?? ''} onChange={(e) => set({ startDate: e.target.value })} />
            </FormField>
            <FormField label="Fecha de vencimiento" htmlFor="inv-maturity">
              <input id="inv-maturity" type="date" className={inputClass} value={editing.data.maturityDate ?? ''} onChange={(e) => set({ maturityDate: e.target.value })} />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Notas" htmlFor="inv-notes">
                <input id="inv-notes" className={inputClass} maxLength={500} value={editing.data.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} />
              </FormField>
            </div>
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No hay inversiones registradas.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((i) => (
              <li key={i.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{i.instrumentType} · {i.entityName}</p>
                    <p className="text-xs text-slate-500">
                      {i.instrumentNumber ? `N.º ${i.instrumentNumber} · ` : ''}{i.accountCode} {i.accountName} · {i.status === 'ACTIVE' ? 'Vigente' : 'Redimida'}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Constitución {formatDate(i.startDate)} · Vencimiento {formatDate(i.maturityDate)} · Tasa {formatPercent(i.annualRate)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-bold tabular-nums text-slate-900">{formatCOP(i.total, '$0')}</p>
                    <p className="text-xs text-slate-500">Capital {formatCOP(i.principal, '$0')} · Intereses {formatCOP(i.accruedInterest, '$0')}</p>
                  </div>
                </div>
                {canEdit && (
                  <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                    <button type="button" className={buttonClass.ghost} onClick={() => setEditing({ id: i.id, data: { ...i } })}>
                      <Pencil size={14} /> Editar
                    </button>
                    <button type="button" className={buttonClass.ghost} onClick={() => remove(i)}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};

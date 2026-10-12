import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  DollarSign,
  Landmark,
  PiggyBank,
  Printer,
  Sparkles,
  Ticket,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { FormField, MoneyInput, inputClass, selectClass } from '../../../shared/ui/components/MoneyInput';
import { Modal } from '../../../shared/ui/components/Modal';
import { Alert, buttonClass } from '../../../shared/ui/components/PageHeader';
import { formatCOP, todayISO } from '../../../shared/lib/format';
import { apiErrorMessage } from '../../../shared/infrastructure/http/apiError';
import { useAuth } from '../../auth/application/hooks/useAuth';
import { directoryApi, type AssociateSummary } from '../../associates/infrastructure/directoryApi';
import { usePrintDocument } from '../../../shared/ui/components/PrintDocumentLayout';
import type { EventCashReceipt, EventType } from '../types/eventReceipt';
import { EVENT_TYPE_ICONS, EVENT_TYPE_LABELS } from '../types/eventReceipt';
import { eventReceiptApi } from '../api/eventReceiptApi';
import { EventReceiptDocument } from './EventReceiptDocument';

interface Props {
  open: boolean;
  onClose: () => void;
  onRegistered: (receipt: EventCashReceipt) => void;
}

const CASH_ACCOUNTS = [
  { code: '110505', name: 'Caja General' },
  { code: '110510', name: 'Cajas Menores' },
  { code: '111005', name: 'Bancos / Cuentas Corrientes y de Ahorro' },
];

const INCOME_ACCOUNTS = [
  { code: '429581', name: '429581 - Eventos, bingos y actividades (Recomendada)' },
  { code: '42958101', name: '42958101 - Ingresos por bingos y rifas' },
  { code: '42958102', name: '42958102 - Ingresos por eventos y bazares' },
  { code: '417010', name: '417010 - Cuotas de administración y sostenimiento' },
  { code: '4295', name: '4295 - Ingresos diversos' },
];

export const NewEventReceiptModal: React.FC<Props> = ({ open, onClose, onRegistered }) => {
  const { currentUser } = useAuth();
  const [eventType, setEventType] = useState<EventType>('BINGO');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [eventName, setEventName] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [cashAccountCode, setCashAccountCode] = useState('110505');
  const [incomeAccountCode, setIncomeAccountCode] = useState('429581');
  const [amount, setAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [deliveredBy, setDeliveredBy] = useState('');
  const [selectedAssociateId, setSelectedAssociateId] = useState<string>('');
  const [associates, setAssociates] = useState<AssociateSummary[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdReceipt, setCreatedReceipt] = useState<EventCashReceipt | null>(null);

  const { documentId, print } = usePrintDocument();

  // Reiniciar estados y cargar próximo consecutivo
  useEffect(() => {
    if (!open) return;
    setEventType('BINGO');
    setEventName('');
    setPaymentDate(todayISO());
    setCashAccountCode('110505');
    setIncomeAccountCode('429581');
    setAmount(null);
    setPaymentMethod('CASH');
    setDeliveredBy('');
    setSelectedAssociateId('');
    setNotes('');
    setError(null);
    setCreatedReceipt(null);

    eventReceiptApi.nextReceiptNumber().then(setReceiptNumber).catch(() => setReceiptNumber('RC-0001'));

    directoryApi.search({ associatesOnly: false }).then(setAssociates).catch(() => setAssociates([]));
  }, [open]);

  // Si se selecciona un asociado de la lista, autocompletar el nombre
  const handleSelectAssociate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedAssociateId(val);
    if (!val) return;
    const found = associates.find((a) => a.id === val);
    if (found) {
      setDeliveredBy(`${found.fullName} (${found.identificationNumber})`);
    }
  };

  const selectedCashAccount = CASH_ACCOUNTS.find((c) => c.code === cashAccountCode) ?? { code: cashAccountCode, name: 'Caja General' };
  const selectedIncomeAccount = INCOME_ACCOUNTS.find((c) => c.code === incomeAccountCode) ?? { code: incomeAccountCode, name: 'Ingresos por eventos' };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!eventName.trim()) {
      return setError('Ingrese el nombre o descripción del evento (ej: Bingo Familiar, Rifa Solidaria).');
    }
    if (!amount || amount <= 0) {
      return setError('Digite el valor total recaudado que ingresa a caja.');
    }
    if (!receiptNumber.trim()) {
      return setError('Ingrese el número consecutivo del recibo.');
    }

    setSaving(true);
    try {
      const receipt = await eventReceiptApi.create({
        receiptNumber,
        eventType,
        eventName: eventName.trim(),
        paymentDate,
        cashAccountCode,
        cashAccountName: selectedCashAccount.name,
        incomeAccountCode,
        incomeAccountName: selectedIncomeAccount.name,
        amount,
        paymentMethod,
        deliveredBy: deliveredBy.trim(),
        thirdPartyId: selectedAssociateId || undefined,
        notes: notes.trim() || undefined,
        receivedBy: currentUser?.fullName || currentUser?.username || 'Caja / Tesorería',
      });

      setCreatedReceipt(receipt);
      onRegistered(receipt);
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo registrar el ingreso a caja.'));
    } finally {
      setSaving(false);
    }
  };

  // Si ya se creó, mostrar pantalla de éxito con vista previa e impresión
  if (createdReceipt) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        title="¡Ingreso a Caja Registrado Exitosamente!"
        subtitle={`Recibo ${createdReceipt.receiptNumber} · Asiento contable ${createdReceipt.voucherNumber}`}
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className={buttonClass.primary} onClick={print}>
              <Printer size={16} /> Imprimir Recibo Oficial
            </button>
          </>
        }
      >
        <Alert tone="success">
          <span className="inline-flex items-center gap-2 font-medium">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            Se ingresó a caja el valor de <strong>{formatCOP(createdReceipt.amount)}</strong> por concepto de{' '}
            <strong>
              {EVENT_TYPE_LABELS[createdReceipt.eventType]}: {createdReceipt.eventName}
            </strong>
            . El comprobante contable de ingreso ha sido asentado correctamente.
          </span>
        </Alert>

        <div className="mt-4">
          <EventReceiptDocument receipt={createdReceipt} documentId={documentId} showPreview />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={saving}
      size="lg"
      title="Nuevo Recibo de Ingreso a Caja"
      subtitle="Registra el dinero recaudado en eventos (rifas, bingos, bazares) ingresándolo a caja con asiento contable automático."
      footer={
        <>
          <button type="button" className={buttonClass.secondary} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            className={buttonClass.primary}
            onClick={() => void submit()}
            disabled={saving || !eventName.trim() || !amount || amount <= 0}
          >
            {saving ? 'Registrando ingreso...' : 'Ingresar a Caja y Generar Recibo'}
          </button>
        </>
      }
    >
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        {/* 1. Tipo de evento (Pills / Botones rápidos) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Tipo de Actividad / Evento:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(
              [
                ['BINGO', 'Bingo', '🎲'],
                ['RIFA', 'Rifa', '🎟️'],
                ['BAZAR', 'Bazar / Venta comida', '🍲'],
                ['DONACION', 'Donación', '🤝'],
                ['ACTIVIDAD', 'Actividad pro-fondos', '⭐'],
                ['OTRO', 'Otro evento', '📋'],
              ] as [EventType, string, string][]
            ).map(([t, label, icon]) => (
              <button
                key={t}
                type="button"
                onClick={() => setEventType(t)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold text-left transition-all cursor-pointer ${
                  eventType === t
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Datos del evento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <FormField label="Nombre o Descripción del Evento *" required>
              <input
                type="text"
                className={inputClass}
                placeholder="Ej: Gran Bingo de Integración, Rifa Solidaria de Navidad..."
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
            </FormField>
          </div>
          <div>
            <FormField label="N° de Recibo de Caja *" required>
              <input
                type="text"
                className={`${inputClass} font-mono`}
                placeholder="RC-0001"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                required
              />
            </FormField>
          </div>
        </div>

        {/* 3. Valor recaudado (DIGITABLE COP sin valores preestablecidos) */}
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-3.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" />
              Valor Total Recaudado a Ingresar a Caja *
            </label>
            <span className="text-[11px] text-indigo-700/80 font-medium">Digite el valor exacto</span>
          </div>
          <div className="w-full">
            <MoneyInput
              value={amount}
              onChange={setAmount}
              placeholder="0"
              className="text-lg font-bold text-indigo-950 h-11"
              aria-label="Valor total recaudado"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Este valor entrará como saldo a favor en la cuenta de caja seleccionada y reconocerá el ingreso en el PUC.
          </p>
        </div>

        {/* 4. Cuentas Contables y Medio de Pago */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Cuenta de Caja Receptora (Entrada de dinero) *">
            <select
              className={selectClass}
              value={cashAccountCode}
              onChange={(e) => setCashAccountCode(e.target.value)}
            >
              {CASH_ACCOUNTS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Cuenta PUC de Ingreso (Contrapartida) *">
            <select
              className={selectClass}
              value={incomeAccountCode}
              onChange={(e) => setIncomeAccountCode(e.target.value)}
            >
              {INCOME_ACCOUNTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Fecha del Ingreso *">
            <input
              type="date"
              className={inputClass}
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Medio de Recepción">
            <select
              className={selectClass}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'TRANSFER')}
            >
              <option value="CASH">Efectivo en billetes/monedas</option>
              <option value="TRANSFER">Transferencia / Consignación bancaria</option>
            </select>
          </FormField>
        </div>

        {/* 5. Responsable / Quien entrega el dinero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Entregado por (Persona o Comité)">
            <input
              type="text"
              className={inputClass}
              placeholder="Ej: Junta de Acción, Comité de Bingos, Juan Pérez..."
              value={deliveredBy}
              onChange={(e) => setDeliveredBy(e.target.value)}
            />
          </FormField>

          <FormField label="Vincular a Asociado o Tercero (Opcional)">
            <select
              className={selectClass}
              value={selectedAssociateId}
              onChange={handleSelectAssociate}
            >
              <option value="">-- No vincular a tercero específico --</option>
              {associates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName} ({a.identificationNumber})
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Observaciones / Detalle adicional">
          <textarea
            className={`${inputClass} h-16 py-1.5 resize-none`}
            placeholder="Detalles adicionales: por ejemplo 'Se vendieron 150 tablas a $10.000 c/u, se descontaron premios entregados en efectivo'..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>

        {/* 6. Vista previa del Asiento Contable Automático (Partida Doble) */}
        {amount && amount > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs">
            <span className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
              <Landmark size={14} className="text-emerald-600" />
              Asiento Contable Automático (Partida Doble):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded border border-emerald-200 bg-emerald-50/50 p-2">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">📥 Débito (Entra a Caja)</span>
                <span className="text-slate-700">{selectedCashAccount.name} ({cashAccountCode})</span>
                <strong className="block text-emerald-700 text-sm mt-0.5">{formatCOP(amount)}</strong>
              </div>
              <div className="rounded border border-indigo-200 bg-indigo-50/50 p-2">
                <span className="text-[11px] font-bold text-indigo-800 uppercase block">📈 Crédito (Ingreso)</span>
                <span className="text-slate-700">{selectedIncomeAccount.name}</span>
                <strong className="block text-indigo-700 text-sm mt-0.5">{formatCOP(amount)}</strong>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              ✓ Balance cuadrado: Las sumas iguales de partida doble se asientan automáticamente en el libro diario.
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
};

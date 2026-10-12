import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Coins,
  PartyPopper,
  Printer,
  ReceiptText,
  Search,
  Sparkles,
  Ticket,
  Wallet,
} from 'lucide-react';
import { Alert, PageContainer, PageHeader, StatCard, buttonClass } from '../../../shared/ui/components/PageHeader';
import { SearchFilterBar } from '../../../shared/ui/components/SearchFilterBar';
import { ResponsiveTable, type TableColumn } from '../../../shared/ui/components/ResponsiveTable';
import { FormField, inputClass, selectClass } from '../../../shared/ui/components/MoneyInput';
import { Modal } from '../../../shared/ui/components/Modal';
import { formatCOP, formatDate, normalizeText, todayISO } from '../../../shared/lib/format';
import { useAuth } from '../../auth/application/hooks/useAuth';
import { usePrintDocument } from '../../../shared/ui/components/PrintDocumentLayout';
import type { EventCashReceipt, EventType } from '../types/eventReceipt';
import { EVENT_TYPE_ICONS, EVENT_TYPE_LABELS } from '../types/eventReceipt';
import { eventReceiptApi } from '../api/eventReceiptApi';
import { NewEventReceiptModal } from './NewEventReceiptModal';
import { EventReceiptDocument } from './EventReceiptDocument';

export const CashIncomeView: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('COLLECTIONS_CREATE') || hasPermission('ACCOUNTING_CREATE');

  const [receipts, setReceipts] = useState<EventCashReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState(`${todayISO().slice(0, 8)}01`);
  const [to, setTo] = useState(todayISO());
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<EventCashReceipt | null>(null);

  const { documentId, print } = usePrintDocument();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventReceiptApi.list();
      setReceipts(data);
    } catch {
      setError('No se pudieron cargar los recibos de caja de eventos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Filtrado
  const filtered = useMemo(() => {
    const q = normalizeText(search);
    return receipts.filter((r) => {
      if (from && r.paymentDate < from) return false;
      if (to && r.paymentDate > to) return false;
      if (typeFilter !== 'ALL' && r.eventType !== typeFilter) return false;

      if (!q) return true;
      const haystack = normalizeText(
        `${r.receiptNumber} ${r.eventName} ${r.deliveredBy ?? ''} ${r.thirdPartyName ?? ''} ${r.voucherNumber ?? ''} ${r.notes ?? ''}`
      );
      return haystack.includes(q);
    });
  }, [receipts, search, from, to, typeFilter]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = filtered.reduce((s, r) => s + r.amount, 0);
    const rifasYBingos = filtered
      .filter((r) => r.eventType === 'RIFA' || r.eventType === 'BINGO')
      .reduce((s, r) => s + r.amount, 0);
    const bazaresYOtros = filtered
      .filter((r) => r.eventType !== 'RIFA' && r.eventType !== 'BINGO')
      .reduce((s, r) => s + r.amount, 0);

    return { total, rifasYBingos, bazaresYOtros, count: filtered.length };
  }, [filtered]);

  const columns: TableColumn<EventCashReceipt>[] = [
    {
      key: 'date',
      header: 'Fecha',
      render: (r) => <span className="text-xs text-slate-700">{formatDate(r.paymentDate)}</span>,
    },
    {
      key: 'receiptNumber',
      header: 'N° Recibo',
      render: (r) => (
        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
          {r.receiptNumber}
        </span>
      ),
    },
    {
      key: 'event',
      header: 'Actividad / Evento',
      render: (r) => (
        <div className="min-w-0 max-w-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
              <span>{EVENT_TYPE_ICONS[r.eventType]}</span>
              <span>{EVENT_TYPE_LABELS[r.eventType]}</span>
            </span>
            <span className="truncate font-semibold text-slate-900 text-xs">{r.eventName}</span>
          </div>
          {r.notes && <p className="truncate text-[11px] text-slate-400 mt-0.5">{r.notes}</p>}
        </div>
      ),
    },
    {
      key: 'deliveredBy',
      header: 'Entregado por',
      hideOnMobile: true,
      render: (r) => (
        <span className="text-xs text-slate-600 truncate max-w-[160px] block">
          {r.deliveredBy || r.thirdPartyName || '—'}
        </span>
      ),
    },
    {
      key: 'cashAccount',
      header: 'Caja Receptora',
      hideOnMobile: true,
      render: (r) => (
        <span className="text-xs text-slate-600 block">
          <strong className="text-slate-800">{r.cashAccountCode}</strong> · {r.cashAccountName}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Monto Ingresado',
      align: 'right',
      render: (r) => (
        <span className="font-bold text-sm tabular-nums text-emerald-700">
          + {formatCOP(r.amount)}
        </span>
      ),
    },
    {
      key: 'voucher',
      header: 'Comprobante',
      align: 'right',
      hideOnMobile: true,
      render: (r) => (
        <span className="font-mono text-xs text-slate-500">
          {r.voucherNumber ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          className={buttonClass.ghost}
          onClick={() => setViewingReceipt(r)}
          title="Ver e imprimir recibo oficial de caja"
        >
          <ReceiptText size={15} /> Recibo
        </button>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Ingresos a Caja · Eventos y Rifas"
        subtitle="Registro de dinero reunido en rifas, bingos, bazares y actividades comunitarias que entra a caja con asiento contable directo."
        icon={<Coins size={20} className="text-amber-600" />}
        actions={
          canCreate && (
            <button
              type="button"
              className={buttonClass.primary}
              onClick={() => setIsNewModalOpen(true)}
            >
              <Ticket size={16} /> + Nuevo Recibo de Ingreso a Caja
            </button>
          )
        }
      />

      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* Tarjetas estadísticas de recaudación por actividades */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <StatCard
          label="Total Ingresado a Caja"
          value={formatCOP(stats.total, '$0')}
          tone="positive"
        />
        <StatCard
          label="Bingos y Rifas"
          value={formatCOP(stats.rifasYBingos, '$0')}
          tone="primary"
        />
        <StatCard
          label="Bazares y Otras Actividades"
          value={formatCOP(stats.bazaresYOtros, '$0')}
        />
        <StatCard
          label="Recibos de Caja Emitidos"
          value={stats.count.toString()}
        />
      </div>

      {/* Barra de filtros */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar por número de recibo, evento, quien entrega..."
        activeFilters={(typeFilter !== 'ALL' ? 1 : 0) + (from ? 1 : 0) + (to ? 1 : 0)}
      >
        <FormField label="Desde">
          <input
            type="date"
            className={inputClass}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </FormField>
        <FormField label="Hasta">
          <input
            type="date"
            className={inputClass}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </FormField>
        <FormField label="Tipo de Actividad">
          <select
            className={selectClass}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">Todas las actividades</option>
            <option value="BINGO">🎲 Bingos</option>
            <option value="RIFA">🎟️ Rifas</option>
            <option value="BAZAR">🍲 Bazares y Comida</option>
            <option value="DONACION">🤝 Donaciones</option>
            <option value="ACTIVIDAD">⭐ Actividades pro-fondos</option>
            <option value="OTRO">📋 Otros eventos</option>
          </select>
        </FormField>
      </SearchFilterBar>

      {/* Tabla responsiva de recibos de eventos */}
      <ResponsiveTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        loading={loading}
        cardTitle={(r) => (
          <span className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-indigo-700">{r.receiptNumber}</span>
            <span className="font-bold text-sm text-emerald-700">{formatCOP(r.amount)}</span>
          </span>
        )}
        cardActions={(r) => (
          <button
            type="button"
            className={buttonClass.ghost}
            onClick={() => setViewingReceipt(r)}
          >
            <ReceiptText size={15} /> Ver / Imprimir Recibo
          </button>
        )}
        emptyMessage="No se han registrado ingresos de caja por eventos o actividades en el periodo seleccionado."
      />

      {/* Modal para crear nuevo recibo de caja de evento */}
      {isNewModalOpen && (
        <NewEventReceiptModal
          open={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onRegistered={() => {
            void load();
          }}
        />
      )}

      {/* Modal para visualizar e imprimir recibo existente */}
      {viewingReceipt && (
        <Modal
          open={!!viewingReceipt}
          onClose={() => setViewingReceipt(null)}
          size="lg"
          title={`Recibo de Caja ${viewingReceipt.receiptNumber}`}
          subtitle={`${EVENT_TYPE_LABELS[viewingReceipt.eventType]}: ${viewingReceipt.eventName} · Comprobante ${viewingReceipt.voucherNumber ?? ''}`}
          footer={
            <>
              <button
                type="button"
                className={buttonClass.secondary}
                onClick={() => setViewingReceipt(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className={buttonClass.primary}
                onClick={print}
              >
                <Printer size={16} /> Imprimir Recibo Oficial
              </button>
            </>
          }
        >
          <div className="mt-2">
            <EventReceiptDocument
              receipt={viewingReceipt}
              documentId={documentId}
              showPreview
            />
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};

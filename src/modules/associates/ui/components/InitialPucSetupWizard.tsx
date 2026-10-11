import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  Building,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  DollarSign,
  PieChart,
  Layers,
  Lightbulb,
  RotateCcw,
  Info,
  X,
} from 'lucide-react';
import { MoneyInput } from '../../../../shared/ui/components/MoneyInput';
import type { QuotaTemplate, QuotaTemplateItem, QuotaCategory } from '../../types/associate';
import type { PucAccount } from '../../../contabilidad/domain/pucTypes';
import { STANDARD_PUC_CATALOG } from '../../../contabilidad/infrastructure/pucStandardCatalog';

const PUC_STORAGE_KEY = 'konta_puc_custom_accounts_v2';
const TEMPLATE_STORAGE_KEY = 'konta_quota_templates_v1';
export const ONBOARDING_KEY = 'konta_initial_puc_setup_done';

const inferCategoryFromAccount = (code: string): QuotaCategory => {
  if (code.startsWith('3')) return 'EQUITY_SAVING';
  if (code.startsWith('4')) return 'INCOME';
  return 'SOCIAL_FUND';
};

const DEFAULT_SUGGESTED_ITEMS: QuotaTemplateItem[] = [
  {
    id: 'step-item-1',
    conceptName: 'Aportes Sociales Ordinarios',
    category: 'EQUITY_SAVING',
    accountId: 'acc-311505',
    accountCode: '311505',
    accountName: 'Aportes sociales ordinarios',
    amount: 10000,
    percentage: 20.0,
    isMandatory: true,
    displayOrder: 1,
  },
  {
    id: 'step-item-2',
    conceptName: 'Aporte Extraordinario del Socio',
    category: 'SOCIAL_FUND',
    accountId: 'acc-238095',
    accountCode: '238095',
    accountName: 'Fondos actividades especiales y bingos',
    amount: 20000,
    percentage: 40.0,
    isMandatory: false,
    displayOrder: 2,
  },
  {
    id: 'step-item-3',
    conceptName: 'Fondo de Solidaridad',
    category: 'SOCIAL_FUND',
    accountId: 'acc-238025',
    accountCode: '238025',
    accountName: 'Fondo de solidaridad',
    amount: 5250,
    percentage: 10.5,
    isMandatory: true,
    displayOrder: 3,
  },
  {
    id: 'step-item-4',
    conceptName: 'Cuota de Administración (Sostenimiento)',
    category: 'INCOME',
    accountId: 'acc-417010',
    accountCode: '417010',
    accountName: 'Cuotas de administración y sostenimiento',
    amount: 6250,
    percentage: 12.5,
    isMandatory: true,
    displayOrder: 4,
  },
  {
    id: 'step-item-5',
    conceptName: 'Turismo y Recreación',
    category: 'SOCIAL_FUND',
    accountId: 'acc-238035',
    accountCode: '238035',
    accountName: 'Fondo de turismo y recreación',
    amount: 5500,
    percentage: 11.0,
    isMandatory: true,
    displayOrder: 5,
  },
  {
    id: 'step-item-6',
    conceptName: 'Juegos de Bingo y Actividades',
    category: 'INCOME',
    accountId: 'acc-429581',
    accountCode: '429581',
    accountName: 'Eventos, bingos y actividades',
    amount: 2000,
    percentage: 4.0,
    isMandatory: false,
    displayOrder: 6,
  },
  {
    id: 'step-item-7',
    conceptName: 'Fondo de Destinación Específica',
    category: 'SOCIAL_FUND',
    accountId: 'acc-238020',
    accountCode: '238020',
    accountName: 'Fondo de destinación específica',
    amount: 1000,
    percentage: 2.0,
    isMandatory: true,
    displayOrder: 7,
  },
];

const COMMON_QUOTA_CONCEPTS = [
  {
    conceptName: 'Aportes Sociales Ordinarios',
    accountCode: '311505',
    accountName: 'Aportes sociales ordinarios',
    category: 'EQUITY_SAVING' as QuotaCategory,
    suggestedAmount: 15000,
  },
  {
    conceptName: 'Fondo de Solidaridad',
    accountCode: '238025',
    accountName: 'Fondo de solidaridad',
    category: 'SOCIAL_FUND' as QuotaCategory,
    suggestedAmount: 10000,
  },
  {
    conceptName: 'Cuota de Administración (Sostenimiento)',
    accountCode: '417010',
    accountName: 'Cuotas de administración y sostenimiento',
    category: 'INCOME' as QuotaCategory,
    suggestedAmount: 15000,
  },
  {
    conceptName: 'Turismo y Recreación',
    accountCode: '238035',
    accountName: 'Fondo de turismo y recreación',
    category: 'SOCIAL_FUND' as QuotaCategory,
    suggestedAmount: 10000,
  },
];

interface InitialPucSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const InitialPucSetupWizard: React.FC<InitialPucSetupWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Load PUC accounts
  const [pucAccounts] = useState<PucAccount[]>(() => {
    try {
      const saved = localStorage.getItem(PUC_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return STANDARD_PUC_CATALOG;
  });

  // Total Quota to receive per associate
  const [totalQuota, setTotalQuota] = useState<number>(50000);
  const [totalQuotaBlank, setTotalQuotaBlank] = useState<boolean>(false);

  // Cash / Bank receiving account
  const [receivingAccountCode, setReceivingAccountCode] = useState<string>('110505');

  // Breakdown Concepts - inicia vacío para que el usuario arme sus cuentas
  const [items, setItems] = useState<QuotaTemplateItem[]>([]);

  // Account selector modal state
  const [isAddingNewConcept, setIsAddingNewConcept] = useState<boolean>(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [searchAccountQuery, setSearchAccountQuery] = useState('');
  const [selectedClassTab, setSelectedClassTab] = useState<string>('all');

  // Sum calculations
  const itemsSum = useMemo(() => {
    return items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [items]);

  const difference = totalQuota - itemsSum;
  const isBalanced = items.length > 0 && Math.abs(difference) < 0.01;

  // Filtered accounts for selection modal
  const filteredAccounts = useMemo(() => {
    let list = pucAccounts;
    if (selectedClassTab !== 'all') {
      list = list.filter((a) => a.code.startsWith(selectedClassTab));
    }
    if (searchAccountQuery.trim()) {
      const q = searchAccountQuery.toLowerCase();
      list = list.filter((a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
    }
    return list;
  }, [pucAccounts, selectedClassTab, searchAccountQuery]);

  // Update item amount
  const handleAmountChange = (index: number, val: number) => {
    const updated = [...items];
    updated[index].amount = val;
    updated[index].percentage = totalQuota > 0 ? (val / totalQuota) * 100 : 0;
    setItems(updated);
  };

  // Update item concept name
  const handleConceptNameChange = (index: number, name: string) => {
    const updated = [...items];
    updated[index].conceptName = name;
    setItems(updated);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick add standard concept
  const handleQuickAdd = (concept: (typeof COMMON_QUOTA_CONCEPTS)[0]) => {
    if (items.some((it) => it.accountCode === concept.accountCode)) return;
    const remaining = Math.max(0, totalQuota - itemsSum);
    const amount = remaining > 0 ? Math.min(remaining, concept.suggestedAmount) : concept.suggestedAmount;
    const newItem: QuotaTemplateItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conceptName: concept.conceptName,
      category: concept.category,
      accountId: `acc-${concept.accountCode}`,
      accountCode: concept.accountCode,
      accountName: concept.accountName,
      amount,
      percentage: totalQuota > 0 ? (amount / totalQuota) * 100 : 0,
      isMandatory: true,
      displayOrder: items.length + 1,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Load standard template
  const handleLoadSuggested = () => {
    setItems(DEFAULT_SUGGESTED_ITEMS.map((it) => ({ ...it, id: `item-${Date.now()}-${it.id}` })));
  };

  // Auto balance remaining to last item
  const handleAutoBalance = () => {
    if (items.length === 0) return;
    const lastIndex = items.length - 1;
    const currentWithoutLast = items.slice(0, lastIndex).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const needed = Math.max(0, totalQuota - currentWithoutLast);
    const updated = [...items];
    updated[lastIndex].amount = needed;
    updated[lastIndex].percentage = totalQuota > 0 ? (needed / totalQuota) * 100 : 0;
    setItems(updated);
  };

  // Select account from picker modal (either for new concept or editing existing)
  const handleSelectAccount = (acc: PucAccount) => {
    if (isAddingNewConcept) {
      const remaining = Math.max(0, totalQuota - itemsSum);
      const category = inferCategoryFromAccount(acc.code);
      const newItem: QuotaTemplateItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        conceptName: acc.name,
        category,
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        amount: remaining > 0 ? remaining : 10000,
        percentage: totalQuota > 0 ? ((remaining > 0 ? remaining : 10000) / totalQuota) * 100 : 0,
        isMandatory: true,
        displayOrder: items.length + 1,
      };
      setItems((prev) => [...prev, newItem]);
      setIsAddingNewConcept(false);
      setSearchAccountQuery('');
      return;
    }

    if (editingItemIndex !== null) {
      const updated = [...items];
      updated[editingItemIndex].accountId = acc.id;
      updated[editingItemIndex].accountCode = acc.code;
      updated[editingItemIndex].accountName = acc.name;
      updated[editingItemIndex].category = inferCategoryFromAccount(acc.code);
      setItems(updated);
      setEditingItemIndex(null);
      setSearchAccountQuery('');
    }
  };

  // Finish Wizard and Save Everything
  const handleFinish = () => {
    const finalTemplate: QuotaTemplate = {
      id: 'c0000000-0000-0000-0000-000000000001',
      name: `Cuota de Asociado ($${totalQuota.toLocaleString('es-CO')})`,
      description: 'Plantilla configurada en el asistente inicial con discriminación de cuentas PUC.',
      totalAmount: totalQuota,
      isActive: true,
      items: items.map((it) => ({
        ...it,
        percentage: totalQuota > 0 ? (it.amount / totalQuota) * 100 : 0,
      })),
    };

    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(finalTemplate));
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full pb-[env(safe-area-inset-bottom)] sm:pb-0 flex flex-col max-h-[92dvh] sm:max-h-[92dvh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Wizard Top Header */}
        <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-100 bg-white flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  Configuración Inicial
                </span>
                <span className="text-xs text-slate-400 font-medium">Paso {currentStep} de 4</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Asistente de Cuotas de Asociados y Cuentas P.U.C.
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Cerrar y configurar más tarde"
          >
            <X size={18} />
          </button>
        </div>

        {/* Wizard Progress Stepper Bar */}
        <div className="px-4 sm:px-8 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          {[
            { step: 1, title: '1. Monto Cuota' },
            { step: 2, title: '2. Discriminación de Valores' },
            { step: 3, title: '3. Asignación de Cuentas PUC' },
            { step: 4, title: '4. Resumen & Partida Doble' },
          ].map((item) => {
            const isDone = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div
                key={item.step}
                onClick={() => setCurrentStep(item.step as any)}
                className={`flex items-center gap-2 cursor-pointer transition-colors text-xs font-semibold ${
                  isCurrent
                    ? 'text-slate-900 font-bold'
                    : isDone
                    ? 'text-slate-700'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    isCurrent
                      ? 'bg-slate-900 text-white shadow-xs'
                      : isDone
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isDone ? <Check size={13} strokeWidth={2.5} /> : item.step}
                </div>
                <span className="hidden sm:inline">{item.title}</span>
              </div>
            );
          })}
        </div>

        {/* Wizard Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {/* ========================================================================= */}
          {/* PASO 1: MONTO TOTAL DE LA CUOTA & CUENTA RECEPTORA                         */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-150">
              <div className="text-center space-y-1.5 mb-6">
                <span className="inline-block p-3 bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 mb-2">
                  <Coins size={28} />
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  ¿Cuánto paga un asociado al mes?
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Ingresa el valor total de la cuota mensual. Por defecto, según las normas del sector, sugerimos <strong>$50.000 COP</strong>.
                </p>
              </div>

              {/* Input Monto Total */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Valor Total de la Cuota por Asociado ($ COP) *
                </label>
                <MoneyInput
                  value={totalQuotaBlank ? null : totalQuota}
                  onChange={(v) => {
                    setTotalQuotaBlank(v === null);
                    setTotalQuota(v ?? 0);
                  }}
                  placeholder="Ej. 50.000"
                  className="h-12 text-xl font-bold"
                  aria-label="Valor total de la cuota"
                  autoFocus
                />
                <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                  <span>Valores comunes:</span>
                  {[30000, 50000, 60000, 100000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTotalQuota(val)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-colors cursor-pointer ${
                        totalQuota === val
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ${val.toLocaleString('es-CO')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuenta de Entrada (Débito) */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  ¿A qué cuenta entra el dinero al recibir el pago? (Débito)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setReceivingAccountCode('110505')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      receivingAccountCode === '110505'
                        ? 'border-slate-800 bg-slate-100/70 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      receivingAccountCode === '110505' ? 'border-slate-900' : 'border-slate-300'
                    }`}>
                      {receivingAccountCode === '110505' && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                    </div>
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 block">110505 - Caja General</span>
                      <span className="text-[11px] text-slate-500">Recepción de dinero en efectivo en oficina</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setReceivingAccountCode('111005')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      receivingAccountCode === '111005'
                        ? 'border-slate-800 bg-slate-100/70 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      receivingAccountCode === '111005' ? 'border-slate-900' : 'border-slate-300'
                    }`}>
                      {receivingAccountCode === '111005' && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                    </div>
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 block">111005 - Bancos</span>
                      <span className="text-[11px] text-slate-500">Transferencias / Consignaciones bancarias</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 2: DISCRIMINACIÓN DE LOS VALORES A RECIBIR                             */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Header / Resumen de Balance */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-linear-to-r from-indigo-50/80 via-white to-slate-50 p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
                    <PieChart size={22} />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Discriminación de la Cuota mensual de ${totalQuota.toLocaleString('es-CO')}
                    </h3>
                    <p className="text-xs text-slate-600">
                      Selecciona y arma tus cuentas P.U.C. con sus nombres personalizados para la cuota.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Total Asignado</span>
                    <span className="text-base sm:text-lg font-black font-mono text-slate-900">
                      ${itemsSum.toLocaleString('es-CO')}
                    </span>
                  </div>
                  {isBalanced ? (
                    <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                      <Check size={14} strokeWidth={3} /> Cuota Balanceada
                    </span>
                  ) : difference > 0 ? (
                    <span className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                      <AlertCircle size={14} strokeWidth={2.5} /> Faltan ${difference.toLocaleString('es-CO')}
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                      <AlertCircle size={14} strokeWidth={2.5} /> Excede por ${Math.abs(difference).toLocaleString('es-CO')}
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de progreso de distribución */}
              {totalQuota > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>Progreso de distribución de la cuota:</span>
                    <span className="font-mono text-slate-700">
                      {Math.min(100, Math.round((itemsSum / totalQuota) * 100))}% (${itemsSum.toLocaleString('es-CO')} de ${totalQuota.toLocaleString('es-CO')})
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    {items.map((it, i) => {
                      const pct = Math.max(0, (it.amount / totalQuota) * 100);
                      const bg =
                        it.category === 'EQUITY_SAVING'
                          ? 'bg-purple-500'
                          : it.category === 'INCOME'
                          ? 'bg-emerald-500'
                          : 'bg-sky-500';
                      return (
                        <div
                          key={it.id || i}
                          style={{ width: `${pct}%` }}
                          className={`${bg} h-full border-r border-white/50 transition-all duration-300`}
                          title={`${it.conceptName}: $${it.amount.toLocaleString('es-CO')} (${pct.toFixed(1)}%)`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ESTADO VACÍO DIDÁCTICO */}
              {items.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-indigo-200 bg-linear-to-b from-indigo-50/60 via-white to-slate-50/60 p-6 sm:p-9 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                    <Layers size={28} />
                  </div>

                  <div className="max-w-xl mx-auto space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      <Sparkles size={13} />
                      Asistente Didáctico de Cuentas P.U.C.
                    </span>
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900">
                      Aquí seleccionas y armas tus cuentas P.U.C. con sus nombres
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      El dinero de la cuota mensual de cada asociado (<strong className="text-slate-900">${totalQuota.toLocaleString('es-CO')}</strong>) se distribuye entre los conceptos contables que maneja tu entidad.
                      Selecciona tus cuentas del catálogo P.U.C., ponles el nombre con el que aparecerán ante los asociados y define el monto de cada rubro.
                    </p>
                  </div>

                  {/* 3 Tarjetas explicativas de las clases contables */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
                    <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[11px] font-bold text-white">1</span>
                        <span className="text-xs font-bold text-purple-950">Patrimonio (Clase 3)</span>
                      </div>
                      <p className="text-[11px] text-purple-900 leading-normal">
                        <strong>Aportes sociales:</strong> Es el capital o ahorro que pertenece al asociado y que capitaliza la entidad (Ej. Cuenta 311505).
                      </p>
                    </div>

                    <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[11px] font-bold text-white">2</span>
                        <span className="text-xs font-bold text-sky-950">Pasivos / Fondos (Clase 2)</span>
                      </div>
                      <p className="text-[11px] text-sky-900 leading-normal">
                        <strong>Fondos sociales:</strong> Destinados a solidaridad, salud, recreación o auxilios mutuos para la comunidad (Ej. Cuenta 238025).
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">3</span>
                        <span className="text-xs font-bold text-emerald-950">Ingresos (Clase 4)</span>
                      </div>
                      <p className="text-[11px] text-emerald-900 leading-normal">
                        <strong>Cuotas de administración:</strong> Recursos que cubren el sostenimiento y gastos operativos de la entidad (Ej. Cuenta 417010).
                      </p>
                    </div>
                  </div>

                  {/* Acciones para empezar */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewConcept(true);
                        setEditingItemIndex(null);
                        setSearchAccountQuery('');
                        setSelectedClassTab('all');
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Plus size={16} />
                      <span>+ Seleccionar Cuenta P.U.C. y Armar Concepto</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadSuggested}
                      className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      <Sparkles size={15} />
                      <span>Cargar plantilla estándar sugerida (7 rubros)</span>
                    </button>
                  </div>

                  {/* Chips de acceso rápido */}
                  <div className="pt-3 border-t border-indigo-100 max-w-xl mx-auto">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-2.5">
                      O agrega rápidamente con un clic uno de los conceptos más utilizados:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {COMMON_QUOTA_CONCEPTS.map((c) => (
                        <button
                          key={c.accountCode}
                          type="button"
                          onClick={() => handleQuickAdd(c)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/60 hover:text-indigo-900 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Plus size={13} className="text-indigo-600" />
                          <span>{c.conceptName}</span>
                          <span className="font-mono text-[10px] text-slate-400 font-bold">({c.accountCode})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* CUANDO YA HAY CONCEPTOS AGREGADOS */
                <div className="space-y-4">
                  {/* Barra de herramientas / Ayuda */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={16} className="text-amber-500 shrink-0" />
                      <span>
                        Puedes <strong>editar el nombre</strong> de cada concepto directamente, <strong>cambiar su cuenta P.U.C.</strong> o ajustar los valores.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {difference > 0 && (
                        <button
                          type="button"
                          onClick={handleAutoBalance}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Ajusta automáticamente el último concepto con la diferencia faltante"
                        >
                          <span>⚡ Ajustar faltante (${difference.toLocaleString('es-CO')})</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewConcept(true);
                          setEditingItemIndex(null);
                          setSearchAccountQuery('');
                          setSelectedClassTab('all');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Agregar Concepto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setItems([])}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Vaciar conceptos y comenzar de nuevo"
                      >
                        <RotateCcw size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Lista de tarjetas de conceptos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-3"
                      >
                        {/* Header: Input de Nombre de concepto + Badge categoría + Eliminar */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Nombre del Concepto ({idx + 1})
                            </label>
                            <input
                              type="text"
                              value={item.conceptName}
                              onChange={(e) => handleConceptNameChange(idx, e.target.value)}
                              className="w-full text-xs font-bold text-slate-900 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 rounded-lg px-2.5 py-1 bg-white transition-colors"
                              placeholder="Ej. Aportes Sociales Ordinarios"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pt-3.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                item.category === 'EQUITY_SAVING'
                                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                                  : item.category === 'INCOME'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : 'bg-sky-100 text-sky-800 border-sky-200'
                              }`}
                            >
                              {item.category === 'EQUITY_SAVING'
                                ? 'Patrimonio'
                                : item.category === 'INCOME'
                                ? 'Ingreso'
                                : 'Pasivo/Fondo'}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar este concepto"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Fila Cuenta P.U.C. asignada */}
                        <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono font-bold text-[11px] text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                              {item.accountCode}
                            </span>
                            <span className="text-[11px] text-slate-600 font-medium truncate" title={item.accountName}>
                              {item.accountName}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemIndex(idx);
                              setIsAddingNewConcept(false);
                              setSearchAccountQuery('');
                              setSelectedClassTab(
                                item.category === 'EQUITY_SAVING' ? '3' : item.category === 'INCOME' ? '4' : '2'
                              );
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg shrink-0 transition-colors cursor-pointer"
                          >
                            Cambiar cuenta ▾
                          </button>
                        </div>

                        {/* Fila Monto a cobrar y porcentaje */}
                        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-xs text-slate-500 font-medium block">Monto a cobrar:</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {totalQuota > 0 ? ((item.amount / totalQuota) * 100).toFixed(1) : 0}% de la cuota
                            </span>
                          </div>
                          <div className="w-36">
                            <MoneyInput
                              value={item.amount}
                              onChange={(v) => handleAmountChange(idx, v ?? 0)}
                              aria-label={`Monto ${item.conceptName}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Acciones al pie de la lista */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewConcept(true);
                        setEditingItemIndex(null);
                        setSearchAccountQuery('');
                        setSelectedClassTab('all');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Plus size={15} />
                      <span>+ Agregar Otro Concepto / Cuenta P.U.C.</span>
                    </button>

                    {items.length < DEFAULT_SUGGESTED_ITEMS.length && (
                      <button
                        type="button"
                        onClick={handleLoadSuggested}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        <Sparkles size={14} />
                        <span>Cargar Modelo Estándar (7 Rubros)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 3: ASIGNACIÓN VISUAL E INTUITIVA DE CUENTAS P.U.C.                     */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="text-center space-y-1.5 mb-2">
                <span className="inline-block p-3 bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 mb-1">
                  <ShieldCheck size={28} />
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Asignación de Cuentas P.U.C.
                </h3>
                <p className="text-xs text-slate-500 max-w-lg mx-auto">
                  Cada rubro configurado debe ir a una cuenta contable específica. Aquí puedes verificar y ajustar las cuentas asociadas.
                </p>
              </div>

              {items.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <AlertCircle size={28} className="mx-auto text-amber-500" />
                  <p className="text-sm font-bold text-slate-800">Aún no has configurado ningún concepto</p>
                  <p className="text-xs text-slate-500">Regresa al Paso 2 para armar los conceptos y asignar tus cuentas P.U.C.</p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 bg-slate-900 text-white text-xs rounded-xl font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Ir al Paso 2
                  </button>
                </div>
              ) : (
                <>
                  {/* 3 Categories Legend Guide */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-0.5">
                      <span className="font-semibold text-slate-800 block">Clase 3: Patrimonio</span>
                      <span className="text-slate-500 text-[11px]">Aportes sociales de capital y ahorro del socio (Cuenta 3115)</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-0.5">
                      <span className="font-semibold text-slate-800 block">Clase 2: Pasivos / Fondos</span>
                      <span className="text-slate-500 text-[11px]">Solidaridad, recreación y reservas (Cuenta 2380)</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-0.5">
                      <span className="font-semibold text-slate-800 block">Clase 4: Ingresos</span>
                      <span className="text-slate-500 text-[11px]">Cuotas de sostenimiento y administración (Cuenta 4170)</span>
                    </div>
                  </div>

                  {/* Interactive List with Click-to-Change Button */}
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900">
                              {idx + 1}. {item.conceptName}
                            </span>
                            <span className="text-xs font-mono font-medium text-slate-500">
                              (${item.amount.toLocaleString('es-CO')})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            Categoría: <span className="font-medium text-slate-700">{item.category === 'EQUITY_SAVING' ? 'Patrimonio (Clase 3)' : item.category === 'INCOME' ? 'Ingreso Operacional (Clase 4)' : 'Pasivo / Fondo Social (Clase 2)'}</span>
                          </span>
                        </div>

                        {/* Assigned PUC Account pill */}
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center gap-2 min-w-0 flex-1 sm:flex-none sm:min-w-[240px]">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {item.accountCode}
                            </span>
                            <span className="font-medium text-slate-800 truncate">
                              {item.accountName}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemIndex(idx);
                              setIsAddingNewConcept(false);
                              setSearchAccountQuery('');
                              setSelectedClassTab(
                                item.category === 'EQUITY_SAVING' ? '3' : item.category === 'INCOME' ? '4' : '2'
                              );
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 border border-slate-200"
                          >
                            Cambiar Cuenta ▾
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 4: RESUMEN DEL ASIENTO CONTABLE & PARTIDA DOBLE                        */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="text-center space-y-1.5 mb-2">
                <span className="inline-block p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-1">
                  <FileText size={28} />
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Verificación de Partida Doble
                </h3>
                <p className="text-xs text-slate-500 max-w-lg mx-auto">
                  Así quedará estructurado el <strong>Comprobante de Ingreso</strong> cada vez que un asociado pague su cuota en el sistema.
                </p>
              </div>

              {/* Comprobante Preview Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-bold">Comprobante Modelo: CP-ING-00001 (Recaudo Cuota Asociado)</span>
                  <span className="px-2.5 py-0.5 bg-emerald-500 text-white rounded-full font-bold text-[10px]">
                    Partida Doble Balanceada
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="table-stack w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-4">Cuenta P.U.C.</th>
                        <th className="py-2.5 px-4">Concepto Contable</th>
                        <th className="py-2.5 px-4 text-right">Débito</th>
                        <th className="py-2.5 px-4 text-right">Crédito</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {/* Línea Débito: Entrada a Caja / Banco */}
                      <tr className="bg-indigo-50/40 font-semibold">
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">
                          {receivingAccountCode}
                        </td>
                        <td className="py-2.5 px-4">
                          {receivingAccountCode === '110505' ? 'Caja General (Ingreso en efectivo)' : 'Bancos Moneda Nacional'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-indigo-700">
                          ${totalQuota.toLocaleString('es-CO')}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-400">$0</td>
                      </tr>

                      {/* Líneas Crédito: Desglose */}
                      {items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2 px-4 font-mono text-slate-600 font-bold">
                            {it.accountCode}
                          </td>
                          <td className="py-2 px-4">
                            {it.conceptName}
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-slate-400">$0</td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                            ${it.amount.toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs text-slate-900">
                      <tr>
                        <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wider text-slate-500">
                          Sumas Iguales:
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                          ${totalQuota.toLocaleString('es-CO')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                          ${itemsSum.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-4 sm:px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep - 1) as any)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Anterior</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400">Paso 1: Parámetros Básicos</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 2 && items.length === 0 ? (
              <span className="text-xs text-amber-600 font-medium hidden sm:inline">
                Agrega al menos un concepto para continuar
              </span>
            ) : currentStep === 2 && !isBalanced ? (
              <span className="text-xs text-amber-600 font-medium hidden sm:inline">
                {difference > 0 ? `Faltan $${difference.toLocaleString('es-CO')} por asignar` : `Excede por $${Math.abs(difference).toLocaleString('es-CO')}`}
              </span>
            ) : null}

            {currentStep < 4 ? (
              <button
                type="button"
                disabled={currentStep === 2 && items.length === 0}
                onClick={() => setCurrentStep((currentStep + 1) as any)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Continuar</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>Guardar y Empezar a Recaudar</span>
              </button>
            )}
          </div>
        </div>

        {/* Internal Account Picker Popup in Step 2 / Step 3 */}
        {(editingItemIndex !== null || isAddingNewConcept) && (
          <div
            className="fixed inset-0 z-[10010] flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
            onClick={() => {
              setEditingItemIndex(null);
              setIsAddingNewConcept(false);
            }}
          >
            <div
              className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full pb-[env(safe-area-inset-bottom)] sm:pb-0 max-h-[92dvh] sm:max-h-[80dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between flex-wrap gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {isAddingNewConcept ? 'Seleccionar Cuenta P.U.C. para Nuevo Concepto' : 'Cambiar Cuenta P.U.C.'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Catálogo
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isAddingNewConcept
                        ? 'Elige la cuenta contable donde se registrará este rubro de la cuota'
                        : `Para concepto: "${editingItemIndex !== null ? items[editingItemIndex]?.conceptName : ''}"`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItemIndex(null);
                    setIsAddingNewConcept(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search and Tabs */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-2.5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchAccountQuery}
                    onChange={(e) => setSearchAccountQuery(e.target.value)}
                    placeholder="Buscar por código o nombre..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: '3', label: '3 Patrimonio (Aportes)' },
                    { id: '2', label: '2 Pasivo (Fondos)' },
                    { id: '4', label: '4 Ingreso (Cuotas)' },
                  ].map((tb) => (
                    <button
                      key={tb.id}
                      type="button"
                      onClick={() => setSelectedClassTab(tb.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                        selectedClassTab === tb.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tb.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredAccounts.map((acc) => (
                  <div
                    key={acc.code}
                    onClick={() => handleSelectAccount(acc)}
                    className="flex items-center justify-between p-3 px-5 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-20 text-center shrink-0">
                        {acc.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {acc.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                      {isAddingNewConcept ? '+ Seleccionar' : 'Asignar'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

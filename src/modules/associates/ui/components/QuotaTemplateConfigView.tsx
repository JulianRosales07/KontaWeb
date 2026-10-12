import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Coins,
  Settings,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Search,
  Building,
  Layers,
  Sparkles,
  ChevronDown,
  X
} from 'lucide-react';
import { MoneyInput } from '../../../../shared/ui/components/MoneyInput';
import type { QuotaTemplate, QuotaTemplateItem, QuotaCategory } from '../../types/associate';
import { associateApi } from '../../infrastructure/associateApi';
import type { PucAccount } from '../../../contabilidad/domain/pucTypes';
import { STANDARD_PUC_CATALOG } from '../../../contabilidad/infrastructure/pucStandardCatalog';

export const PUC_STORAGE_KEY = 'konta_puc_custom_accounts_v2';
export const TEMPLATE_STORAGE_KEY = 'konta_quota_templates_v1';

// Exact default 7 concepts from the Colombian accountant audio
export const DEFAULT_AUDIO_TEMPLATE: QuotaTemplate = {
  id: 'c0000000-0000-0000-0000-000000000001',
  name: 'Cuota Ordinaria Mensual de Asociado ($50.000)',
  description: 'Desglose oficial: $6.250 administración, $5.250 solidaridad, $10.000 aportes, $5.500 recreación, $2.000 bingo, $1.000 fondo específico y $20.000 aporte extraordinario.',
  totalAmount: 50000,
  isActive: true,
  items: [
    {
      id: 'item-1',
      conceptName: 'Aportes Sociales Ordinarios (Ahorro del Socio)',
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
      id: 'item-2',
      conceptName: 'Aporte Extraordinario (Ahorro Extra del Socio)',
      category: 'SAVINGS',
      accountId: 'acc-311510',
      accountCode: '311510',
      accountName: 'Aporte extraordinario',
      amount: 20000,
      percentage: 40.0,
      isMandatory: false,
      displayOrder: 2,
    },
    {
      id: 'item-3',
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
      id: 'item-4',
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
      id: 'item-5',
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
      id: 'item-6',
      conceptName: 'Juego de Bingo y Eventos',
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
      id: 'item-7',
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
  ],
};

interface QuotaTemplateConfigViewProps {
  onSaved?: () => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const QuotaTemplateConfigView: React.FC<QuotaTemplateConfigViewProps> = ({
  onSaved,
  isModal = false,
  onClose,
}) => {
  // Load Available PUC accounts from user's custom Plan or Standard Catalog
  const [pucAccounts, setPucAccounts] = useState<PucAccount[]>(() => {
    try {
      const saved = localStorage.getItem(PUC_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading PUC from storage', e);
    }
    return STANDARD_PUC_CATALOG;
  });

  // Template State
  const [template, setTemplate] = useState<QuotaTemplate>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading template from storage', e);
    }
    return DEFAULT_AUDIO_TEMPLATE;
  });

  // Account selector modal state
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Success Feedback
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Default Receiving Cash / Bank Account (110505 Caja General)
  const [receivingAccountCode, setReceivingAccountCode] = useState<string>('110505');

  // Calculate Real-time Totals
  const totalReceived = template.totalAmount || 50000;
  const itemsSum = useMemo(() => {
    return template.items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [template.items]);

  const difference = totalReceived - itemsSum;
  const isBalanced = Math.abs(difference) < 0.01;

  // Breakdown by Category
  const incomeTotal = useMemo(() => {
    return template.items
      .filter((i) => i.category === 'INCOME')
      .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  }, [template.items]);

  const equityTotal = useMemo(() => {
    return template.items
      .filter((i) => i.category === 'EQUITY_SAVING')
      .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  }, [template.items]);

  const socialFundTotal = useMemo(() => {
    return template.items
      .filter((i) => i.category === 'SOCIAL_FUND')
      .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  }, [template.items]);

  // Accounts available for selection (filtered by search and class)
  const filteredAccounts = useMemo(() => {
    let result = pucAccounts;
    if (selectedClassFilter !== 'all') {
      result = result.filter((a) => a.code.startsWith(selectedClassFilter));
    }
    if (accountSearchQuery.trim()) {
      const q = accountSearchQuery.toLowerCase();
      result = result.filter(
        (a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [pucAccounts, selectedClassFilter, accountSearchQuery]);

  // Campos de valor vacíos (distintos de un valor real de cero): conceptos nuevos o borrados por el usuario
  const [blankAmounts, setBlankAmounts] = useState<Set<string>>(new Set());
  const markBlank = (key: string, blank: boolean) =>
    setBlankAmounts((prev) => {
      const next = new Set(prev);
      if (blank) next.add(key);
      else next.delete(key);
      return next;
    });
  const [saveError, setSaveError] = useState<string | null>(null);

  // Handle amount change for an item
  const handleAmountChange = (index: number, newAmount: number) => {
    const updatedItems = [...template.items];
    updatedItems[index] = {
      ...updatedItems[index],
      amount: newAmount,
      percentage: totalReceived > 0 ? (newAmount / totalReceived) * 100 : 0,
    };
    setTemplate({
      ...template,
      items: updatedItems,
    });
  };

  // Handle concept name change
  const handleConceptNameChange = (index: number, newName: string) => {
    const updatedItems = [...template.items];
    updatedItems[index] = {
      ...updatedItems[index],
      conceptName: newName,
    };
    setTemplate({
      ...template,
      items: updatedItems,
    });
  };

  // Handle category change
  const handleCategoryChange = (index: number, newCat: QuotaCategory) => {
    const updatedItems = [...template.items];
    updatedItems[index] = {
      ...updatedItems[index],
      category: newCat,
    };
    setTemplate({
      ...template,
      items: updatedItems,
    });
  };

  // Handle mandatory toggle
  const handleMandatoryToggle = (index: number) => {
    const updatedItems = [...template.items];
    updatedItems[index] = {
      ...updatedItems[index],
      isMandatory: !updatedItems[index].isMandatory,
    };
    setTemplate({
      ...template,
      items: updatedItems,
    });
  };

  // Handle Assigning an Account to an Item
  const handleSelectAccount = (account: PucAccount) => {
    if (editingItemIndex === null) return;
    const updatedItems = [...template.items];
    updatedItems[editingItemIndex] = {
      ...updatedItems[editingItemIndex],
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
    };
    setTemplate({
      ...template,
      items: updatedItems,
    });
    setEditingItemIndex(null);
    setAccountSearchQuery('');
  };

  // Add new custom concept
  const handleAddConcept = () => {
    const newItem: QuotaTemplateItem = {
      id: 'custom-item-' + Date.now(),
      conceptName: 'Nuevo Concepto de Cuota',
      category: 'SOCIAL_FUND',
      accountId: 'acc-238095',
      accountCode: '238095',
      accountName: 'Fondos actividades especiales y bingos',
      amount: 0,
      percentage: 0,
      isMandatory: false,
      displayOrder: template.items.length + 1,
    };
    setTemplate({
      ...template,
      items: [...template.items, newItem],
    });
    markBlank(newItem.id, true);
  };

  // Remove a concept
  const handleRemoveConcept = (index: number) => {
    const updatedItems = template.items.filter((_, i) => i !== index);
    setTemplate({
      ...template,
      items: updatedItems,
    });
  };

  // Restore Default Template ($50.000 from audio)
  const handleRestoreDefault = () => {
    if (window.confirm('¿Deseas restaurar la plantilla con los 7 conceptos oficiales del audio ($50.000 COP)?')) {
      setTemplate(DEFAULT_AUDIO_TEMPLATE);
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(DEFAULT_AUDIO_TEMPLATE));
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    }
  };

  // Save changes
  const handleSave = () => {
    const blankItem = template.items.find((i) => blankAmounts.has(i.id));
    if (blankAmounts.has('__total') || blankItem) {
      setSaveError(blankItem ? `Ingrese el valor del concepto "${blankItem.conceptName}".` : 'Ingrese el valor total de la cuota.');
      return;
    }
    setSaveError(null);
    // Recompute percentages based on current total
    const computedItems = template.items.map((i) => ({
      ...i,
      percentage: totalReceived > 0 ? (i.amount / totalReceived) * 100 : 0,
    }));

    const finalTemplate: QuotaTemplate = {
      ...template,
      items: computedItems,
    };

    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(finalTemplate));
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);

    if (onSaved) {
      onSaved();
    }
  };

  const mainBody = (
    <div className="space-y-6">
      {/* Toast alert */}
      {showSavedToast && (
        <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl flex items-start sm:items-center justify-between gap-3 text-xs text-slate-800 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-slate-700 shrink-0" />
            <span className="font-semibold">
              ¡Configuración guardada exitosamente! Todas las cuotas de asociados utilizarán este mapeo contable del PUC.
            </span>
          </div>
          <button
            onClick={() => setShowSavedToast(false)}
            className="text-slate-500 hover:text-slate-800 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards & Partida Doble Verifier */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        {/* 1. Total Cuota Recibida (Débito en Caja/Banco) */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Valor Cuota Total</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              Débito (Caja/Banco)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-400 font-mono">$</span>
            <MoneyInput
              value={blankAmounts.has('__total') ? null : template.totalAmount}
              onChange={(v) => {
                markBlank('__total', v === null);
                setTemplate({ ...template, totalAmount: v ?? 0 });
              }}
              aria-label="Valor cuota total"
              className="text-lg font-bold"
            />
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Building size={12} />
            <span>Cuenta Entrada: <strong className="text-slate-600">{receivingAccountCode} (Caja General)</strong></span>
          </div>
        </div>

        {/* 2. Total Patrimonio (Ahorro Socio) */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Aportes Patrimonio (Clase 3)</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              Ahorro del Socio
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            ${equityTotal.toLocaleString('es-CO')}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            {totalReceived > 0 ? ((equityTotal / totalReceived) * 100).toFixed(1) : 0}% de la cuota mensual
          </span>
        </div>

        {/* 3. Total Fondos y Pasivos (Clase 2) */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pasivos y Fondos (Clase 2)</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              Solidaridad / Recreación
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            ${socialFundTotal.toLocaleString('es-CO')}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            {totalReceived > 0 ? ((socialFundTotal / totalReceived) * 100).toFixed(1) : 0}% de la cuota mensual
          </span>
        </div>

        {/* 4. Total Ingresos Sostenimiento (Clase 4) & Status Partida Doble */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Partida Doble Contable</span>
            {isBalanced ? (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1">
                <CheckCircle2 size={11} strokeWidth={2.5} /> Cuadrada
              </span>
            ) : (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-white flex items-center gap-1">
                <AlertCircle size={11} strokeWidth={2.5} /> Descuadrada
              </span>
            )}
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            ${itemsSum.toLocaleString('es-CO')}
          </div>
          <div className="text-[11px] font-medium flex items-center justify-between text-slate-500">
            <span>Ingreso Clase 4: ${incomeTotal.toLocaleString('es-CO')}</span>
            <span className="font-semibold text-slate-700">
              Dif: ${Math.abs(difference).toLocaleString('es-CO')}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Concepts & PUC Mapping Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span>Desglose de Conceptos y Cuentas Contables Asignadas</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-medium">
                {template.items.length} Conceptos
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Haz clic en cualquier cuenta para cambiarla por otra de tu Plan de Cuentas Propio.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddConcept}
            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus size={14} />
            <span>+ Agregar Otro Concepto</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table-stack w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[200px]">Concepto de Cuota</th>
                <th className="py-2.5 px-3 w-44">Categoría Contable</th>
                <th className="py-2.5 px-3 min-w-[260px]">Cuenta P.U.C. Asignada (Crédito)</th>
                <th className="py-2.5 px-3 w-36 text-right">Valor Sugerido ($)</th>
                <th className="py-2.5 px-3 w-20 text-center">% Cuota</th>
                <th className="py-2.5 px-3 w-24 text-center">Obligatorio</th>
                <th className="py-2.5 px-3 w-16 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {template.items.map((item, index) => {
                const itemPercent = totalReceived > 0 ? (item.amount / totalReceived) * 100 : 0;

                return (
                  <tr
                    key={item.id || index}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-xs">
                      {index + 1}
                    </td>

                    {/* Concept Name */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.conceptName}
                        onChange={(e) => handleConceptNameChange(index, e.target.value)}
                        className="w-full px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </td>

                    {/* Category Selector */}
                    <td className="py-2.5 px-3">
                      <select
                        value={item.category}
                        onChange={(e) => handleCategoryChange(index, e.target.value as QuotaCategory)}
                        className="w-full px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-800 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 cursor-pointer"
                      >
                        <option value="EQUITY_SAVING">Clase 3: Patrimonio (Aportes)</option>
                        <option value="SAVINGS">Ahorro del asociado</option>
                        <option value="SOCIAL_FUND">Clase 2: Pasivo / Fondo Social</option>
                        <option value="INCOME">Clase 4: Ingreso Operacional</option>
                      </select>
                    </td>

                    {/* PUC Account Picker Button */}
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemIndex(index);
                          setAccountSearchQuery('');
                          setSelectedClassFilter(
                            item.category === 'EQUITY_SAVING'
                              ? '3'
                              : item.category === 'INCOME'
                              ? '4'
                              : '2'
                          );
                        }}
                        className="w-full text-left p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all flex items-center justify-between cursor-pointer"
                        title="Haz clic para cambiar la cuenta PUC"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-800 bg-slate-200/80 px-1.5 py-0.5 rounded border border-slate-300">
                              {item.accountCode}
                            </span>
                            <span className="font-medium text-slate-800 truncate block text-xs">
                              {item.accountName}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium shrink-0">
                          Cambiar ▾
                        </span>
                      </button>
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="ml-auto w-36">
                        <MoneyInput
                          value={blankAmounts.has(item.id) ? null : item.amount}
                          onChange={(v) => {
                            markBlank(item.id, v === null);
                            handleAmountChange(index, v ?? 0);
                          }}
                          aria-label={`Valor ${item.conceptName}`}
                          invalid={blankAmounts.has(item.id)}
                        />
                      </div>
                    </td>

                    {/* Percentage */}
                    <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-600 font-medium">
                      {itemPercent.toFixed(1)}%
                    </td>

                    {/* Mandatory Checkbox */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={item.isMandatory}
                        onChange={() => handleMandatoryToggle(index)}
                        className="rounded border-slate-300 text-slate-800 focus:ring-slate-400 accent-slate-800 cursor-pointer"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveConcept(index)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar concepto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer with Totals */}
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900 text-xs">
              <tr>
                <td colSpan={4} className="py-2.5 px-4 text-right uppercase tracking-wider text-slate-500 text-[11px]">
                  Total Conceptos Cuota:
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-slate-900">
                  ${itemsSum.toLocaleString('es-CO')}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-700">
                  100%
                </td>
                <td colSpan={2} className="py-2.5 px-3 text-center">
                  {isBalanced ? (
                    <span className="text-[11px] text-slate-700 font-bold">
                      ✓ Partida Doble Cuadrada
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-800 font-bold">
                      Diferencia: ${Math.abs(difference).toLocaleString('es-CO')}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 flex items-start gap-3">
        <HelpCircle size={16} className="text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900">
            ¿Cómo afecta esta configuración a los comprobantes de diario y reportes?
          </p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Cuando guardes un recaudo de un asociado, el sistema tomará automáticamente las cuentas PUC que hayas configurado en esta tabla. El Débito irá a la <strong>Caja General (110505)</strong> por el total pagado ($50.000) y los Créditos se distribuirán exactamente en las cuentas de <strong>Aportes (311505)</strong>, <strong>Fondos Sociales (2380)</strong> y <strong>Cuotas de Administración (417010)</strong> asociadas al NIT del socio. Esto garantiza que el Balance de Comprobación y el Estado de Cuenta del Asociado se generen al instante sin descuadres.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: SELECTOR DE CUENTAS P.U.C.                                        */}
      {/* ========================================================================= */}
      {editingItemIndex !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
            onClick={() => setEditingItemIndex(null)}
          >
            <div
              className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full pb-[env(safe-area-inset-bottom)] sm:pb-0 max-h-[92dvh] sm:max-h-[80dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Seleccionar Cuenta del Plan de Cuentas Propio
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Catálogo PUC
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Asignando cuenta para el concepto: <strong className="text-slate-700">"{template.items[editingItemIndex]?.conceptName}"</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingItemIndex(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Filter and Search */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    placeholder="Buscar por código (ej: 2380, 3115, 4170) o por nombre..."
                    className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 shadow-xs"
                    autoFocus
                  />
                </div>

                {/* Class Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    { id: 'all', label: 'Todas las clases' },
                    { id: '2', label: '2 Pasivo (Fondos)' },
                    { id: '3', label: '3 Patrimonio (Aportes)' },
                    { id: '4', label: '4 Ingresos (Cuotas)' },
                    { id: '1', label: '1 Activo' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedClassFilter(tab.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        selectedClassFilter === tab.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredAccounts.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold">No se encontraron cuentas con ese criterio</p>
                    <p className="text-xs text-slate-500 mt-1">Verifica el código o intenta con otro término de búsqueda.</p>
                  </div>
                ) : (
                  filteredAccounts.map((acc) => {
                    const isCurrent =
                      template.items[editingItemIndex]?.accountCode === acc.code;

                    return (
                      <div
                        key={acc.code}
                        onClick={() => handleSelectAccount(acc)}
                        className={`flex items-center justify-between py-2.5 px-6 transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-100/80 hover:bg-slate-100'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded w-20 text-center shrink-0">
                            {acc.code}
                          </span>
                          <div className="min-w-0 truncate">
                            <span className="text-xs font-semibold text-slate-900 block truncate">
                              {acc.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Naturaleza: {acc.nature === 'DEBIT' ? 'Débito' : 'Crédito'} · Nivel {acc.level}
                              {acc.requiresThirdParty && ' · Exige Tercero (NIT)'}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 ml-3">
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-200 text-slate-800">
                              <CheckCircle2 size={12} />
                              <span>Asignada</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white transition-colors">
                              Seleccionar
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-slate-500">
                  Mostrando <strong>{filteredAccounts.length}</strong> cuentas disponibles
                </span>
                <button
                  type="button"
                  onClick={() => setEditingItemIndex(null)}
                  className="px-4 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );

  if (isModal) {
    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative w-full pb-[env(safe-area-inset-bottom)] sm:pb-0 max-w-5xl max-h-[92dvh] sm:max-h-[92dvh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                <Settings size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Mapeo de Conceptos de Recaudo vs. Cuentas P.U.C.
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    Configuración P.U.C.
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define qué cuentas del Plan de Cuentas Propio recibirán el crédito de cada rubro.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreDefault}
                className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                title="Restablece los 7 rubros exactos explicados en el audio"
              >
                <RotateCcw size={13} />
                <span>Restablecer Audio ($50k)</span>
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {mainBody}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between flex-wrap gap-3 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50/90 shrink-0">
            <div className="text-xs text-slate-500">
              Los cambios se aplicarán automáticamente a las cuotas de asociados.
            </div>
            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save size={14} />
                <span>Guardar Configuración</span>
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="space-y-6">
      {/* Header for Page View */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              <Settings size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Mapeo de Conceptos de Recaudo vs. Cuentas P.U.C.
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Configuración P.U.C.
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Define qué cuentas del Plan de Cuentas Propio recibirán el crédito de cada rubro cuando el asociado paga su cuota.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRestoreDefault}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-200 bg-white hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Restablece los 7 rubros exactos explicados en el audio"
          >
            <RotateCcw size={14} />
            <span>Restablecer Audio ($50k)</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Save size={15} />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>

      {saveError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
          {saveError}
        </div>
      )}

      {mainBody}
    </div>
  );
};

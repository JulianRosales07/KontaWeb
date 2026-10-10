import React from 'react';
import type { NavTab } from '../../../../shared/ui/components/Sidebar';
import {
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Coins,
  Sparkles,
  Users,
  CreditCard,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: NavTab, subtab?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Sistema Contable & Financiero KONTA ERP
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Plataforma integral de gestión contable, cartera por edades, documentos equivalentes y reportes NIIF por terceros.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* ⭐ ACCESO RÁPIDO PROMINENTE: RECAUDO CUOTA ASOCIADOS ($50.000 COP)        */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
              <Sparkles size={13} className="text-slate-400" />
              <span>ACTIVIDAD PRINCIPAL: ASOCIACIONES & COOPERATIVAS</span>
              <span className="bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                RECAUDO $50k
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Recaudo de Cuota Mensual de Asociados
            </h2>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Registra en un solo clic el cobro de la cuota de <strong className="text-white font-semibold">$50.000 COP</strong> con distribución automática en las 7 cuentas del P.U.C.:
            </p>

            {/* 3 Accounting Pillars breakdown badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>$6.250 Admón (Ingreso 417010)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>$13.750 Fondos Sociales (Pasivo 2380)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>$30.000 Aportes Socio (Patrimonio 3115)</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('cartera', 'recaudo-asociados')}
              className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Coins size={16} className="text-slate-900" />
              <span>Cobrar Cuota ($50.000)</span>
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('cartera', 'prestamos-asociados')}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard size={16} />
              <span>Préstamos y Plan de Pagos</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Recaudo de Cuotas */}
        <div
          onClick={() => onNavigate('cartera', 'recaudo-asociados')}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4 border border-slate-200 group-hover:bg-slate-200/80 transition-colors">
              <Coins size={20} />
            </div>
            <div className="self-start inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 mb-2.5">
              Operación Principal
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">
              Recaudo Cuota ($50.000 COP)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Cobro mensual con distribución automática: $6.250 Sostenimiento, $13.750 Fondos Sociales y $30.000 Aportes.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors pt-3 border-t border-slate-100">
            <span>Cobrar Cuota</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Card 2: Préstamos y Plan de Pagos */}
        <div
          onClick={() => onNavigate('cartera', 'prestamos-asociados')}
          className="bg-white rounded-2xl border border-indigo-200/80 p-6 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4 border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
              <CreditCard size={20} />
            </div>
            <div className="self-start inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2.5">
              Cartera de Crédito
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">
              Préstamos y Plan de Pagos
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Registra préstamos a asociados, calcula tablas de amortización francesa y abona cuotas mensuales de capital e interés.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors pt-3 border-t border-slate-100">
            <span>Gestionar Préstamos</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Card 3: Directorio de Asociados */}
        <div
          onClick={() => onNavigate('terceros')}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4 border border-slate-200 group-hover:bg-slate-200/80 transition-colors">
              <Users size={20} />
            </div>
            <div className="self-start inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 mb-2.5">
              Directorio Oficial
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">
              Directorio de Asociados
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Cédulas, nombres, teléfonos y estados de cuenta históricos de cada socio para verificar sus ahorros y aportes acumulados.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors pt-3 border-t border-slate-100">
            <span>Gestionar Asociados</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Card 4: Contabilidad General PUC */}
        <div
          onClick={() => onNavigate('contabilidad')}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4 border border-slate-200 group-hover:bg-slate-200/80 transition-colors">
              <FileSpreadsheet size={20} />
            </div>
            <div className="self-start inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 mb-2.5">
              Partida Doble NIIF
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">
              Contabilidad P.U.C. & Comprobantes
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Comprobantes de ingreso (CP-ING), asientos diarios de Caja 110505 vs Cuentas 4170, 2380 y 3115, y balance de comprobación.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors pt-3 border-t border-slate-100">
            <span>Ver Comprobantes</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Enterprise Highlights */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Arquitectura y Estándares Empresariales
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Integración robusta entre el Frontend React + TypeScript y el Backend Spring Boot 3
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-800 text-xs font-semibold mb-1.5">
              <ShieldCheck size={16} className="text-slate-600" />
              <span>Partida Doble Estricta</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tanto los recaudos de cuota, notas de causación, desembolsos de préstamos y comprobantes contables cuadran en sumas iguales Débito = Crédito.
            </p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-800 text-xs font-semibold mb-1.5">
              <TrendingUp size={16} className="text-slate-600" />
              <span>Consultas JPQL Agrupadas</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Reportes optimizados a nivel de base de datos PostgreSQL mediante proyecciones nativas por Cuenta y Tercero para alto volumen de transacciones.
            </p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-800 text-xs font-semibold mb-1.5">
              <Zap size={16} className="text-slate-600" />
              <span>Conexión con Fallback Híbrido</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              El cliente Axios se conecta en tiempo real al backend en <code className="text-slate-700 bg-slate-200/80 px-1 py-0.5 rounded text-[11px]">localhost:8080/api/v1</code> y provee datos simulados en modo offline si el servidor está detenido.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

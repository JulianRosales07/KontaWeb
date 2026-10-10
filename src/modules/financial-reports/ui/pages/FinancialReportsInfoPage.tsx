import React from 'react';
import {
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Scale,
  Sparkles,
  LogIn,
  PieChart,
  BarChart,
  Shield,
  UserCheck,
} from 'lucide-react';
import { KontaLogo } from '../../../../shared/ui/components/KontaLogo';

interface FinancialReportsInfoPageProps {
  onBackToLanding: () => void;
  onOpenLogin: () => void;
  onNavigateToCartera?: () => void;
  onNavigateToDocSoporte?: () => void;
}

export const FinancialReportsInfoPage: React.FC<FinancialReportsInfoPageProps> = ({
  onBackToLanding,
  onOpenLogin,
  onNavigateToCartera,
  onNavigateToDocSoporte,
}) => {
  return (
    <div className="relative min-h-screen w-full bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      {/* Background Matrix & Subtle Gradient Auras */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.25px,transparent_1.25px)] [background-size:24px_24px] pointer-events-none opacity-40" />
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-[550px] h-[550px] bg-indigo-100/35 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Inicio</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div
              className="flex items-center cursor-pointer transition-transform hover:scale-[1.02]"
              onClick={onBackToLanding}
            >
              <KontaLogo size={36} showText={true} textColor="#0f172a" />
            </div>
          </div>

          {/* Module Switcher Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-500">
            {onNavigateToCartera && (
              <button
                onClick={onNavigateToCartera}
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Cartera & Aging
              </button>
            )}
            {onNavigateToDocSoporte && (
              <button
                onClick={onNavigateToDocSoporte}
                className="hover:text-sky-600 transition-colors cursor-pointer"
              >
                Doc. Soporte
              </button>
            )}
            <span className="text-emerald-600 font-bold border-b-2 border-emerald-600 pb-0.5">
              Estados NIIF
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle size={13} className="text-emerald-500" />
              100% NIIF Plenas y Pymes
            </span>

            <button
              onClick={onOpenLogin}
              className="px-6 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold tracking-wider uppercase rounded-full shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <LogIn size={14} />
              <span>Ingresar al ERP</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-12 lg:pt-16 pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-6">
            <FileSpreadsheet size={16} />
            <span>Módulo Oficial de Estados Financieros por Terceros</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Auditoría de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Estados Financieros</span> a nivel de Terceros.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Genere Balance de Comprobación con validación matemática de sumas iguales, Estado de Resultados (P&G) y Balance General discriminados por cliente, contratista, proveedor o empleado bajo NIIF y catálogo P.U.C.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onOpenLogin}
              className="px-8 py-3.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm tracking-wider uppercase rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Auditar Estados Contables</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => document.getElementById('reports-demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3.5 border border-slate-300 hover:border-emerald-400 text-slate-700 hover:text-emerald-600 font-semibold text-xs sm:text-sm bg-white rounded-full transition-all cursor-pointer shadow-xs"
            >
              Ver Tipos de Informes ↓
            </button>
          </div>
        </div>
      </section>

      {/* KPI Highlights Bar */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 -mt-4 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Scale size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">Sumas Iguales</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Débito = Crédito comprobado al centavo</div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
              <UserCheck size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">Por Tercero</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Movimiento y saldo discriminado por NIT/Cédula</div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <BarChart size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">P&G en Vivo</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Ingresos (4), Gastos (5) y Costos (6) en tiempo real</div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Shield size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">Ecuación NIIF</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Activo = Pasivo + Patrimonio garantizado</div>
          </div>
        </div>
      </section>

      {/* Interactive Reports Demo Card */}
      <section id="reports-demo" className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-12">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 shadow-xl shadow-slate-900/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                <FileSpreadsheet size={16} />
                <span>Simulación de Balance de Comprobación</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Auditoría Contable a Nivel de Tercero (NIT / Cédula)
              </h2>
            </div>

            {/* Balanced Equation Indicator Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <CheckCircle size={15} />
              <span>Ecuación Contable: Balanceada OK</span>
            </div>
          </div>

          {/* Sample Third-Party Financial Ledger Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Cuenta P.U.C.</th>
                  <th className="py-3 px-4">Tercero (NIT / Razón Social)</th>
                  <th className="py-3 px-4 text-right">Saldo Inicial</th>
                  <th className="py-3 px-4 text-right">Débitos</th>
                  <th className="py-3 px-4 text-right">Créditos</th>
                  <th className="py-3 px-4 text-right">Saldo Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">110505 - Caja General</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">800.197.268-1 · Banco de la República</td>
                  <td className="py-3.5 px-4 text-right font-mono">$ 5,000,000</td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-bold">$ 8,400,000</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600">$ 3,200,000</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">$ 10,200,000</td>
                </tr>

                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">130505 - Clientes Nacionales</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">900.542.118-2 · Distribuciones Andinas S.A.S.</td>
                  <td className="py-3.5 px-4 text-right font-mono">$ 8,500,000</td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-bold">$ 4,850,000</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600">$ 5,000,000</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">$ 8,350,000</td>
                </tr>

                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">220505 - Proveedores Nacionales</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">860.231.984-5 · Comercializadora El Triunfo</td>
                  <td className="py-3.5 px-4 text-right font-mono">$ 4,200,000</td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-bold">$ 2,000,000</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600">$ 6,200,000</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">$ 8,400,000</td>
                </tr>

                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">413505 - Comercio al por Mayor</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">901.874.329-1 · Inversiones del Norte</td>
                  <td className="py-3.5 px-4 text-right font-mono">$ 0</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600">$ 0</td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-bold">$ 12,500,000</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">$ 12,500,000</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="py-3.5 px-4 uppercase">Sumas Iguales Auditadas (Débito = Crédito)</td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600">$ 15,250,000</td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600">$ 15,250,000</td>
                  <td className="py-3.5 px-4 text-right font-mono text-indigo-600">Diferencia: $ 0.00</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* Feature Breakdown: 3 Pillars */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            REPORTES EMPRESARIALES
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
            Los 3 Estados Financieros Clave para su Empresa
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Conozca la situación patrimonial y operativa al nivel más granular de su operación
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <Scale size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Balance de Comprobación
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Verificación de partida doble con sumas iguales exactas. Permite filtrar por tercero para conciliar saldos de proveedores, clientes, bancos y cuentas por pagar antes del cierre contable.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6">
              <BarChart size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Estado de Resultados (P&G)
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Muestra la utilidad neta de la empresa contrastando ingresos operacionales menos costos de venta y gastos de administración, desglosando la procedencia por cada tercero.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
              <PieChart size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Balance General NIIF
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Estructura patrimonial en tiempo real: Activo Corriente y No Corriente, Pasivo y Patrimonio, garantizando la consistencia de la ecuación patrimonial para entes de control y DIAN.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pb-20">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold mb-4 backdrop-blur-sm">
              <Sparkles size={14} />
              <span>Contabilidad de Alta Precisión</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ¿Listo para auditar los estados financieros de su empresa?
            </h2>

            <p className="mt-3 text-sm text-slate-300">
              Inicie sesión en Konta ERP para exportar balances, auditar sumas iguales y generar informes para asamblea o gerencia.
            </p>

            <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
              <button
                onClick={onOpenLogin}
                className="px-8 py-3.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm tracking-wider uppercase rounded-full shadow-lg shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <LogIn size={16} />
                <span>Ingresar al Módulo de Estados Financieros</span>
              </button>

              <button
                onClick={onBackToLanding}
                className="px-6 py-3.5 border border-white/20 hover:border-white/40 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm rounded-full transition-all cursor-pointer"
              >
                Volver a la Página Principal
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

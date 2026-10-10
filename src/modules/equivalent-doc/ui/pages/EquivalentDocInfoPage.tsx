import React from 'react';
import {
  ReceiptText,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  FileCheck2,
  Scale,
  Sparkles,
  LogIn,
  DollarSign,
  Layers,
  Calculator,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { KontaLogo } from '../../../../shared/ui/components/KontaLogo';

interface EquivalentDocInfoPageProps {
  onBackToLanding: () => void;
  onOpenLogin: () => void;
  onNavigateToCartera?: () => void;
  onNavigateToReportes?: () => void;
}

export const EquivalentDocInfoPage: React.FC<EquivalentDocInfoPageProps> = ({
  onBackToLanding,
  onOpenLogin,
  onNavigateToCartera,
  onNavigateToReportes,
}) => {
  return (
    <div className="relative min-h-screen w-full bg-slate-50 text-slate-800 font-sans selection:bg-sky-500 selection:text-white overflow-x-hidden">
      {/* Background Matrix & Subtle Gradient Auras */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.25px,transparent_1.25px)] [background-size:24px_24px] pointer-events-none opacity-40" />
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-sky-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-[550px] h-[550px] bg-indigo-100/35 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors cursor-pointer group"
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
            <span className="text-sky-600 font-bold border-b-2 border-sky-600 pb-0.5">
              Doc. Soporte
            </span>
            {onNavigateToReportes && (
              <button
                onClick={onNavigateToReportes}
                className="hover:text-emerald-600 transition-colors cursor-pointer"
              >
                Estados NIIF
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              <CheckCircle size={13} className="text-sky-500" />
              Resolución DIAN Colombia
            </span>

            <button
              onClick={onOpenLogin}
              className="px-6 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold tracking-wider uppercase rounded-full shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 transition-all cursor-pointer flex items-center gap-2"
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-xs font-bold uppercase tracking-wider text-sky-700 mb-6">
            <ReceiptText size={16} />
            <span>Módulo Oficial Documento Soporte en Adquisiciones</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Emisión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">Documento Soporte</span> a no obligados a facturar.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Sustente legalmente los costos, deducciones e impuestos descontables por compras de bienes o servicios a proveedores y personas naturales no obligadas a expedir factura, con generación inmediata de comprobante de egreso o causación a cuentas por pagar.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onOpenLogin}
              className="px-8 py-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs sm:text-sm tracking-wider uppercase rounded-full shadow-lg shadow-sky-500/25 hover:shadow-sky-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Emitir Documento Soporte</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => document.getElementById('modes-demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3.5 border border-slate-300 hover:border-sky-400 text-slate-700 hover:text-sky-600 font-semibold text-xs sm:text-sm bg-white rounded-full transition-all cursor-pointer shadow-xs"
            >
              Ver Modos de Pago & Retenciones ↓
            </button>
          </div>
        </div>
      </section>

      {/* KPI Highlights Bar */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 -mt-4 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-sky-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <FileCheck2 size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">Deducción 100%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Costos y gastos válidos ante la DIAN para renta</div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-sky-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Calculator size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">Retenciones</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Cálculo automático ReteFuente, ReteICA y ReteIVA</div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-sky-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <DollarSign size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">Doble Modalidad</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Pago inmediato con egreso o crédito a causación (2335)</div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-sky-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Scale size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">Sumas Iguales</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Auditoría automática Débitos = Créditos</div>
          </div>
        </div>
      </section>

      {/* Interactive Modes Demo Card */}
      <section id="modes-demo" className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-12">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 shadow-xl shadow-slate-900/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">
                <Layers size={16} />
                <span>Simulación de Asiento Automático P.U.C.</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Comparativa: Pago Inmediato vs. Causación a Crédito
              </h2>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold">
              <ShieldCheck size={15} />
              <span>Consecutivo DIAN: DS-00142</span>
            </div>
          </div>

          {/* Dual Flow Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Opción 1: Egreso Inmediato */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-700">
                  Modalidad 1: Egreso Inmediato (Contado)
                </span>
                <span className="text-xs font-mono text-slate-500">Recibo de Caja / Egreso</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                Genera Comprobante de Egreso sin Cuenta por Pagar
              </h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Ideal para gastos menores, fletes de transporte, servicios de mantenimiento o compras liquidadas en el momento de la entrega.
              </p>

              {/* Sample Accounting Entry */}
              <div className="rounded-xl bg-white border border-slate-200 p-4 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600 font-bold">
                  <span>Cuenta PUC / Concepto</span>
                  <span>Débito / Crédito</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-700">
                  <span>5135 Honorarios / Servicios</span>
                  <span className="text-emerald-600 font-bold">$ 1,500,000 (D)</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-700">
                  <span>2365 Retención Fuente (3.5%)</span>
                  <span className="text-indigo-600 font-bold">$ 52,500 (C)</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-700">
                  <span>1110 Bancos / Caja General</span>
                  <span className="text-sky-600 font-bold">$ 1,447,500 (C)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>Sumas Iguales Auditadas</span>
                  <span>$ 1,500,000</span>
                </div>
              </div>
            </div>

            {/* Opción 2: Causación a Crédito */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-100 text-indigo-700">
                  Modalidad 2: Causación a Crédito
                </span>
                <span className="text-xs font-mono text-slate-500">Cuenta por Pagar (2335)</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                Reconoce el Pasivo con Vencimiento Posterior
              </h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Acredita a la subcuenta del proveedor o contratista (2335) para programar el pago futuro mediante tesorería institucional.
              </p>

              {/* Sample Accounting Entry */}
              <div className="rounded-xl bg-white border border-slate-200 p-4 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600 font-bold">
                  <span>Cuenta PUC / Concepto</span>
                  <span>Débito / Crédito</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-700">
                  <span>5135 Honorarios / Servicios</span>
                  <span className="text-emerald-600 font-bold">$ 2,000,000 (D)</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-700">
                  <span>2365 Retención Fuente (3.5%)</span>
                  <span className="text-indigo-600 font-bold">$ 70,000 (C)</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-700">
                  <span>2335 Costos por Pagar a Terceros</span>
                  <span className="text-purple-600 font-bold">$ 1,930,000 (C)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>Sumas Iguales Auditadas</span>
                  <span>$ 2,000,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Breakdown: 3 Pillars */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            VENTAJAS TRIBUTARIAS
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
            Seguridad Fiscal para Compras a No Obligados
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Cumple íntegramente con los requisitos del Estatuto Tributario y las resoluciones vigentes de la DIAN
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-sky-400 hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6">
              <Calculator size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Retenciones Parametrizables
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Aplique retención en la fuente por compras (2.5%), servicios (4% o 6%) u honorarios (10% o 11%), más ReteICA territorial según la actividad económica del municipio.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-sky-400 hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <Building2 size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Gestión Integral de Terceros
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Registro de beneficiarios por Cédula de Ciudadanía, NIT, Cédula de Extranjería o Pasaporte, verificando tipo de persona y régimen tributario para la emisión.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-sky-400 hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <FileSpreadsheet size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Auditoría y Certificados
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Consolide el acumulado anual de retenciones practicadas para emitir el certificado de retención en la fuente a cada contratista al cierre de año fiscal.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pb-20">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-xs font-semibold mb-4 backdrop-blur-sm">
              <Sparkles size={14} />
              <span>Soporte DIAN Automático</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ¿Listo para emitir sus documentos soporte con validez DIAN?
            </h2>

            <p className="mt-3 text-sm text-slate-300">
              Inicie sesión en Konta ERP para gestionar compras a proveedores no obligados, registrar pagos con egreso o programar causaciones.
            </p>

            <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
              <button
                onClick={onOpenLogin}
                className="px-8 py-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs sm:text-sm tracking-wider uppercase rounded-full shadow-lg shadow-sky-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <LogIn size={16} />
                <span>Ingresar al Módulo de Documento Soporte</span>
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

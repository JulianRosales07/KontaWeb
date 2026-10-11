import React, { useState } from 'react';
import {
  History,
  Settings,
  Plus,
} from 'lucide-react';

export type NominaTab =
  | 'base'
  | 'empleados'
  | 'liquidacion'
  | 'historial-de-periodos'
  | 'configuracion';

interface NominaPageProps {
  initialTab?: NominaTab;
  onTabChange?: (tab: NominaTab) => void;
}

export const NominaPage: React.FC<NominaPageProps> = ({
  initialTab = 'base',
}) => {
  const [activeTab, setActiveTab] = useState<NominaTab>(initialTab);

  // Synchronize with sidebar navigation
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const employees = [
    {
      id: '1',
      name: 'CARLOS ANDRÉS MENDOZA VARGAS',
      idNumber: '1.018.445.920',
      role: 'Contador General',
      salary: 4500000,
      contractType: 'Término Indefinido',
      eps: 'Sanitas',
      afp: 'Porvenir',
      status: 'Activo',
    },
    {
      id: '2',
      name: 'MARÍA PAULA JARAMILLO DUQUE',
      idNumber: '1.032.880.114',
      role: 'Auxiliar Contable y Tributaria',
      salary: 2200000,
      contractType: 'Término Indefinido',
      eps: 'Compensar',
      afp: 'Protección',
      status: 'Activo',
    },
    {
      id: '3',
      name: 'JUAN SEBASTIÁN OSPINA GÓMEZ',
      idNumber: '1.015.334.812',
      role: 'Asesor Comercial Senior',
      salary: 1800000,
      contractType: 'Término Fijo',
      eps: 'Sura',
      afp: 'Colfondos',
      status: 'Activo',
    },
  ];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="min-h-full flex flex-col bg-[#f8fafc]">
      {/* Submenu Content Panels - Navigation is directly handled by the Sidebar */}
      <div className="flex-1 bg-[#f8fafc]">
        {/* TAB 1: BASE */}
        {activeTab === 'base' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900">Parámetros Base de Nómina (Colombia 2026)</h2>
              <p className="text-xs text-slate-500 mt-1">
                Leyes laborales colombianas, salario mínimo, auxilio de transporte y aportes parafiscales
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">S.M.L.V. 2026</span>
                <div className="text-2xl font-bold text-slate-900 mt-2">$1.430.000</div>
                <span className="text-[11px] text-slate-400 mt-1 block">Salario Mínimo Legal</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Auxilio Transporte</span>
                <div className="text-2xl font-bold text-[#5850ec] mt-2">$178.000</div>
                <span className="text-[11px] text-slate-400 mt-1 block">Hasta 2 SMLV</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Seguridad Social</span>
                <div className="text-2xl font-bold text-slate-900 mt-2">8.0% Empleado</div>
                <span className="text-[11px] text-slate-400 mt-1 block">4% Salud + 4% Pensión</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Aportes Empresa</span>
                <div className="text-2xl font-bold text-emerald-600 mt-2">12.0% Pensión</div>
                <span className="text-[11px] text-slate-400 mt-1 block">+ ARL + Parafiscales (Caja 4%)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMPLEADOS */}
        {activeTab === 'empleados' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Directorio de Colaboradores & Empleados</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Gestión de contratos laborales, salarios básicos, afiliaciones a seguridad social y hoja de vida
                </p>
              </div>
              <button
                onClick={() => alert('Crear nuevo empleado')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#5850ec] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus size={15} />
                <span>Nuevo Empleado</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-5">Colaborador</th>
                    <th className="py-3 px-4">Identificación</th>
                    <th className="py-3 px-4">Cargo</th>
                    <th className="py-3 px-4">Tipo Contrato</th>
                    <th className="py-3 px-4">EPS / AFP</th>
                    <th className="py-3 px-5 text-right">Salario Base</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{emp.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{emp.idNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{emp.role}</td>
                      <td className="py-3.5 px-4 text-slate-600">{emp.contractType}</td>
                      <td className="py-3.5 px-4 text-slate-600">{emp.eps} / {emp.afp}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-slate-900">
                        {formatCurrency(emp.salary)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LIQUIDACIÓN */}
        {activeTab === 'liquidacion' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Liquidación Periódica de Nómina</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Cálculo de devengados, horas extras, deducciones y emisión de Nómina Electrónica DIAN
                </p>
              </div>
              <button
                onClick={() => alert('Iniciando cálculo de liquidación quincenal...')}
                className="px-4 py-2 bg-[#5850ec] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Liquidar Periodo Actual</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: HISTORIAL DE PERIODOS */}
        {activeTab === 'historial-de-periodos' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History size={20} className="text-[#5850ec]" />
                <span>Historial de Nóminas Procesadas & Transmitidas a la DIAN</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Comprobantes XML con CUNE y confirmaciones de pago a cuentas bancarias de los empleados
              </p>
            </div>
          </div>
        )}

        {/* TAB 5: CONFIGURACIÓN */}
        {activeTab === 'configuracion' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings size={20} className="text-[#5850ec]" />
                <span>Configuración Contable de Nómina</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Causación de gastos de personal 5105 / 5205, cuentas por pagar 2505 y provisiones de prestaciones sociales
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

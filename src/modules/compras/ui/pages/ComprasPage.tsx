import React, { useState } from 'react';
import {
  Inbox,
  Mail,
  Plus,
  Receipt,
  Send,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { EquivalentDocPage } from '../../../equivalent-doc/ui/pages/EquivalentDocPage';

export type ComprasTab =
  | 'base'
  | 'compras'
  | 'documentos-soporte'
  | 'notas-de-ajuste'
  | 'eventos-recepcion'
  | 'buzon-de-compras'
  | 'correos-recibidos';

interface ComprasPageProps {
  initialTab?: ComprasTab;
  onTabChange?: (tab: ComprasTab) => void;
}

export const ComprasPage: React.FC<ComprasPageProps> = ({
  initialTab = 'base',
}) => {
  const [activeTab, setActiveTab] = useState<ComprasTab>(initialTab);

  // Synchronize with sidebar navigation
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="min-h-full flex flex-col bg-[#f8fafc]">
      {/* Submenu Content Panels - Navigation is directly handled by the Sidebar */}
      <div className="flex-1 bg-[#f8fafc]">
        {/* TAB 1: BASE (Active in screenshot 1) */}
        {activeTab === 'base' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="text-[#5850ec]" size={20} />
                <span>Configuración Base de Compras & Proveedores</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Parámetros generales de adquisición de bienes y servicios, resolución DIAN de Documento Soporte y retenciones
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#5850ec]">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Resolución DIAN Doc. Soporte</h3>
                    <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      ● Activa
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Prefijo:</span>
                    <span className="font-bold text-slate-800">DS</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Rango:</span>
                    <span className="font-bold text-slate-800">1 al 5000</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Resolución No:</span>
                    <span className="font-bold text-slate-800">18760000002</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Vencimiento:</span>
                    <span className="font-bold text-emerald-600">2027-04-12</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Tabla de Retenciones Aplicables</h3>
                    <span className="text-[11px] text-slate-400">Año Gravable 2026</span>
                  </div>
                </div>
                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Compras Generales (Declarantes):</span>
                    <span className="font-bold text-slate-800">2.5%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Compras No Declarantes:</span>
                    <span className="font-bold text-slate-800">3.5%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Servicios Generales:</span>
                    <span className="font-bold text-slate-800">4.0%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Honorarios y Consultoría:</span>
                    <span className="font-bold text-slate-800">10.0% / 11.0%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Buzón de Recepción RADIAN</h3>
                    <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                      Sincronizado
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Correo Electrónico:</span>
                    <span className="font-bold text-slate-800">facturacion@konta.com</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Servidor IMAP:</span>
                    <span className="font-bold text-slate-800">SSL / TLS 993</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Eventos Automáticos:</span>
                    <span className="font-bold text-emerald-600">Activo (Acuse)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Estado Conexión:</span>
                    <span className="font-bold text-emerald-600">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPRAS */}
        {activeTab === 'compras' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Registro de Facturas de Proveedores</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Recepción, causación y registro contable de facturas de compra a crédito y de contado
                </p>
              </div>
              <button
                onClick={() => alert('Registrar nueva factura de compra')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#5850ec] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus size={15} />
                <span>Registrar Factura de Compra</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: DOCUMENTOS SOPORTE (DIAN ELECTRONIC PUNTO 2) */}
        {activeTab === 'documentos-soporte' && (
          <div>
            <EquivalentDocPage />
          </div>
        )}

        {/* TAB 4: NOTAS DE AJUSTE */}
        {activeTab === 'notas-de-ajuste' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Notas de Ajuste al Documento Soporte</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Correcciones, anulaciones y resciliaciones a documentos soporte electrónicos transmitidos a la DIAN
                </p>
              </div>
              <button
                onClick={() => alert('Crear nueva nota de ajuste')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#5850ec] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus size={15} />
                <span>Nueva Nota de Ajuste</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: EVENTOS RECEPCIÓN */}
        {activeTab === 'eventos-recepcion' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Send size={18} className="text-[#5850ec]" />
                <span>Eventos RADIAN DIAN de Facturas de Proveedores</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Generación y firma electrónica de los 3 eventos obligatorios para deducción de costos y gastos (Art. 771-2 E.T.)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evento 1</span>
                <h3 className="text-sm font-bold text-slate-800 mt-1">Acuse de Recibo de Factura</h3>
                <p className="text-xs text-slate-500 mt-2">
                  Notifica la recepción del documento XML al proveedor y la DIAN.
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evento 2</span>
                <h3 className="text-sm font-bold text-slate-800 mt-1">Recibo del Bien o Servicio</h3>
                <p className="text-xs text-slate-500 mt-2">
                  Confirma que la mercancía o servicio fue recibido a satisfacción.
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evento 3</span>
                <h3 className="text-sm font-bold text-slate-800 mt-1">Aceptación Expresa</h3>
                <p className="text-xs text-slate-500 mt-2">
                  Convierte la factura electrónica en título valor para el proveedor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: BUZÓN DE COMPRAS */}
        {activeTab === 'buzon-de-compras' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Inbox size={20} className="text-[#5850ec]" />
                  <span>Buzón de Recepción de Facturas Electrónicas</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Repositorio de archivos XML AttachedDocument y PDF validados automáticamente ante la DIAN
                </p>
              </div>
              <button
                onClick={() => alert('Sincronizando buzón tributario DIAN...')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Sincronizar Buzón</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: CORREOS RECIBIDOS */}
        {activeTab === 'correos-recibidos' && (
          <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mail size={20} className="text-[#5850ec]" />
                <span>Historial de Correos Electrónicos Recibidos</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Registro de emails entrantes de proveedores con extracción automática de adjuntos XML y ZIP
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

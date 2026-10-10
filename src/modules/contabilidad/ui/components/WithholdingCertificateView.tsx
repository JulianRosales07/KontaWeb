import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  FileCheck,
  Info,
} from 'lucide-react';
import { documentExportService } from '../../../../services/documentExportService';
import { THIRD_PARTIES_STORAGE_KEY } from '../../../terceros/ui/pages/TercerosPage';

interface ThirdPartyItem {
  id?: string;
  name: string;
  idType: string;
  idNumber: string;
  dv?: string;
  classification?: string;
}

interface WithholdingSampleParty {
  id: string;
  name: string;
  idNumber: string;
  dv?: string;
  classification: string;
  city?: string;
}

const DEFAULT_SAMPLE_PARTIES: WithholdingSampleParty[] = [
  {
    id: '90000000-0000-0000-0000-000000000001',
    name: 'DISTRIBUIDORA COLOMBIANA DE MATERIAS PRIMAS S.A.S.',
    idNumber: '800123456',
    dv: '9',
    classification: 'Proveedor',
    city: 'Bogotá D.C.',
  },
  {
    id: '90000000-0000-0000-0000-000000000002',
    name: 'JUAN CARLOS PEREZ GOMEZ',
    idNumber: '1020304050',
    dv: '2',
    classification: 'Asociado',
    city: 'Medellín',
  },
  {
    id: '90000000-0000-0000-0000-000000000003',
    name: 'SERVICIOS TECNOLÓGICOS DE COLOMBIA LTDA',
    idNumber: '900987654',
    dv: '1',
    classification: 'Proveedor',
    city: 'Cali',
  },
];

export const WithholdingCertificateView: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [parties, setParties] = useState<WithholdingSampleParty[]>(DEFAULT_SAMPLE_PARTIES);
  const [selectedPartyId, setSelectedPartyId] = useState<string>(DEFAULT_SAMPLE_PARTIES[0].id);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THIRD_PARTIES_STORAGE_KEY);
      if (stored) {
        const parsed: ThirdPartyItem[] = JSON.parse(stored);
        if (parsed.length > 0) {
          const mapped: WithholdingSampleParty[] = parsed.map((p, idx) => ({
            id: p.id || `tp-${idx}`,
            name: p.name,
            idNumber: p.idNumber,
            dv: p.dv,
            classification: p.classification || 'Proveedor',
          }));
          setParties([...mapped, ...DEFAULT_SAMPLE_PARTIES]);
          setSelectedPartyId(mapped[0].id);
        }
      }
    } catch (e) {
      console.warn('Error loading third parties for certificate view', e);
    }
  }, []);

  const selectedParty = parties.find((p) => p.id === selectedPartyId) || parties[0];

  const filteredParties = parties.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.idNumber.toLowerCase().includes(q)
    );
  });

  const handleDownload = async () => {
    if (!selectedParty) return;

    try {
      setDownloading(true);
      setStatusMessage(null);
      await documentExportService.downloadWithholdingCertificate(
        selectedParty.id,
        selectedYear,
        selectedParty.name
      );
      setStatusMessage({
        type: 'success',
        text: `Certificado de Retención ${selectedYear} para ${selectedParty.name} generado y descargado correctamente.`,
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al emitir el certificado oficial desde el servidor.';
      setStatusMessage({
        type: 'error',
        text: msg,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[#5850ec] text-xs font-semibold">
            <ShieldCheck size={14} />
            <span>Estatuto Tributario Nacional · Art. 381</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Certificados de Retención en la Fuente
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Emisión de certificados tributarios oficiales por concepto de Retención en la Fuente a título de Renta (cuenta 2365), Retención de IVA (cuenta 2367) y Retención de ICA (cuenta 2368).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Año:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold px-2 py-0.5 rounded-lg hover:bg-black/5"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Grid: Selector & Certificate Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Third Party Selector */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Selecciona el Tercero / Sujeto Pasivo
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {filteredParties.length} disponibles
            </span>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por NIT o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto rounded-xl border border-slate-100">
            {filteredParties.map((party) => {
              const isSelected = party.id === selectedPartyId;
              return (
                <button
                  key={party.id}
                  onClick={() => setSelectedPartyId(party.id)}
                  className={`w-full p-3.5 text-left transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-l-4 border-l-[#5850ec]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 line-clamp-1">
                      {party.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      NIT: {party.idNumber} {party.dv ? `-${party.dv}` : ''}
                    </div>
                    <span className="inline-block text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md mt-1">
                      {party.classification}
                    </span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 size={16} className="text-[#5850ec] shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Certificate Format & Action */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Vista Previa del Certificado
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Certificado de Retenciones · Año Gravable {selectedYear}
                </h3>
              </div>
              <div className="p-2 rounded-xl bg-indigo-50 text-[#5850ec] border border-indigo-100">
                <FileText size={20} />
              </div>
            </div>

            {/* Selected Party Summary */}
            {selectedParty && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Razón Social / Nombre:</span>
                    <span className="text-sm font-bold text-slate-900">{selectedParty.name}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                    NIT: {selectedParty.idNumber} {selectedParty.dv ? `-${selectedParty.dv}` : ''}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Agente Retenedor: <span className="font-semibold text-slate-800">ASOCIACIÓN EMPRESARIAL KONTA (NIT 901.234.567-8)</span>
                </div>
              </div>
            )}

            {/* Concept Coverage Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Cuenta PUC</th>
                    <th className="py-2.5 px-3">Concepto Tributario</th>
                    <th className="py-2.5 px-3">Art. E.T.</th>
                    <th className="py-2.5 px-3 text-right">Alcance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">2365</td>
                    <td className="py-2.5 px-3">Retención en la Fuente por Renta</td>
                    <td className="py-2.5 px-3 text-slate-500">Art. 381 E.T.</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">Base + Retenido</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">2367</td>
                    <td className="py-2.5 px-3">Impuesto a las Ventas Retenido (ReteIVA)</td>
                    <td className="py-2.5 px-3 text-slate-500">Art. 437-1 E.T.</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">Base + Retenido</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">2368</td>
                    <td className="py-2.5 px-3">Retención Impuesto Industria y Comercio (ReteICA)</td>
                    <td className="py-2.5 px-3 text-slate-500">Acuerdo Municipal</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">Base + Retenido</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                El documento generado en PDF contiene firma del pagador, número de comprobante, ciudad de retención y la certificación oficial expedida para anexar a la declaración de renta anual.
              </span>
            </div>
          </div>

          {/* Action Download Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Formato Oficial PDF OpenPDF (Sin dependencias externas)
            </span>
            <button
              onClick={handleDownload}
              disabled={downloading || !selectedParty}
              className="flex items-center gap-2 px-6 py-3 bg-[#5850ec] hover:bg-[#4a42d4] text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Generando PDF Oficial...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Descargar Certificado Oficial (PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Sparkles,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Hash,
} from 'lucide-react';
import { httpClient } from '../../../../shared/infrastructure/http/httpClient';
import { apiErrorMessage } from '../../../../shared/infrastructure/http/apiError';

export function calculateDianDV(nit: string): string {
  const clean = nit.replace(/\D/g, '');
  if (!clean) return '';
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let sum = 0;
  for (let i = 0; i < clean.length; i++) {
    const digit = parseInt(clean.charAt(clean.length - 1 - i), 10);
    sum += digit * (weights[i] || 3);
  }
  const remainder = sum % 11;
  if (remainder === 0) return '0';
  if (remainder === 1) return '1';
  return String(11 - remainder);
}

const ID_TYPE_CODES: Record<string, string> = {
  'Cédula de ciudadanía': 'CC',
  NIT: 'NIT',
  'Cédula de extranjería': 'CE',
  'Tarjeta de identidad': 'TI',
  Pasaporte: 'PASAPORTE',
  'Permiso por protección temporal': 'PPT',
};

interface NuevoTerceroFormProps {
  onCancel: () => void;
  onSuccess: (newTercero: any) => void;
}

export const NuevoTerceroForm: React.FC<NuevoTerceroFormProps> = ({
  onCancel,
  onSuccess,
}) => {
  // Campos del formulario
  const [personType, setPersonType] = useState<'Persona natural' | 'Persona jurídica'>('Persona natural');
  const [idType, setIdType] = useState('Cédula de ciudadanía');
  const [idNumber, setIdNumber] = useState('');
  const [dv, setDv] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isAssociate, setIsAssociate] = useState(true);

  // Estados de carga y error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Cambiar tipo de identificación por defecto según tipo de persona
  const handlePersonTypeChange = (type: 'Persona natural' | 'Persona jurídica') => {
    setPersonType(type);
    if (type === 'Persona jurídica' && idType !== 'NIT') {
      setIdType('NIT');
    } else if (type === 'Persona natural' && idType === 'NIT') {
      setIdType('Cédula de ciudadanía');
    }
  };

  // Calcular dígito de verificación si es NIT
  useEffect(() => {
    if (idType === 'NIT' && idNumber.trim().length >= 5) {
      setDv(calculateDianDV(idNumber));
    } else if (idType !== 'NIT') {
      setDv('');
    }
  }, [idNumber, idType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idNumber.trim()) {
      setFormError('El número de identificación es obligatorio.');
      return;
    }
    if (!fullName.trim()) {
      setFormError('El nombre completo o razón social es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const calculatedDv = dv || (idType === 'NIT' ? calculateDianDV(idNumber) : '');

    const requestPayload = {
      identificationNumber: idNumber.trim(),
      dv: calculatedDv || undefined,
      fullName: fullName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      type: personType === 'Persona natural' ? 'NATURAL' : 'JURIDICA',
      idType: ID_TYPE_CODES[idType] ?? idType,
      classification: isAssociate ? 'Asociado' : 'Tercero',
      associate: isAssociate,
      status: 'ACTIVE',
    };

    try {
      const response = await httpClient.post('/parties', requestPayload);
      setIsSubmitting(false);
      onSuccess({ ...response.data, name: response.data?.fullName ?? fullName.trim() });
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(apiErrorMessage(err, 'No se pudo registrar el tercero.'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Encabezado superior */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Volver al listado"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Nuevo Tercero
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Ingresa los datos básicos para registrar a la persona o empresa en la plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar Tercero</span>
            )}
          </button>
        </div>
      </div>

      {formError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2 shadow-xs">
          <AlertTriangle size={15} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Tarjeta de Registro como Asociado / Socio */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isAssociate
            ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/60 border-emerald-200 text-emerald-950'
            : 'bg-white border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isAssociate ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">
                  Registrar como Asociado / Socio
                </span>
                {isAssociate && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Aportes Sociales PUC 311505
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAssociate
                  ? 'Tendrá seguimiento contable de aportes, cuotas y habilitación para préstamos de la asociación.'
                  : 'Se registrará como un tercero general (proveedor, acreedor o cliente externo).'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isAssociate}
              onChange={(e) => setIsAssociate(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* Formulario Principal de Datos Normales */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          Información Básica
        </h2>

        {/* Fila 1: Tipo persona, Tipo de identificación, Número de identificación y DV */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Tipo persona */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              {personType === 'Persona natural' ? <User size={13} className="text-slate-400" /> : <Building2 size={13} className="text-slate-400" />}
              <span>* Tipo persona</span>
            </label>
            <select
              value={personType}
              onChange={(e) => handlePersonTypeChange(e.target.value as any)}
              className="w-full text-xs bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-colors"
            >
              <option value="Persona natural">Persona natural</option>
              <option value="Persona jurídica">Persona jurídica</option>
            </select>
          </div>

          {/* Tipo de identificación */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <CreditCard size={13} className="text-slate-400" />
              <span>* Tipo de identificación</span>
            </label>
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              className="w-full text-xs bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-colors"
            >
              <option value="Cédula de ciudadanía">Cédula de ciudadanía (CC)</option>
              <option value="NIT">NIT</option>
              <option value="Cédula de extranjería">Cédula de extranjería (CE)</option>
              <option value="Tarjeta de identidad">Tarjeta de identidad (TI)</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="Permiso por protección temporal">Permiso especial (PPT)</option>
            </select>
          </div>

          {/* Número de documento / NIT */}
          <div className={`${idType === 'NIT' ? 'md:col-span-4' : 'md:col-span-6'} space-y-1.5`}>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Hash size={13} className="text-slate-400" />
              <span>* {idType === 'NIT' ? 'Número de NIT' : 'Número de documento'}</span>
            </label>
            <input
              type="text"
              required
              placeholder={idType === 'NIT' ? 'Ej: 901234567' : 'Ej: 1020304050'}
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="w-full text-xs bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-colors"
            />
          </div>

          {/* Dígito de Verificación (solo si es NIT) */}
          {idType === 'NIT' && (
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                DV
              </label>
              <input
                type="text"
                maxLength={2}
                placeholder="0"
                value={dv}
                onChange={(e) => setDv(e.target.value)}
                className="w-full text-xs text-center font-bold bg-slate-100 border border-slate-200 rounded-xl px-2 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-colors"
                title="Dígito de verificación calculado automáticamente"
              />
            </div>
          )}
        </div>

        {/* Fila 2: Nombre completo o razón social */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <User size={13} className="text-slate-400" />
            <span>* {personType === 'Persona jurídica' ? 'Razón social o nombre de empresa' : 'Nombre completo'}</span>
          </label>
          <input
            type="text"
            required
            placeholder={
              personType === 'Persona jurídica'
                ? 'Ej: Inversiones y Servicios S.A.S.'
                : 'Ej: Juan Carlos Pérez Gómez'
            }
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full text-xs bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-colors"
          />
        </div>

        {/* Fila 3: Correo electrónico y Celular */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Mail size={13} className="text-slate-400" />
              <span>Correo electrónico</span>
            </label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Phone size={13} className="text-slate-400" />
              <span>Celular / Teléfono</span>
            </label>
            <input
              type="tel"
              placeholder="Ej: 300 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-colors"
            />
          </div>
        </div>

        {/* Fila 4: Dirección */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <MapPin size={13} className="text-slate-400" />
            <span>Dirección</span>
          </label>
          <input
            type="text"
            placeholder="Ej: Calle 45 # 12-34, Apto 201, Medellín"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-xs bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* Botones de acción inferiores */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <span>Guardar Tercero</span>
          )}
        </button>
      </div>
    </form>
  );
};

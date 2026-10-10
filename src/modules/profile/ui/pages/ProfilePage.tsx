import React, { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Key,
  Calendar,
  CheckCircle2,
  LogOut,
  ArrowLeft,
  Save,
  Building,
  Phone,
  CreditCard,
  Lock,
  BadgeCheck,
} from 'lucide-react';
import type { AuthUser } from '../../../auth/domain/models/AuthUser';

interface ProfilePageProps {
  currentUser: AuthUser | null;
  onBackToDashboard: () => void;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  onBackToDashboard,
  onLogout,
}) => {
  const [fullName, setFullName] = useState(currentUser?.fullName || 'Julian Rosales');
  const [phone, setPhone] = useState('+57 300 123 4567');
  const [documentId, setDocumentId] = useState('1.098.765.432');
  const [position, setPosition] = useState('Administrador General & Tesorero');
  const [organization, setOrganization] = useState('Asociación Cooperativa de Asociados');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const email = currentUser?.email || 'juliandrosalesp@gmail.com';
  const role = currentUser?.role ? currentUser.role.replace('ROLE_', '') : 'ADMIN';
  const avatarUrl = currentUser?.picture || currentUser?.avatarUrl;
  const initials = (fullName || 'JU').substring(0, 2).toUpperCase();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      currentUser.fullName = fullName;
      const userJson = localStorage.getItem('accounting_user');
      if (userJson) {
        try {
          const parsed = JSON.parse(userJson);
          parsed.fullName = fullName;
          localStorage.setItem('accounting_user', JSON.stringify(parsed));
        } catch {
          // ignore
        }
      }
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Volver al Dashboard"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mi Perfil de Usuario</h1>
            <p className="text-xs text-slate-500 font-medium">
              Administración de cuenta personal, seguridad Google OAuth y permisos en Konta ERP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            Dashboard
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>¡Perfil actualizado con éxito! Los cambios se guardaron localmente.</span>
        </div>
      )}

      {/* Hero Profile Card */}
      <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Cover Pattern Banner */}
        <div className="h-28 sm:h-32 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-4 right-6 flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium">
            <BadgeCheck size={14} className="text-emerald-400" />
            <span>Sesión Verificada con Google OAuth 2.0</span>
          </div>
        </div>

        {/* User Identity Details Row */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            <div className="flex items-end gap-4">
              {/* Avatar with Google badge */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1 shadow-md shrink-0 border border-slate-200/80">
                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-900 text-white flex items-center justify-center font-bold text-2xl relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                {/* Official Google Icon badge */}
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs"
                  title="Cuenta conectada a Google"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.58-5.17 3.58-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                </div>
              </div>

              {/* Name & Basic Meta */}
              <div className="pb-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{fullName}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white shadow-2xs">
                    {role}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                  <div className="flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    <span>{email}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Conectado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Role highlight box */}
            <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <Shield size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Nivel de Acceso</p>
                <p className="font-semibold text-slate-800">Administrador Total · Superusuario</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Personal Information Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <User size={16} className="text-indigo-600" />
                <span>Datos Personales y Cargo</span>
              </div>
              <span className="text-[11px] text-slate-400">Información sincronizada</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nombre Completo</label>
                <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all text-xs">
                  <User size={15} className="text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-800 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Email (Readonly Google) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Correo Electrónico (Google)</label>
                <div className="flex items-center rounded-xl bg-slate-100/70 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed">
                  <Mail size={15} className="text-slate-400 mr-2 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-transparent outline-none text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Document ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Documento de Identidad / Cédula</label>
                <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all text-xs">
                  <CreditCard size={15} className="text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Teléfono / WhatsApp</label>
                <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all text-xs">
                  <Phone size={15} className="text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Cargo en la Entidad</label>
                <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all text-xs">
                  <Shield size={15} className="text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Organization */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Asociación / Cooperativa</label>
                <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all text-xs">
                  <Building size={15} className="text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-tight shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <Save size={15} />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>

          {/* Module Permissions Overview */}
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Key size={16} className="text-indigo-600" />
                <span>Permisos y Funcionalidades Habilitadas</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                5 de 5 Módulos Activos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Cartera & Préstamos (136505)</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Creación de créditos, plan de amortización fija y cobro de intereses (421005).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Recaudo Mensual ($50.000 COP)</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Causación de cuota y distribución automática en cuentas 110505, 417010, 2380 y 3115.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Documento Soporte DIAN</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Compras a no obligados con liquidación de retenciones y cuentas por pagar (2335).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Contabilidad P.U.C. & NIIF</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Auditoría de sumas iguales (Débitos = Créditos) y balances por tercero (NIT/Cédula).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Security & Session Info */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-3 border-b border-slate-100">
              <Lock size={16} className="text-indigo-600" />
              <span>Seguridad & Token de Sesión</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Proveedor de Identidad</p>
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <span>Google Cloud Identity Services</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Algoritmo de Cifrado</p>
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Shield size={14} className="text-indigo-600" />
                  <span>RS256 / SHA-256 JWT</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Expiración de Sesión</p>
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Calendar size={14} className="text-slate-500" />
                  <span>24 horas (Renovación automática)</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Estado de Conexión</p>
                <p className="font-semibold text-emerald-800">Sesión activa protegida con HTTPS</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-xs tracking-tight transition-all cursor-pointer shadow-xs"
              >
                <LogOut size={15} />
                <span>Cerrar Sesión Activa</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

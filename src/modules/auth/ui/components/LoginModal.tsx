import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../application/hooks/useAuth';
import type { AuthResponse } from '../../../../types/accounting';
import type { AuthSession } from '../../domain/models/AuthUser';
import { toAuthSession } from '../../infrastructure/api/sessionMapper';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  User,
  Phone,
  UserPlus,
} from 'lucide-react';
import { KontaLogo } from '../../../../shared/ui/components/KontaLogo';
import { httpClient, getBaseUrl } from '../../../../shared/infrastructure/http/httpClient';
import { securePayloadService } from '../../../../shared/infrastructure/security/securePayloadService';

declare global {
  interface Window {
    google?: any;
  }
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (auth: AuthResponse) => void;
}

type ModalView = 'login' | 'register' | 'forgot' | 'reset' | 'success';

const GOOGLE_CLIENT_ID =
  (import.meta.env?.VITE_GOOGLE_CLIENT_ID as string) ||
  '186642839091-bfvrv5h1knk4rdpvig934i26g8s3u3hv.apps.googleusercontent.com';

function parseJwt(token: string): { email?: string; name?: string; picture?: string; sub?: string } {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding Google JWT', e);
    return {};
  }
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const { login, loginWithSession } = useAuth();
  
  // Navigation state within modal
  const [view, setView] = useState<ModalView>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Recovery & Reset form state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Common UI state
  const [loading, setLoading] = useState(false);
  const [warmingMessage, setWarmingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setTimeout(() => {
        setWarmingMessage(true);
      }, 2500);
    } else {
      setWarmingMessage(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Pre-warm security key and connection
      securePayloadService.warmUp(getBaseUrl());
      return () => {
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      setView('login');
      setError(null);
      setSuccessInfo(null);
      setWarmingMessage(false);
    }
  }, [isOpen]);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!isOpen || (view !== 'login' && view !== 'register')) return;

    let isMounted = true;

    const renderGoogleButton = () => {
      if (!isMounted || !googleButtonRef.current || !window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: view === 'register' ? 'signup_with' : 'signin_with',
          logo_alignment: 'left',
          width: 350,
        });
        setGoogleLoaded(true);
      } catch (err) {
        console.warn('No se pudo inicializar Google Sign-In:', err);
      }
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderGoogleButton();
        }
      }, 250);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, view]);

  const handleGoogleSuccess = async (response: any) => {
    if (!response?.credential) return;
    setLoading(true);
    setError(null);

    try {
      const payload = parseJwt(response.credential);
      const email = payload.email || 'usuario@google.com';
      const fullName = payload.name || 'Usuario Google';
      const picture = payload.picture || '';

      // Conectar con el backend: registrar o autenticar en Supabase
      const backendRes = await httpClient.post<AuthResponse>('/auth/google', {
        email,
        fullName,
        picture,
        idToken: response.credential,
      });

      const authData = backendRes.data;

      const session: AuthSession = toAuthSession(authData, picture);

      loginWithSession(session);
      onLoginSuccess(authData);
      onClose();
    } catch (err: any) {
      console.error('Error Google Login con backend:', err);
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Error al conectar el inicio de sesión con el backend.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleManualGooglePrompt = () => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
      } catch (e) {
        console.warn('Google prompt failed:', e);
      }
    } else {
      alert('Cargando servicios de Google, por favor intente en un segundo.');
    }
  };

  if (!isOpen) return null;

  // Handle standard user login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const session = await login({ username, password });
      onLoginSuccess({
        token: session.token,
        tokenType: 'Bearer',
        username: session.user.username,
        email: session.user.email,
        fullName: session.user.fullName,
        role: session.user.role,
        roles: session.user.roles,
        permissions: session.user.permissions,
        expiresIn: session.expiresIn,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Usuario o contraseña incorrectos. Verifica que la cuenta exista en el sistema.');
    } finally {
      setLoading(false);
    }
  };

  // Handle user registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }
    if (regPassword.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await httpClient.post<AuthResponse>('/auth/register', {
        username: regUsername.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
      });

      const data = response.data;
      const session: AuthSession = toAuthSession(data);

      loginWithSession(session);
      onLoginSuccess(data);
      onClose();
    } catch (err: any) {
      let msg = 'Error al registrar la cuenta.';
      if (err.response?.data?.violations) {
        msg = Object.values(err.response.data.violations).join('. ');
      } else if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request password recovery email / token
  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) {
      setError('Por favor ingresa tu correo electrónico o usuario.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const response = await httpClient.post('/auth/forgot-password', {
        email: recoveryEmail.trim(),
      });

      const data = response.data;
      setResetToken(''); // El usuario debe revisar su correo e ingresar el código manualmente
      setSuccessInfo(data.message || 'Se ha enviado un código de 6 dígitos a tu correo electrónico.');
      setView('reset');
    } catch (err: any) {
      if (!err?.response) {
        setError('No se pudo conectar con el servidor backend (http://localhost:8080). Asegúrate de que el servicio Spring Boot esté iniciado.');
      } else {
        const msg = err.response.data?.message || err.message || 'Error al solicitar recuperación de contraseña.';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit new password with the 6-digit recovery code
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = resetToken.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setError('Debes ingresar el código numérico de 6 dígitos recibido en tu correo.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await httpClient.post('/auth/reset-password', {
        token: cleanCode,
        newPassword,
        confirmPassword,
      });

      setSuccessInfo(response.data?.message || 'Contraseña restablecida exitosamente.');
      setView('success');
    } catch (err: any) {
      if (!err?.response) {
        setError('No se pudo conectar con el servidor backend. Verifica que el servicio esté en ejecución.');
      } else {
        const msg = err.response?.data?.message || err.message || 'El código de 6 dígitos es incorrecto o ha expirado.';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView: ModalView) => {
    setError(null);
    setSuccessInfo(null);
    setView(newView);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-center lg:justify-end pointer-events-none">
        <div
          className="pointer-events-auto relative w-full max-w-[440px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 p-8 shadow-xl text-slate-800 animate-in slide-in-from-right-8 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            onClick={onClose}
            title="Cerrar"
          >
            <X size={18} />
          </button>

          {/* Top Konta Logo */}
          <div className="flex justify-center mb-4">
            <KontaLogo size={42} showText={true} textColor="#0f172a" />
          </div>

          {/* ============================================================ */}
          {/* VIEW: LOGIN                                                  */}
          {/* ============================================================ */}
          {view === 'login' && (
            <>
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Iniciar Sesión</h2>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                  Accede a tu plataforma contable en la nube, cartera y reportes por terceros.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-center font-medium">
                  <span>{error}</span>
                </div>
              )}

              {/* Google Sign In Official Button */}
              <div className="flex flex-col items-center justify-center w-full mb-3">
                <div
                  ref={googleButtonRef}
                  className={`w-full flex justify-center items-center ${googleLoaded ? 'min-h-[44px]' : 'hidden'}`}
                />

                {!googleLoaded && (
                  <button
                    type="button"
                    onClick={handleManualGooglePrompt}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                    <span>Continuar con Google</span>
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center my-3.5 gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  O con usuario y contraseña
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
                <div className="relative flex items-center rounded-xl bg-slate-50/70 border border-slate-200 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all px-3.5 py-2.5">
                  <Mail size={18} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none ml-2.5"
                    placeholder="Usuario o correo electrónico"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="relative flex items-center rounded-xl bg-slate-50/70 border border-slate-200 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all px-3.5 py-2.5">
                  <Lock size={18} className="text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none ml-2.5"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0 ml-1"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Forgot Password link */}
                <div className="text-right -mt-1">
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
                    onClick={() => {
                      setRecoveryEmail(username);
                      switchView('forgot');
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Main Action Button */}
                <button
                  type="submit"
                  className="w-full mt-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      <span>{warmingMessage ? 'Conectando con servidor en la nube...' : 'Ingresando...'}</span>
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </button>
              </form>

              {/* Link to Register Form */}
              <div className="mt-5 pt-3 text-center border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  ¿No tienes una cuenta aún?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('register')}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline ml-1"
                  >
                    Regístrate gratis
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* VIEW: REGISTER                                               */}
          {/* ============================================================ */}
          {view === 'register' && (
            <div className="animate-in fade-in duration-200">
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Volver"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Crear Cuenta</span>
              </div>

              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Regístrate en Konta</h2>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-[300px] mx-auto">
                  Crea tu cuenta de acceso para gestionar tu catálogo PUC, cartera y terceros.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-center font-medium">
                  <span>{error}</span>
                </div>
              )}

              {/* Google Sign In for Register */}
              <div className="flex flex-col items-center justify-center w-full mb-3">
                <div
                  ref={googleButtonRef}
                  className={`w-full flex justify-center items-center ${googleLoaded ? 'min-h-[44px]' : 'hidden'}`}
                />

                {!googleLoaded && (
                  <button
                    type="button"
                    onClick={handleManualGooglePrompt}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                    <span>Registrarse con Google</span>
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center my-3 gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  O completa tus datos
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Registration Form */}
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <div className="relative flex items-center rounded-xl bg-slate-50/70 border border-slate-200 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all px-3.5 py-2">
                  <User size={17} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none ml-2.5"
                    placeholder="Nombre completo"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative flex items-center rounded-xl bg-slate-50/70 border border-slate-200 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all px-3 py-2">
                    <UserPlus size={17} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none ml-2"
                      placeholder="Usuario"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="relative flex items-center rounded-xl bg-slate-50/70 border border-slate-200 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all px-3 py-2">
                    <Phone size={17} className="text-slate-400 shrink-0" />
                    <input
                      type="tel"
                      className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none ml-2"
                      placeholder="Teléfono"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="relative flex items-center rounded-xl bg-slate-50/70 border border-slate-200 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all px-3.5 py-2">
                  <Mail size={17} className="text-slate-400 shrink-0" />
                  <input
                    type="email"
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none ml-2.5"
                    placeholder="Correo electrónico"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="relative flex items-center rounded-xl bg-slate-50/70 border border-slate-200 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all px-3.5 py-2">
                  <Lock size={17} className="text-slate-400 shrink-0" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none ml-2.5"
                    placeholder="Contraseña (mínimo 6 car.)"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0 ml-1"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative flex items-center rounded-xl bg-slate-50/70 border border-slate-200 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all px-3.5 py-2">
                  <Lock size={17} className="text-slate-400 shrink-0" />
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none ml-2.5"
                    placeholder="Confirmar contraseña"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0 ml-1"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      <span>{warmingMessage ? 'Conectando con servidor en la nube...' : 'Creando cuenta...'}</span>
                    </>
                  ) : (
                    'Crear Cuenta y Entrar'
                  )}
                </button>
              </form>

              <div className="mt-4 pt-3 text-center border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  ¿Ya tienes una cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline ml-1"
                  >
                    Inicia sesión
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: FORGOT PASSWORD                                        */}
          {/* ============================================================ */}
          {view === 'forgot' && (
            <div className="animate-in fade-in duration-200">
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Volver al inicio"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recuperación</span>
              </div>

              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">¿Olvidaste tu clave?</h2>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-[300px] mx-auto">
                  Ingresa tu correo o usuario registrado para enviarte un código numérico de 6 dígitos.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-center font-medium">
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestRecovery} className="flex flex-col gap-3.5">
                <div className="relative flex items-center rounded-xl bg-slate-50/70 border border-slate-200 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all px-3.5 py-2.5">
                  <Mail size={18} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none ml-2.5"
                    placeholder="Correo o nombre de usuario"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  disabled={loading}
                >
                  {loading ? 'Enviando código...' : 'Enviar código de 6 dígitos'}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => switchView('reset')}
                  className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer"
                >
                  ¿Ya tienes el código de 6 dígitos? <span className="text-indigo-600 underline">Ingresar código</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: RESET PASSWORD                                         */}
          {/* ============================================================ */}
          {view === 'reset' && (
            <div className="animate-in fade-in duration-200">
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Volver"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paso 2 de 2</span>
              </div>

              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Nueva Contraseña</h2>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-[300px] mx-auto">
                  Introduce el código de 6 dígitos recibido en tu correo y define tu nueva contraseña.
                </p>
              </div>

              {successInfo && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                  <span>{successInfo}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-center font-medium">
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
                {/* 6-Digit Code Input */}
                <div className="relative flex items-center rounded-xl bg-slate-50/70 border border-slate-200 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all px-3.5 py-2.5">
                  <KeyRound size={18} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="w-full bg-transparent text-center font-mono text-base tracking-[0.3em] font-bold text-slate-800 placeholder-slate-400 outline-none ml-2.5"
                    placeholder="000000"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                  />
                </div>

                {/* New Password */}
                <div className="relative flex items-center rounded-xl bg-slate-50/70 border border-slate-200 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all px-3.5 py-2.5">
                  <Lock size={18} className="text-slate-400 shrink-0" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none ml-2.5"
                    placeholder="Nueva contraseña (min 6 car.)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0 ml-1"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative flex items-center rounded-xl bg-slate-50/70 border border-slate-200 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 transition-all px-3.5 py-2.5">
                  <Lock size={18} className="text-slate-400 shrink-0" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none ml-2.5"
                    placeholder="Confirmar nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0 ml-1"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  disabled={loading}
                >
                  {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
                </button>
              </form>

              <div className="mt-4 pt-3 text-center">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  Cancelar y volver a Iniciar Sesión
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: SUCCESS                                                */}
          {/* ============================================================ */}
          {view === 'success' && (
            <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
                ¡Contraseña Actualizada!
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[290px] mx-auto mb-6">
                Tu clave ha sido reestablecida con éxito. Ya puedes iniciar sesión en Konta ERP con tu nueva contraseña.
              </p>

              <button
                type="button"
                onClick={() => {
                  setPassword('');
                  switchView('login');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors active:scale-[0.99] cursor-pointer"
              >
                Iniciar Sesión Ahora
              </button>
            </div>
          )}

          {/* Security badge footer */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <ShieldCheck size={14} className="text-slate-600" />
            <span>Konta ERP • Conexión Segura</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { createPortal } from 'react-dom';
import Loader from './ui/3d-box-loader-animation';

/** Duración de la transición de inicio/cierre de sesión (un ciclo casi completo de la animación de 3 s). */
export const SESSION_TRANSITION_MS = 2800;

export type SessionTransition = 'login' | 'logout' | null;

const MESSAGES: Record<Exclude<SessionTransition, null>, string> = {
  login: 'Iniciando sesión…',
  logout: 'Cerrando sesión…',
};

/**
 * Pantalla completa con la animación 3D que se muestra al iniciar y al cerrar sesión.
 * El fondo es bg-gray-200 (#e5e7eb) porque las máscaras de la animación usan exactamente ese color.
 */
export const SessionTransitionOverlay: React.FC<{ transition: SessionTransition }> = ({ transition }) => {
  if (!transition) return null;
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 overflow-hidden bg-gray-200 print:hidden"
      style={{ animation: 'session-overlay-in 200ms ease-out' }}
    >
      <style>{'@keyframes session-overlay-in { from { opacity: 0 } to { opacity: 1 } }'}</style>
      {/* Capa propia (isolate) para que las máscaras 3D de la animación no se dibujen encima del texto */}
      <div className="relative z-0 isolate flex h-[150px] items-center justify-center min-[481px]:h-[340px]">
        <Loader />
      </div>
      <p className="relative z-10 mt-4 text-sm font-semibold tracking-wide text-slate-700">{MESSAGES[transition]}</p>
    </div>,
    document.body
  );
};

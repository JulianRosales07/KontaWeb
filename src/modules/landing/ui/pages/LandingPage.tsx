import React, { useState, useEffect } from 'react';
import {
  ChevronUp,
  ChevronRight,
  X,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Wallet,
  ReceiptText,
  FileSpreadsheet,
  Menu,
  Scale,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  Calculator,
  BarChart,
  UserCheck,
  Shield,
  FileCheck2,
  LogIn,
} from 'lucide-react';
import type { NavTab } from '../../../../shared/ui/components/Sidebar';
import { KontaLogo } from '../../../../shared/ui/components/KontaLogo';
import { KontaChatWidget } from '../../../../shared/ui/components/KontaChatWidget';
import Footer1 from '../../../../shared/ui/components/ui/footer-section-1';
import { CustomCursor } from '../../../../shared/ui/components/ui/custom-cursor';
import { motion, AnimatePresence } from 'motion/react';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const staggerItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.36,
      ease: EASE_OUT,
    },
  },
};

type ActiveModuleTab = 'cartera' | 'doc-soporte' | 'reportes';

interface LandingPageProps {
  onEnterApp?: (targetTab?: NavTab) => void;
  onOpenLogin: () => void;
  isLoginModalOpen?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp: _onEnterApp,
  onOpenLogin,
  isLoginModalOpen = false,
}) => {
  const [activeModule, setActiveModule] = useState<ActiveModuleTab>('cartera');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 250);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll ONLY when hamburger menu or login modal is open
  useEffect(() => {
    if (isMenuOpen || isLoginModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen, isLoginModalOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToModule = (tab: ActiveModuleTab) => {
    setActiveModule(tab);
    requestAnimationFrame(() => {
      const el = document.getElementById('modulo-showcase');
      if (el) {
        const yOffset = -30;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  };

  const handleNavigateFromMenu = (tab: ActiveModuleTab) => {
    setIsMenuOpen(false);
    setTimeout(() => {
      scrollToModule(tab);
    }, 150);
  };

  return (
    <CustomCursor color="#5850ec" layout="default" enabled={!isMenuOpen && !isLoginModalOpen}>
      <div className="relative min-h-screen w-full bg-white text-slate-800 overflow-x-hidden font-sans selection:bg-indigo-500 selection:text-white">
        {/* Background Matrix Dotted Pattern matching photo */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.25px,transparent_1.25px)] [background-size:24px_24px] pointer-events-none opacity-50" />

        {/* Subtle Warm & Lavender Ambient Auras */}
        <div className="absolute -top-24 right-0 w-[550px] h-[550px] bg-gradient-to-b from-indigo-100/40 via-purple-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Top Navigation Bar */}
        <header className="relative z-30 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-5 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            className="flex items-center cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <KontaLogo size={38} showText={true} textColor="#0f172a" />
          </div>

          {/* Right Action Controls matching reference photo */}
          <div className="flex items-center gap-5 sm:gap-6">
            {/* ADQUIRIR Solid Pill Button matching photo */}
            <motion.button
              onClick={onOpenLogin}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.14, ease: EASE_OUT }}
              className="px-6 py-2.5 bg-[#5850ec] hover:bg-[#4b43e0] text-white text-xs font-bold tracking-wider uppercase rounded-full shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-colors cursor-pointer hover-glow"
            >
              ADQUIRIR
            </motion.button>

            {/* Ingresar Plain Text Link with underline matching photo */}
            <motion.button
              onClick={onOpenLogin}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.14, ease: EASE_OUT }}
              className="text-sm font-semibold text-[#3b82f6] hover:text-[#2563eb] underline underline-offset-2 transition-colors cursor-pointer"
            >
              Ingresar
            </motion.button>

            {/* Hamburger Menu Icon */}
            <motion.button
              onClick={() => setIsMenuOpen(true)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{ duration: 0.14, ease: EASE_OUT }}
              className="p-1.5 text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer rounded-lg hover:bg-slate-100"
              title="Abrir menú"
              aria-label="Abrir menú"
            >
              <Menu size={26} />
            </motion.button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* FULLSCREEN HAMBURGER MENU OVERLAY (STYLE FROM REFERENCE WITH KONTA LOGO) */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="fixed inset-0 z-50 bg-white/80 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto"
            >
            {/* Top Bar of Menu Overlay */}
            <div className="max-w-7xl w-full mx-auto px-6 sm:px-10 lg:px-12 py-5 flex items-center justify-between">
              <div
                className="flex items-center cursor-pointer"
                onClick={() => {
                  setIsMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <KontaLogo size={40} showText={true} textColor="#0f172a" />
              </div>

              <div className="flex items-center gap-5">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="hidden sm:inline-block px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold tracking-wider uppercase rounded-full transition-all cursor-pointer"
                >
                  ADQUIRIR
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="hidden sm:inline-block text-sm font-semibold text-[#3b82f6] hover:text-[#2563eb] underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Ingresar
                </button>

                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer rounded-full hover:bg-slate-100"
                  title="Cerrar menú"
                  aria-label="Cerrar menú"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            {/* Menu Main Content with items & arrows matching reference photo */}
            <div className="max-w-7xl w-full mx-auto px-6 sm:px-10 lg:px-12 py-6 sm:py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Navigation items */}
              <div className="lg:col-span-7 flex flex-col justify-center max-w-xl">
                <nav className="flex flex-col space-y-4 sm:space-y-5">
                  {/* 1. ¿QUÉ ES KONTA? */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group flex items-center justify-between text-left py-1 cursor-pointer transition-colors"
                  >
                    <span className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                      ¿QUÉ ES KONTA ERP?
                    </span>
                    <ChevronRight
                      size={22}
                      className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1.5 transition-all"
                    />
                  </button>

                  {/* 2. CARTERA (CUENTAS POR COBRAR) */}
                  <button
                    onClick={() => handleNavigateFromMenu('cartera')}
                    className="group flex items-center justify-between text-left py-1 cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                        CARTERA (CUENTAS POR COBRAR)
                      </span>
                      <p className="text-xs text-slate-500 font-medium">Control de moras por edades (Aging) y extractos</p>
                    </div>
                    <ChevronRight
                      size={22}
                      className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1.5 transition-all"
                    />
                  </button>

                  {/* 3. DOCUMENTO SOPORTE */}
                  <button
                    onClick={() => handleNavigateFromMenu('doc-soporte')}
                    className="group flex items-center justify-between text-left py-1 cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight group-hover:text-sky-600 transition-colors">
                        DOCUMENTO SOPORTE EQUIVALENTE
                      </span>
                      <p className="text-xs text-slate-500 font-medium">Egreso directo, causación 2335 y retenciones DIAN</p>
                    </div>
                    <ChevronRight
                      size={22}
                      className="text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1.5 transition-all"
                    />
                  </button>

                  {/* 4. ESTADOS NIIF */}
                  <button
                    onClick={() => handleNavigateFromMenu('reportes')}
                    className="group flex items-center justify-between text-left py-1 cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                        ESTADOS FINANCIEROS NIIF
                      </span>
                      <p className="text-xs text-slate-500 font-medium">Balance por terceros, sumas iguales y Estado P&G</p>
                    </div>
                    <ChevronRight
                      size={22}
                      className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1.5 transition-all"
                    />
                  </button>


                  {/* 7. CONTÁCTENOS */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenLogin();
                    }}
                    className="group flex items-center justify-between text-left py-1 cursor-pointer transition-colors"
                  >
                    <span className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                      CONTÁCTENOS
                    </span>
                    <ChevronRight
                      size={22}
                      className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1.5 transition-all"
                    />
                  </button>
                </nav>

                {/* Social Icons matching reference */}
                <div className="pt-6 sm:pt-8 flex items-center gap-3 text-slate-600">
                  <a
                    href="#facebook"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenLogin();
                    }}
                    className="w-8 h-8 rounded-full border border-slate-300 hover:border-indigo-600 hover:text-indigo-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </a>

                  <a
                    href="#instagram"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenLogin();
                    }}
                    className="w-8 h-8 rounded-full border border-slate-300 hover:border-indigo-600 hover:text-indigo-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="Instagram"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                </div>

                {/* CTA Button matching photo */}
                <div className="pt-6">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenLogin();
                    }}
                    className="px-8 py-3.5 bg-[#5850ec] hover:bg-[#4b43e0] text-white font-bold text-xs sm:text-sm tracking-wider uppercase rounded-full shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                  >
                    ¡CREA TU CUENTA GRATIS!
                  </button>
                </div>
              </div>

              {/* Right Column: Faded Hero Phone Mockup in background (matching reference style) */}
              <div className="hidden lg:flex lg:col-span-5 justify-center items-center opacity-30 pointer-events-none">
                <div className="relative w-full max-w-[280px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/60">
                  <img
                    src="/hero-phone.jpg"
                    alt="Konta ERP"
                    className="w-full h-auto object-cover block"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Hero Section matching reference composition */}
        <section className="relative z-20 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 pt-8 lg:pt-14 pb-20 lg:pb-32 min-h-[calc(100vh-100px)] flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Column: Typography & Action */}
            <motion.div
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7 xl:col-span-7 flex flex-col items-start gap-6 max-w-3xl"
            >
              {/* Eyebrow matching photo */}
              <motion.p
                variants={staggerItemVariants}
                className="text-slate-600 text-sm sm:text-base font-medium tracking-tight"
              >
                Data Inteligencia para su Compañía
              </motion.p>

              {/* Headline matching photo typography */}
              <motion.h1
                variants={staggerItemVariants}
                className="text-3xl sm:text-4xl lg:text-[42px] xl:text-[48px] font-black text-slate-900 tracking-tight leading-[1.15] uppercase"
              >
                SOFTWARE PARA LA ADMINISTRACIÓN DE TU NEGOCIO.
              </motion.h1>

              {/* Description strictly reflecting real backend capabilities */}
              <motion.p
                variants={staggerItemVariants}
                className="text-slate-600 text-sm sm:text-base lg:text-[17px] leading-relaxed font-normal"
              >
                Control de <strong className="text-slate-800 font-semibold">Cartera (Cuentas por Cobrar)</strong> por edades de vencimiento (Aging), emisión de{' '}
                <strong className="text-slate-800 font-semibold">Documentos Soporte Equivalentes</strong> con egreso directo o causación,{' '}
                <strong className="text-slate-800 font-semibold">Tesorería y Recibos de Caja</strong>,{' '}
                <strong className="text-slate-800 font-semibold">Contabilidad P.U.C. bajo NIIF</strong> y{' '}
                <strong className="text-slate-800 font-semibold">Estados Financieros a nivel de Terceros</strong> (Balance de Prueba, P&G y Balance General), todo respaldado con auditoría de partida doble en tiempo real.
              </motion.p>

              {/* Main Action Pill matching photo color (#5850ec) */}
              <motion.div
                variants={staggerItemVariants}
                className="pt-2 flex flex-wrap items-center gap-5"
              >
                <motion.button
                  onClick={onOpenLogin}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.14, ease: EASE_OUT }}
                  className="px-9 py-4 bg-[#5850ec] hover:bg-[#4b43e0] text-white font-bold text-sm tracking-wider uppercase rounded-full shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-colors cursor-pointer hover-glow"
                >
                  ¡CREA TU CUENTA GRATIS!
                </motion.button>

                <motion.button
                  onClick={() => scrollToModule('cartera')}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.14, ease: EASE_OUT }}
                  className="text-sm sm:text-base font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-2 group"
                >
                  <span>Conocer Módulo de Cartera</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </motion.button>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                variants={staggerItemVariants}
                className="flex flex-wrap items-center gap-6 pt-3"
              >
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
                  <ShieldCheck size={18} className="text-indigo-600" />
                  <span>100% NIIF Plenas y Pymes</span>
                </span>
              </motion.div>
            </motion.div>

            {/* Right Column: Hero Visual with Neon Triangle & Floating 3D Phone */}
            <div className="lg:col-span-5 xl:col-span-5 relative flex justify-center items-center py-8">
              {/* Yellow/Lime Geometric Neon Triangle Backdrop matching photo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, rotate: -12 }}
                animate={{ opacity: 0.95, scale: 1, rotate: -12 }}
                transition={{ duration: 0.55, ease: EASE_OUT }}
                className="absolute w-[360px] h-[430px] sm:w-[420px] sm:h-[490px] lg:w-[460px] lg:h-[530px] bg-gradient-to-b from-[#e5f532] to-[#bbf426] rounded-3xl translate-x-6 -translate-y-2 shadow-2xl shadow-lime-300/30 pointer-events-none"
                style={{
                  clipPath: 'polygon(30% 0%, 100% 70%, 10% 100%)',
                }}
              />

              {/* Subtle curved dashed connection lines matching photo */}
              <motion.svg
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.45 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewBox="0 0 500 500"
                className="absolute inset-0 w-full h-full pointer-events-none scale-110"
              >
                <path
                  d="M 60 120 Q 250 40 440 220 T 260 460"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="5,6"
                />
                <path
                  d="M 20 320 Q 200 160 480 340"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4,5"
                />
              </motion.svg>

              {/* Floating Phone Render Container */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: [0, -12, 0],
                }}
                transition={{
                  opacity: { duration: 0.5, ease: EASE_OUT },
                  y: { duration: 5.5, repeat: Infinity, ease: EASE_IN_OUT },
                }}
                whileHover={{ scale: 1.025 }}
                className="relative z-10 w-full max-w-[360px] sm:max-w-[400px] lg:max-w-[430px] xl:max-w-[460px] rounded-[32px] overflow-hidden shadow-2xl shadow-slate-900/30 border-4 border-white/90 bg-white cursor-pointer"
              >
                <img
                  src="/hero-phone.jpg"
                  alt="Konta ERP Software en la nube interfaz móvil y contable"
                  className="w-full h-auto object-cover block"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Summary Grid (Puntos 1, 2 y 3) */}
        <section className="relative z-20 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-16 lg:pt-24 pb-12 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
              MÓDULOS DEL SISTEMA
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Seleccione un Módulo para Navegar sus Detalles
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Haga clic sobre cualquier funcionalidad para ver su simulación interactiva abajo en esta misma página
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Cartera */}
            <motion.div
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white border cursor-pointer ${activeModule === 'cartera'
                ? 'border-indigo-500 shadow-xl shadow-indigo-500/15 ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-indigo-300 hover:shadow-lg'
                }`}
              onClick={() => scrollToModule('cartera')}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <Wallet size={22} />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-100/70 text-indigo-700">
                    Punto 1
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Cartera & Cuentas por Cobrar (Aging)
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Clasificación de facturas a crédito por edades de mora (Al día, 1-30, 31-60, 61-90, +90 días), extractos individuales por cliente y recibos de abono.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                <span>Navegar Información de Cartera ↓</span>
                <ArrowRight size={15} />
              </div>
            </motion.div>

            {/* Card 2: Doc. Equivalente */}
            <motion.div
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white border cursor-pointer ${activeModule === 'doc-soporte'
                ? 'border-sky-500 shadow-xl shadow-sky-500/15 ring-2 ring-sky-500/20'
                : 'border-slate-200 hover:border-sky-300 hover:shadow-lg'
                }`}
              onClick={() => scrollToModule('doc-soporte')}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
                    <ReceiptText size={22} />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-100/70 text-sky-700">
                    Punto 2
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  Documento Soporte Equivalente / Recibo
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Soporte a no obligados a facturar (DIAN) con opción de causación a cuenta por pagar o generación inmediata de comprobante de egreso y recibo de caja.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-sky-600 group-hover:translate-x-1 transition-transform">
                <span>Navegar Información de Doc. Soporte ↓</span>
                <ArrowRight size={15} />
              </div>
            </motion.div>

            {/* Card 3: Estados por Terceros */}
            <motion.div
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white border cursor-pointer ${activeModule === 'reportes'
                ? 'border-emerald-500 shadow-xl shadow-emerald-500/15 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-emerald-300 hover:shadow-lg'
                }`}
              onClick={() => scrollToModule('reportes')}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet size={22} />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100/70 text-emerald-700">
                    Punto 3
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Estados Financieros a Nivel de Terceros
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Balance de Comprobación con sumas iguales, Estado de Resultados (P&G) y Balance General discriminados por cliente, proveedor y beneficiario.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>Navegar Información de Estados NIIF ↓</span>
                <ArrowRight size={15} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3-IN-1 INTERACTIVE SHOWCASE SECTION (STAYS ON SAME PAGE) */}
        {/* ========================================================================= */}
        <section id="modulo-showcase" className="relative z-20 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-14">
          {/* Navigation Tabs Pill Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <motion.button
              onClick={() => setActiveModule('cartera')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.14, ease: EASE_OUT }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer shadow-xs ${activeModule === 'cartera'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
            >
              <Wallet size={16} />
              <span>1. Cartera & Aging</span>
            </motion.button>

            <motion.button
              onClick={() => setActiveModule('doc-soporte')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.14, ease: EASE_OUT }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer shadow-xs ${activeModule === 'doc-soporte'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300 hover:text-sky-600'
                }`}
            >
              <ReceiptText size={16} />
              <span>2. Documento Soporte</span>
            </motion.button>

            <motion.button
              onClick={() => setActiveModule('reportes')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.14, ease: EASE_OUT }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer shadow-xs ${activeModule === 'reportes'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                }`}
            >
              <FileSpreadsheet size={16} />
              <span>3. Estados Financieros NIIF</span>
            </motion.button>
          </div>

          {/* ========================================================================= */}
          {/* TAB CONTENT WITH MOTION.DEV ANIMATEPRESENCE */}
          {/* ========================================================================= */}
          <AnimatePresence mode="wait">
            {activeModule === 'cartera' && (
              <motion.div
                key="cartera"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
              >
              {/* Header info */}
              <div className="text-center max-w-3xl mx-auto mb-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
                  <Wallet size={14} />
                  <span>Módulo de Cuentas por Cobrar & Aging</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Control Total de Cartera y Vencimientos por Edades
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Clasifique sus facturas a crédito en 5 bandas de mora, audite extractos por cliente en tiempo real y aplique recibos de caja con contabilización automática en partida doble.
                </p>
              </div>

              {/* KPI Highlights Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                    <Calendar size={18} />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">5 Bandas</div>
                  <div className="text-xs text-slate-500 font-medium">Corriente, 1-30, 31-60, 61-90 y +90 días</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
                    <DollarSign size={18} />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">100% NIIF</div>
                  <div className="text-xs text-slate-500 font-medium">Asientos automáticos 1105/1110 vs 1305</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2.5">
                    <ReceiptText size={18} />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">Extractos</div>
                  <div className="text-xs text-slate-500 font-medium">Detalle individualizado por cliente y NIT</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5">
                    <TrendingUp size={18} />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">En Vivo</div>
                  <div className="text-xs text-slate-500 font-medium">Filtro instantáneo por fecha de corte (asOfDate)</div>
                </div>
              </div>

              {/* Interactive Aging Demo Card */}
              <div className="rounded-3xl bg-white border border-slate-200 p-7 sm:p-9 shadow-xl shadow-slate-900/5 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                      <BarChart3 size={15} />
                      <span>Simulación Visual del Dashboard de Cartera</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      Distribución de Vencimientos por Edades (Aging Matrix)
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">Fecha de Corte Demo:</span>
                    <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
                      2026-09-24
                    </span>
                  </div>
                </div>

                {/* Aging Visual Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                    <span>Proporción de Cartera por Grado de Vencimiento</span>
                    <span className="font-mono text-indigo-600 font-bold">Total: $ 14,850,000 COP</span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex">
                    <div style={{ width: '48%' }} className="bg-emerald-500 h-full" title="Al Día / No Vencida (48%)" />
                    <div style={{ width: '22%' }} className="bg-sky-500 h-full" title="1 a 30 días (22%)" />
                    <div style={{ width: '15%' }} className="bg-amber-500 h-full" title="31 a 60 días (15%)" />
                    <div style={{ width: '10%' }} className="bg-orange-500 h-full" title="61 a 90 días (10%)" />
                    <div style={{ width: '5%' }} className="bg-red-500 h-full" title="Mayor a 90 días (5%)" />
                  </div>
                </div>

                {/* Aging Legend Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <span className="text-slate-600 font-medium">Al Día (Corriente):</span>
                      <div className="font-bold text-slate-800 font-mono">$ 7,128,000</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-sky-500 shrink-0" />
                    <div>
                      <span className="text-slate-600 font-medium">1 - 30 días:</span>
                      <div className="font-bold text-slate-800 font-mono">$ 3,267,000</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                    <div>
                      <span className="text-slate-600 font-medium">31 - 60 días:</span>
                      <div className="font-bold text-slate-800 font-mono">$ 2,227,500</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
                    <div>
                      <span className="text-slate-600 font-medium">61 - 90 días:</span>
                      <div className="font-bold text-slate-800 font-mono">$ 1,485,000</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                    <div>
                      <span className="text-slate-600 font-medium">&gt; 90 días (Crítica):</span>
                      <div className="font-bold text-slate-800 font-mono">$ 742,500</div>
                    </div>
                  </div>
                </div>

                {/* Sample Client Table Preview */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Muestra de Extractos de Clientes en Cartera
                    </h4>
                    <span className="text-[11px] text-slate-400">Datos simulados en vivo</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Cliente / Razón Social</th>
                          <th className="py-2.5 px-4">NIT</th>
                          <th className="py-2.5 px-4">Facturas Pendientes</th>
                          <th className="py-2.5 px-4">Estado</th>
                          <th className="py-2.5 px-4 text-right">Saldo Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">Distribuciones Andinas S.A.S.</td>
                          <td className="py-3 px-4 font-mono text-slate-500">900.542.118-2</td>
                          <td className="py-3 px-4">3 facturas</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                              Al día
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">$ 4,850,000</td>
                        </tr>

                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">Comercializadora El Triunfo Ltda.</td>
                          <td className="py-3 px-4 font-mono text-slate-500">860.231.984-5</td>
                          <td className="py-3 px-4">2 facturas</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                              Mora 31-60d
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">$ 6,200,000</td>
                        </tr>

                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">Inversiones & Servicios del Norte</td>
                          <td className="py-3 px-4 font-mono text-slate-500">901.874.329-1</td>
                          <td className="py-3 px-4">1 factura</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700">
                              Mora &gt; 90d
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">$ 3,800,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Module CTA Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-indigo-50 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">¿Desea gestionar su cartera en el sistema real?</h4>
                    <p className="text-xs text-slate-500">Inicie sesión para ver facturas a crédito, emitir recibos de abono y conciliar clientes.</p>
                  </div>
                </div>
                <button
                  onClick={onOpenLogin}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <LogIn size={14} />
                  <span>Ingresar al Módulo</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DOCUMENTO SOPORTE EQUIVALENTE */}
          {/* ========================================================================= */}
          {activeModule === 'doc-soporte' && (
            <motion.div
              key="doc-soporte"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
            >
              {/* Header info */}
              <div className="text-center max-w-3xl mx-auto mb-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200 mb-2">
                  <ReceiptText size={14} />
                  <span>Módulo de Documento Soporte en Adquisiciones</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Emisión Legal a Proveedores no Obligados a Facturar
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Sustente costos y deducciones con validez DIAN mediante pago inmediato con egreso o causación a crédito (Cuenta por Pagar 2335) y liquidación de retenciones.
                </p>
              </div>

              {/* KPI Highlights Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2.5">
                    <FileCheck2 size={18} />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">Deducción 100%</div>
                  <div className="text-xs text-slate-500 font-medium">Costos y gastos válidos ante la DIAN para renta</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
                    <Calculator size={18} />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">Retenciones</div>
                  <div className="text-xs text-slate-500 font-medium">Cálculo automático ReteFuente, ReteICA y ReteIVA</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                    <DollarSign size={18} />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">Doble Modalidad</div>
                  <div className="text-xs text-slate-500 font-medium">Pago inmediato con egreso o crédito a causación (2335)</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5">
                    <Scale size={18} />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">Sumas Iguales</div>
                  <div className="text-xs text-slate-500 font-medium">Auditoría automática Débitos = Créditos</div>
                </div>
              </div>

              {/* Interactive Modes Demo Card */}
              <div className="rounded-3xl bg-white border border-slate-200 p-7 sm:p-9 shadow-xl shadow-slate-900/5 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">
                      <ReceiptText size={15} />
                      <span>Simulación de Asiento Automático P.U.C.</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      Comparativa: Pago Inmediato vs. Causación a Crédito
                    </h3>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold">
                    <ShieldCheck size={15} />
                    <span>Consecutivo DIAN: DS-00142</span>
                  </div>
                </div>

                {/* Dual Flow Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Opción 1: Egreso Inmediato */}
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-100 text-emerald-700">
                        Modalidad 1: Egreso Inmediato (Contado)
                      </span>
                      <span className="text-xs font-mono text-slate-500">Recibo / Egreso</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                      Genera Comprobante de Egreso sin Cuenta por Pagar
                    </h4>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      Ideal para gastos menores, fletes de transporte, servicios de mantenimiento o compras liquidadas en el momento de la entrega.
                    </p>

                    <div className="rounded-xl bg-white border border-slate-200 p-3.5 font-mono text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600 font-bold">
                        <span>Cuenta PUC / Concepto</span>
                        <span>Débito / Crédito</span>
                      </div>
                      <div className="flex justify-between py-1 text-slate-700">
                        <span>5135 Honorarios / Servicios</span>
                        <span className="text-emerald-600 font-bold">$ 1,500,000 (D)</span>
                      </div>
                      <div className="flex justify-between py-1 text-slate-700">
                        <span>2365 Retención Fuente (3.5%)</span>
                        <span className="text-indigo-600 font-bold">$ 52,500 (C)</span>
                      </div>
                      <div className="flex justify-between py-1 text-slate-700">
                        <span>1110 Bancos / Caja General</span>
                        <span className="text-sky-600 font-bold">$ 1,447,500 (C)</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900">
                        <span>Sumas Iguales Auditadas</span>
                        <span>$ 1,500,000</span>
                      </div>
                    </div>
                  </div>

                  {/* Opción 2: Causación a Crédito */}
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-indigo-100 text-indigo-700">
                        Modalidad 2: Causación a Crédito
                      </span>
                      <span className="text-xs font-mono text-slate-500">Pasivo (2335)</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                      Reconoce el Pasivo con Vencimiento Posterior
                    </h4>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      Acredita a la subcuenta del proveedor o contratista (2335) para programar el pago futuro mediante tesorería institucional.
                    </p>

                    <div className="rounded-xl bg-white border border-slate-200 p-3.5 font-mono text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600 font-bold">
                        <span>Cuenta PUC / Concepto</span>
                        <span>Débito / Crédito</span>
                      </div>
                      <div className="flex justify-between py-1 text-slate-700">
                        <span>5135 Honorarios / Servicios</span>
                        <span className="text-emerald-600 font-bold">$ 2,000,000 (D)</span>
                      </div>
                      <div className="flex justify-between py-1 text-slate-700">
                        <span>2365 Retención Fuente (3.5%)</span>
                        <span className="text-indigo-600 font-bold">$ 70,000 (C)</span>
                      </div>
                      <div className="flex justify-between py-1 text-slate-700">
                        <span>2335 Costos por Pagar</span>
                        <span className="text-purple-600 font-bold">$ 1,930,000 (C)</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900">
                        <span>Sumas Iguales Auditadas</span>
                        <span>$ 2,000,000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module CTA Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-sky-50 border border-sky-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                    <ReceiptText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">¿Desea emitir documentos soporte en el sistema real?</h4>
                    <p className="text-xs text-slate-500">Inicie sesión para registrar compras a no obligados, aplicar retenciones y generar egresos.</p>
                  </div>
                </div>
                <button
                  onClick={onOpenLogin}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md shadow-sky-600/25 transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <LogIn size={14} />
                  <span>Ingresar al Módulo</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ESTADOS FINANCIEROS A NIVEL DE TERCEROS */}
          {/* ========================================================================= */}
          {activeModule === 'reportes' && (
            <motion.div
              key="reportes"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
            >
              {/* Header info */}
              <div className="text-center max-w-3xl mx-auto mb-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                  <FileSpreadsheet size={14} />
                  <span>Módulo de Estados Financieros NIIF por Terceros</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Auditoría Contable Granular a Nivel de Tercero (NIT / Cédula)
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Genere Balance de Comprobación con validación matemática de sumas iguales, Estado de Resultados (P&G) y Balance General discriminados por cliente, proveedor o beneficiario.
                </p>
              </div>

              {/* KPI Highlights Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                    <Scale size={18} />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">Sumas Iguales</div>
                  <div className="text-xs text-slate-500 font-medium">Débito = Crédito comprobado al centavo</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2.5">
                    <UserCheck size={18} />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">Por Tercero</div>
                  <div className="text-xs text-slate-500 font-medium">Movimiento y saldo discriminado por NIT/Cédula</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2.5">
                    <BarChart size={18} />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">P&G en Vivo</div>
                  <div className="text-xs text-slate-500 font-medium">Ingresos (4), Gastos (5) y Costos (6) en tiempo real</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
                    <Shield size={18} />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">Ecuación NIIF</div>
                  <div className="text-xs text-slate-500 font-medium">Activo = Pasivo + Patrimonio garantizado</div>
                </div>
              </div>

              {/* Interactive Reports Demo Card */}
              <div className="rounded-3xl bg-white border border-slate-200 p-7 sm:p-9 shadow-xl shadow-slate-900/5 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                      <FileSpreadsheet size={15} />
                      <span>Simulación de Balance de Comprobación</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      Auditoría Contable a Nivel de Tercero (NIT / Cédula)
                    </h3>
                  </div>

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
                        <th className="py-2.5 px-4">Cuenta P.U.C.</th>
                        <th className="py-2.5 px-4">Tercero (NIT / Razón Social)</th>
                        <th className="py-2.5 px-4 text-right">Saldo Inicial</th>
                        <th className="py-2.5 px-4 text-right">Débitos</th>
                        <th className="py-2.5 px-4 text-right">Créditos</th>
                        <th className="py-2.5 px-4 text-right">Saldo Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">110505 - Caja General</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">800.197.268-1 · Banco de la República</td>
                        <td className="py-3 px-4 text-right font-mono">$ 5,000,000</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">$ 8,400,000</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">$ 3,200,000</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">$ 10,200,000</td>
                      </tr>

                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">130505 - Clientes Nacionales</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">900.542.118-2 · Distribuciones Andinas S.A.S.</td>
                        <td className="py-3 px-4 text-right font-mono">$ 8,500,000</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">$ 4,850,000</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">$ 5,000,000</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">$ 8,350,000</td>
                      </tr>

                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">220505 - Proveedores Nacionales</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">860.231.984-5 · Comercializadora El Triunfo</td>
                        <td className="py-3 px-4 text-right font-mono">$ 4,200,000</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">$ 2,000,000</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">$ 6,200,000</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">$ 8,400,000</td>
                      </tr>

                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">413505 - Comercio al por Mayor</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">901.874.329-1 · Inversiones del Norte</td>
                        <td className="py-3 px-4 text-right font-mono">$ 0</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">$ 0</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">$ 12,500,000</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">$ 12,500,000</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 uppercase">Sumas Iguales Auditadas (Débito = Crédito)</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600">$ 15,250,000</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600">$ 15,250,000</td>
                        <td className="py-3 px-4 text-right font-mono text-indigo-600">Diferencia: $ 0.00</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Module CTA Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">¿Desea auditar sus estados contables en el sistema real?</h4>
                    <p className="text-xs text-slate-500">Inicie sesión para generar balances por tercero, P&G y exportar informes NIIF.</p>
                  </div>
                </div>
                <button
                  onClick={onOpenLogin}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <LogIn size={14} />
                  <span>Ingresar al Módulo</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </section>

        {/* In-page Bottom Navigation: Subir al inicio */}
        <div className="flex flex-col items-center justify-center pb-8 pt-4">
          <button
            onClick={scrollToTop}
            className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-indigo-600 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            title="Subir al inicio de la página"
          >
            <ChevronUp size={16} className="text-indigo-600 group-hover:-translate-y-0.5 transition-transform" />
            <span>Subir al Inicio</span>
          </button>
        </div>

        {/* Footer Section 1 */}
        <Footer1
          brandName="Konta ERP"
          logo={<KontaLogo size={40} showText={true} textColor="#0f172a" />}
          links={[
            { label: "Cartera & Aging", onClick: () => scrollToModule('cartera') },
            { label: "Documento Soporte", onClick: () => scrollToModule('doc-soporte') },
            { label: "Estados NIIF", onClick: () => scrollToModule('reportes') },
            { label: "Planes & Precios", onClick: onOpenLogin },
            { label: "Iniciar Sesión", onClick: onOpenLogin },
          ]}
        />

        {/* Floating Scroll-to-Top Button (hidden when menu or login modal is open) */}
        <AnimatePresence>
          {showScrollTop && !isMenuOpen && !isLoginModalOpen && (
            <motion.button
              onClick={scrollToTop}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.92 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="fixed bottom-22 right-6 z-40 w-12 h-12 rounded-2xl bg-white text-indigo-600 hover:text-white hover:bg-[#5850ec] border border-slate-200 shadow-xl shadow-slate-900/10 flex items-center justify-center cursor-pointer group"
              title="Subir al inicio"
              aria-label="Subir al inicio de la página"
            >
              <ChevronUp size={24} className="group-hover:-translate-y-0.5 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Interactive Floating Konta AI & Support Chat Widget (hidden when menu or login modal is open) */}
        {!isMenuOpen && !isLoginModalOpen && (
          <KontaChatWidget
            onOpenLogin={onOpenLogin}
            onNavigateToModule={scrollToModule}
          />
        )}
      </div>
    </CustomCursor>
  );
};

import React from 'react';

interface KontaLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  subtext?: string;
}

export const KontaLogo: React.FC<KontaLogoProps> = ({
  size = 38,
  showText = false,
  textColor = '#0f172a',
  subtext = 'Cloud Accounting',
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 10px rgba(124, 58, 237, 0.28))' }}
      >
        <defs>
          <linearGradient id="konta-violet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>

          <linearGradient id="konta-deep" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>

          <linearGradient id="konta-teal-top" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          <linearGradient id="konta-emerald-bot" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          <linearGradient id="konta-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <path d="M18 12 H42 V50 L18 32 Z" fill="url(#konta-violet)" />
        <path d="M18 32 L42 50 V88 H18 Z" fill="url(#konta-deep)" />
        <path d="M42 50 L68 12 H90 L56 50 Z" fill="url(#konta-teal-top)" />
        <path d="M68 12 L90 12 L78 28 Z" fill="#34d399" opacity="0.6" />
        <path d="M50 44 L90 88 H68 L42 56 Z" fill="url(#konta-emerald-bot)" />
        <path d="M90 88 L68 88 L78 72 Z" fill="#059669" opacity="0.7" />
        <path d="M30 42 L52 26 L66 42 L44 58 Z" fill="url(#konta-glow)" opacity="0.4" />
        <path d="M42 34 L56 50 L42 66 L28 50 Z" fill="#ffffff" opacity="0.25" />
        <polygon points="18,12 24,12 18,18" fill="#c084fc" />
        <polygon points="90,12 90,18 84,12" fill="#6ee7b7" />
        <polygon points="90,88 84,88 90,82" fill="#10b981" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: `${size * 0.58}px`,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: textColor,
              lineHeight: 1,
            }}
          >
            KONTA
          </span>
          {subtext && (
            <span
              style={{
                fontSize: `${size * 0.22}px`,
                fontWeight: 600,
                color: textColor === '#0f172a' ? '#64748b' : '#94a3b8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: '3px',
              }}
            >
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

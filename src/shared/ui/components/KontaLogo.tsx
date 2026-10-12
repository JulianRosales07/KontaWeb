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
      <img
        src="/konta-icon.png"
        alt="Konta"
        width={size}
        height={size}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          flexShrink: 0,
          filter: 'drop-shadow(0 4px 10px rgba(124, 58, 237, 0.28))',
          display: 'block',
        }}
        loading="eager"
      />

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

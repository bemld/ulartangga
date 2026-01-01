
import React from 'react';

export const LadderIcon: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div style={style} className="absolute">
    <svg viewBox="0 0 32 100" preserveAspectRatio="none" width="100%" height="100%">
      <defs>
        <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#A05A2C' }} />
          <stop offset="50%" style={{ stopColor: '#8B4513' }} />
          <stop offset="100%" style={{ stopColor: '#5C2E0E' }} />
        </linearGradient>
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
          <feOffset dx="1" dy="1" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feMerge> 
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>

      {/* Rails */}
      <rect x="2" y="0" width="8" height="100" fill="url(#woodGradient)" rx="2" ry="2" />
      <rect x="22" y="0" width="8" height="100" fill="url(#woodGradient)" rx="2" ry="2" />
      
      {/* Rungs */}
      <g filter="url(#dropShadow)">
        <rect x="6" y="8" width="20" height="5" fill="url(#woodGradient)" rx="1.5" ry="1.5" />
        <rect x="6" y="28" width="20" height="5" fill="url(#woodGradient)" rx="1.5" ry="1.5" />
        <rect x="6" y="48" width="20" height="5" fill="url(#woodGradient)" rx="1.5" ry="1.5" />
        <rect x="6" y="68" width="20" height="5" fill="url(#woodGradient)" rx="1.5" ry="1.5" />
        <rect x="6" y="88" width="20" height="5" fill="url(#woodGradient)" rx="1.5" ry="1.5" />
      </g>
    </svg>
  </div>
);

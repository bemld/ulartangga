import React from 'react';

// NOTE: This component now renders a ROPE icon, not a snake.
// The filename is kept for simplicity of file modification.
export const SnakeIcon: React.FC<{ style: React.CSSProperties; isFlipped: boolean }> = ({ style, isFlipped }) => (
  <div style={style} className="absolute">
    <svg
      viewBox="0 0 100 24" // Increased viewbox height for shadow
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      style={{ transform: isFlipped ? 'scaleX(-1)' : 'none', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="ropeGradient3D" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d2b48c" />   {/* Lightest tan */}
          <stop offset="50%" stopColor="#a0522d" />  {/* Mid sienna */}
          <stop offset="100%" stopColor="#8b4513" /> {/* Darkest brown */}
        </linearGradient>
        <filter id="ropeDropShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="2" dy="4" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter="url(#ropeDropShadow)">
        {/* Main rope body with a wavy path */}
        <path
          d="M 2,12 C 20,22 40,2 60,12 S 80,22 98,12"
          stroke="url(#ropeGradient3D)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Rope texture lines following the curve */}
        <path
          d="M 10,12 Q 15,16 20,12 M 25,12 Q 30,8 35,12 M 40,12 Q 45,16 50,12 M 55,12 Q 60,8 65,12 M 70,12 Q 75,16 80,12 M 85,12 Q 90,8 95,12"
          stroke="#654321" // Darker brown for texture
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
      </g>
    </svg>
  </div>
);
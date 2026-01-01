
import React from 'react';

export const SnakeIcon: React.FC<{ style: React.CSSProperties; isFlipped: boolean }> = ({ style, isFlipped }) => (
  <div style={style} className="absolute" >
    <svg 
      viewBox="0 0 100 20" 
      preserveAspectRatio="none" 
      width="100%" 
      height="100%" 
      style={{ transform: isFlipped ? 'scaleX(-1)' : 'none', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="ropeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: '#D2B48C' }} />
            <stop offset="50%" style={{ stopColor: '#A0522D' }} />
            <stop offset="100%" style={{ stopColor: '#8B4513' }} />
        </linearGradient>
         <filter id="ropeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.4"/>
        </filter>
      </defs>

      <g filter="url(#ropeShadow)">
        <path
          d="M 2,10 
             C 20,20 40,0 60,10 
             S 80,20 98,10"
          stroke="url(#ropeGradient)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 10,10 Q 15,14 20,10 M 25,10 Q 30,6 35,10 M 40,10 Q 45,14 50,10 M 55,10 Q 60,6 65,10 M 70,10 Q 75,14 80,10 M 85,10 Q 90,6 95,10"
          stroke="#654321"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
      </g>
    </svg>
  </div>
);

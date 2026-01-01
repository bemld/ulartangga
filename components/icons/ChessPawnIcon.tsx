
import React from 'react';

const colorMap: Record<string, { main: string; highlight: string; shadow: string }> = {
    'bg-red-500': { main: '#ef4444', highlight: '#f87171', shadow: '#b91c1c' },
    'bg-blue-500': { main: '#3b82f6', highlight: '#60a5fa', shadow: '#1d4ed8' },
    'bg-green-500': { main: '#22c55e', highlight: '#4ade80', shadow: '#15803d' },
    'bg-yellow-500': { main: '#eab308', highlight: '#facc15', shadow: '#a16207' },
    'bg-purple-500': { main: '#8b5cf6', highlight: '#a78bfa', shadow: '#6d28d9' },
    'bg-pink-500': { main: '#ec4899', highlight: '#f472b6', shadow: '#be185d' },
    'bg-indigo-500': { main: '#6366f1', highlight: '#818cf8', shadow: '#4338ca' },
    'bg-teal-500': { main: '#14b8a6', highlight: '#2dd4bf', shadow: '#0f766e' },
};

interface ChessPawnIconProps {
  color: string;
  className?: string;
  playerName: string;
}

export const ChessPawnIcon: React.FC<ChessPawnIconProps> = ({ color, className, playerName }) => {
    const colors = colorMap[color] || colorMap['bg-red-500'];
    const gradientId = `chess-pawn-gradient-${color.replace('bg-','').replace('-500','')}`;
    const headGradientId = `chess-pawn-head-gradient-${color.replace('bg-','').replace('-500','')}`;

    return (
        <svg
            viewBox="0 0 80 100"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label={`Pion catur untuk ${playerName}`}
        >
            <defs>
                <linearGradient id={gradientId} x1="0" x2="1" y1="0.5" y2="0.5">
                    <stop offset="0%" stopColor={colors.shadow} />
                    <stop offset="20%" stopColor={colors.main} />
                    <stop offset="50%" stopColor={colors.highlight} />
                    <stop offset="80%" stopColor={colors.main} />
                    <stop offset="100%" stopColor={colors.shadow} />
                </linearGradient>
                <radialGradient id={headGradientId} cx="0.4" cy="0.4" r="0.6">
                    <stop offset="0%" stopColor={colors.highlight} />
                    <stop offset="100%" stopColor={colors.main} />
                </radialGradient>
                 <filter id="pawn-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="4" dy="6" stdDeviation="3" floodColor="#000" floodOpacity="0.25" />
                </filter>
            </defs>
            <g filter="url(#pawn-shadow)">
                <path d="M10 98 H70 C70 93, 65 90, 40 90 C15 90, 10 93, 10 98 Z" fill={`url(#${gradientId})`} />
                <path d="M25 90 C 20 70, 20 55, 30 45 L50 45 C60 55, 60 70, 55 90 Z" fill={`url(#${gradientId})`} />
                 <path d="M20 45 C 15 42, 15 38, 40 38 C 65 38, 65 42, 60 45 Z" fill={`url(#${gradientId})`} />
                <circle cx="40" cy="23" r="23" fill={`url(#${headGradientId})`} />
                 <text 
                    x="40" 
                    y="70" 
                    fontFamily="Poppins, sans-serif"
                    fontSize="28"
                    fontWeight="bold"
                    fill="white"
                    textAnchor="middle"
                    stroke="rgba(0,0,0,0.4)"
                    strokeWidth="1"
                >
                    {playerName.charAt(0).toUpperCase()}
                </text>
            </g>
        </svg>
    );
};

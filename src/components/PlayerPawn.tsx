import React from 'react';
import type { Player } from '../types';
import { ChessPawnIcon } from './icons/ChessPawnIcon';

interface PlayerPawnProps {
  player: Player;
  position: { x: number; y: number };
  isActive: boolean;
}

const colorMapHex: Record<string, { main: string; highlight: string; shadow: string; glow: string }> = {
  'bg-red-500': { main: '#ef4444', highlight: '#f87171', shadow: '#b91c1c', glow: 'rgba(239, 68, 68, 0.4)' },
  'bg-blue-500': { main: '#3b82f6', highlight: '#60a5fa', shadow: '#1d4ed8', glow: 'rgba(59, 130, 246, 0.4)' },
  'bg-green-500': { main: '#22c55e', highlight: '#4ade80', shadow: '#15803d', glow: 'rgba(34, 197, 94, 0.4)' },
  'bg-yellow-500': { main: '#eab308', highlight: '#facc15', shadow: '#a16207', glow: 'rgba(234, 179, 8, 0.4)' },
  'bg-purple-500': { main: '#8b5cf6', highlight: '#a78bfa', shadow: '#6d28d9', glow: 'rgba(139, 92, 246, 0.4)' },
  'bg-pink-500': { main: '#ec4899', highlight: '#f472b6', shadow: '#be185d', glow: 'rgba(236, 72, 153, 0.4)' },
  'bg-indigo-500': { main: '#6366f1', highlight: '#818cf8', shadow: '#4338ca', glow: 'rgba(99, 102, 241, 0.4)' },
  'bg-teal-500': { main: '#14b8a6', highlight: '#2dd4bf', shadow: '#0f766e', glow: 'rgba(20, 184, 166, 0.4)' },
};

export const PlayerPawn: React.FC<PlayerPawnProps> = ({ player, position, isActive }) => {
  // Don't render until a valid position is calculated
  if (position.x === 0 && position.y === 0) {
    return null;
  }

  const selectedStyle = player.pawnStyle || 'classic';
  const colors = colorMapHex[player.color] || colorMapHex['bg-red-500'];

  return (
    <div
      title={player.name}
      className={`absolute transition-all ease-out duration-500 z-30 group`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        width: '48px',
        height: '60px',
      }}
    >
      {/* Dynamic Keyframes Injection */}
      <style>{`
        @keyframes kid-bob-act {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(1deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes kid-bob-idle {
          0% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
          100% { transform: translateY(0); }
        }
        @keyframes leg-swing-l {
          0% { transform: rotate(-22deg); }
          50% { transform: rotate(18deg); }
          100% { transform: rotate(-22deg); }
        }
        @keyframes leg-swing-r {
          0% { transform: rotate(18deg); }
          50% { transform: rotate(-22deg); }
          100% { transform: rotate(18deg); }
        }
        @keyframes hand-swing-l {
          0% { transform: translateY(0) rotate(15deg); }
          50% { transform: translateY(-2px) rotate(-15deg); }
          100% { transform: translateY(0) rotate(15deg); }
        }
        @keyframes hand-swing-r {
          0% { transform: translateY(0) rotate(-15deg); }
          50% { transform: translateY(-2px) rotate(15deg); }
          100% { transform: translateY(0) rotate(-15deg); }
        }
        @keyframes car-vibe-act {
          0% { transform: translateY(0) skewX(0deg); }
          25% { transform: translateY(-2px) skewX(1deg); }
          50% { transform: translateY(0) skewX(0deg); }
          75% { transform: translateY(-1.5px) skewX(-1deg); }
          100% { transform: translateY(0) skewX(0deg); }
        }
        @keyframes car-vibe-idle {
          0% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
          100% { transform: translateY(0); }
        }
        @keyframes wheel-spin-act {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes puff-smoke {
          0% { transform: translate(-10px, 15px) scale(0.3); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translate(-25px, 20px) scale(1.2); opacity: 0; }
        }
        @keyframes meeple-vibe {
          0% { transform: perspective(200px) rotateX(10deg) scale(1); }
          50% { transform: perspective(200px) rotateX(10deg) scale(1.05) translateY(-3px); }
          100% { transform: perspective(200px) rotateX(10deg) scale(1); }
        }
        @keyframes shadow-scale {
          0% { transform: scale(1); opacity: 0.43; }
          50% { transform: scale(0.8); opacity: 0.22; }
          100% { transform: scale(1); opacity: 0.43; }
        }
      `}</style>

      {/* 3D Realistic Drop Shadow */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/60 rounded-full blur-[3px]"
        style={{
          width: selectedStyle === 'car' ? '38px' : '28px',
          height: '7px',
          animation: isActive ? 'shadow-scale 0.5s infinite ease-in-out' : 'shadow-scale 2s infinite ease-in-out',
        }}
      />

      {/* THE 3D PIECE RE-STYLERS */}
      <div 
        className="w-full h-full relative"
        style={{
          animation: selectedStyle === 'kid'
            ? (isActive ? 'kid-bob-act 0.5s infinite ease-in-out' : 'kid-bob-idle 2s infinite ease-in-out')
            : selectedStyle === 'car'
            ? (isActive ? 'car-vibe-act 0.4s infinite linear' : 'car-vibe-idle 1.5s infinite ease-in-out')
            : (isActive ? 'meeple-vibe 0.5s infinite ease-in-out' : 'none'),
        }}
      >
        {/* Indicators of current active turn */}
        {isActive && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40">
            <span className="text-[10px] uppercase font-black text-slate-900 bg-yellow-400 border border-slate-950 px-2.5 py-0.5 rounded-full shadow-[0_3px_0_rgba(15,23,42,1)] leading-none tracking-widest whitespace-nowrap">
              Jalan!
            </span>
            <div className="w-1.5 h-1.5 bg-yellow-400 border-r border-b border-slate-950 rotate-45 -mt-0.5" />
          </div>
        )}

        {/* --- MODEL: WALKING SCHOOL-KID 3D --- */}
        {selectedStyle === 'kid' && (
          <svg className="w-full h-full overflow-visible" viewBox="0 0 60 75" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id={`kid-head-grad-${player.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="100%" stopColor="#fed7aa" />
              </linearGradient>
              <linearGradient id={`kid-shirt-grad-${player.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colors.highlight} />
                <stop offset="100%" stopColor={colors.main} strokeWidth="1"/>
              </linearGradient>
            </defs>

            {/* Arms (Swaying dynamically) */}
            <g style={{ animation: isActive ? 'hand-swing-l 0.5s infinite ease-in-out' : 'none', transformOrigin: '22px 30px' }}>
              {/* Left arm */}
              <rect x="15" y="32" width="6" height="15" rx="3" fill="#fdba74" />
              <rect x="15" y="41" width="6" height="6" rx="3" fill="#ea580c" />
            </g>
            <g style={{ animation: isActive ? 'hand-swing-r 0.5s infinite ease-in-out' : 'none', transformOrigin: '38px 30px' }}>
              {/* Right arm */}
              <rect x="39" y="32" width="6" height="15" rx="3" fill="#fdba74" />
              <rect x="39" y="41" width="6" height="6" rx="3" fill="#ea580c" />
            </g>

            {/* Legs (Stepping dynamically) */}
            <g style={{ animation: isActive ? 'leg-swing-l 0.5s infinite ease-in-out' : 'none', transformOrigin: '24px 45px' }}>
              {/* Left leg */}
              <rect x="21" y="45" width="7" height="18" rx="3" fill="#1e293b" />
              <ellipse cx="24.5" cy="62" rx="5" ry="4" fill="#ea580c" />
            </g>
            <g style={{ animation: isActive ? 'leg-swing-r 0.5s infinite ease-in-out' : 'none', transformOrigin: '36px 45px' }}>
              {/* Right leg */}
              <rect x="32" y="45" width="7" height="18" rx="3" fill="#1e293b" />
              <ellipse cx="35.5" cy="62" rx="5" ry="4" fill="#ea580c" />
            </g>

            {/* Backpack (3D Isometric thickness on the back) */}
            <rect x="17" y="27" width="26" height="20" rx="4" fill={colors.shadow} transform="skewY(-3)" />

            {/* Shirt / Torso */}
            <rect x="20" y="28" width="20" height="20" rx="3" fill={`url(#kid-shirt-grad-${player.id})`} />
            
            {/* Collar */}
            <polygon points="26,28 34,28 30,34" fill="#fd3636" />

            {/* Initial Group Letter on Shirt */}
            <text 
              x="30" 
              y="43" 
              fontFamily="Poppins, sans-serif" 
              fontSize="12" 
              fontWeight="900" 
              fill="#ffffff" 
              textAnchor="middle"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="1.5"
            >
              {player.name.charAt(0).toUpperCase()}
            </text>

            {/* Head (Slightly tilted for 3D vibe) */}
            <circle cx="30" cy="18" r="11" fill={`url(#kid-head-grad-${player.id})`} className="stroke-[#c2410c] stroke-[1]" />
            
            {/* Cute Baseball Cap / Hair */}
            <path d="M19 18 C 19 10, 41 10, 41 18 Z" fill="#c2410c" />
            {/* Cap Brim (Visor) */}
            <path d="M26 15 L43 14 L43 18 L26 18 Z" fill="#7c2d12" />

            {/* Eyes */}
            <circle cx="27" cy="19" r="1.5" fill="#1e293b" />
            <circle cx="33" cy="19" r="1.5" fill="#1e293b" />
            
            {/* Cute Smile */}
            <path d="M28 22 Q30 25 32 22" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}

        {/* --- MODEL: SPORTS RACING CAR 3D --- */}
        {selectedStyle === 'car' && (
          <svg className="w-full h-full overflow-visible" viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id={`car-body-grad-${player.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colors.highlight} />
                <stop offset="40%" stopColor={colors.main} />
                <stop offset="100%" stopColor={colors.shadow} />
              </linearGradient>
              <linearGradient id="windshield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>

            {/* Back Exhaust Smoke puff when active */}
            {isActive && (
              <circle cx="6" cy="46" r="6" fill="#cbd5e1" className="opacity-0" style={{ animation: 'puff-smoke 0.8s infinite linear' }} />
            )}

            {/* Rear Spoiler (3D Wing) */}
            <path d="M 6,24 H 18 V 29 H 6 Z" fill="#1e293b" style={{ transform: 'rotate(-10deg) translate(-2px, 2px)' }} />
            <path d="M 5,20 H 14 V 24 H 5 Z" fill="#ef4444" />

            {/* 3D Main Car Under-Body Shadow inside SVG */}
            <rect x="8" y="44" width="44" height="6" rx="3" fill="#0f172a" opacity="0.6" />

            {/* Sleek Isometric 3D Car Body */}
            {/* Tail / Wing support */}
            <rect x="7" y="28" width="6" height="12" fill={colors.shadow} rx="1" />
            
            {/* Metallic Body */}
            <path d="M 8,36 Q 5,42 12,45 L 48,43 Q 54,38 52,32 L 46,28 H 22 Z" fill={`url(#${`car-body-grad-${player.id}`})`} stroke={colors.shadow} strokeWidth="1" />

            {/* Cockpit Cabin / Windshield */}
            <path d="M 22,28 L 36,24 L 43,30 L 40,35 L 20,35 Z" fill="url(#windshield-grad)" stroke="#0284c7" strokeWidth="1" />
            <path d="M 23,29 L 34,26 L 39,32 L 21,32 Z" fill="#ffffff" opacity="0.4" />

            {/* Driver Helmet (Little yellow circle in cockpit) */}
            <circle cx="28" cy="30" r="3.5" fill="#facc15" />

            {/* Side Racing Panel / Decal (Yellow/white racing details) */}
            <rect x="22" y="37" width="16" height="5" rx="1.5" fill="#ffffff" />
            
            {/* Team/Group Initial on racing decal */}
            <text 
              x="30" 
              y="42" 
              fontFamily="monospace" 
              fontSize="6" 
              fontWeight="900" 
              fill="#1e293b" 
              textAnchor="middle"
            >
              {player.name.charAt(7) || player.name.charAt(0)}
            </text>

            {/* Frontend Hood highlight */}
            <path d="M 46,31 Q 55,34 50,42 L 42,43 Z" fill={colors.highlight} opacity="0.3" />

            {/* Front Headlights (Bright neon yellow) */}
            <polygon points="51,37 53,39 52,41" fill="#fef08a" />

            {/* Black Wheels with inner spinning mags */}
            <g style={{ transformOrigin: '17px 44px' }}>
              {/* Back Wheel */}
              <circle cx="17" cy="44" r="7" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <g style={{ animation: isActive ? 'wheel-spin-act 0.5s infinite linear' : 'none', transformOrigin: '17px 44px' }}>
                <circle cx="17" cy="44" r="4" fill="#94a3b8" />
                <line x1="17" y1="40" x2="17" y2="48" stroke="#f1f5f9" strokeWidth="1.5" />
                <line x1="13" y1="44" x2="21" y2="44" stroke="#f1f5f9" strokeWidth="1.5" />
              </g>
            </g>

            <g style={{ transformOrigin: '42px 44px' }}>
              {/* Front Wheel */}
              <circle cx="42" cy="44" r="7" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <g style={{ animation: isActive ? 'wheel-spin-act 0.5s infinite linear' : 'none', transformOrigin: '42px 44px' }}>
                <circle cx="42" cy="44" r="4" fill="#94a3b8" />
                <line x1="42" y1="40" x2="42" y2="48" stroke="#f1f5f9" strokeWidth="1.5" />
                <line x1="38" y1="44" x2="46" y2="44" stroke="#f1f5f9" strokeWidth="1.5" />
              </g>
            </g>
          </svg>
        )}

        {/* --- MODEL: CLASSIC TRADITIONAL 3D MEEPLE / CHESS PAWN --- */}
        {selectedStyle === 'classic' && (
          <ChessPawnIcon
            color={player.color}
            playerName={player.name}
            className="w-full h-full filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform"
          />
        )}
      </div>
    </div>
  );
};

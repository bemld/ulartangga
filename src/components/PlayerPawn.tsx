import React from 'react';
import type { Player } from '../types';
import { ChessPawnIcon } from './icons/ChessPawnIcon';

interface PlayerPawnProps {
  player: Player;
  position: { x: number; y: number };
  isActive: boolean;
}

export const PlayerPawn: React.FC<PlayerPawnProps> = ({ player, position, isActive }) => {
  // Don't render until a valid position is calculated
  if (position.x === 0 && position.y === 0) {
    return null;
  }

  return (
    <div
      title={player.name}
      // Adjusted aspect ratio for the new chess pawn icon
      className={`w-8 h-10 sm:w-10 sm:h-12 absolute transition-all ease-in-out duration-300 z-10 ${isActive ? 'pawn-active' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        // Anchor the pawn from its bottom-center
        transform: 'translateX(-50%) translateY(-100%)',
      }}
    >
      <ChessPawnIcon
        color={player.color}
        playerName={player.name}
        className="w-full h-full"
      />
    </div>
  );
};

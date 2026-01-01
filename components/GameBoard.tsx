
import React, { useRef, useState, useLayoutEffect } from 'react';
import { Player, SnakeOrLadder, VisualSettings, GameType } from '../types';
import { BOARD_SIZE } from '../constants';
import { PlayerPawn } from './PlayerPawn';
import { SnakeIcon } from './icons/SnakeIcon';
import { LadderIcon } from './icons/LadderIcon';

interface GameBoardProps {
  gameType: GameType;
  players: Player[];
  snakes: SnakeOrLadder[];
  ladders: SnakeOrLadder[];
  currentPlayerId: number;
  visualSettings: VisualSettings;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameType, players, snakes, ladders, currentPlayerId, visualSettings }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [squarePositions, setSquarePositions] = useState<Map<number, { x: number; y: number }>>(new Map());
  const [squareSize, setSquareSize] = useState({ width: 0, height: 0 });

  const totalSquares = gameType === GameType.ChallengeTrail ? 9 : BOARD_SIZE;
  const COLS = gameType === GameType.ChallengeTrail ? 3 : 5;
  const ROWS = totalSquares / COLS;

  useLayoutEffect(() => {
    const boardElement = boardRef.current;
    if (!boardElement) return;

    const updatePositions = () => {
      const newPositions = new Map<number, { x: number; y: number }>();
      const boardRect = boardElement.getBoundingClientRect();

      const firstSquareEl = document.getElementById('square-1');
      if (firstSquareEl) {
        const rect = firstSquareEl.getBoundingClientRect();
        setSquareSize({ width: rect.width, height: rect.height });
      }

      for (let i = 1; i <= totalSquares; i++) {
        const squareEl = document.getElementById(`square-${i}`);
        if (squareEl) {
          const rect = squareEl.getBoundingClientRect();
          const x = rect.left - boardRect.left + rect.width / 2;
          const y = rect.top - boardRect.top + rect.height / 2;
          newPositions.set(i, { x, y });
        }
      }
      setSquarePositions(newPositions);
    };

    const observer = new ResizeObserver(updatePositions);
    observer.observe(boardElement);
    updatePositions();
    return () => observer.unobserve(boardElement);
  }, [totalSquares, COLS]);

  const getSquareCenter = (square: number) => squarePositions.get(square) || { x: 0, y: 0 };

  const squares = [];
  for (let i = 0; i < totalSquares; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const y = (ROWS - 1) - row; 
    let num;
    if (y % 2 === 0) num = (y * COLS) + col + 1;
    else num = (y * COLS) + (COLS - 1 - col) + 1;
    
    const hasCustomBg = !!visualSettings.containerBackground;
    const bgColor = hasCustomBg ? 'bg-black/20' : (Math.floor((num - 1) / COLS) + (num - 1)) % 2 === 0 ? 'bg-stone-200/80' : 'bg-stone-100/80';
    squares.push({ num, bgColor });
  }

  const hasPositions = squarePositions.size > 0;
  
  return (
    <div 
      className={`aspect-square w-full max-w-3xl mx-auto p-2 sm:p-4 rounded-2xl shadow-xl border-2 relative ${visualSettings.containerBackground ? 'border-white/20' : 'bg-stone-50 border-stone-200'}`}
      ref={boardRef}
      style={visualSettings.containerBackground ? { backgroundImage: `url(${visualSettings.containerBackground})`, backgroundSize: 'cover' } : {}}
    >
      <div className={`grid h-full gap-2 ${gameType === GameType.ChallengeTrail ? 'grid-cols-3 grid-rows-3' : 'grid-cols-5 grid-rows-5'}`}>
        {squares.map(({ num, bgColor }) => (
          <div
            key={num}
            id={`square-${num}`}
            className={`rounded-md flex items-start justify-end p-2 ${bgColor} border ${visualSettings.containerBackground ? 'border-white/10' : 'border-stone-300'} relative overflow-hidden`}
          >
            <span className={`font-bold ${gameType === GameType.ChallengeTrail ? 'text-2xl sm:text-4xl' : 'text-sm sm:text-lg'} ${visualSettings.containerBackground ? 'text-white/60' : 'text-slate-400'}`}>{num}</span>
          </div>
        ))}
      </div>
      
      {gameType === GameType.SnakesLadders && hasPositions && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {ladders.map((ladder, i) => {
              const startPos = getSquareCenter(ladder.start);
              const endPos = getSquareCenter(ladder.end);
              const distance = Math.sqrt(Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2));
              const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x) * (180 / Math.PI) - 90;
              return <LadderIcon key={`ladder-${i}`} style={{ width: '24px', height: `${distance}px`, left: `${(startPos.x + endPos.x) / 2}px`, top: `${(startPos.y + endPos.y) / 2}px`, transform: `translate(-50%, -50%) rotate(${angle}deg)` }} />;
            })}
            {snakes.map((snake, i) => {
              const startPos = getSquareCenter(snake.start);
              const endPos = getSquareCenter(snake.end);
              if (!startPos.x) return null;
              const distance = Math.sqrt(Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2));
              const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x) * (180 / Math.PI);
              const ropeThickness = squareSize.width * 0.4 || 40;
              return snake.imageUrl ? (
                  <img key={`r-${i}`} src={snake.imageUrl} style={{ position: 'absolute', width: `${distance}px`, height: `${ropeThickness}px`, left: `${(startPos.x + endPos.x) / 2}px`, top: `${(startPos.y + endPos.y) / 2}px`, transform: `translate(-50%, -50%) rotate(${angle}deg)`, objectFit: 'fill' }} />
              ) : null;
            })}
          </div>
      )}

      {hasPositions && players.map((player) => {
          const center = getSquareCenter(player.position);
          const playersOnSameSquare = players.filter(p => p.position === player.position);
          const idx = playersOnSameSquare.findIndex(p => p.id === player.id);
          const offset = playersOnSameSquare.length > 1 ? { x: Math.cos((idx/playersOnSameSquare.length)*2*Math.PI)*12, y: Math.sin((idx/playersOnSameSquare.length)*2*Math.PI)*12 } : {x:0, y:0};
          return <PlayerPawn key={player.id} player={player} position={{ x: center.x + offset.x, y: center.y + offset.y }} isActive={player.id === currentPlayerId} />;
      })}
    </div>
  );
};

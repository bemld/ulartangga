import React, { useRef, useState, useLayoutEffect } from 'react';
import type { Player, SnakeOrLadder, VisualSettings } from '../types';
import { BOARD_SIZE } from '../constants';
import { PlayerPawn } from './PlayerPawn';
import { SnakeIcon } from './icons/SnakeIcon';
import { LadderIcon } from './icons/LadderIcon';

interface GameBoardProps {
  players: Player[];
  snakes: SnakeOrLadder[];
  ladders: SnakeOrLadder[];
  currentPlayerId: number;
  visualSettings: VisualSettings;
}

export const GameBoard: React.FC<GameBoardProps> = ({ players, snakes, ladders, currentPlayerId, visualSettings }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [squarePositions, setSquarePositions] = useState<Map<number, { x: number; y: number }>>(new Map());
  const [squareSize, setSquareSize] = useState({ width: 0, height: 0 });

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

      for (let i = 1; i <= BOARD_SIZE; i++) {
        const squareEl = document.getElementById(`square-${i}`);
        if (squareEl) {
          const rect = squareEl.getBoundingClientRect();
          // Calculate center relative to the board container's top-left corner
          const x = rect.left - boardRect.left + rect.width / 2;
          const y = rect.top - boardRect.top + rect.height / 2;
          newPositions.set(i, { x, y });
        }
      }
      setSquarePositions(newPositions);
    };

    // Use ResizeObserver for better performance and accuracy
    const observer = new ResizeObserver(updatePositions);
    observer.observe(boardElement);
    
    updatePositions(); // Initial calculation

    return () => {
      observer.unobserve(boardElement);
    };
  }, []); // Run only once on mount

  const getSquareCenter = (square: number) => {
    return squarePositions.get(square) || { x: 0, y: 0 };
  };

  const squares = [];
  const COLS = 5;
  const ROWS = BOARD_SIZE / COLS;

  for (let i = 0; i < BOARD_SIZE; i++) {
    const row = Math.floor(i / COLS); // 0-indexed from top
    const col = i % COLS;             // 0-indexed from left

    // Convert to 0-indexed from bottom to determine number
    const y = (ROWS - 1) - row; 

    let num;
    if (y % 2 === 0) { // Even rows (from bottom: 0, 2, 4...) go left-to-right
      num = (y * COLS) + col + 1;
    } else { // Odd rows (from bottom: 1, 3...) go right-to-left
      num = (y * COLS) + (COLS - 1 - col) + 1;
    }
    
    const hasCustomBg = !!visualSettings.containerBackground;
    const bgColor = hasCustomBg
      ? 'bg-black/20'
      : (Math.floor((num - 1) / 5) + (num - 1)) % 2 === 0 ? 'bg-stone-200/80' : 'bg-stone-100/80';
    squares.push({ num, bgColor });
  }

  const hasPositions = squarePositions.size > 0;
  
  const boardStyle: React.CSSProperties = visualSettings.containerBackground
    ? {
        backgroundImage: `url(${visualSettings.containerBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {};
    
  const defaultBoardClasses = "bg-stone-50/95 border-stone-200";
  const customBoardClasses = "border-white/20";

  return (
    <div 
      className={`aspect-square w-full max-w-3xl max-h-full mx-auto p-2 sm:p-4 rounded-2xl shadow-xl shadow-black/30 border-2 relative ${visualSettings.containerBackground ? customBoardClasses : defaultBoardClasses}`}
      ref={boardRef}
      style={boardStyle}
    >
      <div className="grid grid-cols-5 grid-rows-5 h-full gap-1">
        {squares.map(({ num, bgColor }) => (
          <div
            key={num}
            id={`square-${num}`}
            className={`rounded-md flex items-start justify-end p-2 ${bgColor} border ${visualSettings.containerBackground ? 'border-white/20' : 'border-stone-300/50'} shadow-inner`}
          >
            <span className={`font-bold text-sm sm:text-lg ${visualSettings.containerBackground ? 'text-white/80' : 'text-slate-500'}`}>{num}</span>
          </div>
        ))}
      </div>
      
      {/* Visual Ladders and Ropes (previously snakes) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {hasPositions && ladders.map((ladder, i) => {
          const startPos = getSquareCenter(ladder.start);
          const endPos = getSquareCenter(ladder.end);
          const deltaX = endPos.x - startPos.x;
          const deltaY = endPos.y - startPos.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) - 90;
          
          const style = {
            width: '24px',
            height: `${distance}px`,
            left: `${(startPos.x + endPos.x) / 2}px`,
            top: `${(startPos.y + endPos.y) / 2}px`,
            transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          };
          return <LadderIcon key={`ladder-${i}`} style={style} />;
        })}

        {hasPositions && snakes.map((snake, i) => {
          const startPos = getSquareCenter(snake.start);
          const endPos = getSquareCenter(snake.end);
          
          if (!startPos || !endPos || (startPos.x === 0 && startPos.y === 0)) {
            return null;
          }

          const deltaX = endPos.x - startPos.x;
          const deltaY = endPos.y - startPos.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

          if (snake.imageUrl) {
            // Set rope thickness to be a proportion of a square's width for a nice visual balance
            const ropeThickness = squareSize.width > 0 ? squareSize.width * 0.4 : 40; 
            const imageStyle: React.CSSProperties = {
              position: 'absolute',
              width: `${distance}px`,
              height: `${ropeThickness}px`, // Dynamic height based on square size
              left: `${(startPos.x + endPos.x) / 2}px`,
              top: `${(startPos.y + endPos.y) / 2}px`,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              objectFit: 'fill', // Stretch the image to fill the container dimensions
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))',
            };
            return (
              <img
                key={`rope-img-${i}`}
                src={snake.imageUrl}
                alt={`Tali dari ${snake.start} ke ${snake.end}`}
                style={imageStyle}
              />
            );
          } else {
            // Set rope icon thickness to be a proportion of a square's width
            const ropeThickness = squareSize.width > 0 ? squareSize.width * 0.2 : 20;
            const iconStyle = {
              width: `${distance}px`,
              height: `${ropeThickness}px`,
              left: `${(startPos.x + endPos.x) / 2}px`,
              top: `${(startPos.y + endPos.y) / 2}px`,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
            };
            const isFlipped = startPos.x > endPos.x;
            return <SnakeIcon key={`rope-icon-${i}`} style={iconStyle} isFlipped={isFlipped} />;
          }
        })}
      </div>


      {/* Absolutely Positioned Pawns */}
      {hasPositions && players.map((player) => {
          const center = getSquareCenter(player.position);

          const playersOnSameSquare = players.filter(p => p.position === player.position);
          const playerIndexOnSquare = playersOnSameSquare.findIndex(p => p.id === player.id);
          
          let offsetX = 0;
          let offsetY = 0;
          if (playersOnSameSquare.length > 1) {
            const angle = (playerIndexOnSquare / playersOnSameSquare.length) * 2 * Math.PI;
            const radius = 12; // Radius to arrange pawns in a circle
            offsetX = Math.cos(angle) * radius;
            offsetY = Math.sin(angle) * radius;
          }

          return (
            <PlayerPawn
              key={player.id}
              player={player}
              position={{ x: center.x + offsetX, y: center.y + offsetY }}
              isActive={player.id === currentPlayerId}
            />
          );
        })}
    </div>
  );
};
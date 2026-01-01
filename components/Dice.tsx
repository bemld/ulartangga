
import React, { useState, useEffect } from 'react';
import { DiceIcon } from './icons/DiceIcons';

interface DiceProps {
  result: number;
  isRolling: boolean;
}

export const Dice: React.FC<DiceProps> = ({ result, isRolling }) => {
  const [displayValue, setDisplayValue] = useState(result);

  useEffect(() => {
    if (isRolling) {
      let rollCount = 0;
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
        rollCount++;
        if (rollCount > 10) { // Corresponds to ~700ms animation
          clearInterval(interval);
          setDisplayValue(result);
        }
      }, 70);
      return () => clearInterval(interval);
    } else {
      setDisplayValue(result);
    }
  }, [isRolling, result]);

  return (
    <div className={`w-20 h-20 sm:w-24 sm:h-24 p-2 bg-white rounded-lg shadow-md text-slate-700 ${isRolling ? 'dice-rolling' : ''}`}>
      <DiceIcon value={displayValue} />
    </div>
  );
};

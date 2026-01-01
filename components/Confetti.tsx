
import React, { useState, useEffect } from 'react';

const confettiColors = ['#fde047', '#f97316', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6', '#ffffff'];
const totalConfetti = 150;

interface Confetto {
  id: number;
  style: React.CSSProperties;
}

export const Confetti: React.FC = () => {
  const [confetti, setConfetti] = useState<Confetto[]>([]);

  useEffect(() => {
    const generateConfetti = () => {
      const newConfetti: Confetto[] = [];
      for (let i = 0; i < totalConfetti; i++) {
        const xPos = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 5 + Math.random() * 5;
        const size = 8 + Math.random() * 8;
        const initialRotation = Math.random() * 360;

        newConfetti.push({
          id: i,
          style: {
            left: `${xPos}%`,
            width: `${size}px`,
            height: `${size / 2}px`,
            backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            animation: `fall ${duration}s linear ${delay}s infinite`,
            transform: `rotate(${initialRotation}deg)`,
            borderRadius: '50%',
          },
        });
      }
      setConfetti(newConfetti);
    };
    generateConfetti();
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none z-50 overflow-hidden">
      {confetti.map(({ id, style }) => (
        <div key={id} style={style} className="absolute top-0 opacity-0" />
      ))}
    </div>
  );
};

import React from 'react';

const commonProps = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
  className: "w-full h-full"
};

export const Dice1 = () => <svg {...commonProps}><circle cx="12" cy="12" r="1.5" /></svg>;
export const Dice2 = () => <svg {...commonProps}><circle cx="8" cy="8" r="1.5" /><circle cx="16" cy="16" r="1.5" /></svg>;
export const Dice3 = () => <svg {...commonProps}><circle cx="8" cy="8" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="16" cy="16" r="1.5" /></svg>;
export const Dice4 = () => <svg {...commonProps}><circle cx="8" cy="8" r="1.5" /><circle cx="16" cy="8" r="1.5" /><circle cx="8" cy="16" r="1.5" /><circle cx="16" cy="16" r="1.5" /></svg>;
export const Dice5 = () => <svg {...commonProps}><circle cx="8" cy="8" r="1.5" /><circle cx="16" cy="8" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="8" cy="16" r="1.5" /><circle cx="16" cy="16" r="1.5" /></svg>;
export const Dice6 = () => <svg {...commonProps}><circle cx="8" cy="8" r="1.5" /><circle cx="16" cy="8" r="1.5" /><circle cx="8" cy="12" r="1.5" /><circle cx="16" cy="12" r="1.5" /><circle cx="8" cy="16" r="1.5" /><circle cx="16" cy="16" r="1.5" /></svg>;

export const DiceIcon: React.FC<{ value: number }> = ({ value }) => {
  switch (value) {
    case 1: return <Dice1 />;
    case 2: return <Dice2 />;
    case 3: return <Dice3 />;
    case 4: return <Dice4 />;
    case 5: return <Dice5 />;
    case 6: return <Dice6 />;
    default: return <Dice1 />;
  }
};
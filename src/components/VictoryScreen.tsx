import React from 'react';
import { Player } from '../types';
import { TrophyIcon } from './icons/TrophyIcon';
import { Confetti } from './Confetti';
import { Star } from 'lucide-react';

interface VictoryScreenProps {
  winner: Player;
  onNewGame: () => void;
  onResetGame: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ winner, onNewGame, onResetGame }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-40 overflow-hidden">
      <Confetti />
      <div className="relative flex flex-col items-center justify-center text-center">
        {/* Spinning Rays */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] animate-rays-spin z-[-1]"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, rgba(253, 224, 71, 0.3) 0%, transparent 2.5%, rgba(253, 224, 71, 0.3) 5%, transparent 7.5%, rgba(253, 224, 71, 0.3) 10%, transparent 12.5%, rgba(253, 224, 71, 0.3) 15%, transparent 17.5%, rgba(253, 224, 71, 0.3) 20%, transparent 22.5%, rgba(253, 224, 71, 0.3) 25%, transparent 27.5%, rgba(253, 224, 71, 0.3) 30%, transparent 32.5%, rgba(253, 224, 71, 0.3) 35%, transparent 37.5%, rgba(253, 224, 71, 0.3) 40%, transparent 42.5%, rgba(253, 224, 71, 0.3) 45%, transparent 47.5%, rgba(253, 224, 71, 0.3) 50%, transparent 52.5%, rgba(253, 224, 71, 0.3) 55%, transparent 57.5%, rgba(253, 224, 71, 0.3) 60%, transparent 62.5%, rgba(253, 224, 71, 0.3) 65%, transparent 67.5%, rgba(253, 224, 71, 0.3) 70%, transparent 72.5%, rgba(253, 224, 71, 0.3) 75%, transparent 77.5%, rgba(253, 224, 71, 0.3) 80%, transparent 82.5%, rgba(253, 224, 71, 0.3) 85%, transparent 87.5%, rgba(253, 224, 71, 0.3) 90%, transparent 92.5%, rgba(253, 224, 71, 0.3) 95%, transparent 97.5%)',
            maskImage: 'radial-gradient(circle at center, black 10%, transparent 60%)'
          }}
        />

        <div className="animate-trophy-drop opacity-0">
            <TrophyIcon className="w-40 h-40 text-yellow-400 drop-shadow-lg" />
        </div>
        
        <div className="animate-content-fade opacity-0 mt-4">
          <h1 className="text-5xl sm:text-6xl font-bold text-white font-poppins drop-shadow-lg">
            Selamat!
          </h1>
          <p className={`text-3xl sm:text-4xl mt-3 font-semibold text-yellow-300 drop-shadow-md`}>
            {winner.name} telah menang!
          </p>
          
          {/* Total Stars Display */}
          <div className="mt-4 flex items-center justify-center gap-2 bg-white/10 p-3 rounded-full backdrop-blur-sm border border-white/20">
              <Star size={32} className="text-yellow-400 fill-yellow-400 drop-shadow-sm" />
              <span className="text-3xl font-bold text-white">{winner.stars || 0} Total Bintang</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-12 animate-content-fade-late opacity-0">
          <button
            onClick={onResetGame}
            className="bg-orange-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-orange-700 transition-all transform hover:scale-105 shadow-xl border-2 border-orange-400"
          >
            Ulangi dengan Pengaturan Sama
          </button>
          <button
            onClick={onNewGame}
            className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-emerald-700 transition-all transform hover:scale-105 shadow-xl border-2 border-emerald-400"
          >
            Permainan Baru
          </button>
        </div>
      </div>
    </div>
  );
};
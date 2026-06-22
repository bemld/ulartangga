import React from 'react';
import { Player } from '../types';
import { TrophyIcon } from './icons/TrophyIcon';
import { Confetti } from './Confetti';
import { Star, Award, Sparkles, CheckCircle2 } from 'lucide-react';

interface VictoryScreenProps {
  winner: Player;
  players: Player[];
  customAwards?: string[];
  onNewGame: () => void;
  onResetGame: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ 
  winner, 
  players, 
  customAwards = [], 
  onNewGame, 
  onResetGame 
}) => {
  // Record of awardName -> array of playerIds who won this award
  const [awardedGroupIds, setAwardedGroupIds] = React.useState<Record<string, number[]>>({});

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-start p-4 z-40 overflow-y-auto">
      <Confetti />
      
      {/* Decorative Rays */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] animate-rays-spin z-[-1] pointer-events-none"
        style={{
          background: 'conic-gradient(from 0deg at 50% 50%, rgba(253, 224, 71, 0.15) 0%, transparent 2.5%, rgba(253, 224, 71, 0.15) 5%, transparent 7.5%, rgba(253, 224, 71, 0.15) 10%, transparent 12.5%, rgba(253, 224, 71, 0.15) 15%, transparent 17.5%, rgba(253, 224, 71, 0.15) 20%, transparent 22.5%, rgba(253, 224, 71, 0.15) 25%, transparent 27.5%, rgba(253, 224, 71, 0.15) 30%, transparent 32.5%, rgba(253, 224, 71, 0.15) 35%, transparent 37.5%, rgba(253, 224, 71, 0.15) 40%, transparent 42.5%, rgba(253, 224, 71, 0.15) 45%, transparent 47.5%, rgba(253, 224, 71, 0.15) 50%, transparent 52.5%, rgba(253, 224, 71, 0.15) 55%, transparent 57.5%, rgba(253, 224, 71, 0.15) 60%, transparent 62.5%, rgba(253, 224, 71, 0.15) 65%, transparent 67.5%, rgba(253, 224, 71, 0.15) 70%, transparent 72.5%, rgba(253, 224, 71, 0.15) 75%, transparent 77.5%, rgba(253, 224, 71, 0.15) 80%, transparent 82.5%, rgba(253, 224, 71, 0.15) 85%, transparent 87.5%, rgba(253, 224, 71, 0.15) 90%, transparent 92.5%, rgba(253, 224, 71, 0.15) 95%, transparent 97.5%)',
          maskImage: 'radial-gradient(circle at center, black 10%, transparent 60%)'
        }}
      />

      <div className="relative flex flex-col items-center justify-center text-center w-full max-w-4xl py-10">
        
        {/* Trophy Section */}
        <div className="animate-trophy-drop opacity-0">
          <TrophyIcon className="w-36 h-36 sm:w-44 sm:h-44 text-yellow-400 drop-shadow-[0_10px_25px_rgba(234,179,8,0.3)]" />
        </div>
        
        {/* Celebration Header */}
        <div className="animate-content-fade opacity-0 mt-3">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white font-poppins drop-shadow-md tracking-tight">
            Selamat kepada Pemenang!
          </h1>
          <p className="text-2xl sm:text-4xl mt-3 font-bold text-yellow-300 drop-shadow-sm flex items-center justify-center gap-2">
            🏆 {winner.name} 🏆
          </p>
          
          {/* Total Stars Display */}
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/20 shadow-md">
            <Star size={24} className="text-yellow-400 fill-yellow-400 animate-pulse" />
            <span className="text-lg sm:text-xl font-bold text-white">{winner.stars || 0} Total Bintang</span>
          </div>
        </div>

        {/* Papan Pengkategorian & Apresiasi Guru */}
        {customAwards && customAwards.length > 0 && (
          <div className="mt-8 bg-slate-900/80 backdrop-blur-lg rounded-2xl p-5 sm:p-7 border border-white/15 text-left w-full max-w-2xl mx-auto shadow-2xl animate-content-fade-late opacity-0">
            <div className="flex items-center gap-2.5 mb-5 border-b border-white/10 pb-4">
              <Award className="text-yellow-400 w-6 h-6 animate-bounce" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white font-poppins">Papan Apresiasi Karakter Guru</h2>
                <p className="text-xs text-slate-350">Silakan pilih kelompok mana yang berhak menyandang penghargaan karakter berikut:</p>
              </div>
            </div>

            <div className="space-y-4">
              {customAwards.map((award, aIdx) => {
                const checkedGroupIds = awardedGroupIds[award] || [];
                return (
                  <div key={aIdx} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/15 transition-all">
                    <div className="font-semibold text-yellow-300 text-xs sm:text-sm flex items-center gap-1.5 mb-2.5">
                      <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0 animate-pulse" />
                      {award}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {players.map((plyr) => {
                        const isAwarded = checkedGroupIds.includes(plyr.id);
                        return (
                          <button
                            key={plyr.id}
                            type="button"
                            onClick={() => {
                              const updated = isAwarded
                                ? checkedGroupIds.filter(id => id !== plyr.id)
                                : [...checkedGroupIds, plyr.id];
                              setAwardedGroupIds(prev => ({ ...prev, [award]: updated }));
                            }}
                            className={`px-3 py-1.5 text-xs rounded-full border flex items-center gap-1.5 font-bold transition-all ${
                              isAwarded 
                                ? 'bg-yellow-500 border-yellow-350 text-slate-950 scale-105 shadow-md shadow-yellow-500/10' 
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${plyr.color}`}></span>
                            {plyr.name}
                            {isAwarded && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rekapitulasi Penghargaan */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <h3 className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">
                Ringkasan Apresiasi Kelompok
              </h3>
              <div className="space-y-2">
                {players.map((plyr) => {
                  const items = Object.keys(awardedGroupIds).filter(awName => (awardedGroupIds[awName] || []).includes(plyr.id));
                  return (
                    <div 
                      key={plyr.id} 
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl transition-all border ${
                        items.length > 0 
                          ? 'bg-yellow-500/15 border-yellow-500/35 shadow-sm' 
                          : 'bg-white/5 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${plyr.color}`}></span>
                        <span className="font-bold text-sm text-white">{plyr.name}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2 sm:mt-0">
                        {items.length > 0 ? (
                          items.map((aw, i) => (
                            <span key={i} className="bg-yellow-400 text-slate-900 px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-0.5 shadow-sm">
                              🏅 {aw}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Belum menerima penghargaan</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 sm:mt-10 animate-content-fade-late opacity-0 w-full max-w-lg justify-center px-4 font-sans">
          <button
            onClick={onResetGame}
            className="w-full sm:w-auto bg-orange-600 text-white font-bold py-3.5 px-8 rounded-xl text-lg hover:bg-orange-700 transition-all transform hover:scale-105 shadow-xl border border-orange-500"
          >
            Ulangi Permainan
          </button>
          <button
            onClick={onNewGame}
            className="w-full sm:w-auto bg-emerald-600 text-white font-bold py-3.5 px-8 rounded-xl text-lg hover:bg-emerald-700 transition-all transform hover:scale-105 shadow-xl border border-emerald-500"
          >
            Buat Game Baru
          </button>
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import type { Player, ActivityType } from '../types';
import { Dice } from './Dice';

interface GameControlsProps {
  players: Player[];
  currentPlayer: Player;
  onRollDice: () => void;
  onReset: () => void;
  onGoHome: () => void; // New prop for going back to home screen
  diceResult: number;
  isRolling: boolean;
  canRoll: boolean;
  activityType: ActivityType;
  pendingQuestion: string | null;
  onAnswerCorrect: () => void;
  onAnswerIncorrect: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  players,
  currentPlayer,
  onRollDice,
  onReset,
  onGoHome, // Destructure the new prop
  diceResult,
  isRolling,
  canRoll,
  activityType,
  pendingQuestion,
  onAnswerCorrect,
  onAnswerIncorrect,
}) => {
  const isCognitiveQuestionTime = activityType === 'cognitive' && pendingQuestion;

  return (
    <div className="w-full bg-slate-800 text-slate-200 p-4 sm:p-6 shadow-2xl shadow-black/40 flex flex-col justify-between h-full border-t-4 sm:border-t-0 sm:border-l-4 border-slate-900/50 overflow-y-auto">
      <div>
        <h2 className="text-4xl font-bold text-yellow-300 mb-4 font-caveat text-center">Status Pemain</h2>
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center p-2 rounded-lg transition-all ${
                player.id === currentPlayer.id ? 'bg-slate-600 ring-2 ring-yellow-400' : 'bg-slate-700/80'
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${player.color} mr-3 flex-shrink-0 border-2 border-white/20`}></div>
              <div className="flex-grow">
                <p className="font-bold text-slate-100">{player.name}</p>
                <p className="text-sm text-slate-400">Posisi: {player.position}</p>
              </div>
              {player.id === currentPlayer.id && (
                  <div className="flex items-center text-yellow-400 font-semibold text-sm font-caveat text-lg">
                    {isCognitiveQuestionTime ? 'Jawab Soal!' : '→ Giliranmu!'}
                  </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col items-center mt-6">
        {isCognitiveQuestionTime ? (
            <div className="w-full text-center">
                <div className="mb-4 p-4 bg-slate-700 border-l-4 border-yellow-400 text-yellow-200 rounded-r-lg text-left">
                    <h3 className="font-bold font-poppins">Pertanyaan untuk {currentPlayer.name}:</h3>
                    <p className="mt-1 font-caveat text-xl text-white">{pendingQuestion}</p>
                </div>
                <p className="font-semibold text-slate-300 mb-3 font-caveat text-xl">Guru: Tandai jawaban siswa.</p>
                <div className="w-full space-y-3">
                     <button
                        onClick={onAnswerCorrect}
                        className="w-full bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:bg-emerald-600 transition-all transform hover:scale-105"
                    >
                        Jawaban Benar
                    </button>
                    <button
                        onClick={onAnswerIncorrect}
                        className="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:bg-red-700 transition-all transform hover:scale-105"
                    >
                        Jawaban Salah (Lewati Giliran)
                    </button>
                </div>
            </div>
        ) : (
            <>
                <Dice result={diceResult} isRolling={isRolling} />
                <button
                onClick={onRollDice}
                disabled={!canRoll || isRolling}
                className="mt-4 w-full bg-teal-500 text-white font-bold py-4 px-6 rounded-lg text-xl shadow-md hover:bg-teal-600 transition-all transform hover:scale-105 disabled:bg-slate-500 disabled:cursor-not-allowed disabled:transform-none"
                >
                {isRolling ? 'Melempar...' : 'Lemparkan Dadu'}
                </button>
            </>
        )}
         {/* Meta controls section at the bottom */}
        <div className="w-full mt-6 pt-4 border-t border-slate-700/50 space-y-2">
            <button
                onClick={() => {
                    if (window.confirm('Apakah Anda yakin ingin kembali ke menu utama? Permainan saat ini akan berakhir.')) {
                        onGoHome();
                    }
                }}
                className="w-full text-sky-400 font-semibold hover:bg-slate-700 hover:text-sky-300 py-2 rounded-lg transition-colors"
                >
                Kembali ke Menu Utama
            </button>
            <button
            onClick={onReset}
            className="w-full text-orange-400 font-semibold hover:bg-slate-700 hover:text-orange-300 py-2 rounded-lg transition-colors"
            >
            Ulangi Pengaturan
            </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Player, ActivityType, GameType } from '../types';
import { Dice } from './Dice';

interface GameControlsProps {
  gameType: GameType;
  players: Player[];
  currentPlayer: Player;
  onRollDice: () => void;
  onReset: () => void;
  onGoHome: () => void;
  diceResult: number;
  isRolling: boolean;
  canRoll: boolean;
  activityType: ActivityType;
  pendingQuestion: string | null;
  onAnswerCorrect: () => void;
  onAnswerIncorrect: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameType,
  players,
  currentPlayer,
  onRollDice,
  onReset,
  onGoHome,
  diceResult,
  isRolling,
  canRoll,
  activityType,
  pendingQuestion,
  onAnswerCorrect,
  onAnswerIncorrect,
}) => {
  const isQuestionActive = pendingQuestion !== null;

  return (
    <div className="w-full bg-slate-800 text-slate-200 p-4 sm:p-6 rounded-2xl shadow-2xl flex flex-col justify-between h-full border-4 border-slate-900/50">
      <div>
        <h2 className="text-3xl font-bold text-yellow-300 mb-4 font-caveat text-center">
            {gameType === GameType.ChallengeTrail ? 'Jalur Tantangan' : 'Giliran Main'}
        </h2>
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center p-2 rounded-lg transition-all ${
                player.id === currentPlayer.id ? 'bg-slate-600 ring-2 ring-yellow-400' : 'bg-slate-700/80'
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${player.color} mr-3 border-2 border-white/20`}></div>
              <div className="flex-grow">
                <p className="font-bold text-slate-100">{player.name}</p>
                <p className="text-sm text-slate-400">Posisi: {player.position}</p>
              </div>
              {player.id === currentPlayer.id && !isQuestionActive && (
                  <div className="text-yellow-400 font-caveat text-lg animate-bounce">
                    Ayo!
                  </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col items-center mt-6">
        {isQuestionActive ? (
            <div className="w-full text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-4 bg-slate-700 border-l-4 border-sky-400 text-sky-100 rounded-r-lg text-left shadow-inner">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Tantangan Kotak {currentPlayer.position}</h3>
                    <p className="mt-1 font-caveat text-2xl leading-tight text-white">{pendingQuestion}</p>
                </div>
                <div className="w-full space-y-2">
                     <p className="text-xs text-yellow-500 font-bold uppercase mb-2">Panel Validasi Guru</p>
                     <button
                        onClick={onAnswerCorrect}
                        className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:bg-emerald-600 transition-transform active:scale-95"
                    >
                        {gameType === GameType.ChallengeTrail ? 'Naik ke Level Berikutnya' : 'Jawaban Benar!'}
                    </button>
                    <button
                        onClick={onAnswerIncorrect}
                        className="w-full bg-red-600 text-white font-bold py-3 rounded-xl text-md shadow-lg hover:bg-red-700 transition-transform active:scale-95"
                    >
                        {gameType === GameType.ChallengeTrail ? 'Tetap di Level Ini' : 'Jawaban Salah'}
                    </button>
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center w-full">
                {/* Dadu hanya muncul di mode Ular Tangga Klasik */}
                {gameType === GameType.SnakesLadders && (
                    <div className="mb-4">
                        <Dice result={diceResult} isRolling={isRolling} />
                    </div>
                )}
                
                <button
                    onClick={onRollDice}
                    disabled={!canRoll || isRolling}
                    className={`w-full text-white font-bold py-5 rounded-2xl text-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95 disabled:bg-slate-600 ${gameType === GameType.ChallengeTrail ? 'bg-sky-600 hover:bg-sky-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                >
                    {gameType === GameType.ChallengeTrail ? 'BUKA TANTANGAN' : (isRolling ? 'MENGOCOK...' : 'KOCOK DADU')}
                </button>
            </div>
        )}

        <div className="w-full mt-8 pt-4 border-t border-slate-700/50 flex justify-between px-2">
            <button onClick={onGoHome} className="text-slate-500 text-xs font-bold hover:text-white uppercase tracking-widest">Utama</button>
            <button onClick={onReset} className="text-slate-500 text-xs font-bold hover:text-white uppercase tracking-widest">Reset</button>
        </div>
      </div>
    </div>
  );
};


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
  const isQuestionTime = pendingQuestion !== null;

  return (
    <div className="w-full bg-slate-800 text-slate-200 p-4 sm:p-6 rounded-2xl shadow-2xl flex flex-col justify-between h-full border-4 border-slate-900/50">
      <div>
        <h2 className="text-3xl font-bold text-yellow-300 mb-4 font-caveat text-center">
            {gameType === GameType.ChallengeTrail ? 'Jalur Prestasi' : 'Status Pemain'}
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
                <p className="text-sm text-slate-400">Level: {player.position}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col items-center mt-6">
        {isQuestionTime ? (
            <div className="w-full text-center">
                <div className="mb-4 p-4 bg-slate-700 border-l-4 border-yellow-400 text-yellow-200 rounded-r-lg text-left">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Tantangan Level {currentPlayer.position}</h3>
                    <p className="mt-1 font-caveat text-2xl text-white">{pendingQuestion}</p>
                </div>
                <div className="w-full space-y-3">
                     <button
                        onClick={onAnswerCorrect}
                        className="w-full bg-emerald-500 text-white font-bold py-3 rounded-lg text-lg shadow-md hover:bg-emerald-600"
                    >
                        {gameType === GameType.ChallengeTrail ? 'Lanjut ke Level Berikutnya' : 'Jawaban Benar'}
                    </button>
                    <button
                        onClick={onAnswerIncorrect}
                        className="w-full bg-red-600 text-white font-bold py-3 rounded-lg text-lg shadow-md hover:bg-red-700"
                    >
                        {gameType === GameType.ChallengeTrail ? 'Coba Lagi Nanti' : 'Jawaban Salah (Lewati)'}
                    </button>
                </div>
            </div>
        ) : (
            <>
                {gameType === GameType.SnakesLadders && <Dice result={diceResult} isRolling={isRolling} />}
                <button
                onClick={onRollDice}
                disabled={!canRoll || isRolling}
                className={`mt-4 w-full text-white font-bold py-4 rounded-lg text-xl shadow-md transition-all transform hover:scale-105 disabled:bg-slate-500 ${gameType === GameType.ChallengeTrail ? 'bg-sky-500 hover:bg-sky-600' : 'bg-teal-500 hover:bg-teal-600'}`}
                >
                {gameType === GameType.ChallengeTrail ? 'Buka Tantangan' : (isRolling ? 'Melempar...' : 'Lemparkan Dadu')}
                </button>
            </>
        )}
        <div className="w-full mt-6 pt-4 border-t border-slate-700/50 space-y-2">
            <button onClick={onGoHome} className="w-full text-sky-400 font-semibold py-1 rounded-lg">Menu Utama</button>
            <button onClick={onReset} className="w-full text-orange-400 font-semibold py-1 rounded-lg">Reset Game</button>
        </div>
      </div>
    </div>
  );
};

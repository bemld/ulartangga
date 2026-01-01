import React, { useState, useCallback, useEffect } from 'react';
import { GameStage, Player, BoardActivities, SnakeOrLadder, ActivityType, VisualSettings } from '../types';
import { BOARD_SIZE } from '../constants';
import { SetupScreen } from './SetupScreen';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { ActivityModal } from './ActivityModal';
import { VictoryScreen } from './VictoryScreen';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

interface SnakeLadderGameProps {
  visualSettings: VisualSettings;
  onBackToMenu: () => void;
}

export const SnakeLadderGame: React.FC<SnakeLadderGameProps> = ({ visualSettings, onBackToMenu }) => {
  // Internal stage for this specific game (Setup -> Playing -> Finished)
  const [internalStage, setInternalStage] = useState<GameStage>(GameStage.Setup);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [activities, setActivities] = useState<BoardActivities>({});
  const [snakes, setSnakes] = useState<SnakeOrLadder[]>([]);
  const [ladders, setLadders] = useState<SnakeOrLadder[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceResult, setDiceResult] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [activeActivity, setActiveActivity] = useState<{ square: number; content: string } | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [canRoll, setCanRoll] = useState(true);

  // New states for cognitive mode
  const [activityType, setActivityType] = useState<ActivityType>('psychomotor');
  const [pendingQuestions, setPendingQuestions] = useState<Record<number, string | null>>({});

  useEffect(() => {
    if (internalStage === GameStage.Playing || internalStage === GameStage.Finished) {
      document.body.classList.add('game-active');
    } else {
      document.body.classList.remove('game-active');
    }
    return () => {
      document.body.classList.remove('game-active');
    };
  }, [internalStage]);

  const handleStartGame = useCallback((
    newPlayers: Player[],
    newActivities: BoardActivities,
    newSnakes: SnakeOrLadder[],
    newLadders: SnakeOrLadder[],
    newActivityType: ActivityType,
  ) => {
    setPlayers(newPlayers);
    setActivities(newActivities);
    setSnakes(newSnakes);
    setLadders(newLadders);
    setActivityType(newActivityType);
    setCurrentPlayerIndex(0);
    setDiceResult(1);
    setIsRolling(false);
    setActiveActivity(null);
    setWinner(null);
    setCanRoll(true);
    setPendingQuestions({});
    setInternalStage(GameStage.Playing);
  }, []);

  const handleResetGame = useCallback(() => {
    setInternalStage(GameStage.Setup);
  }, []);
  
  // Reset internal state but stay in Setup mode or go back via prop
  const handleNewGame = useCallback(() => {
     // If user wants to "Go Home" from victory screen, we use the parent prop
     onBackToMenu();
  }, [onBackToMenu]);

  const movePlayerAlongPath = async (path: number[], playerIndex: number) => {
    for (const position of path) {
      setPlayers(currentPlayers => {
          const newPlayers = [...currentPlayers];
          if (newPlayers[playerIndex]) {
              newPlayers[playerIndex] = { ...newPlayers[playerIndex], position };
          }
          return newPlayers;
      });
      await delay(300); 
    }
  };

  const handleRollDice = useCallback(async () => {
    if (!canRoll || isRolling) return;

    setCanRoll(false);
    setIsRolling(true);
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceResult(roll);

    await delay(700);
    setIsRolling(false);
    
    const currentPlayer = players[currentPlayerIndex];
    const startPosition = currentPlayer.position;
    const tempPosition = startPosition + roll;

    const path: number[] = [];
    let landPosition: number;

    if (tempPosition > BOARD_SIZE) {
        landPosition = BOARD_SIZE - (tempPosition - BOARD_SIZE);
        for (let i = startPosition + 1; i <= BOARD_SIZE; i++) {
            path.push(i);
        }
        for (let i = BOARD_SIZE - 1; i >= landPosition; i--) {
            path.push(i);
        }
    } else {
        landPosition = tempPosition;
        for (let i = startPosition + 1; i <= landPosition; i++) {
            path.push(i);
        }
    }
    
    if (path.length > 0) {
        await movePlayerAlongPath(path, currentPlayerIndex);
    }

    if (landPosition === BOARD_SIZE) {
        await delay(500);
        setWinner(players[currentPlayerIndex]);
        setInternalStage(GameStage.Finished);
        return;
    }

    let finalPosition = landPosition;
    const ladder = ladders.find(l => l.start === landPosition);
    const snake = snakes.find(s => s.start === landPosition);

    if (ladder) {
        finalPosition = ladder.end;
    } else if (snake) {
        finalPosition = snake.end;
    }
    
    if (finalPosition !== landPosition) {
        await delay(200);
        setPlayers(currentPlayers => {
            const newPlayers = [...currentPlayers];
            if (newPlayers[currentPlayerIndex]) {
                newPlayers[currentPlayerIndex].position = finalPosition;
            }
            return newPlayers;
        });
        await delay(1000);
    }
    
    // --- Activity & Turn Logic ---
    const activityContent = activities[finalPosition];
    if (activityContent) {
        setActiveActivity({ square: finalPosition, content: activityContent });
        if (activityType === 'cognitive') {
            setPendingQuestions(prev => ({ ...prev, [currentPlayer.id]: activityContent }));
        }
    }

    // --- Turn Progression Logic ---
    if (activityType === 'cognitive') {
        setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
        setCanRoll(true);
    } else { 
        if (!activityContent) {
            setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
            setCanRoll(true);
        }
    }

  }, [canRoll, isRolling, players, currentPlayerIndex, activities, ladders, snakes, activityType]);

  const handleCloseModal = () => {
    setActiveActivity(null);
    if (activityType === 'psychomotor') {
        setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
        setCanRoll(true);
    }
  };

  const handleAnswerCorrect = useCallback(() => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;
    setPendingQuestions(prev => ({ ...prev, [currentPlayer.id]: null }));
    setCanRoll(true);
  }, [players, currentPlayerIndex]);
  
  const handleAnswerIncorrect = useCallback(() => {
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
    setCanRoll(true); 
  }, [players.length]);


  // RENDER LOGIC BASED ON INTERNAL STAGE

  if (internalStage === GameStage.Setup) {
    return <SetupScreen onStartGame={handleStartGame} visualSettings={visualSettings} onBack={onBackToMenu} />;
  }

  if (internalStage === GameStage.Finished && winner) {
    return (
      <VictoryScreen 
        winner={winner}
        onNewGame={handleNewGame} // This goes back to menu
        onResetGame={handleResetGame} // This goes back to setup
      />
    );
  }

  // Playing Stage
  const currentPlayer = players.length > 0 ? players[currentPlayerIndex] : null;
  const pendingQuestion = currentPlayer ? pendingQuestions[currentPlayer.id] : null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center md:items-start justify-center p-4 sm:p-6 lg:p-8 gap-6 md:gap-8">
      <main className="w-full flex-grow">
        <GameBoard
          players={players}
          snakes={snakes}
          ladders={ladders}
          currentPlayerId={currentPlayer?.id ?? -1}
          visualSettings={visualSettings}
        />
      </main>
      <aside className="w-full md:w-80 lg:w-96 flex-shrink-0">
        {currentPlayer && (
          <GameControls
            players={players}
            currentPlayer={currentPlayer}
            onRollDice={handleRollDice}
            onReset={handleResetGame}
            onGoHome={onBackToMenu}
            diceResult={diceResult}
            isRolling={isRolling}
            canRoll={canRoll}
            activityType={activityType}
            pendingQuestion={pendingQuestion}
            onAnswerCorrect={handleAnswerCorrect}
            onAnswerIncorrect={handleAnswerIncorrect}
          />
        )}
      </aside>
      {activeActivity && (
        <ActivityModal
          activity={activeActivity.content}
          squareNumber={activeActivity.square}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};
import React, { useState, useCallback, useEffect } from 'react';
import { GameStage, Player, BoardActivities, SnakeOrLadder, ActivityType, VisualSettings } from './types';
import { BOARD_SIZE } from './constants';
import { HomeScreen } from './components/HomeScreen';
import { SetupScreen } from './components/SetupScreen';
import { GameBoard } from './components/GameBoard';
import { GameControls } from './components/GameControls';
import { ActivityModal } from './components/ActivityModal';
import { DesignStudio } from './components/DesignStudio';
import { VictoryScreen } from './components/VictoryScreen';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const VISUAL_SETTINGS_KEY = 'tanggaIlmuVisualSettings';

const initialVisualSettings: VisualSettings = {
  mainBackground: '/assets/bg1.jpg',
  containerBackground: '/assets/container1.jpg',
};

export const App: React.FC = () => {
  const [gameStage, setGameStage] = useState<GameStage>(GameStage.Home);
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
  
  // Visual settings state
  const [visualSettings, setVisualSettings] = useState<VisualSettings>(initialVisualSettings);

  // Load and apply visual settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(VISUAL_SETTINGS_KEY);
      if (savedSettings) {
        setVisualSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Failed to load visual settings from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (visualSettings.mainBackground) {
      document.body.style.backgroundImage = `url(${visualSettings.mainBackground})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = ''; // Revert to CSS default
      document.body.classList.add('bg-stone-200'); // Ensure fallback
    }
  }, [visualSettings.mainBackground]);

  useEffect(() => {
    if (gameStage === GameStage.Playing || gameStage === GameStage.Finished) {
      document.body.classList.add('game-active');
    } else {
      document.body.classList.remove('game-active');
    }
    return () => {
      document.body.classList.remove('game-active');
    };
  }, [gameStage]);
  
  const handleSaveSettings = useCallback((newSettings: VisualSettings) => {
    setVisualSettings(newSettings);
    try {
      localStorage.setItem(VISUAL_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save visual settings to localStorage", error);
    }
    setGameStage(GameStage.Home);
  }, []);

  const handleGoToSetup = useCallback(() => {
    setGameStage(GameStage.Setup);
  }, []);

  const handleGoToDesign = useCallback(() => {
    setGameStage(GameStage.Design);
  }, []);

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
    setGameStage(GameStage.Playing);
  }, []);

  const handleResetGame = useCallback(() => {
    setGameStage(GameStage.Setup);
  }, []);
  
  const handleNewGame = useCallback(() => {
    setGameStage(GameStage.Home);
    setPlayers([]);
    setActivities({});
    setSnakes([]);
    setLadders([]);
    setPendingQuestions({});
  }, []);

  const movePlayerAlongPath = async (path: number[], playerIndex: number) => {
    for (const position of path) {
      setPlayers(currentPlayers => {
          const newPlayers = [...currentPlayers];
          if (newPlayers[playerIndex]) {
              newPlayers[playerIndex] = { ...newPlayers[playerIndex], position };
          }
          return newPlayers;
      });
      await delay(300); // Corresponds to duration-300 in PlayerPawn.tsx
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
        await delay(500); // Short pause before victory screen
        setWinner(players[currentPlayerIndex]);
        setGameStage(GameStage.Finished);
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
        await delay(1000); // Wait for the longer slide animation
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
        // In cognitive mode, turn always passes to the next player after a roll.
        setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
        setCanRoll(true);
    } else { // Psychomotor mode
        // In psychomotor mode, turn only passes if there's no activity.
        // If there is an activity, turn passes when modal is closed.
        if (!activityContent) {
            setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
            setCanRoll(true);
        }
    }

  }, [canRoll, isRolling, players, currentPlayerIndex, activities, ladders, snakes, activityType]);

  const handleCloseModal = () => {
    setActiveActivity(null);
    if (activityType === 'psychomotor') {
        // Original behavior for psychomotor: advance turn after closing modal.
        setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
        setCanRoll(true);
    }
    // For cognitive mode, do nothing. The turn has already advanced in handleRollDice.
  };

  // --- New handlers for cognitive mode answers ---
  const handleAnswerCorrect = useCallback(() => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;

    // Clear the pending question for the current player
    setPendingQuestions(prev => ({ ...prev, [currentPlayer.id]: null }));
    
    // Allow the player to roll immediately. Do not advance the turn.
    setCanRoll(true);
  }, [players, currentPlayerIndex]);
  
  const handleAnswerIncorrect = useCallback(() => {
    // Player is stuck with their question. Turn passes to the next player.
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
    setCanRoll(true); // The *next* player can now act.
  }, [players.length]);


  if (gameStage === GameStage.Home) {
    return <HomeScreen onStartSetup={handleGoToSetup} onStartDesign={handleGoToDesign} visualSettings={visualSettings} />;
  }
  
  if (gameStage === GameStage.Design) {
    return <DesignStudio initialSettings={visualSettings} onSave={handleSaveSettings} onBack={() => setGameStage(GameStage.Home)} />;
  }

  if (gameStage === GameStage.Setup) {
    return <SetupScreen onStartGame={handleStartGame} visualSettings={visualSettings} onBack={handleNewGame} />;
  }

  if (gameStage === GameStage.Finished && winner) {
    return (
      <VictoryScreen 
        winner={winner}
        onNewGame={handleNewGame}
        onResetGame={handleResetGame}
      />
    );
  }

  const currentPlayer = players.length > 0 ? players[currentPlayerIndex] : null;
  const pendingQuestion = currentPlayer ? pendingQuestions[currentPlayer.id] : null;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col sm:flex-row">
      <main className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        <GameBoard
          players={players}
          snakes={snakes}
          ladders={ladders}
          currentPlayerId={currentPlayer?.id ?? -1}
          visualSettings={visualSettings}
        />
      </main>
      <aside className="w-full sm:w-80 lg:w-96 flex-shrink-0 h-auto sm:h-full">
        {currentPlayer && (
          <GameControls
            players={players}
            currentPlayer={currentPlayer}
            onRollDice={handleRollDice}
            onReset={handleResetGame}
            onGoHome={handleNewGame}
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
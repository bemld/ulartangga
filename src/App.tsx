
import React, { useState, useCallback, useEffect } from 'react';
import { GameStage, Player, BoardActivities, SnakeOrLadder, ActivityType, VisualSettings, GameType } from './types';
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
  mainBackground: null,
  containerBackground: null,
};

export const App: React.FC = () => {
  const [gameStage, setGameStage] = useState<GameStage>(GameStage.Home);
  const [gameType, setGameType] = useState<GameType>(GameType.SnakesLadders);
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

  const [activityType, setActivityType] = useState<ActivityType>('psychomotor');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  
  const [visualSettings, setVisualSettings] = useState<VisualSettings>(initialVisualSettings);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(VISUAL_SETTINGS_KEY);
      if (savedSettings) setVisualSettings(JSON.parse(savedSettings));
    } catch (error) {
      console.error("Failed to load visual settings", error);
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
      document.body.classList.add('bg-stone-200');
    }
  }, [visualSettings.mainBackground]);

  useEffect(() => {
    if (gameStage === GameStage.Playing || gameStage === GameStage.Finished) {
      document.body.classList.add('game-active');
    } else {
      document.body.classList.remove('game-active');
    }
  }, [gameStage]);
  
  const handleSaveSettings = useCallback((newSettings: VisualSettings) => {
    setVisualSettings(newSettings);
    try {
      localStorage.setItem(VISUAL_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save settings", error);
    }
    setGameStage(GameStage.Home);
  }, []);

  const handleStartGame = useCallback((
    newPlayers: Player[],
    newActivities: BoardActivities,
    newSnakes: SnakeOrLadder[],
    newLadders: SnakeOrLadder[],
    newActivityType: ActivityType,
    selectedGameType: GameType
  ) => {
    setPlayers(newPlayers);
    setActivities(newActivities);
    setSnakes(newSnakes);
    setLadders(newLadders);
    setActivityType(newActivityType);
    setGameType(selectedGameType);
    setCurrentPlayerIndex(0);
    setDiceResult(1);
    setIsRolling(false);
    setActiveActivity(null);
    setWinner(null);
    setCanRoll(true);
    setPendingQuestion(null);
    setGameStage(GameStage.Playing);
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
      await delay(300);
    }
  };

  const handleRollDice = useCallback(async () => {
    if (!canRoll || isRolling) return;

    setCanRoll(false);

    if (gameType === GameType.ChallengeTrail) {
      // Logic for Challenge Trail: Just show the question
      const currentPlayer = players[currentPlayerIndex];
      const activityContent = activities[currentPlayer.position];
      if (activityContent) {
          setPendingQuestion(activityContent);
      } else {
          // If no activity, just go to next group (should not happen with AI generation)
          setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
          setCanRoll(true);
      }
      return;
    }

    // --- MODE ULAR TANGGA KLASIK ---
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
        for (let i = startPosition + 1; i <= BOARD_SIZE; i++) path.push(i);
        for (let i = BOARD_SIZE - 1; i >= landPosition; i--) path.push(i);
    } else {
        landPosition = tempPosition;
        for (let i = startPosition + 1; i <= landPosition; i++) path.push(i);
    }
    
    if (path.length > 0) await movePlayerAlongPath(path, currentPlayerIndex);

    if (landPosition === BOARD_SIZE) {
        setWinner(players[currentPlayerIndex]);
        setGameStage(GameStage.Finished);
        return;
    }

    // Cek Ular dan Tangga
    let finalPosition = landPosition;
    const ladder = ladders.find(l => l.start === landPosition);
    const snake = snakes.find(s => s.start === landPosition);

    if (ladder) finalPosition = ladder.end;
    else if (snake) finalPosition = snake.end;
    
    if (finalPosition !== landPosition) {
        await delay(500);
        setPlayers(currentPlayers => {
            const newPlayers = [...currentPlayers];
            if (newPlayers[currentPlayerIndex]) newPlayers[currentPlayerIndex].position = finalPosition;
            return newPlayers;
        });
        await delay(500);
    }
    
    // Cek Aktivitas
    const activityContent = activities[finalPosition];
    if (activityContent) {
        setPendingQuestion(activityContent);
    } else {
        // Pindah giliran jika tidak ada aktivitas
        setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
        setCanRoll(true);
    }
  }, [canRoll, isRolling, players, currentPlayerIndex, activities, ladders, snakes, gameType]);

  const handleAnswerCorrect = useCallback(async () => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;

    setPendingQuestion(null);
    
    if (gameType === GameType.ChallengeTrail) {
      const targetPos = currentPlayer.position + 1;
      if (targetPos <= 9) {
        await movePlayerAlongPath([targetPos], currentPlayerIndex);
        setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
        setCanRoll(true);
      } else {
        setWinner(currentPlayer);
        setGameStage(GameStage.Finished);
      }
    } else {
      // Ular Tangga: Berhasil menjawab berarti tetap di posisi sekarang
      setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
      setCanRoll(true);
    }
  }, [players, currentPlayerIndex, gameType]);
  
  const handleAnswerIncorrect = useCallback(() => {
    setPendingQuestion(null);
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
    setCanRoll(true);
    // Jika salah di Ular Tangga, mungkin bisa dibuat mundur, tapi defaultnya tetap di tempat
  }, [players.length]);

  if (gameStage === GameStage.Home) return <HomeScreen onStartSetup={() => setGameStage(GameStage.Setup)} onStartDesign={() => setGameStage(GameStage.Design)} visualSettings={visualSettings} />;
  if (gameStage === GameStage.Design) return <DesignStudio initialSettings={visualSettings} onSave={handleSaveSettings} onBack={() => setGameStage(GameStage.Home)} />;
  if (gameStage === GameStage.Setup) return <SetupScreen onStartGame={handleStartGame} visualSettings={visualSettings} onBack={() => setGameStage(GameStage.Home)} />;
  if (gameStage === GameStage.Finished && winner) return <VictoryScreen winner={winner} onNewGame={() => setGameStage(GameStage.Home)} onResetGame={() => setGameStage(GameStage.Setup)} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center md:items-start justify-center p-4 gap-6">
      <main className="w-full flex-grow">
        <GameBoard
          gameType={gameType}
          players={players}
          snakes={snakes}
          ladders={ladders}
          currentPlayerId={players[currentPlayerIndex]?.id ?? -1}
          visualSettings={visualSettings}
        />
      </main>
      <aside className="w-full md:w-80 lg:w-96 flex-shrink-0">
        {players[currentPlayerIndex] && (
          <GameControls
            gameType={gameType}
            players={players}
            currentPlayer={players[currentPlayerIndex]}
            onRollDice={handleRollDice}
            onReset={() => setGameStage(GameStage.Setup)}
            onGoHome={() => setGameStage(GameStage.Home)}
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
    </div>
  );
};

export enum GameStage {
  Home = 'home',
  Setup = 'setup',
  Playing = 'playing',
  Finished = 'finished',
  Design = 'design',
}

export interface Player {
  id: number;
  name: string;
  position: number; // Dalam Level Up, ini berarti Level saat ini (1-9)
  color: string;
}

export interface SnakeOrLadder {
  start: number;
  end: number;
}

export type BoardActivities = Record<number, string>;

export type ActivityType = 'cognitive' | 'psychomotor';

export interface VisualSettings {
  mainBackground: string | null;
  containerBackground: string | null;
}

// --- Tipe Baru untuk Level Up Game ---

export interface LevelTask {
  level: number;
  difficulty: string;
  content: string;
}

export type LevelContent = Record<number, LevelTask>;
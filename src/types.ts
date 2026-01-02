
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
  members?: string[]; // Optional: List of student names in this group
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

// --- Tipe untuk Manajemen Kelas ---

export interface Student {
  id: string;
  name: string;
  gender: 'L' | 'P';
}

export interface ClassData {
  id: string;
  name: string;
  students: Student[];
  createdAt?: any;
}
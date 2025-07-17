export enum GameStage {
  Home = 'home',
  Setup = 'setup',
  Playing = 'playing',
  Finished = 'finished',
  Design = 'design', // Halaman baru untuk admin/desainer
}

export interface Player {
  id: number;
  name: string;
  position: number;
  color: string;
}

export interface SnakeOrLadder {
  start: number;
  end: number;
  imageUrl?: string; // To store the generated snake image
}

export type BoardActivities = Record<number, string>;

export type ActivityType = 'cognitive' | 'psychomotor';

export interface VisualSettings {
  mainBackground: string | null;
  containerBackground: string | null;
}
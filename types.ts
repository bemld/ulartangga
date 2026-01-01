
export enum GameStage {
  Home = 'home',
  Setup = 'setup',
  Playing = 'playing',
  Finished = 'finished',
  Design = 'design',
}

export enum GameType {
  SnakesLadders = 'snakes_ladders',
  ChallengeTrail = 'challenge_trail',
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
  imageUrl?: string;
}

export type BoardActivities = Record<number, string>;

export type ActivityType = 'cognitive' | 'psychomotor';

export interface VisualSettings {
  mainBackground: string | null;
  containerBackground: string | null;
}

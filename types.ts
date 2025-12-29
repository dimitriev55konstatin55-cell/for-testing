
export type CandyColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export interface Candy {
  id: string;
  color: CandyColor;
}

export interface TargetFruit {
  color: CandyColor;
  current: number;
  target: number;
}

export interface Achievement {
  id: string;
  groupId: string;
  level: number;
  title: string;
  titleEn: string;       // Added English title
  description: string;
  descriptionEn: string; // Added English description
  unlocked: boolean;
  claimed: boolean;
  requirement: number;
  current: number;
  reward: number;
}

export interface Inventory {
  smallPack: number;
  mediumPack: number;
  largePack: number;
  magicSnowflake: number;
  santaBag: number;
}

export interface AppSettings {
  maxDailyMinutes: number | null;
  soundEnabled: boolean;
  musicEnabled: boolean; 
  hintsEnabled: boolean;
  language: 'ru' | 'en';
}

export interface GameStats {
  red: number;
  blue: number;
  green: number;
  yellow: number;
  purple: number;
  orange: number;
}

export type LevelType = 'score' | 'collect';

export interface GameState {
  board: (Candy | null)[];
  score: number;
  moves: number;
  level: number;
  levelType: LevelType;
  objective: { ru: string, en: string } | string; // Updated to support bilingual
  storySegment: { ru: string, en: string } | string; // Updated to support bilingual
  targetScore: number;
  targetFruits: TargetFruit[];
  jars: Record<CandyColor, number>;
  isProcessing: boolean;
  screen: 'menu' | 'game' | 'achievements' | 'story' | 'loading' | 'map' | 'shop' | 'settings' | 'blocked';
  totalScore: number;
  totalJarsUsed: number;
  totalMoves: number; 
  maxCombo: number;
  tick: number;
  coinsFromLevels: number;
  lastLevelReward: number;
  inventory: Inventory;
  tutorialSeen: boolean;
  settings: AppSettings;
  minutesPlayedToday: number;
  lastPlayedDate: string;
  stats: GameStats; 
}

export type PieceColor = "w" | "b";
export type PieceType = "k" | "q" | "r" | "b" | "n" | "p";
export type Square = string; // e.g. "e4"

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  square: Square;
}

export interface ChessPosition {
  fen: string;
  pieces: ChessPiece[];
  turn: PieceColor;
}

export type LessonCategory =
  | "basics"
  | "tactics"
  | "openings"
  | "endgames"
  | "checkmates"
  | "strategy"
  | "defense"
  | "attacks"
  | "pawns"
  | "middlegame";

export type LessonDifficulty =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "master";

export type PuzzleType =
  | "findBestMove"
  | "mateInOne"
  | "mateInTwo"
  | "mateInThree"
  | "capturePiece"
  | "avoidBlunder";

export interface ChessLesson {
  id: string;
  unitId: number;
  lessonNumber: number;
  title: string;
  description: string;
  category: LessonCategory;
  difficulty: LessonDifficulty;
  puzzleType: PuzzleType;
  fen: string;
  solutionMoves: string[]; // UCI moves e.g. ["e2e4", "e7e5"]
  hints: string[];
  explanation: string;
  xpReward: number;
  gemReward: number;
  isBonus: boolean;
}

export type UnitStatus = "locked" | "active" | "completed";

export interface SkillUnit {
  id: number;
  title: string;
  description: string;
  category: LessonCategory;
  icon: string;
  color: string;
  lessonCount: number;
  status: UnitStatus;
}

export interface UserProgress {
  completedLessons: string[];
  currentUnitId: number;
  currentLessonIndex: number;
  totalXP: number;
  level: number;
  gems: number;
  hearts: number;
  maxHearts: number;
  streakDays: number;
  lastActiveDate: string | null;
  streakFreezes: number;
  chestSlots: number;
  chestTimerStarts: number[];
  achievements: string[];
  dailyGoal: number;
  dailyProgress: number;
  dailyGoalMet: boolean;
  leagueScore: number;
  leagueName: string;
  shieldEnabled: boolean;
  blockedApps: string[];
  puzzleStreak: number;
  longestStreak: number;
  totalLessonsCompleted: number;
  totalPuzzlesSolved: number;
  perfectLessons: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "lessons" | "mastery" | "special";
  requirement: number;
  gemReward: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  type: "streakFreeze" | "heartRefill" | "doubleXP" | "chestBoost" | "cosmetic";
  effect: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  avatarIndex: number;
  isPlayer: boolean;
}

export const LEAGUE_NAMES = [
  "Bronze",
  "Silver",
  "Gold",
  "Sapphire",
  "Ruby",
  "Emerald",
  "Amethyst",
  "Diamond",
  "Grandmaster",
] as const;

export const XP_PER_LEVEL = 500;
export const DAILY_GOAL_OPTIONS = [1, 2, 3, 5, 10];
export const MAX_HEARTS = 5;
export const HEART_REFILL_MINUTES = 30;
export const CHEST_UNLOCK_HOURS = 4;
export const MAX_CHEST_SLOTS = 2;

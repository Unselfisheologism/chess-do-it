import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProgress } from "../types";
import { MAX_HEARTS, DAILY_GOAL_OPTIONS } from "../types";

const STORAGE_KEYS = {
  PROGRESS: "@chessquest_progress",
  BLOCKED_APPS: "@chessquest_blocked_apps",
  SHIELD_ENABLED: "@chessquest_shield_enabled",
} as const;

export const DEFAULT_PROGRESS: UserProgress = {
  completedLessons: [],
  currentUnitId: 1,
  currentLessonIndex: 0,
  totalXP: 0,
  level: 1,
  gems: 500,
  hearts: MAX_HEARTS,
  maxHearts: MAX_HEARTS,
  streakDays: 0,
  lastActiveDate: null,
  streakFreezes: 0,
  chestSlots: 0,
  chestTimerStarts: [],
  achievements: [],
  dailyGoal: DAILY_GOAL_OPTIONS[2], // 3 lessons default
  dailyProgress: 0,
  dailyGoalMet: false,
  leagueScore: 0,
  leagueName: "Bronze",
  shieldEnabled: true,
  blockedApps: [
    "Instagram",
    "TikTok",
    "Facebook",
    "X (Twitter)",
    "Snapchat",
    "YouTube",
    "Reddit",
    "Discord",
  ],
  puzzleStreak: 0,
  longestStreak: 0,
  totalLessonsCompleted: 0,
  totalPuzzlesSolved: 0,
  perfectLessons: 0,
};

export async function loadProgress(): Promise<UserProgress> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    return { ...DEFAULT_PROGRESS, ...parsed };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export async function saveProgress(progress: UserProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  } catch (e) {
    console.warn("Failed to save progress:", e);
  }
}

export function getLevel(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

export function getXPForLevel(level: number): number {
  return (level - 1) * 500;
}

export function getXPProgress(xp: number): number {
  return (xp % 500) / 500;
}

export function getLeagueFromScore(score: number): string {
  const tiers = [
    { min: 0, name: "Bronze" },
    { min: 1000, name: "Silver" },
    { min: 3000, name: "Gold" },
    { min: 6000, name: "Sapphire" },
    { min: 10000, name: "Ruby" },
    { min: 15000, name: "Emerald" },
    { min: 22000, name: "Amethyst" },
    { min: 30000, name: "Diamond" },
    { min: 50000, name: "Grandmaster" },
  ];
  let league = "Bronze";
  for (const tier of tiers) {
    if (score >= tier.min) league = tier.name;
  }
  return league;
}

export function checkDailyReset(progress: UserProgress): UserProgress {
  const today = new Date().toISOString().split("T")[0];
  if (progress.lastActiveDate === today) return progress;

  if (progress.lastActiveDate) {
    const lastDate = new Date(progress.lastActiveDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return progress;
    if (diffDays > 1) {
      // Streak broken
      return {
        ...progress,
        lastActiveDate: today,
        dailyProgress: 0,
        dailyGoalMet: false,
        streakDays: 0,
        puzzleStreak: 0,
      };
    }
  }

  // New day — check if yesterday's goal was met
  const wasMet = progress.dailyGoalMet;
  const newStreak = wasMet ? progress.streakDays + 1 : 0;

  if (newStreak > progress.longestStreak) {
    progress.longestStreak = newStreak;
  }

  return {
    ...progress,
    lastActiveDate: today,
    dailyProgress: 0,
    dailyGoalMet: false,
    streakDays: newStreak,
  };
}

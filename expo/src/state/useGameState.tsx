import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  UserProgress,
  Achievement,
  ShopItem,
  ChessLesson,
  SkillUnit,
  LeaderboardEntry,
} from "../types";
import { MAX_HEARTS, CHEST_UNLOCK_HOURS, MAX_CHEST_SLOTS } from "../types";
import {
  DEFAULT_PROGRESS,
  loadProgress,
  saveProgress,
  getLevel,
  getXPForLevel,
  getXPProgress,
  getLeagueFromScore,
  checkDailyReset,
} from "../utils/storage";
import { getAllLessons, getUnits, getLessonsByUnit } from "../data/lessons";
import { ACHIEVEMENTS } from "../data/achievements";
import { SHOP_ITEMS } from "../data/shopItems";

export interface GameState {
  progress: UserProgress;
  isLoading: boolean;
  // Actions
  completeLesson: (lessonId: string, perfect: boolean) => void;
  completePuzzle: () => void;
  spendGems: (amount: number) => boolean;
  earnGems: (amount: number) => void;
  loseHeart: () => boolean;
  refillHearts: () => void;
  useStreakFreeze: () => boolean;
  openChest: () => { xp: number; gems: number } | null;
  setDailyGoal: (goal: number) => void;
  toggleShield: () => void;
  addBlockedApp: (app: string) => void;
  removeBlockedApp: (app: string) => void;
  resetProgress: () => void;
  // Computed
  level: number;
  xpProgress: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  leagueName: string;
  units: SkillUnit[];
  allLessons: ChessLesson[];
  currentUnitLessons: ChessLesson[];
  achievements: Achievement[];
  earnedAchievements: Achievement[];
  shopItems: ShopItem[];
  leaderboard: LeaderboardEntry[];
}

export const [GameProvider, useGameState] = createContextHook((): GameState => {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef(progress);

  // Persist with debounce
  const persist = useCallback((p: UserProgress) => {
    progressRef.current = p;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProgress(p);
    }, 500);
  }, []);

  // Load on mount
  useEffect(() => {
    loadProgress().then((p) => {
      const updated = checkDailyReset(p);
      const units = getUnits();
      // Set first unit active
      if (units.length > 0 && units[0].status === "locked") {
        units[0].status = "active";
      }
      setProgress(updated);
      progressRef.current = updated;
      setIsLoading(false);
    });
  }, []);

  // Auto-refill hearts
  useEffect(() => {
    if (progress.hearts >= MAX_HEARTS) return;
    const interval = setInterval(
      () => {
        const p = progressRef.current;
        if (p.hearts < p.maxHearts) {
          const updated = { ...p, hearts: Math.min(p.hearts + 1, p.maxHearts) };
          setProgress(updated);
          persist(updated);
        }
      },
      30 * 60 * 1000,
    ); // 30 min
    return () => clearInterval(interval);
  }, []);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveProgress(progressRef.current);
    };
  }, []);

  const completeLesson = useCallback(
    (lessonId: string, perfect: boolean) => {
      setProgress((prev) => {
        if (prev.completedLessons.includes(lessonId)) return prev;
        const xpEarned = perfect ? 25 : 15;
        const gemEarned = perfect ? 3 : 1;
        const newXP = prev.totalXP + xpEarned;
        const newLevel = getLevel(newXP);
        const newGems = prev.gems + gemEarned;
        const newDailyProgress = prev.dailyProgress + 1;
        const goalMet = newDailyProgress >= prev.dailyGoal;
        const newCompleted = [...prev.completedLessons, lessonId];
        const newTotal = prev.totalLessonsCompleted + 1;
        const newPerfect = perfect
          ? prev.perfectLessons + 1
          : prev.perfectLessons;

        // Check achievements
        const newAchievements = [...prev.achievements];
        for (const ach of ACHIEVEMENTS) {
          if (newAchievements.includes(ach.id)) continue;
          let earned = false;
          if (ach.id === "first_lesson") earned = newTotal >= 1;
          if (ach.id === "five_lessons") earned = newTotal >= 5;
          if (ach.id === "twenty_five") earned = newTotal >= 25;
          if (ach.id === "hundred") earned = newTotal >= 100;
          if (ach.id === "five_hundred") earned = newTotal >= 500;
          if (ach.id === "thousand") earned = newTotal >= 1000;
          if (ach.id === "streak_3") earned = prev.streakDays >= 3;
          if (ach.id === "streak_7") earned = prev.streakDays >= 7;
          if (ach.id === "streak_30") earned = prev.streakDays >= 30;
          if (ach.id === "perfect_10") earned = newPerfect >= 10;
          if (ach.id === "perfect_50") earned = newPerfect >= 50;
          if (ach.id === "level_5") earned = newLevel >= 5;
          if (ach.id === "level_10") earned = newLevel >= 10;
          if (ach.id === "level_25") earned = newLevel >= 25;
          if (ach.id === "level_50") earned = newLevel >= 50;
          if (ach.id === "gem_hoarder") earned = newGems >= 1000;
          if (ach.id === "daily_warrior") earned = goalMet;
          if (earned) newAchievements.push(ach.id);
        }

        // Update lesson progress
        const lessons = getAllLessons();
        const lessonIndex = lessons.findIndex((l) => l.id === lessonId);
        let newUnitId = prev.currentUnitId;
        let newLessonIndex = prev.currentLessonIndex;

        if (lessonIndex >= 0) {
          newLessonIndex = lessonIndex + 1;
          // Find which unit this lesson belongs to
          const lesson = lessons[lessonIndex];
          if (lesson) {
            newUnitId = lesson.unitId;
          }
        }

        const leagueScore = prev.leagueScore + xpEarned;

        const updated: UserProgress = {
          ...prev,
          completedLessons: newCompleted,
          totalXP: newXP,
          level: newLevel,
          gems: newGems,
          dailyProgress: newDailyProgress,
          dailyGoalMet: goalMet,
          currentLessonIndex: newLessonIndex,
          currentUnitId: newUnitId,
          achievements: newAchievements,
          leagueScore,
          leagueName: getLeagueFromScore(leagueScore),
          totalLessonsCompleted: newTotal,
          perfectLessons: newPerfect,
        };
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const completePuzzle = useCallback(() => {
    setProgress((prev) => {
      const xpEarned = 20;
      const newStreak = prev.puzzleStreak + 1;
      const updated: UserProgress = {
        ...prev,
        totalXP: prev.totalXP + xpEarned,
        level: getLevel(prev.totalXP + xpEarned),
        gems: prev.gems + 2,
        puzzleStreak: newStreak,
        totalPuzzlesSolved: prev.totalPuzzlesSolved + 1,
        leagueScore: prev.leagueScore + xpEarned,
        leagueName: getLeagueFromScore(prev.leagueScore + xpEarned),
      };
      persist(updated);
      return updated;
    });
  }, [persist]);

  const spendGems = useCallback(
    (amount: number): boolean => {
      if (progressRef.current.gems < amount) return false;
      setProgress((prev) => {
        const updated = { ...prev, gems: prev.gems - amount };
        persist(updated);
        return updated;
      });
      return true;
    },
    [persist],
  );

  const earnGems = useCallback(
    (amount: number) => {
      setProgress((prev) => {
        const updated = { ...prev, gems: prev.gems + amount };
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const loseHeart = useCallback((): boolean => {
    const p = progressRef.current;
    if (p.hearts <= 0) return false;
    setProgress((prev) => {
      const updated = { ...prev, hearts: prev.hearts - 1 };
      persist(updated);
      return updated;
    });
    return true;
  }, [persist]);

  const refillHearts = useCallback(() => {
    setProgress((prev) => {
      const updated = { ...prev, hearts: prev.maxHearts };
      persist(updated);
      return updated;
    });
  }, [persist]);

  const useStreakFreeze = useCallback((): boolean => {
    const p = progressRef.current;
    if (p.streakFreezes <= 0) return false;
    setProgress((prev) => {
      const updated = {
        ...prev,
        streakFreezes: prev.streakFreezes - 1,
        streakDays: prev.streakDays + 1,
      };
      persist(updated);
      return updated;
    });
    return true;
  }, [persist]);

  const openChest = useCallback((): { xp: number; gems: number } | null => {
    const p = progressRef.current;
    if (p.chestTimerStarts.length === 0) return null;
    const now = Date.now();
    const fourHours = CHEST_UNLOCK_HOURS * 60 * 60 * 1000;
    const readyIndex = p.chestTimerStarts.findIndex(
      (start) => now - start >= fourHours,
    );
    if (readyIndex === -1) return null;

    const xp = Math.floor(Math.random() * 30) + 10;
    const gems = Math.floor(Math.random() * 10) + 3;
    setProgress((prev) => {
      const newStarts = [...prev.chestTimerStarts];
      newStarts.splice(readyIndex, 1);
      const updated = {
        ...prev,
        chestTimerStarts: newStarts,
        totalXP: prev.totalXP + xp,
        level: getLevel(prev.totalXP + xp),
        gems: prev.gems + gems,
      };
      persist(updated);
      return updated;
    });
    return { xp, gems };
  }, [persist]);

  const setDailyGoal = useCallback(
    (goal: number) => {
      setProgress((prev) => {
        const updated = { ...prev, dailyGoal: goal };
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const toggleShield = useCallback(() => {
    setProgress((prev) => {
      const updated = { ...prev, shieldEnabled: !prev.shieldEnabled };
      persist(updated);
      return updated;
    });
  }, [persist]);

  const addBlockedApp = useCallback(
    (app: string) => {
      setProgress((prev) => {
        if (prev.blockedApps.includes(app)) return prev;
        const updated = { ...prev, blockedApps: [...prev.blockedApps, app] };
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const removeBlockedApp = useCallback(
    (app: string) => {
      setProgress((prev) => {
        const updated = {
          ...prev,
          blockedApps: prev.blockedApps.filter((a) => a !== app),
        };
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    persist(DEFAULT_PROGRESS);
  }, [persist]);

  // Computed values
  const level = getLevel(progress.totalXP);
  const xpProgress = getXPProgress(progress.totalXP);
  const xpForCurrentLevel = getXPForLevel(level);
  const xpForNextLevel = getXPForLevel(level + 1);
  const leagueName = getLeagueFromScore(progress.leagueScore);

  const units = getUnits().map((u) => ({
    ...u,
    status:
      u.id < progress.currentUnitId
        ? "completed"
        : u.id === progress.currentUnitId
          ? "active"
          : "locked",
  })) as SkillUnit[];

  const allLessons = getAllLessons();
  const currentUnitLessons = getLessonsByUnit(progress.currentUnitId);
  const earnedAchievements = ACHIEVEMENTS.filter((a) =>
    progress.achievements.includes(a.id),
  );

  // Generate local leaderboard
  const leaderboard: LeaderboardEntry[] = [
    {
      name: "You",
      score: progress.leagueScore,
      avatarIndex: 0,
      isPlayer: true,
    },
    {
      name: "MagnusFan42",
      score: progress.leagueScore + Math.floor(Math.random() * 500) + 50,
      avatarIndex: 1,
      isPlayer: false,
    },
    {
      name: "QueenSlayer",
      score: progress.leagueScore + Math.floor(Math.random() * 300) + 20,
      avatarIndex: 2,
      isPlayer: false,
    },
    {
      name: "PawnStar99",
      score: progress.leagueScore - Math.floor(Math.random() * 200) - 10,
      avatarIndex: 3,
      isPlayer: false,
    },
    {
      name: "CheckMatePro",
      score: progress.leagueScore + Math.floor(Math.random() * 400) + 30,
      avatarIndex: 4,
      isPlayer: false,
    },
    {
      name: "KnightRider",
      score: progress.leagueScore - Math.floor(Math.random() * 150) - 5,
      avatarIndex: 5,
      isPlayer: false,
    },
    {
      name: "BishopBlitz",
      score: progress.leagueScore + Math.floor(Math.random() * 250) + 40,
      avatarIndex: 6,
      isPlayer: false,
    },
    {
      name: "RookAndRoll",
      score: progress.leagueScore - Math.floor(Math.random() * 100) - 20,
      avatarIndex: 7,
      isPlayer: false,
    },
  ].sort((a, b) => b.score - a.score);

  return {
    progress,
    isLoading,
    completeLesson,
    completePuzzle,
    spendGems,
    earnGems,
    loseHeart,
    refillHearts,
    useStreakFreeze,
    openChest,
    setDailyGoal,
    toggleShield,
    addBlockedApp,
    removeBlockedApp,
    resetProgress,
    level,
    xpProgress,
    xpForCurrentLevel,
    xpForNextLevel,
    leagueName,
    units,
    allLessons,
    currentUnitLessons,
    achievements: ACHIEVEMENTS,
    earnedAchievements,
    shopItems: SHOP_ITEMS,
    leaderboard,
  };
});

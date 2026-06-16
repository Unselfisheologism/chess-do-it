import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Flame,
  Zap,
  Gem,
  Target,
  Trophy,
  Shield,
  ArrowRight,
  BookOpen,
  Crown,
} from "lucide-react-native";
import { useGameState } from "../../src/state/useGameState";
import { StreakFlame } from "../../src/components/StreakFlame";
import { XPBar } from "../../src/components/XPBar";
import { HeartSystem } from "../../src/components/HeartSystem";
import { SkillPath } from "../../src/components/SkillPath";
import { AchievementPopup } from "../../src/components/AchievementPopup";
import THEME from "../../src/theme";
import type { ChessLesson } from "../../src/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    progress,
    level,
    xpProgress,
    units,
    allLessons,
    earnedAchievements,
    completeLesson,
  } = useGameState();

  const [recentAchievement, setRecentAchievement] = React.useState<
    (typeof earnedAchievements)[0] | null
  >(null);

  const activeUnit = useMemo(
    () =>
      units.find((u: (typeof units)[number]) => u.status === "active") ||
      units[0],
    [units],
  );

  const activeUnitLessons = useMemo(
    () => allLessons.filter((l: ChessLesson) => l.unitId === activeUnit.id),
    [allLessons, activeUnit],
  );

  const nextLesson = useMemo(() => {
    const idx = activeUnitLessons.findIndex(
      (l: ChessLesson) => !progress.completedLessons.includes(l.id),
    );
    return idx >= 0 ? activeUnitLessons[idx] : activeUnitLessons[0];
  }, [activeUnitLessons, progress.completedLessons]);

  const handleLessonPress = (lesson: ChessLesson) => {
    router.push(`/lesson/${lesson.id}` as const);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AchievementPopup
        achievement={recentAchievement}
        onDismiss={() => setRecentAchievement(null)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.appName}>ChessQuest</Text>
            <Text style={styles.greeting}>
              {progress.streakDays > 0
                ? `${progress.streakDays} day streak!`
                : "Ready to learn?"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <StreakFlame
              streakDays={progress.streakDays}
              streakFreezes={progress.streakFreezes}
            />
            <View style={styles.gemBadge}>
              <Gem size={14} color="#FFD700" />
              <Text style={styles.gemCount}>{progress.gems}</Text>
            </View>
          </View>
        </View>

        {/* XP Bar */}
        <View style={styles.xpSection}>
          <XPBar
            currentXP={progress.totalXP}
            level={level}
            progress={xpProgress}
          />
        </View>

        {/* Hearts */}
        <View style={styles.heartsRow}>
          <HeartSystem
            hearts={progress.hearts}
            maxHearts={progress.maxHearts}
          />
          <Text style={styles.heartTimer}>
            {progress.hearts < progress.maxHearts ? "Refills in 30min" : "Full"}
          </Text>
        </View>

        {/* Daily Goal */}
        <View style={styles.dailyGoalCard}>
          <View style={styles.dailyGoalLeft}>
            <Target size={24} color="#FFD700" />
            <View>
              <Text style={styles.dailyGoalTitle}>Daily Goal</Text>
              <Text style={styles.dailyGoalProgress}>
                {progress.dailyProgress}/{progress.dailyGoal} lessons
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.dailyGoalBar,
              {
                width: `${Math.min(100, (progress.dailyProgress / progress.dailyGoal) * 100)}%`,
                backgroundColor: progress.dailyGoalMet
                  ? THEME.accentGreen
                  : THEME.accent,
              },
            ]}
          />
          {progress.dailyGoalMet && (
            <View style={styles.goalMetBadge}>
              <Text style={styles.goalMetText}>Done!</Text>
            </View>
          )}
        </View>

        {/* Next Lesson Card */}
        {nextLesson && (
          <Pressable
            style={({ pressed }) => [
              styles.nextLessonCard,
              pressed && styles.nextLessonCardPressed,
            ]}
            onPress={handleLessonPress.bind(null, nextLesson)}
          >
            <View style={styles.nextLessonGlow} />
            <View style={styles.nextLessonContent}>
              <View>
                <Text style={styles.nextLabel}>UP NEXT</Text>
                <Text style={styles.nextTitle}>{nextLesson.title}</Text>
                <Text style={styles.nextDesc}>{nextLesson.description}</Text>
                <View style={styles.nextMeta}>
                  <Zap size={14} color="#FFD700" />
                  <Text style={styles.nextXP}>+{nextLesson.xpReward} XP</Text>
                  {nextLesson.isBonus && (
                    <>
                      <Gem size={14} color="#FFD700" />
                      <Text style={styles.nextGem}>Bonus</Text>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.nextArrow}>
                <ArrowRight size={24} color="#FFF" />
              </View>
            </View>
          </Pressable>
        )}

        {/* Skill Path */}
        <View style={styles.sectionHeader}>
          <BookOpen size={20} color={THEME.accent} />
          <Text style={styles.sectionTitle}>Learning Path</Text>
          <Text style={styles.sectionSub}>
            {progress.totalLessonsCompleted} of {allLessons.length} lessons
            completed
          </Text>
        </View>

        {units.slice(0, Math.min(5, units.length)).map((unit) => (
          <SkillPath
            key={unit.id}
            unit={unit}
            lessons={allLessons.filter((l) => l.unitId === unit.id)}
            completedLessons={progress.completedLessons}
            currentLessonIndex={progress.currentLessonIndex}
            onLessonPress={handleLessonPress}
          />
        ))}

        {/* League Banner */}
        <View style={styles.leagueCard}>
          <Trophy size={24} color="#FFD700" />
          <View style={styles.leagueInfo}>
            <Text style={styles.leagueName}>{progress.leagueName} League</Text>
            <Text style={styles.leagueScore}>
              {progress.leagueScore.toLocaleString()} points
            </Text>
          </View>
          {progress.leagueName === "Grandmaster" && (
            <Crown size={20} color="#FFD700" />
          )}
        </View>

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerLeft: {
    gap: 2,
  },
  appName: {
    color: THEME.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  greeting: {
    color: THEME.textSecondary,
    fontSize: 14,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gemBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  gemCount: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "700",
  },
  xpSection: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  heartsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  heartTimer: {
    color: THEME.textSecondary,
    fontSize: 12,
  },
  dailyGoalCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: "hidden",
    position: "relative",
  },
  dailyGoalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  dailyGoalTitle: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: "700",
  },
  dailyGoalProgress: {
    color: THEME.textSecondary,
    fontSize: 12,
  },
  dailyGoalBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.accent,
  },
  goalMetBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: THEME.accentGreen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  goalMetText: {
    color: THEME.bg,
    fontSize: 11,
    fontWeight: "700",
  },
  nextLessonCard: {
    backgroundColor: THEME.accentBlue,
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  nextLessonCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  nextLessonGlow: {
    position: "absolute",
    top: -50,
    right: -30,
    width: 150,
    height: 150,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 75,
  },
  nextLessonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  nextLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  nextTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
  },
  nextDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 2,
  },
  nextMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  nextXP: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "700",
  },
  nextGem: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "700",
  },
  nextArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  sectionSub: {
    color: THEME.textSecondary,
    fontSize: 12,
  },
  leagueCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 4,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: "700",
  },
  leagueScore: {
    color: THEME.textSecondary,
    fontSize: 13,
  },
});

import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Trophy,
  Zap,
  Gem,
  Flame,
  Target,
  CalendarCheck,
  Award,
  Crown,
  Shield,
  Star,
  TrendingUp,
  CheckCircle,
  BookOpen,
  Crosshair,
  Medal,
} from "lucide-react-native";
import { useGameState } from "../../src/state/useGameState";
import THEME from "../../src/theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    progress,
    level,
    xpProgress,
    xpForCurrentLevel,
    xpForNextLevel,
    leagueName,
    earnedAchievements,
    achievements,
  } = useGameState();

  const stats = useMemo(
    () => [
      {
        label: "Level",
        value: String(level),
        icon: <Star size={20} color="#FFD700" />,
        color: "#FFD700",
      },
      {
        label: "Total XP",
        value: progress.totalXP.toLocaleString(),
        icon: <Zap size={20} color="#45B7D1" />,
        color: "#45B7D1",
      },
      {
        label: "Streak",
        value: `${progress.streakDays}d`,
        icon: <Flame size={20} color="#FF6B35" />,
        color: "#FF6B35",
      },
      {
        label: "Best Streak",
        value: `${progress.longestStreak}d`,
        icon: <TrendingUp size={20} color="#2ED573" />,
        color: "#2ED573",
      },
      {
        label: "Lessons",
        value: String(progress.totalLessonsCompleted),
        icon: <BookOpen size={20} color="#A29BFE" />,
        color: "#A29BFE",
      },
      {
        label: "Puzzles",
        value: String(progress.totalPuzzlesSolved),
        icon: <Crosshair size={20} color="#FF6348" />,
        color: "#FF6348",
      },
      {
        label: "Perfect",
        value: String(progress.perfectLessons),
        icon: <Target size={20} color="#55EFC4" />,
        color: "#55EFC4",
      },
      {
        label: "Gems",
        value: String(progress.gems),
        icon: <Gem size={20} color="#FFD700" />,
        color: "#FFD700",
      },
    ],
    [progress, level],
  );

  const leagueIndex = useMemo(() => {
    const leagues = [
      "Bronze",
      "Silver",
      "Gold",
      "Sapphire",
      "Ruby",
      "Emerald",
      "Amethyst",
      "Diamond",
      "Grandmaster",
    ];
    return leagues.indexOf(leagueName);
  }, [leagueName]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{level}</Text>
          </View>
          <Text style={styles.username}>Chess Apprentice</Text>
          <View style={styles.leagueBadge}>
            <Shield size={16} color="#FFD700" />
            <Text style={styles.leagueText}>{leagueName} League</Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.xpCard}>
          <View style={styles.xpLabelRow}>
            <Zap size={18} color="#FFD700" />
            <Text style={styles.xpLabel}>XP Progress</Text>
            <Text style={styles.xpLevel}>Level {level}</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View
              style={[styles.xpBarFill, { width: `${xpProgress * 100}%` }]}
            />
          </View>
          <View style={styles.xpNumbers}>
            <Text style={styles.xpNum}>
              {progress.totalXP - xpForCurrentLevel} XP
            </Text>
            <Text style={styles.xpNumTotal}>
              {xpForNextLevel - xpForCurrentLevel} XP to Level {level + 1}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View
                style={[
                  styles.statIconBg,
                  { backgroundColor: stat.color + "20" },
                ]}
              >
                {stat.icon}
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Achievements */}
        <Text style={styles.sectionTitle}>
          Achievements ({earnedAchievements.length}/{achievements.length})
        </Text>
        <View style={styles.achievementsGrid}>
          {achievements.map((ach: (typeof achievements)[number]) => {
            const earned = earnedAchievements.some(
              (a: (typeof achievements)[number]) => a.id === ach.id,
            );
            return (
              <View
                key={ach.id}
                style={[styles.achCard, earned && styles.achCardEarned]}
              >
                <Medal
                  size={24}
                  color={earned ? "#FFD700" : "#444"}
                  fill={earned ? "#FFD700" : "transparent"}
                />
                <Text
                  style={[
                    styles.achTitle,
                    earned ? styles.achTitleEarned : null,
                  ]}
                >
                  {ach.title}
                </Text>
                <Text style={styles.achDesc}>{ach.description}</Text>
                {earned && (
                  <View style={styles.achBadge}>
                    <CheckCircle size={12} color="#2ED573" />
                  </View>
                )}
              </View>
            );
          })}
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
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.accentBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
  },
  username: {
    color: THEME.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  leagueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leagueText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "700",
  },
  xpCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  xpLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  xpLabel: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  xpLevel: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "700",
  },
  xpBarBg: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 5,
  },
  xpNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  xpNum: {
    color: THEME.textSecondary,
    fontSize: 12,
  },
  xpNumTotal: {
    color: THEME.textSecondary,
    fontSize: 12,
  },
  sectionTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 12,
    width: "23%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    color: THEME.textSecondary,
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  achCard: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 12,
    width: "48%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    opacity: 0.5,
  },
  achCardEarned: {
    opacity: 1,
    borderColor: "rgba(255,215,0,0.3)",
    backgroundColor: "rgba(255,215,0,0.05)",
  },
  achTitle: {
    color: "#666",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  achTitleEarned: {
    color: "#FFD700",
  },
  achDesc: {
    color: THEME.textSecondary,
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },
  achBadge: {
    position: "absolute",
    top: 6,
    right: 6,
  },
});

import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trophy, Crown, Medal, Shield, Star } from "lucide-react-native";
import { useGameState } from "../../src/state/useGameState";
import THEME from "../../src/theme";

const AVATAR_COLORS = [
  "#45B7D1",
  "#FF6B6B",
  "#FDCB6E",
  "#2ED573",
  "#A29BFE",
  "#E17055",
  "#FF6348",
  "#FFD700",
];

const LEAGUE_COLORS: Record<string, string> = {
  Bronze: "#CD7F32",
  Silver: "#C0C0C0",
  Gold: "#FFD700",
  Sapphire: "#0F52BA",
  Ruby: "#E0115F",
  Emerald: "#50C878",
  Amethyst: "#9966CC",
  Diamond: "#B9F2FF",
  Grandmaster: "#FF4500",
};

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { leaderboard, progress, leagueName } = useGameState();

  const leagueColor = LEAGUE_COLORS[leagueName] || "#CD7F32";

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const rest = useMemo(() => leaderboard.slice(3), [leaderboard]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* League Header */}
        <View style={[styles.leagueHeader, { borderColor: leagueColor }]}>
          <Trophy size={32} color={leagueColor} />
          <Text style={[styles.leagueTitle, { color: leagueColor }]}>
            {leagueName} League
          </Text>
          <Text style={styles.leagueSubtitle}>Weekly Leaderboard</Text>
        </View>

        {/* Top 3 Podium */}
        <View style={styles.podium}>
          {topThree.length >= 2 && (
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, styles.secondPlace]}>
                <Text style={styles.avatarEmoji}>
                  {
                    ["♟️", "♞", "♝", "♜", "♛", "♚", "🏁", "⚡"][
                      topThree[1].avatarIndex
                    ]
                  }
                </Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[1].name}
              </Text>
              <Medal size={20} color="#C0C0C0" />
              <Text style={styles.podiumScore}>
                {topThree[1].score.toLocaleString()}
              </Text>
            </View>
          )}

          {topThree.length >= 1 && (
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, styles.firstPlace]}>
                <Crown size={16} color="#FFD700" style={styles.crownIcon} />
                <Text style={styles.avatarEmoji}>
                  {
                    ["♟️", "♞", "♝", "♜", "♛", "♚", "🏁", "⚡"][
                      topThree[0].avatarIndex
                    ]
                  }
                </Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[0].name}
              </Text>
              <Medal size={20} color="#FFD700" />
              <Text style={styles.podiumScore}>
                {topThree[0].score.toLocaleString()}
              </Text>
            </View>
          )}

          {topThree.length >= 3 && (
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, styles.thirdPlace]}>
                <Text style={styles.avatarEmoji}>
                  {
                    ["♟️", "♞", "♝", "♜", "♛", "♚", "🏁", "⚡"][
                      topThree[2].avatarIndex
                    ]
                  }
                </Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[2].name}
              </Text>
              <Medal size={20} color="#CD7F32" />
              <Text style={styles.podiumScore}>
                {topThree[2].score.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Rest of leaderboard */}
        <View style={styles.listCard}>
          {rest.map((entry: (typeof rest)[number], i: number) => (
            <View
              key={i}
              style={[styles.listItem, entry.isPlayer && styles.listItemPlayer]}
            >
              <Text style={styles.listRank}>#{i + 4}</Text>
              <View
                style={[
                  styles.listAvatar,
                  { backgroundColor: AVATAR_COLORS[entry.avatarIndex] + "30" },
                ]}
              >
                <Text style={styles.listAvatarText}>
                  {
                    ["♟️", "♞", "♝", "♜", "♛", "♚", "🏁", "⚡"][
                      entry.avatarIndex
                    ]
                  }
                </Text>
              </View>
              <Text style={styles.listName}>{entry.name}</Text>
              <Text style={styles.listScore}>
                {entry.score.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* League Tiers */}
        <Text style={styles.tiersTitle}>League Tiers</Text>
        <View style={styles.tiersGrid}>
          {Object.entries(LEAGUE_COLORS).map(([name, color]) => {
            const isCurrent = name === leagueName;
            return (
              <View
                key={name}
                style={[
                  styles.tierCard,
                  isCurrent && {
                    borderColor: color,
                    backgroundColor: color + "15",
                  },
                ]}
              >
                <Shield size={18} color={isCurrent ? color : "#444"} />
                <Text style={[styles.tierName, isCurrent ? { color } : null]}>
                  {name}
                </Text>
                {isCurrent && (
                  <View
                    style={[styles.currentBadge, { backgroundColor: color }]}
                  >
                    <Star size={10} color="#000" />
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
  leagueHeader: {
    alignItems: "center",
    padding: 20,
    backgroundColor: THEME.surface,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 20,
    gap: 4,
  },
  leagueTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  leagueSubtitle: {
    color: THEME.textSecondary,
    fontSize: 13,
  },
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 16,
    marginBottom: 24,
    minHeight: 160,
  },
  podiumItem: {
    alignItems: "center",
    gap: 4,
    width: 100,
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.surface,
  },
  firstPlace: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  secondPlace: {
    borderWidth: 2,
    borderColor: "#C0C0C0",
  },
  thirdPlace: {
    borderWidth: 2,
    borderColor: "#CD7F32",
  },
  crownIcon: {
    position: "absolute",
    top: -12,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  podiumName: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  podiumScore: {
    color: THEME.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  listCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 24,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    gap: 12,
  },
  listItemPlayer: {
    backgroundColor: "rgba(255,215,0,0.05)",
  },
  listRank: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    width: 32,
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  listAvatarText: {
    fontSize: 18,
  },
  listName: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  listScore: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "700",
  },
  tiersTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  tiersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tierCard: {
    width: "30%",
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  tierName: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  currentBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});

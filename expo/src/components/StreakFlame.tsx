import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Flame } from "lucide-react-native";

interface Props {
  streakDays: number;
  streakFreezes: number;
}

export const StreakFlame = React.memo(function StreakFlame({
  streakDays,
  streakFreezes,
}: Props) {
  const isActive = streakDays > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.flameContainer, isActive && styles.flameActive]}>
        <Flame
          size={22}
          color={isActive ? "#FF6B35" : "#666"}
          fill={isActive ? "#FF6B35" : "transparent"}
        />
        <Text
          style={[styles.streakCount, isActive && styles.streakCountActive]}
        >
          {streakDays}
        </Text>
      </View>
      {streakFreezes > 0 && (
        <View style={styles.freezeBadge}>
          <Text style={styles.freezeText}>{streakFreezes}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  flameContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 53, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 2,
  },
  flameActive: {
    backgroundColor: "rgba(255, 107, 53, 0.25)",
  },
  streakCount: {
    color: "#666",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "System",
  },
  streakCountActive: {
    color: "#FF6B35",
  },
  freezeBadge: {
    backgroundColor: "rgba(100, 200, 255, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  freezeText: {
    color: "#64C8FF",
    fontSize: 11,
    fontWeight: "700",
  },
});

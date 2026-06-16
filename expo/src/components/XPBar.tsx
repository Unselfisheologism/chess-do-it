import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Zap } from "lucide-react-native";

interface Props {
  currentXP: number;
  level: number;
  progress: number;
}

export const XPBar = React.memo(function XPBar({
  currentXP,
  level,
  progress,
}: Props) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      <View style={styles.levelRow}>
        <Zap size={16} color="#FFD700" />
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.xpText}>
          {currentXP} / {level * 500} XP
        </Text>
      </View>
      <View style={styles.barBg}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: animWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
                extrapolate: "clamp",
              }),
            },
          ]}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  levelText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  xpText: {
    color: "#999",
    fontSize: 12,
    marginLeft: "auto",
  },
  barBg: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 4,
  },
});

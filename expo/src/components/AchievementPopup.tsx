import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, View, StyleSheet, Dimensions } from "react-native";
import { Award } from "lucide-react-native";
import type { Achievement } from "../types";

interface Props {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementPopup = React.memo(function AchievementPopup({
  achievement,
  onDismiss,
}: Props) {
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!achievement) return;
    translateY.setValue(-150);
    opacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(3000),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -150,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onDismiss());
  }, [achievement]);

  if (!achievement) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }], opacity }]}
      pointerEvents="none"
    >
      <Award size={28} color="#FFD700" />
      <View>
        <Text style={styles.title}>Achievement Unlocked!</Text>
        <Text style={styles.name}>{achievement.title}</Text>
      </View>
    </Animated.View>
  );
});

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
    zIndex: 1000,
    elevation: 20,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  title: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
  },
  name: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

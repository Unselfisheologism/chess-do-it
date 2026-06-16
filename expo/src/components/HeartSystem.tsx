import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Heart } from "lucide-react-native";

interface Props {
  hearts: number;
  maxHearts: number;
}

export const HeartSystem = React.memo(function HeartSystem({
  hearts,
  maxHearts,
}: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxHearts }).map((_, i) => (
        <Heart
          key={i}
          size={18}
          color={i < hearts ? "#FF4757" : "#444"}
          fill={i < hearts ? "#FF4757" : "transparent"}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 2,
  },
});

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { ChessLesson, SkillUnit } from "../types";

interface Props {
  unit: SkillUnit;
  lessons: ChessLesson[];
  completedLessons: string[];
  currentLessonIndex: number;
  onLessonPress: (lesson: ChessLesson) => void;
}

export const SkillPath = React.memo(function SkillPath({
  unit,
  lessons,
  completedLessons,
  currentLessonIndex,
  onLessonPress,
}: Props) {
  const isLocked = unit.status === "locked";
  const isCompleted = unit.status === "completed";

  if (isLocked) {
    return (
      <View style={[styles.container, styles.locked]}>
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockText}>Complete previous unit</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: unit.color }]}>
      <View style={[styles.header, { backgroundColor: unit.color + "20" }]}>
        <Text style={[styles.unitTitle, { color: unit.color }]}>
          Unit {unit.id}: {unit.title}
        </Text>
        <Text style={styles.unitDesc}>{unit.description}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    (completedLessons.filter((l) =>
                      lessons.some((ls) => ls.id === l),
                    ).length /
                      lessons.length) *
                      100,
                  )}%`,
                  backgroundColor: unit.color,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {
              completedLessons.filter((l) => lessons.some((ls) => ls.id === l))
                .length
            }
            /{lessons.length}
          </Text>
        </View>
      </View>
      <View style={styles.lessonsGrid}>
        {lessons.slice(0, 8).map((lesson, i) => {
          const isCompleted = completedLessons.includes(lesson.id);
          const isCurrent = !isCompleted && completedLessons.length === i;
          const isBonus = lesson.isBonus;

          return (
            <Pressable
              key={lesson.id}
              onPress={() => onLessonPress(lesson)}
              disabled={!isCurrent && !isCompleted}
              style={[
                styles.lessonNode,
                {
                  backgroundColor: isCompleted
                    ? unit.color + "30"
                    : isCurrent
                      ? unit.color + "15"
                      : "#1A1A2E",
                  borderColor: isCompleted
                    ? unit.color
                    : isCurrent
                      ? unit.color + "80"
                      : "#333",
                  opacity: !isCurrent && !isCompleted ? 0.5 : 1,
                },
              ]}
            >
              {isCompleted ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : isBonus ? (
                <Text style={styles.bonusIcon}>⭐</Text>
              ) : (
                <Text style={[styles.lessonNum, { color: unit.color }]}>
                  {i + 1}
                </Text>
              )}
            </Pressable>
          );
        })}
        {lessons.length > 8 && (
          <Pressable style={[styles.lessonNode, styles.moreNode]}>
            <Text style={styles.moreText}>+{lessons.length - 8}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#16213E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
    marginBottom: 12,
  },
  locked: {
    opacity: 0.5,
  },
  lockOverlay: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: {
    fontSize: 32,
  },
  lockText: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
  },
  header: {
    padding: 16,
  },
  unitTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  unitDesc: {
    color: "#999",
    fontSize: 13,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    color: "#999",
    fontSize: 12,
  },
  lessonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 8,
  },
  lessonNode: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  checkmark: {
    color: "#2ED573",
    fontSize: 18,
    fontWeight: "700",
  },
  bonusIcon: {
    fontSize: 16,
  },
  lessonNum: {
    fontSize: 13,
    fontWeight: "700",
  },
  moreNode: {
    backgroundColor: "#1A1A2E",
    borderColor: "#444",
  },
  moreText: {
    color: "#888",
    fontSize: 12,
  },
});

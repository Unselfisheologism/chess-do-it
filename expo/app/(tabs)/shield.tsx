import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Puzzle,
  ArrowRight,
  Clock,
} from "lucide-react-native";
import { useGameState } from "../../src/state/useGameState";
import { FocusShield as FocusShieldComponent } from "../../src/components/FocusShield";
import THEME from "../../src/theme";

export default function ShieldScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { progress, toggleShield, addBlockedApp, removeBlockedApp } =
    useGameState();

  const handleSolvePuzzle = () => {
    router.navigate("/(tabs)/puzzle");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Focus Shield</Text>
            <Text style={styles.subtitle}>
              Block social media until you learn
            </Text>
          </View>
          <Shield
            size={28}
            color={progress.shieldEnabled ? "#2ED573" : "#888"}
          />
        </View>

        {/* Status Card */}
        <View
          style={[
            styles.statusCard,
            progress.shieldEnabled && !progress.dailyGoalMet
              ? styles.statusLocked
              : progress.shieldEnabled
                ? styles.statusActive
                : styles.statusOff,
          ]}
        >
          {progress.shieldEnabled && !progress.dailyGoalMet ? (
            <>
              <ShieldAlert size={40} color="#FF4757" />
              <Text style={styles.statusTitle}>
                Shield Active — Apps Locked
              </Text>
              <Text style={styles.statusDesc}>
                Complete your daily chess lesson to unlock social media for 3
                hours
              </Text>
              <Pressable
                style={styles.unlockBigBtn}
                onPress={handleSolvePuzzle}
              >
                <Puzzle size={20} color="#1A1A2E" />
                <Text style={styles.unlockBigText}>Solve Puzzle to Unlock</Text>
                <ArrowRight size={20} color="#1A1A2E" />
              </Pressable>
              <View style={styles.timerRow}>
                <Clock size={14} color="#999" />
                <Text style={styles.timerText}>
                  Daily goal: {progress.dailyProgress}/{progress.dailyGoal}{" "}
                  lessons
                </Text>
              </View>
            </>
          ) : progress.shieldEnabled ? (
            <>
              <ShieldCheck size={40} color="#2ED573" />
              <Text style={styles.statusTitle}>Shield Active — Unlocked</Text>
              <Text style={styles.statusDesc}>
                Daily goal met! Social media is unlocked. Re-locks in 3 hours or
                at midnight.
              </Text>
            </>
          ) : (
            <>
              <Shield size={40} color="#888" />
              <Text style={styles.statusTitle}>Shield is Off</Text>
              <Text style={styles.statusDesc}>
                Enable Focus Shield to block social media until you complete
                your daily lesson.
              </Text>
            </>
          )}
        </View>

        {/* Focus Shield Component */}
        <FocusShieldComponent
          shieldEnabled={progress.shieldEnabled}
          blockedApps={progress.blockedApps}
          dailyGoalMet={progress.dailyGoalMet}
          onToggleShield={toggleShield}
          onAddApp={addBlockedApp.bind(null, "Instagram")}
          onRemoveApp={removeBlockedApp}
          onSolvePuzzle={handleSolvePuzzle}
        />

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: THEME.text,
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: THEME.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    borderWidth: 2,
  },
  statusLocked: {
    backgroundColor: "rgba(255,71,87,0.08)",
    borderColor: "#FF4757",
  },
  statusActive: {
    backgroundColor: "rgba(46,213,115,0.08)",
    borderColor: "#2ED573",
  },
  statusOff: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
  },
  statusTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  statusDesc: {
    color: THEME.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  unlockBigBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 8,
  },
  unlockBigText: {
    color: "#1A1A2E",
    fontSize: 16,
    fontWeight: "800",
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  timerText: {
    color: "#999",
    fontSize: 12,
  },
});

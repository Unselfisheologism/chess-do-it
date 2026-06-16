import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Puzzle,
} from "lucide-react-native";

interface Props {
  shieldEnabled: boolean;
  blockedApps: string[];
  dailyGoalMet: boolean;
  onToggleShield: () => void;
  onAddApp: () => void;
  onRemoveApp: (app: string) => void;
  onSolvePuzzle: () => void;
}

const SOCIAL_APPS = [
  { name: "Instagram", icon: "📸", color: "#E4405F" },
  { name: "TikTok", icon: "🎵", color: "#69C9D0" },
  { name: "Facebook", icon: "📘", color: "#1877F2" },
  { name: "X (Twitter)", icon: "🐦", color: "#1DA1F2" },
  { name: "Snapchat", icon: "👻", color: "#FFFC00" },
  { name: "YouTube", icon: "▶️", color: "#FF0000" },
  { name: "Reddit", icon: "🤖", color: "#FF4500" },
  { name: "Discord", icon: "💬", color: "#5865F2" },
];

export const FocusShield = React.memo(function FocusShield({
  shieldEnabled,
  blockedApps,
  dailyGoalMet,
  onToggleShield,
  onAddApp,
  onRemoveApp,
  onSolvePuzzle,
}: Props) {
  const isLocked = shieldEnabled && !dailyGoalMet;

  return (
    <View style={styles.container}>
      {/* Shield Toggle */}
      <View style={[styles.shieldCard, isLocked && styles.shieldCardLocked]}>
        <View style={styles.shieldHeader}>
          {isLocked ? (
            <ShieldAlert size={32} color="#FF4757" />
          ) : shieldEnabled ? (
            <ShieldCheck size={32} color="#2ED573" />
          ) : (
            <Shield size={32} color="#888" />
          )}
          <View style={styles.shieldInfo}>
            <Text style={styles.shieldTitle}>
              {isLocked
                ? "Social Media Locked"
                : shieldEnabled
                  ? "Shield Active"
                  : "Shield Off"}
            </Text>
            <Text style={styles.shieldDesc}>
              {isLocked
                ? "Complete your daily lesson to unlock"
                : shieldEnabled
                  ? "Social media is blocked until daily goal met"
                  : "Enable to block social media until you learn"}
            </Text>
          </View>
          <Pressable
            onPress={onToggleShield}
            style={[styles.toggleBtn, shieldEnabled && styles.toggleBtnOn]}
          >
            <View
              style={[styles.toggleKnob, shieldEnabled && styles.toggleKnobOn]}
            />
          </Pressable>
        </View>

        {isLocked && (
          <Pressable style={styles.unlockBtn} onPress={onSolvePuzzle}>
            <Puzzle size={20} color="#1A1A2E" />
            <Text style={styles.unlockText}>Solve Puzzle to Unlock</Text>
          </Pressable>
        )}
      </View>

      {/* Blocked Apps List */}
      <Text style={styles.sectionTitle}>Blocked Apps</Text>
      <View style={styles.appsGrid}>
        {SOCIAL_APPS.map((app) => {
          const isBlocked = blockedApps.includes(app.name);
          return (
            <Pressable
              key={app.name}
              style={[
                styles.appCard,
                isBlocked && styles.appCardBlocked,
                isLocked && styles.appCardLocked,
              ]}
              onPress={() => (isBlocked ? onRemoveApp(app.name) : onAddApp())}
            >
              <Text style={styles.appIcon}>{app.icon}</Text>
              <Text
                style={[styles.appName, isBlocked && styles.appNameBlocked]}
                numberOfLines={1}
              >
                {app.name}
              </Text>
              {isBlocked ? (
                isLocked ? (
                  <Lock size={14} color="#FF4757" />
                ) : (
                  <ShieldCheck size={14} color="#2ED573" />
                )
              ) : (
                <Unlock size={14} color="#888" />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* How it works */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How Focus Shield Works</Text>
        <View style={styles.infoStep}>
          <Text style={styles.infoNum}>1</Text>
          <Text style={styles.infoText}>
            Enable the shield to block selected social media apps
          </Text>
        </View>
        <View style={styles.infoStep}>
          <Text style={styles.infoNum}>2</Text>
          <Text style={styles.infoText}>
            Complete your daily chess lesson or puzzle to temporarily unlock
          </Text>
        </View>
        <View style={styles.infoStep}>
          <Text style={styles.infoNum}>3</Text>
          <Text style={styles.infoText}>
            Apps re-lock after 3 hours — keep learning to stay unlocked
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  shieldCard: {
    backgroundColor: "#16213E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2ED573",
  },
  shieldCardLocked: {
    borderColor: "#FF4757",
    backgroundColor: "#1A0F0F",
  },
  shieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shieldInfo: {
    flex: 1,
  },
  shieldTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  shieldDesc: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  toggleBtn: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#333",
    justifyContent: "center",
    padding: 3,
  },
  toggleBtnOn: {
    backgroundColor: "#2ED573",
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFF",
  },
  toggleKnobOn: {
    alignSelf: "flex-end",
  },
  unlockBtn: {
    marginTop: 12,
    backgroundColor: "#FFD700",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  unlockText: {
    color: "#1A1A2E",
    fontSize: 16,
    fontWeight: "800",
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
  },
  appsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  appCard: {
    backgroundColor: "#16213E",
    borderRadius: 12,
    padding: 12,
    width: "23%",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#333",
  },
  appCardBlocked: {
    borderColor: "#FF4757",
    backgroundColor: "#1A0F0F",
  },
  appCardLocked: {
    opacity: 0.8,
  },
  appIcon: {
    fontSize: 24,
  },
  appName: {
    color: "#888",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  appNameBlocked: {
    color: "#FF6B6B",
  },
  infoCard: {
    backgroundColor: "#16213E",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  infoTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  infoStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  infoNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFD700",
    textAlign: "center",
    lineHeight: 24,
    color: "#1A1A2E",
    fontWeight: "800",
    fontSize: 14,
    overflow: "hidden",
  },
  infoText: {
    color: "#AAA",
    fontSize: 13,
    flex: 1,
  },
});

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Shield,
  Lock,
  Unlock,
  Puzzle,
  ArrowRight,
  CheckCircle,
  X,
} from "lucide-react-native";
import { useGameState } from "../src/state/useGameState";
import FocusShield from "../modules/focus-shield/src/FocusShieldModule";
import THEME from "../src/theme";

const UNLOCK_DURATION_SECONDS = 3 * 60 * 60; // 3 hours, matches the iOS Phase 3 default

// MARK: - GateScreen
//
// Route: /gate?package=<packageName>
//
// Launched by the Android FocusShieldService (via deep link) when the
// user opens a blocked app. The user must solve a chess puzzle to earn
// a temporary unlock; on solve, the screen calls
// `FocusShield.unlockForDuration(...)` and the service stops
// intercepting until the timer expires.
//
// On iOS this route is unused (FamilyActivityPicker / ManagedSettings
// handle blocking via the system shield), but it is registered as a
// valid route so the deep-link target doesn't fail to resolve if a
// link is ever opened on iOS too.

export default function GateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { package: pkg } = useLocalSearchParams<{ package?: string }>();
  const { progress } = useGameState();

  const packageLabel = prettyAppName(pkg ?? "a blocked app");

  // Snapshot the puzzle count when the gate mounts. When the count
  // grows, we know the user solved a puzzle while away — write the
  // unlock. (Ref survives unmount/remount so coming back to this
  // route after a puzzle tab visit still triggers.)
  const baselineCountRef = useRef(progress.totalPuzzlesSolved);
  const hasUnlockedRef = useRef(false);

  const [remaining, setRemaining] = useState<number>(0);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll the native unlock timer so the success state shows
  // immediately after the user solves a puzzle (in case the resolver
  // chain is slow).
  const pollRemaining = useCallback(async () => {
    try {
      const r = await FocusShield.getRemainingUnlockSeconds();
      setRemaining(r);
    } catch {
      // ignore — iOS rejects getBlockedApps etc., and we only care
      // about the unlock state which is the same on both platforms
    }
  }, []);

  useEffect(() => {
    pollRemaining();
    const id = setInterval(pollRemaining, 1000);
    return () => clearInterval(id);
  }, [pollRemaining]);

  // Detect puzzle completion: when the user comes back to this
  // route after solving a puzzle in /(tabs)/puzzle, the count will
  // have increased. We write the unlock once per visit.
  useFocusEffect(
    useCallback(() => {
      const completed =
        progress.totalPuzzlesSolved - baselineCountRef.current;
      if (completed > 0 && !hasUnlockedRef.current) {
        hasUnlockedRef.current = true;
        setWriting(true);
        FocusShield.unlockForDuration(UNLOCK_DURATION_SECONDS)
          .then(() => pollRemaining())
          .catch((e) => setError(String(e?.message ?? e)))
          .finally(() => setWriting(false));
      }
    }, [progress.totalPuzzlesSolved, pollRemaining]),
  );

  const handleSolvePuzzle = () => {
    // Re-baseline before navigating so the focus-return check fires
    // only if a puzzle was actually solved.
    baselineCountRef.current = progress.totalPuzzlesSolved;
    hasUnlockedRef.current = false;
    router.navigate("/(tabs)/puzzle");
  };

  const handleBackToApp = () => {
    // Best-effort: open the blocked app via an intent (Android) or
    // just dismiss the gate (iOS, where there is no bounce).
    // On iOS this just goes back to the previous screen.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/shield");
    }
  };

  const unlocked = remaining > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Status icon */}
        <View
          style={[
            styles.iconCircle,
            unlocked ? styles.iconCircleUnlocked : styles.iconCircleLocked,
          ]}
        >
          {unlocked ? (
            <Unlock size={48} color="#2ED573" />
          ) : (
            <Lock size={48} color="#FF4757" />
          )}
        </View>

        {/* Title + subtitle */}
        <Text style={styles.title}>
          {unlocked ? "Unlocked!" : "Focus Shield Active"}
        </Text>
        <Text style={styles.subtitle}>
          {unlocked
            ? `You earned ${formatSeconds(remaining)} of ${packageLabel}.`
            : `You tried to open ${packageLabel}. Solve a chess puzzle to unlock it for 3 hours.`}
        </Text>

        {/* Status body */}
        {writing && (
          <View style={styles.statusRow}>
            <ActivityIndicator color="#FFD700" />
            <Text style={styles.statusText}>Writing unlock…</Text>
          </View>
        )}
        {error && (
          <View style={styles.statusRow}>
            <X size={16} color="#FF4757" />
            <Text style={[styles.statusText, { color: "#FF4757" }]}>
              {error}
            </Text>
          </View>
        )}
        {unlocked && !writing && !error && (
          <View style={styles.statusRow}>
            <CheckCircle size={16} color="#2ED573" />
            <Text style={[styles.statusText, { color: "#2ED573" }]}>
              Social media is unblocked until {formatUnlockEnd(remaining)}.
            </Text>
          </View>
        )}

        {/* Actions */}
        {unlocked ? (
          <Pressable style={styles.primaryBtn} onPress={handleBackToApp}>
            <ArrowRight size={20} color="#0A1525" />
            <Text style={styles.primaryBtnText}>Back to {packageLabel}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primaryBtn} onPress={handleSolvePuzzle}>
            <Puzzle size={20} color="#0A1525" />
            <Text style={styles.primaryBtnText}>Solve Puzzle to Unlock</Text>
          </Pressable>
        )}

        {/* Skip link — present in the spec as a "soft out" so the user
            doesn't feel trapped. Note: if they skip, the Accessibility-
            Service will bounce them right back the next time they open
            the blocked app. */}
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.replace("/(tabs)/shield")}
        >
          <Shield size={16} color={THEME.textSecondary} />
          <Text style={styles.secondaryBtnText}>Manage Focus Shield</Text>
        </Pressable>
      </View>
    </View>
  );
}

// MARK: - Helpers

/**
 * Best-effort pretty name for a package like `com.instagram.android`
 * → "Instagram". Falls back to the raw package if no heuristic
 * matches. (For a polished version, we'd query the PackageManager
 * for the app label via a new Module function — for now, this
 * heuristic covers the most common social packages.)
 */
function prettyAppName(pkg: string): string {
  if (pkg === "a blocked app") return pkg;
  const lower = pkg.toLowerCase();
  const table: Array<[string, string]> = [
    ["instagram", "Instagram"],
    ["tiktok", "TikTok"],
    ["facebook", "Facebook"],
    ["twitter", "X (Twitter)"],
    ["x.android", "X (Twitter)"],
    ["snapchat", "Snapchat"],
    ["youtube", "YouTube"],
    ["reddit", "Reddit"],
    ["discord", "Discord"],
    ["linkedin", "LinkedIn"],
    ["pinterest", "Pinterest"],
    ["threads", "Threads"],
  ];
  for (const [needle, label] of table) {
    if (lower.includes(needle)) return label;
  }
  // Fall back to the last segment of the package, capitalized.
  const last = pkg.split(".").pop() ?? pkg;
  return last.charAt(0).toUpperCase() + last.slice(1);
}

function formatSeconds(s: number): string {
  if (s <= 0) return "0 minutes";
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${Math.max(1, minutes)} minute${minutes === 1 ? "" : "s"}`;
}

function formatUnlockEnd(remainingSec: number): string {
  const end = new Date(Date.now() + remainingSec * 1000);
  return end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconCircleLocked: {
    backgroundColor: "rgba(255,71,87,0.12)",
    borderWidth: 2,
    borderColor: "#FF4757",
  },
  iconCircleUnlocked: {
    backgroundColor: "rgba(46,213,115,0.12)",
    borderWidth: 2,
    borderColor: "#2ED573",
  },
  title: {
    color: THEME.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: THEME.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  statusText: {
    color: THEME.textSecondary,
    fontSize: 13,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FFD700",
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 16,
    minWidth: 260,
  },
  primaryBtnText: {
    color: "#0A1525",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: THEME.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Gem,
  ShoppingBag,
  Heart,
  Snowflake,
  Zap,
  PackageOpen,
  CheckCircle,
  Star,
} from "lucide-react-native";
import { useGameState } from "../../src/state/useGameState";
import THEME from "../../src/theme";

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { progress, shopItems, spendGems, earnGems, refillHearts } =
    useGameState();

  const [purchased, setPurchased] = useState<string[]>([]);

  const handleBuy = (item: (typeof shopItems)[0]) => {
    if (progress.gems < item.cost) {
      Alert.alert("Not enough gems", "Complete more lessons to earn gems!");
      return;
    }

    const success = spendGems(item.cost);
    if (!success) return;

    if (item.type === "streakFreeze") {
      Alert.alert(
        "Purchased!",
        `Got ${item.effect} streak freeze${item.effect > 1 ? "s" : ""}!`,
      );
    } else if (item.type === "heartRefill") {
      refillHearts();
      Alert.alert("Hearts Refilled!", "All hearts restored!");
    } else if (item.type === "doubleXP") {
      setPurchased((p) => [...p, item.id]);
      Alert.alert("XP Boost Active!", `Double XP for ${item.effect} minutes!`);
    } else if (item.type === "chestBoost") {
      Alert.alert("Chest Boosted!", "Chest unlocked instantly!");
    }

    setPurchased((p) => [...p, item.id]);
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
            <Text style={styles.title}>Shop</Text>
            <Text style={styles.subtitle}>Spend your hard-earned gems</Text>
          </View>
          <View style={styles.gemBalance}>
            <Gem size={20} color="#FFD700" />
            <Text style={styles.gemCount}>{progress.gems}</Text>
          </View>
        </View>

        {/* Items Grid */}
        <View style={styles.itemsGrid}>
          {shopItems.map((item) => {
            const alreadyBought = purchased.includes(item.id);
            return (
              <Pressable
                key={item.id}
                style={[styles.itemCard, alreadyBought && styles.itemBought]}
                onPress={() => !alreadyBought && handleBuy(item)}
                disabled={alreadyBought}
              >
                <View style={styles.itemIcon}>
                  {item.type === "streakFreeze" && (
                    <Snowflake size={28} color="#64C8FF" />
                  )}
                  {item.type === "heartRefill" && (
                    <Heart size={28} color="#FF4757" />
                  )}
                  {item.type === "doubleXP" && (
                    <Zap size={28} color="#FFD700" />
                  )}
                  {item.type === "chestBoost" && (
                    <PackageOpen size={28} color="#E17055" />
                  )}
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                {alreadyBought ? (
                  <View style={styles.boughtBadge}>
                    <CheckCircle size={14} color="#2ED573" />
                    <Text style={styles.boughtText}>Owned</Text>
                  </View>
                ) : (
                  <View style={styles.priceTag}>
                    <Gem size={14} color="#FFD700" />
                    <Text style={styles.priceText}>{item.cost}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Earn More Gems */}
        <View style={styles.earnCard}>
          <Star size={24} color="#FFD700" />
          <View style={styles.earnInfo}>
            <Text style={styles.earnTitle}>Earn More Gems</Text>
            <Text style={styles.earnDesc}>
              Complete lessons, solve puzzles, and keep your streak to earn
              gems!
            </Text>
          </View>
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
  gemBalance: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  gemCount: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "800",
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  itemCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    width: "47%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    gap: 8,
  },
  itemBought: {
    opacity: 0.5,
    borderColor: "#2ED573",
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  itemDesc: {
    color: THEME.textSecondary,
    fontSize: 11,
    textAlign: "center",
  },
  priceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "700",
  },
  boughtBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(46,213,115,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  boughtText: {
    color: "#2ED573",
    fontSize: 14,
    fontWeight: "600",
  },
  earnCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: "700",
  },
  earnDesc: {
    color: THEME.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
});

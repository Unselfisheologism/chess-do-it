import type { ShopItem } from "../types";

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "streak_freeze",
    name: "Streak Freeze",
    description: "Protects your streak for one missed day",
    icon: "Snowflake",
    cost: 50,
    type: "streakFreeze",
    effect: 1,
  },
  {
    id: "heart_refill",
    name: "Heart Refill",
    description: "Instantly refill all your hearts",
    icon: "Heart",
    cost: 100,
    type: "heartRefill",
    effect: 5,
  },
  {
    id: "double_xp_15",
    name: "XP Boost",
    description: "Double XP for the next 15 minutes",
    icon: "Zap",
    cost: 80,
    type: "doubleXP",
    effect: 15,
  },
  {
    id: "chest_boost",
    name: "Chest Boost",
    description: "Unlock a chest instantly",
    icon: "PackageOpen",
    cost: 75,
    type: "chestBoost",
    effect: 1,
  },
  {
    id: "streak_freeze_pack",
    name: "Freeze Pack",
    description: "3 Streak Freezes at a discount",
    icon: "Snowflake",
    cost: 120,
    type: "streakFreeze",
    effect: 3,
  },
];

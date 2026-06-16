import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Puzzle,
  Zap,
  Gem,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Trophy,
  Flame,
  Lightbulb,
  RefreshCw,
} from "lucide-react-native";
import { Chess, Square as ChessJSSquare } from "chess.js";
import { useGameState } from "../../src/state/useGameState";
import { ChessBoard } from "../../src/components/ChessBoard";
import {
  getPieces,
  validateMove,
  getBestMoveHint,
} from "../../src/utils/chess";
import type { Square } from "../../src/types";
import THEME from "../../src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BOARD_SIZE = SCREEN_WIDTH - 32;

const DAILY_PUZZLES = [
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solution: ["h5f7"],
    title: "Scholar's Mate Pattern",
    hint: "Look for a checkmate on f7",
    xp: 25,
  },
  {
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6",
    solution: ["f3g5"],
    title: "Knight Fork",
    hint: "Can you attack two pieces at once?",
    xp: 20,
  },
  {
    fen: "5rk1/ppp2ppp/8/8/8/8/PPP2PPP/5RK1 w - - 0 1",
    solution: ["f1f8"],
    title: "Back Rank Mate",
    hint: "The back rank is undefended...",
    xp: 30,
  },
  {
    fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
    solution: ["b8c6"],
    title: "Defend the Pawn",
    hint: "Develop a piece while protecting your center pawn",
    xp: 15,
  },
  {
    fen: "7k/5Q2/8/8/8/8/8/7K w - - 0 1",
    solution: ["f7g7"],
    title: "Staircase Mate",
    hint: "Use your queen to force the checkmate",
    xp: 35,
  },
  {
    fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    solution: ["e4d5"],
    title: "Capture the Center",
    hint: "Take the free pawn in the center",
    xp: 15,
  },
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    solution: ["f1b5"],
    title: "Pin the Knight",
    hint: "Pin the knight to the king",
    xp: 25,
  },
];

export default function PuzzleScreen() {
  const insets = useSafeAreaInsets();
  const { completePuzzle, progress } = useGameState();

  const [puzzleIdx, setPuzzleIdx] = useState<number>(() =>
    Math.floor(Math.random() * DAILY_PUZZLES.length),
  );
  const puzzle = DAILY_PUZZLES[puzzleIdx];

  const [game, setGame] = useState(() => new Chess(puzzle.fen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [status, setStatus] = useState<
    "playing" | "correct" | "wrong" | "complete"
  >("playing");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const pieces = useMemo(() => getPieces(game), [game.fen()]);

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSquarePress = useCallback(
    (square: Square) => {
      if (status !== "playing") return;

      if (!selectedSquare) {
        const piece = pieces.find(
          (p: (typeof pieces)[number]) => p.square === square,
        );
        if (!piece || piece.color !== (puzzle.fen ? "w" : "w")) return;
        setSelectedSquare(square);
        const moves = game.moves({
          square: square as ChessJSSquare,
          verbose: true,
        });
        setValidMoves(moves.map((m) => m.to as Square));
      } else {
        if (square === selectedSquare) {
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }

        if (!validateMove(game, selectedSquare, square)) {
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }

        try {
          const newGame = new Chess(game.fen());
          newGame.move({
            from: selectedSquare as ChessJSSquare,
            to: square as ChessJSSquare,
          });
          setGame(newGame);
          setLastMove({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          setValidMoves([]);

          const moveUCI = `${selectedSquare}${square}`;
          const expectedMove = puzzle.solution[solutionIndex];

          if (moveUCI === expectedMove) {
            const newIndex = solutionIndex + 1;
            setSolutionIndex(newIndex);
            if (newIndex >= puzzle.solution.length) {
              setStatus("complete");
              completePuzzle();
            } else {
              setStatus("correct");
              setTimeout(() => setStatus("playing"), 500);
            }
          } else {
            setStatus("wrong");
            triggerShake();
            setTimeout(() => {
              setGame(new Chess(puzzle.fen));
              setSolutionIndex(0);
              setStatus("playing");
              setLastMove(null);
            }, 800);
          }
        } catch {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    },
    [selectedSquare, game, pieces, status, solutionIndex],
  );

  const handleHint = useCallback(() => {
    if (hintsUsed >= 3) return;
    setHintsUsed((h) => h + 1);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  }, [hintsUsed]);

  const hintText = useMemo(() => {
    if (!showHint) return null;
    if (hintsUsed === 1) return puzzle.hint;
    return getBestMoveHint(game, puzzle.solution);
  }, [showHint, hintsUsed, game]);

  const handleRefresh = useCallback(() => {
    const newIdx = Math.floor(Math.random() * DAILY_PUZZLES.length);
    setPuzzleIdx(newIdx);
    setGame(new Chess(DAILY_PUZZLES[newIdx].fen));
    setSolutionIndex(0);
    setStatus("playing");
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setHintsUsed(0);
    setShowHint(false);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topInfo}>
          <View style={styles.puzzleLabel}>
            <Flame size={16} color="#FF6B35" />
            <Text style={styles.puzzleLabelText}>
              Daily Puzzle — {progress.puzzleStreak} streak
            </Text>
          </View>
          <Text style={styles.puzzleTitle}>{puzzle.title}</Text>
        </View>
        <View style={styles.topMeta}>
          <Zap size={14} color="#FFD700" />
          <Text style={styles.metaText}>+{puzzle.xp} XP</Text>
        </View>
      </View>

      {/* Status Banners */}
      {status === "correct" && (
        <View style={[styles.statusBanner, styles.correctBanner]}>
          <CheckCircle size={20} color="#2ED573" />
          <Text style={styles.correctText}>Correct!</Text>
        </View>
      )}
      {status === "wrong" && (
        <View style={[styles.statusBanner, styles.wrongBanner]}>
          <XCircle size={20} color="#FF4757" />
          <Text style={styles.wrongText}>Not quite — try again!</Text>
        </View>
      )}
      {status === "complete" && (
        <View style={[styles.statusBanner, styles.completeBanner]}>
          <View style={styles.completeRow}>
            <Trophy size={28} color="#FFD700" />
            <View>
              <Text style={styles.completeText}>Puzzle Solved!</Text>
              <Text style={styles.completeSub}>+{puzzle.xp} XP · +2 Gems</Text>
            </View>
          </View>
          <Pressable onPress={handleRefresh} style={styles.refreshBtn}>
            <RefreshCw size={20} color="#FFF" />
            <Text style={styles.refreshText}>New Puzzle</Text>
          </Pressable>
        </View>
      )}

      {/* Board */}
      <Animated.View
        style={[
          styles.boardContainer,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <ChessBoard
          pieces={pieces}
          selectedSquare={selectedSquare}
          validMoves={validMoves}
          onSquarePress={handleSquarePress}
          size={BOARD_SIZE}
          lastMove={lastMove}
        />
      </Animated.View>

      {/* Hint */}
      {showHint && hintText && (
        <View style={styles.hintBubble}>
          <Lightbulb size={16} color="#FFD700" />
          <Text style={styles.hintText}>{hintText}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          onPress={handleHint}
          style={[styles.hintBtn, hintsUsed >= 3 && styles.btnDisabled]}
          disabled={hintsUsed >= 3}
        >
          <Lightbulb size={18} color={hintsUsed >= 3 ? "#555" : "#FFD700"} />
          <Text
            style={[
              styles.hintBtnText,
              hintsUsed >= 3 && styles.btnTextDisabled,
            ]}
          >
            Hint ({3 - hintsUsed})
          </Text>
        </Pressable>
        <Pressable onPress={handleRefresh} style={styles.skipBtn}>
          <RefreshCw size={18} color="#888" />
          <Text style={styles.skipBtnText}>New</Text>
        </Pressable>
      </View>

      <View style={{ height: insets.bottom + 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  topInfo: {
    flex: 1,
  },
  puzzleLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  puzzleLabelText: {
    color: "#FF6B35",
    fontSize: 12,
    fontWeight: "600",
  },
  puzzleTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  topMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaText: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "700",
  },
  statusBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  correctBanner: {
    backgroundColor: "rgba(46,213,115,0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  correctText: {
    color: "#2ED573",
    fontSize: 16,
    fontWeight: "700",
  },
  wrongBanner: {
    backgroundColor: "rgba(255,71,87,0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  wrongText: {
    color: "#FF4757",
    fontSize: 16,
    fontWeight: "700",
  },
  completeBanner: {
    backgroundColor: "rgba(255,215,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
    gap: 12,
  },
  completeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  completeText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "800",
  },
  completeSub: {
    color: "#FFD700",
    fontSize: 13,
    opacity: 0.8,
    marginTop: 2,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 10,
    borderRadius: 10,
  },
  refreshText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  boardContainer: {
    alignItems: "center",
    padding: 16,
  },
  hintBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,215,0,0.1)",
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  hintText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  controls: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  hintBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: THEME.surface,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  hintBtnText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
  btnDisabled: { opacity: 0.4 },
  btnTextDisabled: { color: "#555" },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: THEME.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  skipBtnText: {
    color: "#888",
    fontSize: 14,
  },
});

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Zap,
  Gem,
  Lightbulb,
  CheckCircle,
  XCircle,
  Trophy,
} from "lucide-react-native";
import { Chess, Square as ChessJSSquare } from "chess.js";
import { useGameState } from "../../src/state/useGameState";
import { ChessBoard } from "../../src/components/ChessBoard";
import { getLessonById } from "../../src/data/lessons";
import {
  getPieces,
  validateMove,
  isCheckmate,
  getBestMoveHint,
} from "../../src/utils/chess";
import type { Square, ChessPiece } from "../../src/types";
import THEME from "../../src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BOARD_SIZE = SCREEN_WIDTH - 32;

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeLesson, progress, loseHeart } = useGameState();

  const lesson = useMemo(() => getLessonById(id || ""), [id]);
  const [game, setGame] = useState<Chess>(
    () => new Chess(lesson?.fen || undefined),
  );
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
  const [isPerfect, setIsPerfect] = useState(true);

  const pieces = useMemo(() => getPieces(game), [game.fen()]);

  const handleSquarePress = useCallback(
    (square: Square) => {
      if (status !== "playing") return;

      if (!selectedSquare) {
        // Selecting a piece
        const piece = pieces.find((p) => p.square === square);
        if (
          !piece ||
          piece.color !==
            ((lesson?.fen ? game.turn() : game.turn()) as "w" | "b")
        )
          return;
        setSelectedSquare(square);

        const moves = game.moves({
          square: square as ChessJSSquare,
          verbose: true,
        });
        setValidMoves(moves.map((m) => m.to as Square));
      } else {
        // Making a move
        if (square === selectedSquare) {
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }

        const isValid = validateMove(game, selectedSquare, square);
        if (!isValid) {
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }

        // Make the move
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

          // Check against solution
          if (!lesson) return;
          const moveUCI = `${selectedSquare}${square}`;

          if (solutionIndex < lesson.solutionMoves.length) {
            const expectedMove = lesson.solutionMoves[solutionIndex];
            if (moveUCI === expectedMove) {
              const newIndex = solutionIndex + 1;
              setSolutionIndex(newIndex);

              if (newIndex >= lesson.solutionMoves.length) {
                setStatus("complete");
                completeLesson(lesson.id, isPerfect);
                setTimeout(() => {
                  if (router.canGoBack()) router.back();
                }, 1000);
              } else {
                setStatus("correct");
                setTimeout(() => setStatus("playing"), 500);
              }
            } else {
              setStatus("wrong");
              setIsPerfect(false);
              loseHeart();
              setTimeout(() => {
                setGame(new Chess(lesson.fen || undefined));
                setSolutionIndex(0);
                setStatus("playing");
                setLastMove(null);
              }, 800);
            }
          }
        } catch {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    },
    [selectedSquare, game, pieces, status, solutionIndex, lesson],
  );

  const handleHint = useCallback(() => {
    if (!lesson || hintsUsed >= 3) return;
    setHintsUsed((h) => h + 1);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  }, [lesson, hintsUsed]);

  const hintText = useMemo(() => {
    if (!lesson || !showHint) return null;
    if (hintsUsed === 1)
      return lesson.hints[0] || "Look carefully at the board";
    if (hintsUsed === 2) return lesson.hints[1] || "Consider all your options";
    return getBestMoveHint(game, lesson.solutionMoves);
  }, [lesson, showHint, hintsUsed, game]);

  if (!lesson) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Lesson not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const completed = progress.completedLessons.includes(lesson.id);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#FFF" />
        </Pressable>
        <View style={styles.topInfo}>
          <Text style={styles.lessonTitle} numberOfLines={1}>
            {lesson.title}
          </Text>
          <View style={styles.topMeta}>
            <Zap size={14} color="#FFD700" />
            <Text style={styles.metaText}>+{lesson.xpReward} XP</Text>
            <Gem size={14} color="#FFD700" />
            <Text style={styles.metaText}>+{lesson.gemReward}</Text>
          </View>
        </View>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>
            {solutionIndex + 1}/{lesson.solutionMoves.length + 1}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        {status === "correct" && (
          <View style={[styles.statusBanner, styles.correctBanner]}>
            <CheckCircle size={20} color="#2ED573" />
            <Text style={styles.correctText}>Correct!</Text>
          </View>
        )}
        {status === "wrong" && (
          <View style={[styles.statusBanner, styles.wrongBanner]}>
            <XCircle size={20} color="#FF4757" />
            <Text style={styles.wrongText}>Wrong move — try again!</Text>
          </View>
        )}
        {status === "complete" && (
          <View style={[styles.statusBanner, styles.completeBanner]}>
            <Trophy size={24} color="#FFD700" />
            <Text style={styles.completeText}>
              {isPerfect ? "Perfect!" : "Lesson Complete!"}
            </Text>
          </View>
        )}

        {/* Chess Board */}
        <View style={styles.boardContainer}>
          <ChessBoard
            pieces={pieces}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            onSquarePress={handleSquarePress}
            size={BOARD_SIZE}
            lastMove={lastMove}
          />
        </View>

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
              Hint ({3 - hintsUsed} left)
            </Text>
          </Pressable>
        </View>

        {/* Lesson Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Description</Text>
          <Text style={styles.infoText}>{lesson.description}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Puzzle Type</Text>
          <Text style={styles.infoText}>
            {lesson.puzzleType === "mateInOne"
              ? "Checkmate in 1"
              : lesson.puzzleType === "mateInTwo"
                ? "Checkmate in 2"
                : lesson.puzzleType === "capturePiece"
                  ? "Capture a piece"
                  : lesson.puzzleType === "avoidBlunder"
                    ? "Avoid a blunder"
                    : "Find the best move"}
          </Text>
        </View>

        {lesson.isBonus && (
          <View style={[styles.infoCard, styles.bonusCard]}>
            <Gem size={20} color="#FFD700" />
            <View>
              <Text style={styles.bonusTitle}>Bonus Lesson!</Text>
              <Text style={styles.bonusDesc}>
                Earn extra XP and gems for completing this challenge
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  backBtn: {
    padding: 4,
  },
  topInfo: {
    flex: 1,
  },
  lessonTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: "700",
  },
  topMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
  },
  stepIndicator: {
    backgroundColor: THEME.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  correctBanner: {
    backgroundColor: "rgba(46, 213, 115, 0.15)",
  },
  correctText: {
    color: "#2ED573",
    fontSize: 16,
    fontWeight: "700",
  },
  wrongBanner: {
    backgroundColor: "rgba(255, 71, 87, 0.15)",
  },
  wrongText: {
    color: "#FF4757",
    fontSize: 16,
    fontWeight: "700",
  },
  completeBanner: {
    backgroundColor: "rgba(255, 215, 0, 0.15)",
  },
  completeText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "800",
  },
  boardContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  hintBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
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
    marginBottom: 16,
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
  btnDisabled: {
    opacity: 0.4,
  },
  btnTextDisabled: {
    color: "#555",
  },
  infoCard: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  infoLabel: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoText: {
    color: THEME.text,
    fontSize: 14,
    lineHeight: 20,
  },
  bonusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.05)",
  },
  bonusTitle: {
    color: "#FFD700",
    fontSize: 15,
    fontWeight: "700",
  },
  bonusDesc: {
    color: THEME.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    color: THEME.text,
    fontSize: 18,
    textAlign: "center",
    marginTop: 40,
  },
  backText: {
    color: THEME.accentBlue,
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  },
});

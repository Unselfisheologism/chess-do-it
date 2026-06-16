import React, { useCallback } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  type LayoutChangeEvent,
} from "react-native";
import Svg, { Rect, Text as SvgText, Line, G } from "react-native-svg";
import type { ChessPiece as ChessPieceType, Square } from "../types";
import { getPieceSymbol, isLightSquare, squareToCoords } from "../utils/chess";

interface Props {
  pieces: ChessPieceType[];
  selectedSquare: Square | null;
  validMoves: Square[];
  onSquarePress: (square: Square) => void;
  size: number;
  flipped?: boolean;
  lastMove?: { from: Square; to: Square } | null;
}

export const ChessBoard = React.memo(function ChessBoard({
  pieces,
  selectedSquare,
  validMoves,
  onSquarePress,
  size,
  flipped = false,
  lastMove,
}: Props) {
  const squareSize = size / 8;
  const lightColor = "#F0D9B5";
  const darkColor = "#B58863";
  const selectedColor = "rgba(255, 255, 0, 0.5)";
  const validMoveColor = "rgba(0, 0, 0, 0.2)";
  const lastMoveColor = "rgba(255, 255, 0, 0.3)";

  const getSquareColor = useCallback(
    (row: number, col: number): string => {
      const square = `${String.fromCharCode(97 + col)}${8 - row}` as Square;
      if (selectedSquare === square) return selectedColor;
      if (lastMove) {
        const { to } = lastMove;
        const toCoords = squareToCoords(to);
        if (toCoords.row === row && toCoords.col === col) return lastMoveColor;
        const fromCoords = squareToCoords(lastMove.from);
        if (fromCoords.row === row && fromCoords.col === col)
          return lastMoveColor;
      }
      return isLightSquare(square) ? lightColor : darkColor;
    },
    [selectedSquare, lastMove],
  );

  const getSquareLabel = useCallback(
    (row: number, col: number, position: "file" | "rank"): string | null => {
      if (position === "file" && row === 7) {
        const file = flipped
          ? String.fromCharCode(104 - col)
          : String.fromCharCode(97 + col);
        return file;
      }
      if (position === "rank" && col === 0) {
        const rank = flipped ? String(row + 1) : String(8 - row);
        return rank;
      }
      return null;
    },
    [flipped],
  );

  const renderSquare = useCallback(
    (row: number, col: number) => {
      const actualCol = flipped ? 7 - col : col;
      const actualRow = flipped ? 7 - row : row;
      const square =
        `${String.fromCharCode(97 + actualCol)}${8 - actualRow}` as Square;
      const isValid = validMoves.includes(square);
      const piece = pieces.find((p) => p.square === square);
      const color = getSquareColor(actualRow, actualCol);

      return (
        <Pressable
          key={`${row}-${col}`}
          onPress={() => onSquarePress(square)}
          style={[
            styles.square,
            {
              left: col * squareSize,
              top: row * squareSize,
              width: squareSize,
              height: squareSize,
              backgroundColor: color,
            },
          ]}
        >
          {isValid && (
            <View
              style={[
                styles.validMoveDot,
                piece ? styles.validMoveCapture : styles.validMoveEmpty,
                {
                  width: piece ? squareSize : squareSize * 0.3,
                  height: piece ? squareSize : squareSize * 0.3,
                  borderRadius: piece ? 0 : squareSize * 0.15,
                },
              ]}
            />
          )}
          {piece && (
            <Svg width={squareSize} height={squareSize} viewBox="0 0 40 40">
              <SvgText
                x={20}
                y={30}
                fontSize={28}
                textAnchor="middle"
                fill={piece.color === "w" ? "#FFFFFF" : "#1A1A2E"}
                stroke={piece.color === "w" ? "#333" : "#666"}
                strokeWidth={0.5}
                fontWeight="bold"
              >
                {getPieceSymbol(piece.type, piece.color)}
              </SvgText>
            </Svg>
          )}
          {/* File labels */}
          {getSquareLabel(row, col, "file") && (
            <Svg width={squareSize} height={squareSize} style={styles.labelSvg}>
              <SvgText
                x={squareSize - 4}
                y={squareSize - 4}
                fontSize={9}
                textAnchor="end"
                fill={isLightSquare(square) ? darkColor : lightColor}
                opacity={0.7}
              >
                {getSquareLabel(row, col, "file")}
              </SvgText>
            </Svg>
          )}
          {/* Rank labels */}
          {getSquareLabel(row, col, "rank") && (
            <Svg width={squareSize} height={squareSize} style={styles.labelSvg}>
              <SvgText
                x={5}
                y={10}
                fontSize={9}
                textAnchor="start"
                fill={isLightSquare(square) ? darkColor : lightColor}
                opacity={0.7}
              >
                {getSquareLabel(row, col, "rank")}
              </SvgText>
            </Svg>
          )}
        </Pressable>
      );
    },
    [
      pieces,
      selectedSquare,
      validMoves,
      onSquarePress,
      squareSize,
      flipped,
      getSquareColor,
      getSquareLabel,
    ],
  );

  const squares: React.ReactNode[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      squares.push(renderSquare(row, col));
    }
  }

  return (
    <View
      style={[
        styles.board,
        {
          width: size,
          height: size,
          borderRadius: 8,
        },
      ]}
    >
      {squares}
    </View>
  );
});

const styles = StyleSheet.create({
  board: {
    overflow: "hidden",
    backgroundColor: "#1A1A2E",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  square: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  validMoveDot: {
    position: "absolute",
    zIndex: 1,
  },
  validMoveEmpty: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  validMoveCapture: {
    borderWidth: 4,
    borderColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 0,
  },
  labelSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});

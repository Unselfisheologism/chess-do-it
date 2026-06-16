import { Chess, Square as ChessJSSquare } from "chess.js";
import type { ChessPiece, PieceColor, PieceType, Square } from "../types";

export function createGame(fen?: string): Chess {
  if (fen) {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }
  return new Chess();
}

export function parseSquare(sq: ChessJSSquare): Square {
  return sq as Square;
}

export function getPieceAt(game: Chess, square: Square): ChessPiece | null {
  const piece = game.get(square as ChessJSSquare);
  if (!piece) return null;
  return {
    type: piece.type as PieceType,
    color: piece.color as PieceColor,
    square: square,
  };
}

export function getPieces(game: Chess): ChessPiece[] {
  const pieces: ChessPiece[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const file = String.fromCharCode(97 + c);
      const rank = String(8 - r);
      const sq = `${file}${rank}` as Square;
      const piece = getPieceAt(game, sq);
      if (piece) pieces.push(piece);
    }
  }
  return pieces;
}

export function getPieceSymbol(type: PieceType, color: PieceColor): string {
  const symbols: Record<PieceType, string> = {
    k: color === "w" ? "♔" : "♚",
    q: color === "w" ? "♕" : "♛",
    r: color === "w" ? "♖" : "♜",
    b: color === "w" ? "♗" : "♝",
    n: color === "w" ? "♘" : "♞",
    p: color === "w" ? "♙" : "♟",
  };
  return symbols[type];
}

export function isLightSquare(square: Square): boolean {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  return (file + rank) % 2 === 0;
}

export function squareToCoords(square: Square): { row: number; col: number } {
  const col = square.charCodeAt(0) - 97;
  const row = 8 - parseInt(square[1]);
  return { row, col };
}

export function coordsToSquare(row: number, col: number): Square {
  const file = String.fromCharCode(97 + col);
  const rank = String(8 - row);
  return `${file}${rank}` as Square;
}

export function validateMove(game: Chess, from: Square, to: Square): boolean {
  try {
    const moves = game.moves({ square: from as ChessJSSquare, verbose: true });
    return moves.some((m) => m.to === to);
  } catch {
    return false;
  }
}

export function tryMove(game: Chess, from: Square, to: Square): Chess | null {
  try {
    const move = game.move({
      from: from as ChessJSSquare,
      to: to as ChessJSSquare,
    });
    if (move) {
      const newGame = new Chess(game.fen());
      return newGame;
    }
    return null;
  } catch {
    return null;
  }
}

export function getBestMoveHint(game: Chess, solutionMoves: string[]): string {
  if (solutionMoves.length === 0) return "";
  const firstMove = solutionMoves[0];
  const from = firstMove.slice(0, 2) as Square;
  const to = firstMove.slice(2, 4) as Square;
  const piece = getPieceAt(game, from);
  if (!piece) return "";
  const pieceName =
    piece.type === "k"
      ? "King"
      : piece.type === "q"
        ? "Queen"
        : piece.type === "r"
          ? "Rook"
          : piece.type === "b"
            ? "Bishop"
            : piece.type === "n"
              ? "Knight"
              : "Pawn";
  return `Move your ${pieceName} from ${from} to ${to}`;
}

export function isCheckmate(game: Chess): boolean {
  return game.isCheckmate();
}

export function isStalemate(game: Chess): boolean {
  return game.isStalemate();
}

export function getGameStatus(game: Chess): string {
  if (game.isCheckmate()) return "Checkmate!";
  if (game.isStalemate()) return "Stalemate";
  if (game.isDraw()) return "Draw";
  if (game.isCheck()) return "Check!";
  return game.turn() === "w" ? "White to move" : "Black to move";
}

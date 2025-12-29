
import { Candy } from './types';
import { CANDY_COLORS, GRID_SIZE } from './constants';

export const createBoard = (): (Candy | null)[] => {
  const board: (Candy | null)[] = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    board.push({
      id: Math.random().toString(36).substr(2, 9),
      color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)]
    });
  }
  
  let matches = checkForMatches(board);
  while (matches.length > 0) {
    matches.forEach(idx => {
      board[idx] = {
        id: Math.random().toString(36).substr(2, 9),
        color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)]
      };
    });
    matches = checkForMatches(board);
  }
  
  return board;
};

export const shuffleBoard = (currentBoard: (Candy | null)[]): (Candy | null)[] => {
    // Collect all existing candies
    const candies = currentBoard.filter(c => c !== null) as Candy[];
    const newBoard: (Candy | null)[] = new Array(GRID_SIZE * GRID_SIZE).fill(null);
    
    // Fisher-Yates Shuffle
    for (let i = candies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candies[i], candies[j]] = [candies[j], candies[i]];
    }

    // Place back carefully to avoid immediate matches if possible (simple fill for now)
    for (let i=0; i < currentBoard.length; i++) {
        if (candies.length > 0) {
            newBoard[i] = candies.pop()!;
        } else {
             // Fallback if nulls existed
             newBoard[i] = {
                id: Math.random().toString(36).substr(2, 9),
                color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)]
             };
        }
    }

    // Ensure at least one move exists, otherwise recurse
    if (!findPotentialMatch(newBoard)) {
        return shuffleBoard(newBoard);
    }

    return newBoard;
};

export const checkForMatches = (board: (Candy | null)[]) => {
  const matches = new Set<number>();
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    if (i % GRID_SIZE < GRID_SIZE - 2) {
      const rowIdxs = [i, i + 1, i + 2];
      const colors = rowIdxs.map(idx => board[idx]?.color);
      if (colors[0] && colors.every(c => c === colors[0])) {
        rowIdxs.forEach(idx => matches.add(idx));
      }
    }
  }
  for (let i = 0; i < GRID_SIZE * (GRID_SIZE - 2); i++) {
    const colIdxs = [i, i + GRID_SIZE, i + GRID_SIZE * 2];
    const colors = colIdxs.map(idx => board[idx]?.color);
    if (colors[0] && colors.every(c => c === colors[0])) {
      colIdxs.forEach(idx => matches.add(idx));
    }
  }
  return Array.from(matches);
};

export const moveIntoSquareBelow = (board: (Candy | null)[]) => {
  const newBoard = [...board];
  let moved = false;
  for (let col = 0; col < GRID_SIZE; col++) {
    const columnCandies: Candy[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      const candy = newBoard[row * GRID_SIZE + col];
      if (candy !== null) columnCandies.push(candy);
    }
    const missingCount = GRID_SIZE - columnCandies.length;
    if (missingCount > 0) {
      moved = true;
      for (let i = 0; i < missingCount; i++) {
        newBoard[i * GRID_SIZE + col] = {
          id: Math.random().toString(36).substr(2, 9),
          color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)]
        };
      }
      for (let i = 0; i < columnCandies.length; i++) {
        newBoard[(i + missingCount) * GRID_SIZE + col] = columnCandies[i];
      }
    }
  }
  return { board: newBoard, moved };
};

// Возвращает объект { swap: [i, j], match: [k, l, m...] }
export const findPotentialMatch = (board: (Candy | null)[]): { swap: number[], match: number[] } | null => {
    // Проверяем горизонтальные свапы
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE - 1; col++) {
            const i = row * GRID_SIZE + col;
            const j = i + 1;
            if (!board[i] || !board[j]) continue;
            const matchIndices = getSimulatedMatch(board, i, j);
            if (matchIndices.length > 0) return { swap: [i, j], match: matchIndices };
        }
    }
    // Проверяем вертикальные свапы
    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = 0; row < GRID_SIZE - 1; row++) {
            const i = row * GRID_SIZE + col;
            const j = i + GRID_SIZE;
            if (!board[i] || !board[j]) continue;
            const matchIndices = getSimulatedMatch(board, i, j);
            if (matchIndices.length > 0) return { swap: [i, j], match: matchIndices };
        }
    }
    return null;
};

const getSimulatedMatch = (board: (Candy | null)[], i: number, j: number): number[] => {
    const b = [...board];
    const temp = b[i];
    b[i] = b[j];
    b[j] = temp;
    return checkForMatches(b);
};

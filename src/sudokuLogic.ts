// Function to generate a valid Sudoku puzzle
export function generateSudoku() {
  // Start with an empty 9x9 grid
  const solution = Array(9).fill(null).map(() => Array(9).fill(null));
  
  // Fill the diagonal 3x3 boxes first (these can be filled independently)
  fillDiagonalBoxes(solution);
  
  // Fill the rest of the grid
  solveSudoku(solution);
  
  // Create a copy of the solution
  const puzzle = JSON.parse(JSON.stringify(solution));
  
  // Remove numbers to create the puzzle (adjust difficulty by changing the number of cells to remove)
  // For kids 10-14, we'll keep more numbers visible (remove fewer)
  removeNumbers(puzzle, 40); // Remove 40 numbers (easier puzzle)
  
  return { puzzle, solution };
}

// Fill the diagonal 3x3 boxes
function fillDiagonalBoxes(grid: number[][]) {
  for (let box = 0; box < 9; box += 3) {
    fillBox(grid, box, box);
  }
}

// Fill a 3x3 box starting at the given row and column
function fillBox(grid: number[][], row: number, col: number) {
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  let numIndex = 0;
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      grid[row + i][col + j] = nums[numIndex++];
    }
  }
}

// Shuffle an array using Fisher-Yates algorithm
function shuffle(array: number[]): number[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Solve the Sudoku puzzle using backtracking
function solveSudoku(grid: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      // Find an empty cell
      if (grid[row][col] === null) {
        // Try filling it with numbers 1-9
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          // Check if it's valid to place the number
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            
            // Recursively try to solve the rest of the puzzle
            if (solveSudoku(grid)) {
              return true;
            }
            
            // If we couldn't solve it, backtrack
            grid[row][col] = null;
          }
        }
        // If no number works, we need to backtrack
        return false;
      }
    }
  }
  // If we've filled all cells, the puzzle is solved
  return true;
}

// Check if it's valid to place a number at the given position
function isValid(grid: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) {
      return false;
    }
  }
  
  // Check column
  for (let i = 0; i < 9; i++) {
    if (grid[i][col] === num) {
      return false;
    }
  }
  
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[boxRow + i][boxCol + j] === num) {
        return false;
      }
    }
  }
  
  return true;
}

// Remove numbers from the grid to create a puzzle
function removeNumbers(grid: (number | null)[][], count: number) {
  let removed = 0;
  while (removed < count) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    
    if (grid[row][col] !== null) {
      grid[row][col] = null;
      removed++;
    }
  }
}

// Check if the current board state is a valid solution
export function isSolved(board: (number | null)[][]): boolean {
  // Check if all cells are filled
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === null) {
        return false;
      }
    }
  }
  
  // Check rows
  for (let row = 0; row < 9; row++) {
    const seen = new Set();
    for (let col = 0; col < 9; col++) {
      if (seen.has(board[row][col])) {
        return false;
      }
      seen.add(board[row][col]);
    }
  }
  
  // Check columns
  for (let col = 0; col < 9; col++) {
    const seen = new Set();
    for (let row = 0; row < 9; row++) {
      if (seen.has(board[row][col])) {
        return false;
      }
      seen.add(board[row][col]);
    }
  }
  
  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      const seen = new Set();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const value = board[boxRow + i][boxCol + j];
          if (seen.has(value)) {
            return false;
          }
          seen.add(value);
        }
      }
    }
  }
  
  return true;
}
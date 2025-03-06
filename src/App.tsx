import React, { useState, useEffect } from 'react';
import { RefreshCw, Trophy, Clock, Medal, Info } from 'lucide-react';
import { generateSudoku, isSolved } from './sudokuLogic';

interface LeaderboardEntry {
  score: number;
  time: number;
  date: Date;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function App() {
  const [board, setBoard] = useState<Array<Array<number | null>>>(Array(9).fill(null).map(() => Array(9).fill(null)));
  const [initialBoard, setInitialBoard] = useState<Array<Array<boolean>>>(Array(9).fill(null).map(() => Array(9).fill(false)));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [solution, setSolution] = useState<Array<Array<number>>>(Array(9).fill(null).map(() => Array(9).fill(0)));
  const [score, setScore] = useState<number>(0);
  const [lastMove, setLastMove] = useState<{value: number | null, correct: boolean | null, points: number} | null>(null);
  const [time, setTime] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [cellStates, setCellStates] = useState<Array<Array<{value: number | null, scored: boolean}>>>(
    Array(9).fill(null).map(() => Array(9).fill(null).map(() => ({ value: null, scored: false })))
  );

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && !isComplete) {
      interval = setInterval(() => {
        setTime(time => time + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isComplete]);

  // Generate a new game
  const newGame = () => {
    const { puzzle, solution } = generateSudoku();
    setBoard(puzzle);
    setSolution(solution);
    
    // Track which cells were initially filled
    const initialFilled = Array(9).fill(null).map(() => Array(9).fill(false));
    // Initialize cell states
    const newCellStates = Array(9).fill(null).map(() => Array(9).fill(null).map(() => ({ value: null, scored: false })));
    
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        initialFilled[i][j] = puzzle[i][j] !== null;
        if (puzzle[i][j] !== null) {
          newCellStates[i][j] = { value: puzzle[i][j], scored: false };
        }
      }
    }
    
    setInitialBoard(initialFilled);
    setCellStates(newCellStates);
    setIsComplete(false);
    setSelectedCell(null);
    setScore(0);
    setLastMove(null);
    setTime(0);
    setIsActive(true);
  };

  // Initialize the game
  useEffect(() => {
    newGame();
  }, []);

  // Check if the puzzle is solved
  useEffect(() => {
    if (board.every(row => row.every(cell => cell !== null))) {
      if (isSolved(board)) {
        setIsComplete(true);
        setIsActive(false);
        // Add to leaderboard
        setLeaderboard(prev => {
          const newEntry: LeaderboardEntry = {
            score,
            time,
            date: new Date()
          };
          const newLeaderboard = [...prev, newEntry].sort((a, b) => {
            if (a.score !== b.score) {
              return b.score - a.score; // Higher score first
            }
            return a.time - b.time; // Lower time first
          }).slice(0, 10); // Keep top 10
          return newLeaderboard;
        });
      }
    }
  }, [board]);

  // Handle cell selection
  const handleCellClick = (row: number, col: number) => {
    if (!initialBoard[row][col]) {
      setSelectedCell([row, col]);
    }
  };

  // Check if a cell value is correct
  const isCellCorrect = (row: number, col: number): boolean | null => {
    if (board[row][col] === null) return null;
    return board[row][col] === solution[row][col];
  };

  // Handle number input
  const handleNumberInput = (number: number) => {
    if (selectedCell && !initialBoard[selectedCell[0]][selectedCell[1]]) {
      const [row, col] = selectedCell;
      const currentCellState = cellStates[row][col];
      
      // Update the board
      const newBoard = [...board];
      newBoard[row][col] = number;
      setBoard(newBoard);
      
      // Check if the move is correct
      const isCorrect = number === solution[row][col];
      let pointsChange = 0;
      
      // Only adjust score if this is a new placement or a different number
      if (currentCellState.value !== number) {
        pointsChange = isCorrect ? 1 : -1;
        setScore(prevScore => prevScore + pointsChange);
      }
      
      // Update cell state
      const newCellStates = [...cellStates];
      newCellStates[row][col] = { value: number, scored: true };
      setCellStates(newCellStates);
      
      // Update last move info for feedback
      setLastMove({
        value: number,
        correct: isCorrect,
        points: pointsChange
      });
    }
  };

  // Handle clear cell
  const handleClearCell = () => {
    if (selectedCell && !initialBoard[selectedCell[0]][selectedCell[1]]) {
      const [row, col] = selectedCell;
      
      // Only proceed if there's a value to clear and it's not correct
      if (board[row][col] !== null && board[row][col] !== solution[row][col]) {
        // Update the board
        const newBoard = [...board];
        newBoard[row][col] = null;
        setBoard(newBoard);
        
        // Update cell state (but don't change score)
        const newCellStates = [...cellStates];
        newCellStates[row][col] = { value: null, scored: false };
        setCellStates(newCellStates);
        
        // Update last move info
        setLastMove({
          value: null,
          correct: null,
          points: 0 // No points for clearing
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-blue-700">Sudoku</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-gray-600 hover:text-blue-600 transition-colors"
              aria-label="Show instructions"
            >
              <Info size={20} />
            </button>
            <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">
              <Clock size={18} />
              <span className="font-bold">{formatTime(time)}</span>
            </div>
            <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg">
              <Trophy size={18} />
              <span className="font-bold">{score} pts</span>
            </div>
          </div>
        </div>

        {/* Instructions Modal */}
        {showInstructions && (
          <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-lg">
            <h2 className="font-bold mb-2">How to Play</h2>
            <ul className="space-y-1 text-sm">
              <li>• Click on an empty cell and use the number pad to fill in numbers</li>
              <li>• Fill the grid so that every row, column, and 3×3 box contains the numbers 1-9</li>
              <li>• Green numbers are correct (+1 point)</li>
              <li>• Red numbers are incorrect (-1 point)</li>
              <li>• Complete the puzzle as quickly as possible for a better score!</li>
            </ul>
          </div>
        )}
        
        {/* Last move feedback */}
        {lastMove && (
          <div className={`mb-4 p-2 rounded-lg text-sm ${
            lastMove.correct === true ? 'bg-green-100 text-green-800' : 
            lastMove.correct === false ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
            {lastMove.value === null ? (
              <p>Cell cleared</p>
            ) : (
              <p>
                {lastMove.correct ? 'Correct!' : 'Incorrect!'} 
                {lastMove.points !== 0 && (
                  <span> {lastMove.points > 0 ? `+${lastMove.points}` : lastMove.points} point{Math.abs(lastMove.points) !== 1 ? 's' : ''}</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Sudoku Board */}
        <div className="grid grid-cols-9 gap-0.5 bg-gray-300 border-2 border-gray-800 mb-6">
          {board.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const isInitial = initialBoard[rowIndex][colIndex];
              const isSelected = selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex;
              const cellCorrectness = !isInitial ? isCellCorrect(rowIndex, colIndex) : null;
              
              // Add border styling for 3x3 boxes
              const borderRight = (colIndex + 1) % 3 === 0 && colIndex < 8 ? 'border-r-2 border-gray-800' : '';
              const borderBottom = (rowIndex + 1) % 3 === 0 && rowIndex < 8 ? 'border-b-2 border-gray-800' : '';
              
              // Determine text color based on correctness
              let textColorClass = isInitial ? 'text-gray-700' : 'text-blue-600';
              if (!isInitial && cell !== null) {
                textColorClass = cellCorrectness === true ? 'text-green-600' : 
                                 cellCorrectness === false ? 'text-red-600' : textColorClass;
              }
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    aspect-square flex items-center justify-center text-xl font-medium cursor-pointer
                    ${isInitial ? 'bg-gray-100' : 'bg-white hover:bg-blue-50'} 
                    ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : ''}
                    ${textColorClass}
                    ${isInitial ? 'font-bold' : ''}
                    ${borderRight} ${borderBottom}
                  `}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell !== null ? cell : ''}
                </div>
              );
            })
          ))}
        </div>

        {/* Number Pad and Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
              <button
                key={number}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-3 rounded-lg text-xl transition-colors"
                onClick={() => handleNumberInput(number)}
              >
                {number}
              </button>
            ))}
            <button
              className="bg-red-100 hover:bg-red-200 text-red-800 font-bold py-3 rounded-lg text-xl transition-colors"
              onClick={handleClearCell}
            >
              Clear
            </button>
          </div>
          
          <button 
            onClick={newGame}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors text-lg font-semibold"
          >
            <RefreshCw size={20} />
            New Game
          </button>
        </div>

        {/* Game completion message */}
        {isComplete && (
          <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg text-center">
            <p className="text-xl font-bold">Congratulations! 🎉</p>
            <p>You solved the puzzle!</p>
            <p className="mt-2">
              Final score: <span className="font-bold">{score} points</span>
              <br />
              Time: <span className="font-bold">{formatTime(time)}</span>
            </p>
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Medal size={20} className="text-yellow-600" />
              <h2 className="text-lg font-bold text-gray-800">Leaderboard</h2>
            </div>
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div 
                  key={index}
                  className={`flex justify-between items-center p-2 rounded ${
                    index === 0 ? 'bg-yellow-50 text-yellow-900' :
                    index === 1 ? 'bg-gray-50 text-gray-900' :
                    index === 2 ? 'bg-orange-50 text-orange-900' :
                    'text-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{index + 1}.</span>
                    <span>{entry.score} points</span>
                  </div>
                  <span className="text-sm">{formatTime(entry.time)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
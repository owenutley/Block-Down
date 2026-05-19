import './index.css';

import { StrictMode, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { trpc } from './trpc';

type GameDifficulty = 'tutorial' | 'daily' | 'easy' | 'medium' | 'hard';
type BlockType = 'red-circle' | 'blue-square' | 'yellow-triangle' | 'purple-star' | 'green-leaf' | 'orange-block';
type Position = { x: number; y: number };

interface BlockData {
  pos: Position;
  type: BlockType;
}

interface DestinationData {
  pos: Position;
  type: BlockType;
}



interface LevelConfig {
  walls: Position[];
  blocks: BlockData[];
  destinations: DestinationData[];
  startPos: Position;
  gridSize: number;
}

const LEVEL_CONFIGS: Record<GameDifficulty, LevelConfig> = {
  tutorial: {
    walls: [{ x: 8, y: 7 }],
    blocks: [
      { pos: { x: 3, y: 3 }, type: 'yellow-triangle' },
      { pos: { x: 2, y: 7 }, type: 'green-leaf' },
      { pos: { x: 2, y: 2 }, type: 'red-circle' },
    ],
    destinations: [
      { pos: { x: 10, y: 3 }, type: 'yellow-triangle' },
      { pos: { x: 7, y: 0 }, type: 'green-leaf' },
      { pos: { x: 0, y: 6 }, type: 'red-circle' },
    ],
    startPos: { x: 1, y: 1 },
    gridSize: 11,
  },
  daily: {
    walls: [],
    blocks: [],
    destinations: [],
    startPos: { x: 5, y: 5 },
    gridSize: 11,
  },
  easy: {
    walls: [{ x: 9, y: 1 }],
    blocks: [
      { pos: { x: 2, y: 1 }, type: 'blue-square' },
      { pos: { x: 2, y: 6 }, type: 'red-circle' },
    ],
    destinations: [
      { pos: { x: 10, y: 6 }, type: 'red-circle' },
      { pos: { x: 8, y: 10 }, type: 'blue-square' },
    ],
    startPos: { x: 5, y: 5 },
    gridSize: 11,
  },
  medium: {
    walls: [
      { x: 1, y: 5 },
      { x: 8, y: 6 },
      { x: 4, y: 0 },
      { x: 9, y: 1 },
      { x: 2, y: 7 },
      { x: 3, y: 2 },
      { x: 10, y: 3 },
      { x: 9, y: 9 },
    ],
    blocks: [
      { pos: { x: 4, y: 9 }, type: 'green-leaf' },
      { pos: { x: 8, y: 9 }, type: 'red-circle' },
      { pos: { x: 6, y: 9 }, type: 'blue-square' },
    ],
    destinations: [
      { pos: { x: 2, y: 5 }, type: 'green-leaf' },
      { pos: { x: 9, y: 8 }, type: 'red-circle' },
      { pos: { x: 10, y: 0 }, type: 'blue-square' },
    ],
    startPos: { x: 1, y: 1 },
    gridSize: 11,
  },
  hard: {
    walls: [
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 1, y: 7 },
      { x: 2, y: 2 },
      { x: 4, y: 6 },
      { x: 5, y: 2 },
      { x: 5, y: 8 },
      { x: 6, y: 1 },
      { x: 7, y: 8 },
    ],
    blocks: [
      { pos: { x: 7, y: 3 }, type: 'red-circle' },
      { pos: { x: 4, y: 2 }, type: 'blue-square' },
      { pos: { x: 5, y: 4 }, type: 'yellow-triangle' },
      { pos: { x: 3, y: 4 }, type: 'purple-star' },
      { pos: { x: 1, y: 2 }, type: 'green-leaf' },
      { pos: { x: 7, y: 1 }, type: 'orange-block' },
    ],
    destinations: [
      { pos: { x: 4, y: 8 }, type: 'red-circle' },
      { pos: { x: 0, y: 3 }, type: 'blue-square' },
      { pos: { x: 6, y: 8 }, type: 'yellow-triangle' },
      { pos: { x: 2, y: 5 }, type: 'purple-star' },
      { pos: { x: 6, y: 3 }, type: 'green-leaf' },
      { pos: { x: 8, y: 8 }, type: 'orange-block' },
    ],
    startPos: { x: 7, y: 0 },
    gridSize: 9,
  },
};

type PuzzleDifficulty = 'tutorial' | 'easy' | 'medium' | 'hard';

const PuzzleManager = ({ onClose, onPuzzleImported }: { onClose: () => void; onPuzzleImported: () => void }) => {
  const [activeDifficulty, setActiveDifficulty] = useState<PuzzleDifficulty>('easy');
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [puzzleJson, setPuzzleJson] = useState('');
  const [showImportForm, setShowImportForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Load puzzles for current difficulty
  useEffect(() => {
    const loadPuzzles = async () => {
      try {
        setLoading(true);
        const result = await trpc.puzzle.getByDifficulty.query(activeDifficulty);
        setPuzzles(result || []);
      } catch (error) {
        console.error('Failed to load puzzles:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPuzzles();
  }, [activeDifficulty]);

  const handleImportPuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puzzleJson.trim()) {
      setImportError('Please enter puzzle JSON');
      return;
    }

    let parsedPuzzle;
    try {
      parsedPuzzle = JSON.parse(puzzleJson);
    } catch (err) {
      setImportError('Invalid JSON format');
      return;
    }

    try {
      setLoading(true);
      setImportError(null);
      await trpc.puzzle.create.mutate({
        ...parsedPuzzle,
        id: parsedPuzzle.id || `${activeDifficulty}-${Date.now()}`,
        difficulty: activeDifficulty,
      });

      setPuzzleJson('');
      setShowImportForm(false);
      onPuzzleImported();
      // Reload puzzles
      const result = await trpc.puzzle.getByDifficulty.query(activeDifficulty);
      setPuzzles(result || []);
    } catch (error) {
      console.error('Failed to create puzzle:', error);
      setImportError('Failed to create puzzle. Check that your JSON matches the required shape.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePuzzle = async (puzzleId: string) => {
    try {
      setLoading(true);
      await trpc.puzzle.delete.mutate(puzzleId);
      // Reload puzzles
      const result = await trpc.puzzle.getByDifficulty.query(activeDifficulty);
      setPuzzles(result || []);
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Failed to delete puzzle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllPuzzles = async () => {
    try {
      setLoading(true);
      await trpc.puzzle.clearAll.mutate();
      // Reload puzzles
      const result = await trpc.puzzle.getByDifficulty.query(activeDifficulty);
      setPuzzles(result || []);
      setConfirmClearAll(false);
    } catch (error) {
      console.error('Failed to clear puzzles:', error);
    } finally {
      setLoading(false);
    }
  };

  const difficultyColors: Record<GameDifficulty, string> = {
    tutorial: 'border-blue-500 neon-blue text-blue-300',
    daily: 'border-purple-500 neon-purple text-purple-300',
    easy: 'border-green-500 neon-green text-green-300',
    medium: 'border-yellow-400 neon-yellow text-yellow-300',
    hard: 'border-red-500 neon-red text-red-300',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black text-white">Puzzle Manager</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl transition"
          >
            ✕
          </button>
        </div>

        {/* Difficulty Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['tutorial', 'easy', 'medium', 'hard'] as PuzzleDifficulty[]).map(diff => (
            <button
              key={diff}
              onClick={() => setActiveDifficulty(diff)}
              className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
                activeDifficulty === diff
                  ? `bg-black/60 border ${difficultyColors[diff]}`
                  : 'bg-black/40 border border-white/20 text-white/60 hover:text-white/80'
              }`}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>

        {/* Import Form */}
        {showImportForm && (
          <form onSubmit={handleImportPuzzle} className="mb-6 p-4 bg-black/40 rounded-lg border border-blue-500/50 flex flex-col gap-3">
            <label className="block text-white/90 text-sm font-bold">Puzzle JSON</label>
            <textarea
              value={puzzleJson}
              onChange={(e) => {
                setPuzzleJson(e.target.value);
                setImportError(null);
              }}
              placeholder='{"title": "My Puzzle", "blocks": [[1,2]], "target": 50}'
              className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 min-h-[100px] font-mono text-sm"
              autoFocus
            />
            {importError && (
              <div className="text-red-400 text-sm font-bold">{importError}</div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="submit"
                disabled={loading || !puzzleJson.trim()}
                className="px-4 py-2 bg-green-500/30 border border-green-500 text-green-300 rounded-lg font-bold hover:bg-green-500/50 disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowImportForm(false);
                  setPuzzleJson('');
                  setImportError(null);
                }}
                className="px-4 py-2 bg-red-500/30 border border-red-500 text-red-300 rounded-lg font-bold hover:bg-red-500/50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Puzzles List */}
        <div className="flex-1 overflow-y-auto mb-6">
          {loading ? (
            <div className="text-white/60 text-center py-8">Loading puzzles...</div>
          ) : puzzles.length === 0 ? (
            <div className="text-white/60 text-center py-8">No puzzles for {activeDifficulty}</div>
          ) : (
            <div className="space-y-2">
              {puzzles.map((puzzle) => (
                <div key={puzzle.id} className="flex flex-col gap-2 p-3 bg-black/40 rounded-lg border border-white/10 hover:border-white/20 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold truncate">{puzzle.title}</h3>
                      <p className="text-white/60 text-sm">ID: {puzzle.id}</p>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => setConfirmDeleteId(puzzle.id)}
                        className="px-3 py-1 bg-red-500/30 border border-red-500 text-red-300 text-sm rounded-lg font-bold hover:bg-red-500/50 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {confirmDeleteId === puzzle.id && (
                    <div className="mt-2 p-3 bg-red-900/30 border border-red-500/50 rounded flex justify-between items-center">
                      <span className="text-red-300 text-sm font-bold">Are you sure?</span>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-sm bg-black/60 text-white rounded">Cancel</button>
                        <button onClick={() => handleDeletePuzzle(puzzle.id)} className="px-2 py-1 text-sm bg-red-500 text-white rounded font-bold">Yes, Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {confirmClearAll ? (
          <div className="flex flex-col gap-3 p-4 bg-red-900/30 border border-red-500 rounded-lg mb-4">
            <p className="text-red-300 font-bold text-center">WARNING: This will delete ALL puzzles across ALL difficulties and reset the database. This action cannot be undone. Are you absolutely sure?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClearAll(false)} className="flex-1 px-6 py-3 bg-black/60 border border-white/20 text-white rounded-lg font-bold hover:bg-black/80 transition">
                Cancel
              </button>
              <button onClick={handleClearAllPuzzles} className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition">
                Yes, Reset Everything
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            {!showImportForm && (
              <button
                onClick={() => setShowImportForm(true)}
                className="flex-1 px-6 py-3 bg-blue-500/30 border border-blue-500 text-blue-300 rounded-lg font-bold hover:bg-blue-500/50 transition"
              >
                + Import Puzzle
              </button>
            )}
            <button
              onClick={() => setConfirmClearAll(true)}
              className="flex-1 px-6 py-3 bg-red-500/30 border border-red-500 text-red-300 rounded-lg font-bold hover:bg-red-500/50 transition"
            >
              Factory Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-purple-500/30 border border-purple-500 text-purple-300 rounded-lg font-bold hover:bg-purple-500/50 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Menu = ({ onSelectDifficulty }: { onSelectDifficulty: (difficulty: GameDifficulty) => void }) => {
  const [showPuzzleManager, setShowPuzzleManager] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-mesh-gradient px-4">
      <h1 className="text-center text-6xl font-black neon-text-title tracking-tight">
        Block Down
      </h1>

      <div className="flex w-full max-w-sm flex-col gap-4">
        {[
          { id: 'tutorial', label: 'Tutorial', color: 'border-blue-500 neon-blue text-blue-300' },
          { id: 'daily', label: 'Daily Puzzle', color: 'border-purple-500 neon-purple text-purple-300' },
          { id: 'easy', label: 'Easy Puzzle', color: 'border-green-500 neon-green text-green-300' },
          { id: 'medium', label: 'Medium Puzzle', color: 'border-yellow-400 neon-yellow text-yellow-300' },
          { id: 'hard', label: 'Hard Puzzle', color: 'border-red-500 neon-red text-red-300' },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => onSelectDifficulty(btn.id as GameDifficulty)}
            className={`rounded-2xl bg-black/60 border ${btn.color} px-6 py-4 text-xl font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Puzzle Manager Button - Bottom Left */}
      <div className="absolute bottom-6 left-6">
        <button
          onClick={() => setShowPuzzleManager(true)}
          className="px-4 py-2 bg-black/60 border border-cyan-500 neon-cyan text-cyan-300 rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <span>⚙️</span>
          <span>Manage Puzzles</span>
        </button>
      </div>

      {/* Puzzle Manager Modal */}
      {showPuzzleManager && (
        <PuzzleManager
          onClose={() => setShowPuzzleManager(false)}
          onPuzzleImported={() => {
            // Refresh or handle puzzle import
          }}
        />
      )}
    </div>
  );
};

const GameBoard = ({ difficulty, onReturnToMenu }: { difficulty: GameDifficulty; onReturnToMenu: () => void }) => {
  const levelConfig = LEVEL_CONFIGS[difficulty];
  const [playerPos, setPlayerPos] = useState<Position>(levelConfig.startPos);
  const [blockPositions, setBlockPositions] = useState<BlockData[]>(levelConfig.blocks);
  const [history, setHistory] = useState<{ playerPos: Position; blockPositions: BlockData[] }[]>([]);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Check win condition whenever blocks change
  useEffect(() => {
    if (levelConfig.destinations.length === 0) return;

    const allBlocksInPlace = levelConfig.destinations.every((destination) => {
      return blockPositions.some(
        (block) =>
          block.pos.x === destination.pos.x &&
          block.pos.y === destination.pos.y &&
          block.type === destination.type
      );
    });

    if (allBlocksInPlace) {
      setIsPuzzleSolved(true);
      const timer = setTimeout(() => {
        setIsWon(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setIsPuzzleSolved(false);
      setIsWon(false);
    }
  }, [blockPositions, levelConfig]);

  const difficultyLabels: Record<GameDifficulty, string> = {
    tutorial: 'Tutorial',
    daily: 'Daily Puzzle',
    easy: 'Easy Puzzles',
    medium: 'Medium Puzzle',
    hard: 'Hard Puzzles',
  };

  const positionKey = (pos: Position) => `${pos.x},${pos.y}`;
  const wallSet = new Set(levelConfig.walls.map(positionKey));
  const blockMap = new Map(blockPositions.map((block, idx) => [positionKey(block.pos), idx]));
  const destinationMap = new Map(levelConfig.destinations.map((dest) => [positionKey(dest.pos), dest]));

  const canOccupy = (pos: Position, includeBlocks: boolean = true) => {
    if (pos.x < 0 || pos.x >= levelConfig.gridSize || pos.y < 0 || pos.y >= levelConfig.gridSize) {
      return false;
    }
    if (wallSet.has(positionKey(pos))) {
      return false;
    }
    if (includeBlocks && blockMap.has(positionKey(pos))) {
      return false;
    }
    return true;
  };

  const pushBlock = (blockPos: Position, direction: Position): Position => {
    let currentPos = { ...blockPos };
    let nextPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };

    while (canOccupy(nextPos, false) && !wallSet.has(positionKey(nextPos))) {
      const blockAtNext = blockMap.has(positionKey(nextPos));
      if (blockAtNext) {
        break;
      }
      currentPos = nextPos;
      nextPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };
    }

    return currentPos;
  };

  const movePlayer = (direction: Position) => {
    if (isPuzzleSolved) return;

    const newPos = { x: playerPos.x + direction.x, y: playerPos.y + direction.y };

    if (!canOccupy(newPos, false)) {
      return;
    }

    let newBlockPositions = blockPositions;

    const blockIdx = blockMap.get(positionKey(newPos));
    if (blockIdx !== undefined) {
      const block = blockPositions[blockIdx];
      if (!block) return;
      const oldBlockPos = block.pos;
      const blockNewPos = pushBlock(oldBlockPos, direction);

      // Only allow movement if the block actually moved
      if (blockNewPos.x === oldBlockPos.x && blockNewPos.y === oldBlockPos.y) {
        return;
      }

      newBlockPositions = [...blockPositions];
      newBlockPositions[blockIdx] = { ...block, pos: blockNewPos };
    }

    setHistory(prev => [...prev, { playerPos, blockPositions }]);
    setBlockPositions(newBlockPositions);
    setPlayerPos(newPos);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          movePlayer({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePlayer({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          movePlayer({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePlayer({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, blockPositions]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const touchEnd = { x: touch.clientX, y: touch.clientY };
    const dx = touchEnd.x - touchStartPos.current.x;
    const dy = touchEnd.y - touchStartPos.current.y;
    const threshold = 30;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > threshold) {
        movePlayer({ x: dx > 0 ? 1 : -1, y: 0 });
      }
    } else {
      if (Math.abs(dy) > threshold) {
        movePlayer({ x: 0, y: dy > 0 ? 1 : -1 });
      }
    }

    touchStartPos.current = null;
  };

  const handleUndo = () => {
    if (history.length === 0 || isWon) return;
    const lastState = history[history.length - 1];
    if (!lastState) return;
    setHistory(prev => prev.slice(0, -1));
    setPlayerPos(lastState.playerPos);
    setBlockPositions(lastState.blockPositions);
  };

  const handleUndoFive = () => {
    if (history.length === 0 || isWon) return;
    const stepsToUndo = Math.min(5, history.length);
    const targetState = history[history.length - stepsToUndo];
    if (!targetState) return;
    setHistory(prev => prev.slice(0, -stepsToUndo));
    setPlayerPos(targetState.playerPos);
    setBlockPositions(targetState.blockPositions);
  };

  const handleReset = () => {
    setPlayerPos(levelConfig.startPos);
    setBlockPositions(levelConfig.blocks);
    setHistory([]);
    setIsPuzzleSolved(false);
    setIsWon(false);
  };

  const getBlockStyle = (blockType: BlockType) => {
    switch (blockType) {
      case 'red-circle':
        return { bg: 'bg-black/60', border: 'border border-red-500 neon-red', emoji: '', innerBg: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' };
      case 'blue-square':
        return { bg: 'bg-black/60', border: 'border border-blue-500 neon-blue', emoji: '', innerBg: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' };
      case 'yellow-triangle':
        return { bg: 'bg-black/60', border: 'border border-yellow-400 neon-yellow', emoji: '', innerBg: 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]' };
      case 'purple-star':
        return { bg: 'bg-black/60', border: 'border border-purple-500 neon-purple', emoji: '', innerBg: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]' };
      case 'green-leaf':
        return { bg: 'bg-black/60', border: 'border border-green-500 neon-green', emoji: '', innerBg: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' };
      case 'orange-block':
        return { bg: 'bg-black/60', border: 'border border-orange-500 neon-orange', emoji: '', innerBg: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' };
      default:
        return { bg: 'bg-black/60', border: 'border border-white/50', emoji: '', innerBg: 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' };
    }
  };

  const getDestinationStyle = (destType: BlockType) => {
    switch (destType) {
      case 'red-circle':
        return { bg: 'bg-red-900/30', border: 'border border-red-500/80 border-dashed neon-red', emoji: '' };
      case 'blue-square':
        return { bg: 'bg-blue-900/30', border: 'border border-blue-500/80 border-dashed neon-blue', emoji: '' };
      case 'yellow-triangle':
        return { bg: 'bg-yellow-900/30', border: 'border border-yellow-500/80 border-dashed neon-yellow', emoji: '' };
      case 'purple-star':
        return { bg: 'bg-purple-900/30', border: 'border border-purple-500/80 border-dashed neon-purple', emoji: '' };
      case 'green-leaf':
        return { bg: 'bg-green-900/30', border: 'border border-green-500/80 border-dashed neon-green', emoji: '' };
      case 'orange-block':
        return { bg: 'bg-orange-900/30', border: 'border border-orange-500/80 border-dashed neon-orange', emoji: '' };
      default:
        return { bg: 'bg-white/10', border: 'border border-white/50 border-dashed', emoji: '' };
    }
  };

  if (isWon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-mesh-gradient px-4">
        <div className="text-center glass-panel p-8 rounded-3xl animate-float">
          <h1 className="text-5xl font-black text-white mb-2 drop-shadow-md">You Won!</h1>
          <p className="text-xl text-white/90 mb-8 font-medium">
            All blocks are in their correct positions!
          </p>
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={handleReset}
              className="rounded-xl bg-black/60 border border-green-500 neon-green text-green-300 px-6 py-4 text-xl font-bold transition-all transform hover:scale-105 active:scale-95"
            >
              Play Again
            </button>
            <button
              onClick={onReturnToMenu}
              className="rounded-xl bg-black/60 border border-purple-500 neon-purple text-purple-300 px-6 py-4 text-xl font-bold transition-all transform hover:scale-105 active:scale-95"
            >
              Return to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalBlocks = levelConfig.destinations.length;
  const blocksInPlace = levelConfig.destinations.filter(destination =>
    blockPositions.some(block =>
      block.pos.x === destination.pos.x &&
      block.pos.y === destination.pos.y &&
      block.type === destination.type
    )
  ).length;
  const progressPercent = totalBlocks > 0 ? (blocksInPlace / totalBlocks) * 100 : 0;

  return (
    <div className="flex min-h-screen flex-col bg-mesh-gradient px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-black text-white drop-shadow-md">{difficultyLabels[difficulty]}</h1>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={handleUndo}
            disabled={history.length === 0 || isWon}
            className={`rounded-xl px-4 py-2 text-sm sm:text-base font-bold transition-all ${history.length === 0 || isWon ? 'bg-black/60 border border-white/10 text-white/30 cursor-not-allowed' : 'bg-black/60 border border-cyan-400 neon-cyan text-cyan-300 hover:scale-105 active:scale-95'}`}
          >
            Undo
          </button>
          <button
            onClick={handleUndoFive}
            disabled={history.length === 0 || isWon}
            className={`rounded-xl px-4 py-2 text-sm sm:text-base font-bold transition-all ${history.length === 0 || isWon ? 'bg-black/60 border border-white/10 text-white/30 cursor-not-allowed' : 'bg-black/60 border border-blue-400 neon-blue text-blue-300 hover:scale-105 active:scale-95'}`}
          >
            Undo 5
          </button>
          <button
            onClick={handleReset}
            className="rounded-xl bg-black/60 border border-red-500 neon-red text-red-300 px-4 py-2 text-sm sm:text-base font-bold transition-all hover:scale-105 active:scale-95"
          >
            Reset
          </button>
          <button
            onClick={onReturnToMenu}
            className="rounded-xl bg-black/60 border border-purple-500 neon-purple text-purple-300 px-4 py-2 text-sm sm:text-base font-bold transition-all hover:scale-105 active:scale-95"
          >
            Menu
          </button>
        </div>
      </div>

      {totalBlocks > 0 && (
        <div className="w-full max-w-2xl mx-auto mb-4 sm:mb-6">
          <div className="flex justify-between text-white/90 text-sm font-bold mb-2 px-1">
            <span>Progress</span>
            <span>{blocksInPlace} / {totalBlocks}</span>
          </div>
          <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div
        className="flex-1 flex items-center justify-center w-full overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="glass-panel p-1 sm:p-2 relative rounded-2xl sm:rounded-3xl"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${levelConfig.gridSize}, 1fr)`,
            gap: '1px',
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: 'fit-content',
            aspectRatio: '1'
          }}
        >
          {Array.from({ length: levelConfig.gridSize * levelConfig.gridSize }).map((_, i) => {
            const x = i % levelConfig.gridSize;
            const y = Math.floor(i / levelConfig.gridSize);
            const key = positionKey({ x, y });

            const hasWall = wallSet.has(key);
            const destination = destinationMap.get(key);
            const hasDestination = destination !== undefined;

            let bgColor = 'glass-cell';
            let borderStyle = '';
            let emoji = '';
            let shadowStyle = '';
            let radiusStyle = 'rounded-md sm:rounded-lg md:rounded-xl';

            if (hasWall) {
              bgColor = 'bg-gray-800/80 dark:bg-black/80 backdrop-blur-sm';
              borderStyle = 'border-2 border-gray-600';
              emoji = '';
              shadowStyle = 'shadow-inner';
              radiusStyle = 'rounded-none';
            } else if (hasDestination) {
              const destStyle = getDestinationStyle(destination!.type);
              bgColor = `${destStyle.bg} animate-pulse-glow bg-opacity-40 backdrop-blur-sm`;
              borderStyle = destStyle.border;
              emoji = destStyle.emoji;
            }

            return (
              <div
                key={i}
                className={`aspect-square w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 ${radiusStyle} flex items-center justify-center text-lg sm:text-2xl font-bold transition-all ${bgColor} ${borderStyle} ${shadowStyle}`}
              >
                {emoji}
              </div>
            );
          })}

          <div
            className="absolute"
            style={{
              top: 'var(--grid-padding)',
              left: 'var(--grid-padding)',
              right: 'var(--grid-padding)',
              bottom: 'var(--grid-padding)',
              pointerEvents: 'none'
            }}
          >
            {blockPositions.map((block, idx) => {
              const destination = destinationMap.get(positionKey(block.pos));
              const isOnDestination = destination !== undefined;
              const isCorrectDestination = isOnDestination && destination!.type === block.type;

              const blockStyle = getBlockStyle(block.type);
              let content;

              if (isCorrectDestination) {
                const parts = blockStyle.innerBg.split(' ');
                const bgColorClass = parts[0];
                const shadowClass = parts[1] ? parts[1].replace('10px', '25px').replace('0.8)]', '1)]') : '';
                
                content = (
                  <div className={`w-full h-full rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center ${bgColorClass} ${shadowClass} border-2 border-white/50 animate-pulse-glow`}>
                  </div>
                );
              } else {
                content = (
                  <div className={`w-full h-full rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center text-lg sm:text-2xl font-bold ${blockStyle.bg} ${blockStyle.border}`}>
                    <div className={`w-1/2 h-1/2 rounded-full ${blockStyle.innerBg}`}></div>
                  </div>
                );
              }

              return (
                <div
                  key={`block-${idx}`}
                  className={`absolute animate-slide aspect-square w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10`}
                  style={{
                    transform: `translate(calc(${block.pos.x} * (var(--cell-size) + 1px)), calc(${block.pos.y} * (var(--cell-size) + 1px)))`,
                  }}
                >
                  {content}
                </div>
              );
            })}

            {(() => {
              const borderStyle = 'border border-white/80 neon-white';
              return (
                <div
                  className={`absolute animate-slide aspect-square w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10`}
                  style={{
                    transform: `translate(calc(${playerPos.x} * (var(--cell-size) + 1px)), calc(${playerPos.y} * (var(--cell-size) + 1px)))`,
                  }}
                >
                  <div className={`w-full h-full rounded-full flex items-center justify-center bg-black/60 ${borderStyle}`}>
                    <div className="w-1/2 h-1/2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export const App = () => {
  const [currentScreen, setCurrentScreen] = useState<{ type: 'menu' } | { type: 'game'; difficulty: GameDifficulty }>({ type: 'menu' });

  const handleSelectDifficulty = (difficulty: GameDifficulty) => {
    setCurrentScreen({ type: 'game', difficulty });
  };

  const handleReturnToMenu = () => {
    setCurrentScreen({ type: 'menu' });
  };

  return (
    <>
      {currentScreen.type === 'menu' ? (
        <Menu onSelectDifficulty={handleSelectDifficulty} />
      ) : (
        <GameBoard difficulty={currentScreen.difficulty} onReturnToMenu={handleReturnToMenu} />
      )}
    </>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

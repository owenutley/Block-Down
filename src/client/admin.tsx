import React, { useEffect, useState } from 'react';
import { trpc } from './trpc';
import { showToast } from '@devvit/web/client';
import { Puzzle, PuzzleDifficulty } from '../shared/types';
import { cn } from './utils';
import { playSlideSound, playThudSound, playMatchSound, playWinMelody } from './utils/audio';

export function Admin() {
  const [activeTab, setActiveTab] = useState<PuzzleDifficulty>('easy');
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // States for puzzle list
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [allPuzzles, setAllPuzzles] = useState<Puzzle[]>([]);
  const [selectedDailyPostPuzzleId, setSelectedDailyPostPuzzleId] = useState('');
  const [creatingDailyPost, setCreatingDailyPost] = useState(false);
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);
  const [activePuzzleId, setActivePuzzleId] = useState<string | null>(null);

  // Form states
  const [puzzleName, setPuzzleName] = useState('');
  const [puzzleJson, setPuzzleJson] = useState('');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Visual Editor states
  const [editMode, setEditMode] = useState<'visual' | 'json'>('visual');
  const [gridWidth, setGridWidth] = useState(9);
  const [gridHeight, setGridHeight] = useState(9);
  const [editorPlayer, setEditorPlayer] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [editorWalls, setEditorWalls] = useState<{ x: number, y: number }[]>([]);
  const [editorBlocks, setEditorBlocks] = useState<{ id: string, color: string, x: number, y: number }[]>([]);
  const [editorTargets, setEditorTargets] = useState<{ id: string, color: string, x: number, y: number }[]>([]);
  const [editorMoves, setEditorMoves] = useState<string[]>([]);
  const [selectedTool, setSelectedTool] = useState<'wall' | 'player' | 'block' | 'target' | 'eraser'>('wall');
  const [selectedColor, setSelectedColor] = useState<string>('red');

  // Playtest states
  const [playtestActive, setPlaytestActive] = useState(false);
  const [playtestPlayer, setPlaytestPlayer] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [playtestBlocks, setPlaytestBlocks] = useState<{ id: string, color: string, x: number, y: number }[]>([]);
  const [playtestMoves, setPlaytestMoves] = useState<string[]>([]);
  const [playtestSolved, setPlaytestSolved] = useState(false);

  // Check admin status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await trpc.admin.checkAuth.query();
        setIsAdmin(result.isAdmin);
        setUsername(result.username || null);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch puzzles when tab changes
  useEffect(() => {
    if (isAdmin) {
      loadPuzzles();
      loadAllPuzzles();
      resetForm();
    }
  }, [activeTab, isAdmin]);

  const loadAllPuzzles = async () => {
    try {
      const data = await trpc.admin.getAllPuzzles.query();
      setAllPuzzles(data);
    } catch (error) {
      console.error('Failed to load all puzzles for daily post selection', error);
      showToast({ text: 'Failed to load puzzle list', appearance: 'neutral' });
    }
  };

  const handleCreateDailyPost = async () => {
    if (!selectedDailyPostPuzzleId) {
      showToast({ text: 'Select a puzzle to publish', appearance: 'neutral' });
      return;
    }

    setCreatingDailyPost(true);
    try {
      let dateParam: string | undefined = undefined;
      if (selectedDailyPostPuzzleId.startsWith('daily-')) {
        const datePart = selectedDailyPostPuzzleId.replace('daily-', '');
        if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dateParam = datePart;
        }
      }

      await trpc.admin.createDailyPost.mutate({
        puzzleId: selectedDailyPostPuzzleId,
        date: dateParam,
      });
      showToast({ text: 'Daily post created successfully!', appearance: 'success' });
    } catch (error) {
      console.error(error);
      showToast({ text: 'Failed to create daily post', appearance: 'neutral' });
    } finally {
      setCreatingDailyPost(false);
    }
  };

  // Visual state -> JSON String synchronization
  useEffect(() => {
    if (editMode === 'visual') {
      const obj = {
        width: gridWidth,
        height: gridHeight,
        player: editorPlayer,
        walls: editorWalls,
        blocks: editorBlocks,
        targets: editorTargets,
        playerMoves: editorMoves
      };
      setPuzzleJson(JSON.stringify(obj, null, 2));
    }
  }, [gridWidth, gridHeight, editorPlayer, editorWalls, editorBlocks, editorTargets, editorMoves, editMode]);

  // JSON String -> Visual state synchronization
  useEffect(() => {
    if (editMode === 'json') return; // Don't parse while editing raw JSON text
    try {
      if (!puzzleJson.trim()) return;
      const parsed = JSON.parse(puzzleJson);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.width === 'number') setGridWidth(parsed.width);
        if (typeof parsed.height === 'number') setGridHeight(parsed.height);
        if (parsed.player && typeof parsed.player.x === 'number' && typeof parsed.player.y === 'number') {
          setEditorPlayer(parsed.player);
        }
        if (Array.isArray(parsed.walls)) setEditorWalls(parsed.walls);
        if (Array.isArray(parsed.blocks)) setEditorBlocks(parsed.blocks);
        if (Array.isArray(parsed.targets)) setEditorTargets(parsed.targets);
        if (Array.isArray(parsed.playerMoves)) setEditorMoves(parsed.playerMoves);
      }
    } catch (e) {
      // Don't log syntax errors while user is typing invalid JSON
    }
  }, [puzzleJson, editMode]);

  const loadPuzzles = async () => {
    setLoadingPuzzles(true);
    try {
      const data = await trpc.puzzle.getByDifficulty.query(activeTab);
      setPuzzles(data);
      if (activeTab === 'splash' || activeTab === 'tutorial') {
        const activePuzzle = await trpc.puzzle.getActive.query(activeTab);
        setActivePuzzleId(activePuzzle ? activePuzzle.id : null);
      } else {
        setActivePuzzleId(null);
      }
    } catch (error) {
      showToast({ text: 'Failed to load puzzles', appearance: 'neutral' });
    } finally {
      setLoadingPuzzles(false);
    }
  };

  const handleSetActive = async (puzzleId: string) => {
    if (activeTab !== 'splash' && activeTab !== 'tutorial') return;
    try {
      await trpc.admin.setActive.mutate({ type: activeTab, puzzleId });
      setActivePuzzleId(puzzleId);
      showToast({ text: 'Active puzzle updated', appearance: 'success' });
    } catch (e) {
      showToast({ text: 'Failed to set active puzzle', appearance: 'neutral' });
    }
  };

  const resetForm = () => {
    setPuzzleName('');
    setPuzzleJson('');
    setEditingId(null);
    setGridWidth(9);
    setGridHeight(9);
    setEditorPlayer({ x: 0, y: 0 });
    setEditorWalls([]);
    setEditorBlocks([]);
    setEditorTargets([]);
    setEditorMoves([]);
  };

  const handleEdit = (puzzle: Puzzle) => {
    setEditingId(puzzle.id);
    setPuzzleName(puzzle.name);
    // Remove auto-injected fields to keep the JSON clean for editing
    const { id, name, difficulty, createdAt, ...cleanJson } = puzzle as any;
    setPuzzleJson(JSON.stringify(cleanJson, null, 2));

    if (puzzle.difficulty === 'daily') {
      const dateStr = puzzle.id.replace('daily-', '');
      if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        setDailyDate(dateStr);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puzzleName || !puzzleJson) {
      showToast({ text: 'Please provide a name and JSON', appearance: 'neutral' });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(puzzleJson);
    } catch (err) {
      showToast({ text: 'Invalid JSON format', appearance: 'neutral' });
      return;
    }

    let finalId = editingId;
    
    // Auto-generate ID if creating new
    if (!finalId) {
      if (activeTab === 'daily') {
        finalId = `daily-${dailyDate}`;
        // Automatically overwrite if exists, as confirm is blocked in iframe
      } else {
        finalId = `${activeTab}-${Date.now()}`;
      }
    }

    try {
      const payload = {
        ...parsed,
        id: finalId,
        name: puzzleName,
        difficulty: activeTab,
      };

      await trpc.admin.createPuzzle.mutate(payload);

      // If it's a daily puzzle, make sure to assign it
      if (activeTab === 'daily') {
        await trpc.admin.assignDaily.mutate({
          puzzleId: finalId,
          date: dailyDate
        });
      }

      showToast({ text: 'Puzzle saved successfully!', appearance: 'success' });
      resetForm();
      loadPuzzles();
    } catch (error) {
      console.error(error);
      showToast({ text: 'Failed to save puzzle. Check JSON format.', appearance: 'neutral' });
    }
  };

  const handleDeletePuzzle = async (puzzleId: string) => {
    try {
      await trpc.admin.deletePuzzle.mutate(puzzleId);
      showToast({ text: 'Puzzle deleted successfully!', appearance: 'success' });
      setConfirmDeleteId(null);
      loadPuzzles();
    } catch (error) {
      showToast({ text: 'Failed to delete puzzle', appearance: 'neutral' });
    }
  };

  const handleClone = async (puzzle: Puzzle, targetDifficulty: PuzzleDifficulty) => {
    try {
      let finalId = `${targetDifficulty}-${Date.now()}`;
      if (targetDifficulty === 'daily') {
        finalId = `daily-${dailyDate}`;
      }

      const payload = {
        id: finalId,
        name: puzzle.name,
        difficulty: targetDifficulty,
        width: puzzle.width,
        height: puzzle.height,
        player: puzzle.player,
        walls: puzzle.walls,
        blocks: puzzle.blocks,
        targets: puzzle.targets,
        playerMoves: puzzle.playerMoves,
      };

      await trpc.admin.createPuzzle.mutate(payload);

      if (targetDifficulty === 'daily') {
        await trpc.admin.assignDaily.mutate({
          puzzleId: finalId,
          date: dailyDate,
        });
      }

      showToast({ text: `Puzzle cloned to ${targetDifficulty}!`, appearance: 'success' });
      loadPuzzles();
    } catch (error) {
      console.error(error);
      showToast({ text: 'Failed to clone puzzle', appearance: 'neutral' });
    }
  };


  const getBlockColorClass = (color: string) => {
    switch (color.toLowerCase()) {
      case 'red': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      case 'blue': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]';
      case 'yellow': return 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]';
      case 'purple': return 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]';
      case 'green': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
      case 'orange': return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]';
      default: return 'bg-white';
    }
  };

  const getTargetColorClass = (color: string) => {
    switch (color.toLowerCase()) {
      case 'red': return 'border-2 border-dashed border-red-500 bg-red-500/20';
      case 'blue': return 'border-2 border-dashed border-blue-500 bg-blue-500/20';
      case 'yellow': return 'border-2 border-dashed border-yellow-400 bg-yellow-400/20';
      case 'purple': return 'border-2 border-dashed border-purple-500 bg-purple-500/20';
      case 'green': return 'border-2 border-dashed border-green-500 bg-green-500/20';
      case 'orange': return 'border-2 border-dashed border-orange-500 bg-orange-500/20';
      default: return 'border border-dashed border-white bg-white/15';
    }
  };

  const handleCellClick = (x: number, y: number) => {
    // Clear any existing element at this cell
    const cleanCell = () => {
      setEditorWalls(prev => prev.filter(w => w.x !== x || w.y !== y));
      setEditorBlocks(prev => prev.filter(b => b.x !== x || b.y !== y));
      setEditorTargets(prev => prev.filter(t => t.x !== x || t.y !== y));
    };

    if (selectedTool === 'eraser') {
      cleanCell();
    } else if (selectedTool === 'wall') {
      cleanCell();
      setEditorWalls(prev => [...prev, { x, y }]);
    } else if (selectedTool === 'player') {
      cleanCell();
      setEditorPlayer({ x, y });
    } else if (selectedTool === 'block') {
      cleanCell();
      const id = `b_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      setEditorBlocks(prev => [...prev, { id, color: selectedColor, x, y }]);
    } else if (selectedTool === 'target') {
      cleanCell();
      const id = `t_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      setEditorTargets(prev => [...prev, { id, color: selectedColor, x, y }]);
    }
  };

  const startPlaytest = () => {
    setPlaytestPlayer({ ...editorPlayer });
    setPlaytestBlocks(editorBlocks.map(b => ({ ...b })));
    setPlaytestMoves([]);
    setPlaytestSolved(false);
    setPlaytestActive(true);
  };

  useEffect(() => {
    if (!playtestActive || playtestSolved) return;

    const handlePlaytestKeyDown = (e: KeyboardEvent) => {
      let dir = { x: 0, y: 0 };
      let moveStr = '';
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dir = { x: 0, y: -1 };
          moveStr = 'Up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dir = { x: 0, y: 1 };
          moveStr = 'Down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dir = { x: -1, y: 0 };
          moveStr = 'Left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dir = { x: 1, y: 0 };
          moveStr = 'Right';
          break;
        default:
          return;
      }

      e.preventDefault();
      
      const wallSet = new Set(editorWalls.map(w => `${w.x},${w.y}`));
      const blockMap = new Map(playtestBlocks.map((b, idx) => [`${b.x},${b.y}`, idx]));

      const canOccupy = (pos: {x: number, y: number}, includeBlocks = true) => {
        if (pos.x < 0 || pos.x >= gridWidth || pos.y < 0 || pos.y >= gridHeight) return false;
        if (wallSet.has(`${pos.x},${pos.y}`)) return false;
        if (includeBlocks && blockMap.has(`${pos.x},${pos.y}`)) return false;
        return true;
      };

      const pushBlock = (blockPos: {x: number, y: number}, direction: {x: number, y: number}) => {
        let currentPos = { ...blockPos };
        let nextPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };
        while (canOccupy(nextPos, false) && !wallSet.has(`${nextPos.x},${nextPos.y}`)) {
          if (blockMap.has(`${nextPos.x},${nextPos.y}`)) break;
          currentPos = nextPos;
          nextPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };
        }
        return currentPos;
      };

      const newPos = { x: playtestPlayer.x + dir.x, y: playtestPlayer.y + dir.y };
      
      if (!canOccupy(newPos, false)) {
        playThudSound();
        return;
      }

      let newBlocks = playtestBlocks;
      let didBlockMatch = false;

      const blockIdx = blockMap.get(`${newPos.x},${newPos.y}`);
      if (blockIdx !== undefined) {
        const block = playtestBlocks[blockIdx];
        if (!block) return;
        const oldBlockPos = { x: block.x, y: block.y };
        const blockNewPos = pushBlock(oldBlockPos, dir);

        if (blockNewPos.x === oldBlockPos.x && blockNewPos.y === oldBlockPos.y) {
          playThudSound();
          return;
        }

        const destMatch = editorTargets.find(t => t.x === blockNewPos.x && t.y === blockNewPos.y && t.color === block.color);
        if (destMatch) {
          didBlockMatch = true;
        }

        newBlocks = [...playtestBlocks];
        newBlocks[blockIdx] = { ...block, x: blockNewPos.x, y: blockNewPos.y };
      }

      if (didBlockMatch) {
        playMatchSound();
      } else {
        playSlideSound();
      }

      setPlaytestPlayer(newPos);
      setPlaytestBlocks(newBlocks);
      setPlaytestMoves(prev => [...prev, moveStr]);

      const won = editorTargets.every(dest => 
        newBlocks.some(b => b.x === dest.x && b.y === dest.y && b.color === dest.color)
      );

      if (won) {
        setPlaytestSolved(true);
        playWinMelody();
      }
    };

    window.addEventListener('keydown', handlePlaytestKeyDown);
    return () => window.removeEventListener('keydown', handlePlaytestKeyDown);
  }, [playtestActive, playtestPlayer, playtestBlocks, playtestSolved, editorWalls, editorTargets, gridWidth, gridHeight]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-red-950 border border-red-700 rounded-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-red-200 mb-2">Current user: <span className="font-mono">{username}</span></p>
          <p className="text-red-300">
            Only authorized administrators can access this panel.
          </p>
        </div>
      </div>
    );
  }

  const difficulties: PuzzleDifficulty[] = ['tutorial', 'daily', 'easy', 'medium', 'hard', 'splash'];

  return (
    <div className="min-h-screen bg-mesh-gradient text-white pb-20">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 pt-12">
          <h1 className="text-4xl font-bold mb-2">Puzzle Management</h1>
          <p className="text-gray-400">Admin: {username}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700 overflow-x-auto">
          {difficulties.map((diff) => (
            <button
              key={diff}
              onClick={() => setActiveTab(diff)}
              className={cn(
                'px-4 py-2 font-bold transition-colors capitalize whitespace-nowrap',
                activeTab === diff
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {diff} Puzzles
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Create / Edit Form */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 sticky top-6 border border-gray-700 shadow-xl">
              <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-4 mb-6">
                <h2 className="text-xl font-bold mb-2">Publish Daily Post</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Select any puzzle from the database and publish it as a test daily post.
                </p>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Select Puzzle</label>
                <select
                  value={selectedDailyPostPuzzleId}
                  onChange={(e) => setSelectedDailyPostPuzzleId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors mb-4"
                >
                  <option value="">Choose a puzzle to post</option>
                  {allPuzzles.map((puzzle) => (
                    <option key={puzzle.id} value={puzzle.id}>
                      {puzzle.name} ({puzzle.id})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleCreateDailyPost}
                  disabled={creatingDailyPost || !selectedDailyPostPuzzleId}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 rounded transition-colors"
                >
                  {creatingDailyPost ? 'Publishing...' : 'Create Daily Post'}
                </button>
              </div>
              {playtestActive ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-yellow-400 animate-pulse">Playtesting</h2>
                    <span className="bg-blue-900 text-blue-200 px-3 py-1 rounded text-sm font-bold">
                      Moves: {playtestMoves.length}
                    </span>
                  </div>

                  <div
                    className="grid gap-1 bg-gray-950 p-2 border border-gray-800 rounded-lg overflow-auto max-w-full"
                    style={{
                      gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
                      aspectRatio: '1',
                      width: '100%',
                      maxHeight: '400px'
                    }}
                  >
                    {Array.from({ length: gridWidth * gridHeight }).map((_, i) => {
                      const x = i % gridWidth;
                      const y = Math.floor(i / gridWidth);
                      const isWall = editorWalls.some(w => w.x === x && w.y === y);
                      const isPlayer = playtestPlayer.x === x && playtestPlayer.y === y;
                      const block = playtestBlocks.find(b => b.x === x && b.y === y);
                      const target = editorTargets.find(t => t.x === x && t.y === y);

                      let cellBg = 'bg-gray-900/60';
                      let content = null;

                      if (isWall) {
                        cellBg = 'bg-gray-750 border border-gray-600';
                      } else if (isPlayer) {
                        content = <div className="w-5 h-5 rounded-full bg-white border border-black flex items-center justify-center text-[10px] text-black font-bold">P</div>;
                      } else if (block) {
                        content = <div className={`w-5 h-5 rounded ${getBlockColorClass(block.color)}`} />;
                      } else if (target) {
                        content = <div className={`w-4 h-4 rounded ${getTargetColorClass(target.color)}`} />;
                      }

                      return (
                        <div key={i} className={`aspect-square flex items-center justify-center rounded-sm ${cellBg}`}>
                          {content}
                        </div>
                      );
                    })}
                  </div>

                  {playtestSolved && (
                    <div className="bg-green-950/80 border border-green-700 rounded-lg p-3 text-center text-green-300 font-bold">
                      🎉 Level Solved in {playtestMoves.length} moves!
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditorMoves(playtestMoves);
                        setPlaytestActive(false);
                        showToast({ text: `Recorded ${playtestMoves.length} moves for level.`, appearance: 'success' });
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-500 font-bold py-2 rounded text-sm transition-colors text-white"
                    >
                      Use Moves
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaytestActive(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 font-bold py-2 rounded text-sm transition-colors text-white"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4">
                    {editingId ? 'Edit Puzzle' : `Create ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Puzzle`}
                  </h2>

                  {/* Mode Selector */}
                  <div className="flex gap-2 mb-4 bg-gray-900 p-1 rounded border border-gray-700">
                    <button
                      type="button"
                      onClick={() => setEditMode('visual')}
                      className={cn(
                        "flex-1 py-1 rounded font-bold text-xs transition-colors",
                        editMode === 'visual' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                      )}
                    >
                      🎨 Visual Creator
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode('json')}
                      className={cn(
                        "flex-1 py-1 rounded font-bold text-xs transition-colors",
                        editMode === 'json' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                      )}
                    >
                      📝 Raw JSON
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {editingId && (
                      <div className="bg-blue-900/30 border border-blue-500/50 rounded p-3 text-sm text-blue-200 mb-4 flex justify-between items-center">
                        <div>Editing: <span className="font-mono font-bold">{editingId}</span></div>
                        <button 
                          type="button" 
                          onClick={resetForm}
                          className="text-blue-400 underline hover:text-blue-300 font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300 font-medium">
                        Puzzle Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={puzzleName}
                        onChange={(e) => setPuzzleName(e.target.value)}
                        placeholder="e.g., Level 1"
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>

                    {activeTab === 'daily' && !editingId && (
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-300 font-medium">
                          Date <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          value={dailyDate}
                          onChange={(e) => setDailyDate(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>
                    )}

                    {editMode === 'visual' ? (
                      <div className="space-y-4">
                        {/* Grid size adjuster */}
                        <div>
                          <label className="block text-sm font-semibold mb-1 text-gray-300 font-medium">Grid Dimensions</label>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <span className="text-[10px] text-gray-400 block mb-1">Width: {gridWidth}</span>
                              <div className="flex border border-gray-700 rounded overflow-hidden">
                                <button type="button" onClick={() => setGridWidth(w => Math.max(3, w - 1))} className="flex-1 bg-gray-750 hover:bg-gray-600 font-bold py-1 text-xs">-</button>
                                <button type="button" onClick={() => setGridWidth(w => Math.min(15, w + 1))} className="flex-1 bg-gray-750 hover:bg-gray-600 font-bold py-1 text-xs">+</button>
                              </div>
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] text-gray-400 block mb-1">Height: {gridHeight}</span>
                              <div className="flex border border-gray-700 rounded overflow-hidden">
                                <button type="button" onClick={() => setGridHeight(h => Math.max(3, h - 1))} className="flex-1 bg-gray-750 hover:bg-gray-600 font-bold py-1 text-xs">-</button>
                                <button type="button" onClick={() => setGridHeight(h => Math.min(15, h + 1))} className="flex-1 bg-gray-750 hover:bg-gray-600 font-bold py-1 text-xs">+</button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Drawing Tools */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-300 font-medium">Toolbox</label>
                          <div className="grid grid-cols-3 gap-1.5 mb-3">
                            {(['wall', 'player', 'block', 'target', 'eraser'] as const).map(tool => (
                              <button
                                key={tool}
                                type="button"
                                onClick={() => setSelectedTool(tool)}
                                className={cn(
                                  "py-1.5 rounded font-bold text-[10px] sm:text-xs capitalize transition-all border",
                                  selectedTool === tool 
                                    ? "bg-blue-600 text-white border-blue-400 animate-pulse-glow" 
                                    : "bg-gray-700 text-gray-300 border-transparent hover:bg-gray-650"
                                )}
                              >
                                {tool === 'wall' && '🧱 Wall'}
                                {tool === 'player' && '👤 Player'}
                                {tool === 'block' && '📦 Block'}
                                {tool === 'target' && '🎯 Target'}
                                {tool === 'eraser' && '🧹 Eraser'}
                              </button>
                            ))}
                          </div>

                          {(selectedTool === 'block' || selectedTool === 'target') && (
                            <div className="mb-3">
                              <span className="text-[10px] text-gray-400 block mb-1.5">Tool Color:</span>
                              <div className="flex gap-1.5 flex-wrap">
                                {['red', 'blue', 'yellow', 'purple', 'green', 'orange'].map(color => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={cn(
                                      "w-6 h-6 rounded-full border-2 capitalize text-[9px] font-bold text-black flex items-center justify-center transition-all",
                                      selectedColor === color ? "border-white scale-110 shadow-md" : "border-transparent opacity-75 hover:opacity-100",
                                      getBlockColorClass(color).split(' ')[0]
                                    )}
                                    title={color}
                                  >
                                    {color.charAt(0).toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive Editor Grid */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-300 font-medium">Canvas (Click to paint)</label>
                          <div 
                            className="grid gap-0.5 bg-gray-950 p-1.5 border border-gray-800 rounded-lg overflow-auto max-w-full"
                            style={{
                              gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
                              aspectRatio: '1',
                              width: '100%',
                              maxHeight: '320px'
                            }}
                          >
                            {Array.from({ length: gridWidth * gridHeight }).map((_, i) => {
                              const x = i % gridWidth;
                              const y = Math.floor(i / gridWidth);
                              
                              const isWall = editorWalls.some(w => w.x === x && w.y === y);
                              const isPlayer = editorPlayer.x === x && editorPlayer.y === y;
                              const block = editorBlocks.find(b => b.x === x && b.y === y);
                              const target = editorTargets.find(t => t.x === x && t.y === y);
                              
                              let content = null;
                              let bgClass = 'bg-gray-900 hover:bg-gray-850 cursor-pointer';

                              if (isWall) {
                                bgClass = 'bg-gray-700 border border-gray-600';
                              } else if (isPlayer) {
                                content = (
                                  <div className="w-4 h-4 rounded-full bg-white border border-black flex items-center justify-center text-[8px] font-black text-black">
                                    P
                                  </div>
                                );
                              } else if (block) {
                                content = (
                                  <div className={`w-4 h-4 rounded-sm ${getBlockColorClass(block.color)}`} />
                                );
                              } else if (target) {
                                content = (
                                  <div className={`w-3.5 h-3.5 rounded-sm ${getTargetColorClass(target.color)}`} />
                                );
                              }

                              return (
                                <div
                                  key={i}
                                  onClick={() => handleCellClick(x, y)}
                                  className={`aspect-square flex items-center justify-center transition-colors rounded-sm ${bgClass}`}
                                >
                                  {content}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Playtest Trigger */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={startPlaytest}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-500 font-bold py-2 rounded text-sm transition-all shadow-[0_0_12px_rgba(202,138,4,0.3)] text-white"
                          >
                            🎮 Playtest & Record Path
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-300 font-medium">
                          Puzzle JSON <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={puzzleJson}
                          onChange={(e) => setPuzzleJson(e.target.value)}
                          placeholder='{"width": 9, "height": 9, "player": {"x": 3, "y": 0}, "walls": [], "blocks": [], "targets": []}'
                          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-mono text-xs sm:text-sm h-64 focus:outline-none focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_20px_rgba(37,99,235,0.6)]"
                    >
                      {editingId ? 'Update Puzzle' : 'Create Puzzle'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Puzzle List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-xl min-h-[500px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold capitalize">
                  {activeTab} Puzzles
                </h2>
                <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm font-bold">
                  {puzzles.length} Total
                </span>
              </div>
              
              {loadingPuzzles ? (
                <div className="text-gray-400 text-center py-12 animate-pulse">Loading puzzles...</div>
              ) : puzzles.length === 0 ? (
                <div className="text-gray-400 text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
                  No puzzles found for {activeTab}. Create one!
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {puzzles.map((puzzle) => (
                    <div key={puzzle.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col justify-between hover:border-gray-500 transition-colors group">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-white truncate pr-2" title={puzzle.name}>{puzzle.name}</h3>
                          {activeTab === 'daily' && (
                            <span className="bg-blue-900/50 text-blue-300 border border-blue-700/50 text-xs px-2 py-1 rounded whitespace-nowrap">
                              {puzzle.id.replace('daily-', '')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-mono mb-4 break-all">ID: {puzzle.id}</p>
                      </div>
                      
                      <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-gray-800">
                        {(activeTab === 'splash' || activeTab === 'tutorial') && (
                          <button
                            onClick={() => handleSetActive(puzzle.id)}
                            className={cn(
                              "w-full text-sm font-semibold py-2 rounded transition-colors border text-center",
                              activePuzzleId === puzzle.id 
                                ? "bg-green-900/60 text-green-300 border-green-500 neon-green" 
                                : "bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
                            )}
                          >
                            {activePuzzleId === puzzle.id ? 'Active' : 'Set Active'}
                          </button>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleEdit(puzzle)}
                            className="w-full sm:flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-2 rounded transition-colors border border-gray-600 text-center"
                          >
                            Edit
                          </button>
                          
                          <div className="relative w-full sm:flex-1">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleClone(puzzle, e.target.value as PuzzleDifficulty);
                                  e.target.value = ''; // Reset select
                                }
                              }}
                              className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-2 pl-2 pr-6 rounded transition-colors border border-gray-600 appearance-none text-center cursor-pointer font-sans"
                              defaultValue=""
                            >
                              <option value="" disabled hidden>Clone to</option>
                              {difficulties.map(d => (
                                <option key={d} value={d} className="bg-gray-900 text-white text-left capitalize">
                                  {d}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400 text-[10px]">
                              ▼
                            </div>
                          </div>

                          {confirmDeleteId === puzzle.id ? (
                            <div className="flex w-full sm:flex-1 gap-1">
                              <button
                                onClick={() => handleDeletePuzzle(puzzle.id)}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded transition-colors text-center"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold py-2 rounded transition-colors text-center"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(puzzle.id)}
                              className="w-full sm:flex-1 bg-red-900/30 hover:bg-red-900/60 text-red-400 text-sm font-semibold py-2 rounded transition-colors border border-red-900/50 text-center"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

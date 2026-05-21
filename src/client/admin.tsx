import React, { useEffect, useState } from 'react';
import { trpc } from './trpc';
import { showToast } from '@devvit/web/client';
import { Puzzle, PuzzleDifficulty } from '../shared/types';
import { cn } from './utils';

export function Admin() {
  const [activeTab, setActiveTab] = useState<PuzzleDifficulty>('easy');
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // States for puzzle list
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);
  const [activePuzzleId, setActivePuzzleId] = useState<string | null>(null);

  // Form states
  const [puzzleName, setPuzzleName] = useState('');
  const [puzzleJson, setPuzzleJson] = useState('');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

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
      resetForm();
    }
  }, [activeTab, isAdmin]);

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
        // Overwrite check for daily puzzles
        if (puzzles.some(p => p.id === finalId)) {
          if (!confirm(`A daily puzzle already exists for ${dailyDate}. Do you want to overwrite it?`)) {
            return;
          }
        }
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
    if (!confirm('Are you sure you want to delete this puzzle?')) {
      return;
    }

    try {
      await trpc.admin.deletePuzzle.mutate(puzzleId);
      showToast({ text: 'Puzzle deleted successfully!', appearance: 'success' });
      loadPuzzles();
    } catch (error) {
      showToast({ text: 'Failed to delete puzzle', appearance: 'neutral' });
    }
  };

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
              <h2 className="text-2xl font-bold mb-4">
                {editingId ? 'Edit Puzzle' : `Create ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Puzzle`}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {editingId && (
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded p-3 text-sm text-blue-200 mb-4">
                    Editing: <span className="font-mono font-bold">{editingId}</span>
                    <button 
                      type="button" 
                      onClick={resetForm}
                      className="ml-2 text-blue-400 underline hover:text-blue-300"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
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
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
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

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
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

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_20px_rgba(37,99,235,0.6)]"
                >
                  {editingId ? 'Update Puzzle' : 'Create Puzzle'}
                </button>
              </form>
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
                      
                      <div className="flex gap-2 mt-auto pt-4 border-t border-gray-800">
                        {(activeTab === 'splash' || activeTab === 'tutorial') && (
                          <button
                            onClick={() => handleSetActive(puzzle.id)}
                            className={cn(
                              "flex-1 text-sm font-semibold py-2 rounded transition-colors border",
                              activePuzzleId === puzzle.id 
                                ? "bg-green-900/60 text-green-300 border-green-500 neon-green" 
                                : "bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
                            )}
                          >
                            {activePuzzleId === puzzle.id ? 'Active' : 'Set Active'}
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(puzzle)}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-2 rounded transition-colors border border-gray-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePuzzle(puzzle.id)}
                          className="flex-1 bg-red-900/30 hover:bg-red-900/60 text-red-400 text-sm font-semibold py-2 rounded transition-colors border border-red-900/50"
                        >
                          Delete
                        </button>
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

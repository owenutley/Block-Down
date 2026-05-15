# Puzzle Database System

This document outlines the puzzle database system for the Block Down game, built on Reddit's Devvit Redis database.

## Overview

The puzzle database system manages:
- **Daily Puzzles**: Puzzles assigned for specific dates
- **Puzzle Storage**: All puzzles organized by difficulty (tutorial, easy, medium, hard)
- **Upcoming Queue**: Puzzles scheduled to become daily puzzles
- **Past Archive**: Historical puzzles that were previously daily puzzles
- **Statistics**: Tracking attempts, completions, and scores for each puzzle

## Architecture

### File Structure

```
src/
├── shared/
│   └── types.ts              # Shared puzzle type definitions
├── server/
│   ├── trpc.ts               # tRPC router with puzzle procedures
│   └── core/
│       ├── puzzle.ts         # Core puzzle database operations
│       └── puzzle.test.ts    # Unit tests
```

### Type Definitions

All puzzle-related types are defined in [src/shared/types.ts](src/shared/types.ts):

- **`Puzzle`**: Individual puzzle with grid, difficulty, and metadata
- **`PuzzleDifficulty`**: Enum of 'tutorial', 'easy', 'medium', 'hard'
- **`DailyPuzzle`**: Assignment of a puzzle to a specific date
- **`PuzzleStats`**: Statistics including attempts, completions, and scores
- **`UserPuzzleProgress`**: User-specific progress on a puzzle

## Redis Key Structure

All data is stored in Redis using namespaced keys:

```
puzzle:{id}                    # Individual puzzle data (JSON string)
puzzles:{difficulty}          # JSON array of puzzle IDs by difficulty
daily:{YYYY-MM-DD}           # Daily puzzle assignment for a date
current:daily                 # Current (today's) daily puzzle
upcoming:puzzles             # JSON array of upcoming daily puzzle IDs
past:puzzles                 # JSON array of archived (past) puzzle IDs
stats:{puzzleId}             # Statistics for a puzzle (JSON)
```

**Note**: Devvit's Redis implementation stores array data as JSON strings, so collection operations (like adding/removing from the queue) involve fetching the JSON, modifying the array, and saving it back.

## Core Functions

All database operations are in [src/server/core/puzzle.ts](src/server/core/puzzle.ts):

### Puzzle Management

**`createPuzzle(puzzle: Puzzle): Promise<void>`**
- Stores a new puzzle in Redis
- Adds puzzle ID to the difficulty index
- Creates/updates the puzzle object

```typescript
await createPuzzle({
  id: 'easy-1',
  difficulty: 'easy',
  blocks: [[1, 2, 3], [1, 2, 3], [1, 2, 3]],
  target: 50,
  title: 'Easy Start',
  createdAt: Date.now(),
});
```

**`getPuzzle(id: string): Promise<Puzzle | null>`**
- Retrieves a puzzle by ID
- Returns null if puzzle doesn't exist

**`getPuzzlesByDifficulty(difficulty: PuzzleDifficulty): Promise<Puzzle[]>`**
- Gets all puzzles of a specific difficulty
- Supports: 'tutorial', 'easy', 'medium', 'hard'

**`getAllPuzzles(): Promise<Puzzle[]>`**
- Retrieves all puzzles across all difficulties

### Daily Puzzle Management

**`assignDailyPuzzle(puzzleId: string, date?: string): Promise<DailyPuzzle>`**
- Assigns a puzzle as the daily puzzle for a date
- If no date provided, uses today's date
- Updates the `current:daily` key if assigning for today
- Throws if puzzle doesn't exist

```typescript
// Assign for today
const daily = await assignDailyPuzzle('easy-1');

// Assign for specific date
const daily = await assignDailyPuzzle('medium-1', '2024-12-25');
```

**`getCurrentDailyPuzzle(): Promise<(DailyPuzzle & { puzzle: Puzzle }) | null>`**
- Gets today's daily puzzle with full puzzle data
- Returns null if no daily puzzle is assigned for today

**`getDailyPuzzle(date: string): Promise<(DailyPuzzle & { puzzle: Puzzle }) | null>`**
- Gets the daily puzzle for a specific date (YYYY-MM-DD format)
- Includes full puzzle data

### Upcoming/Past Puzzle Management

**`addUpcomingPuzzle(puzzleId: string, position?: number): Promise<void>`**
- Adds a puzzle to the upcoming queue
- If position is provided, inserts at that position
- Otherwise appends to the end

**`getNextUpcomingPuzzle(): Promise<Puzzle | null>`**
- Returns the next puzzle in the upcoming queue

**`getUpcomingPuzzles(limit?: number): Promise<Puzzle[]>`**
- Gets multiple upcoming puzzles (default: 10)
- Limits to max 10 puzzles at a time

**`archivePuzzle(puzzleId: string): Promise<void>`**
- Moves a puzzle from upcoming to the past archive

**`getPastPuzzles(limit?: number): Promise<Puzzle[]>`**
- Gets past puzzles from the archive (default: 30)
- Useful for viewing historical daily puzzles

### Statistics

**`getPuzzleStats(puzzleId: string): Promise<PuzzleStats | null>`**
- Retrieves statistics for a puzzle
- Includes: totalAttempts, totalCompletions, averageScore, bestScore

**`updatePuzzleStats(puzzleId: string, stats: {attempts?, completions?, scores?}): Promise<void>`**
- Updates or creates statistics for a puzzle
- Automatically calculates averageScore and bestScore from scores array

```typescript
await updatePuzzleStats('easy-1', {
  attempts: 1,
  completions: 1,
  scores: [95],
});
```

### Admin Functions

**`initializeSamplePuzzles(): Promise<void>`**
- Creates sample puzzles for development/testing
- Includes 2 tutorial, 1 easy, 1 medium, and 1 hard puzzle

**`deletePuzzle(id: string): Promise<void>`**
- Deletes a puzzle from all indices (use with caution)

## tRPC Procedures

The puzzle system is exposed via tRPC procedures in [src/server/trpc.ts](src/server/trpc.ts):

### Queries

```typescript
// Get a single puzzle
trpc.puzzle.getById.query('puzzle-id')

// Get all puzzles by difficulty
trpc.puzzle.getByDifficulty.query('easy')

// Get all puzzles
trpc.puzzle.getAll.query()

// Get today's daily puzzle
trpc.puzzle.getCurrentDaily.query()

// Get daily puzzle for a date
trpc.puzzle.getDaily.query('2024-12-25')

// Get upcoming puzzles (limit: 1-50, default: 10)
trpc.puzzle.getUpcoming.query(5)

// Get past puzzles (limit: 1-100, default: 30)
trpc.puzzle.getPast.query(15)

// Get puzzle statistics
trpc.puzzle.getStats.query('puzzle-id')
```

### Mutations

```typescript
// Create a new puzzle
trpc.puzzle.create.mutate({
  id: 'medium-1',
  difficulty: 'medium',
  blocks: [[1, 2], [3, 4]],
  target: 100,
  title: 'Medium Challenge',
  description: 'A medium difficulty puzzle',
})

// Assign a puzzle as daily
trpc.puzzle.assignDaily.mutate({
  puzzleId: 'easy-1',
  date: '2024-12-25', // optional
})

// Add to upcoming queue
trpc.puzzle.addUpcoming.mutate('puzzle-id')

// Archive a puzzle
trpc.puzzle.archive.mutate('puzzle-id')

// Update statistics
trpc.puzzle.updateStats.mutate({
  puzzleId: 'easy-1',
  attempts: 1,
  completions: 1,
  scores: [85],
})

// Initialize sample puzzles
trpc.puzzle.initializeSamples.mutate()
```

## Usage Examples

### Frontend: Display Daily Puzzle

```typescript
import { trpc } from './trpc';

export function DailyPuzzleView() {
  const [daily, setDaily] = React.useState(null);

  React.useEffect(() => {
    trpc.puzzle.getCurrentDaily.query().then(setDaily);
  }, []);

  if (!daily) return <div>No daily puzzle assigned</div>;

  return (
    <div>
      <h2>{daily.puzzle.title}</h2>
      <p>Difficulty: {daily.difficulty}</p>
      <p>Target: {daily.puzzle.target}</p>
      {daily.puzzle.description && <p>{daily.puzzle.description}</p>}
    </div>
  );
}
```

### Frontend: Get Available Puzzles by Difficulty

```typescript
export function PuzzleSelector() {
  const [easyPuzzles, setEasyPuzzles] = React.useState([]);

  React.useEffect(() => {
    trpc.puzzle.getByDifficulty.query('easy').then(setEasyPuzzles);
  }, []);

  return (
    <div>
      {easyPuzzles.map((puzzle) => (
        <button key={puzzle.id}>{puzzle.title}</button>
      ))}
    </div>
  );
}
```

### Backend: Daily Puzzle Rotation

```typescript
// In a scheduled task or trigger
import { getNextUpcomingPuzzle, archivePuzzle, assignDailyPuzzle } from './core/puzzle';

export async function rotateDailyPuzzle() {
  const nextPuzzle = await getNextUpcomingPuzzle();
  if (nextPuzzle) {
    await assignDailyPuzzle(nextPuzzle.id);
    await archivePuzzle(nextPuzzle.id);
  }
}
```

### Backend: Track Puzzle Completion

```typescript
import { updatePuzzleStats } from './core/puzzle';

export async function recordPuzzleCompletion(puzzleId: string, score: number) {
  await updatePuzzleStats(puzzleId, {
    attempts: 1,
    completions: 1,
    scores: [score],
  });
}
```

## Puzzle Grid Format

The `blocks` field is a 2D array representing the puzzle grid:

```typescript
// 3x3 grid with different block types (numbers represent colors/types)
blocks: [
  [1, 2, 3],
  [1, 2, 3],
  [1, 2, 3],
]

// 4x4 mixed grid
blocks: [
  [1, 1, 2, 2],
  [1, 1, 2, 2],
  [3, 3, 4, 4],
  [3, 3, 4, 4],
]
```

## Testing

Run the puzzle tests:

```bash
npm run test -- puzzle
```

The test file ([src/server/core/puzzle.test.ts](src/server/core/puzzle.test.ts)) includes tests for:
- Creating puzzles
- Retrieving puzzles by ID and difficulty
- Daily puzzle assignment and retrieval
- Upcoming/past puzzle management
- Statistics updates
- Sample puzzle initialization

## Best Practices

1. **Date Format**: Always use YYYY-MM-DD format for dates
2. **Puzzle IDs**: Use lowercase with hyphens (e.g., 'tutorial-1', 'easy-1')
3. **Caching**: Consider caching frequently accessed puzzles on the frontend
4. **Error Handling**: Always check for null when retrieving puzzles
5. **Statistics**: Update stats immediately after puzzle completion
6. **Admin Access**: In production, add authentication checks to mutations
7. **Cleanup**: Periodically archive old puzzles to keep Redis lean

## Future Enhancements

- User-specific puzzle progress tracking
- Leaderboards by puzzle and difficulty
- Daily puzzle difficulty rotation logic
- Puzzle hints and solutions
- User puzzle ratings/feedback
- Advanced statistics (completion time, difficulty rating)

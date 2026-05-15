/**
 * Puzzle Database Setup Guide
 * 
 * This file provides example code and guidelines for setting up the puzzle
 * database when the application starts.
 */

import {
  createPuzzle,
  initializeSamplePuzzles,
  assignDailyPuzzle,
  addUpcomingPuzzle,
} from './src/server/core/puzzle';
import { Puzzle } from './src/shared/types';

/**
 * QUICK START
 * -----------
 * 
 * To initialize the database with sample puzzles:
 * 1. Call initializeSamplePuzzles() in your server startup
 * 2. This creates 5 sample puzzles (2 tutorial, 1 easy, 1 medium, 1 hard)
 * 3. Then assign the first tutorial puzzle as today's daily puzzle
 * 
 * Example in src/server/index.ts or similar startup file:
 */

export async function setupPuzzleDatabase() {
  // Initialize sample puzzles
  await initializeSamplePuzzles();
  console.log('✓ Sample puzzles initialized');

  // Assign a daily puzzle for today
  await assignDailyPuzzle('tutorial-1');
  console.log('✓ Daily puzzle assigned');

  // Add upcoming puzzles to the queue
  await addUpcomingPuzzle('tutorial-2');
  await addUpcomingPuzzle('easy-1');
  await addUpcomingPuzzle('medium-1');
  await addUpcomingPuzzle('hard-1');
  console.log('✓ Upcoming puzzles queued');
}

/**
 * CUSTOM PUZZLES
 * ---------------
 * 
 * Create custom puzzles for your game:
 */

// Example: Tutorial Puzzle
const tutorialPuzzle: Puzzle = {
  id: 'tutorial-match4',
  difficulty: 'tutorial',
  blocks: [
    [1, 1, 2, 2],
    [1, 1, 2, 2],
    [3, 3, 3, 3],
    [4, 4, 4, 4],
  ],
  target: 30,
  title: 'Learn to Match Blocks',
  description: 'Match 4 or more blocks to clear them from the board.',
  createdAt: Date.now(),
};

// Example: Easy Puzzle
const easyPuzzle: Puzzle = {
  id: 'easy-cascade',
  difficulty: 'easy',
  blocks: [
    [1, 2, 3, 1, 2],
    [2, 3, 1, 2, 3],
    [3, 1, 2, 3, 1],
    [1, 2, 3, 1, 2],
    [2, 3, 1, 2, 3],
  ],
  target: 50,
  title: 'Cascade Challenge',
  description: 'Watch the blocks fall and create powerful cascades!',
  createdAt: Date.now(),
};

// Example: Medium Puzzle
const mediumPuzzle: Puzzle = {
  id: 'medium-strategy',
  difficulty: 'medium',
  blocks: [
    [1, 1, 2, 2, 3, 3],
    [1, 1, 2, 2, 3, 3],
    [4, 4, 5, 5, 6, 6],
    [4, 4, 5, 5, 6, 6],
    [7, 7, 8, 8, 9, 9],
    [7, 7, 8, 8, 9, 9],
  ],
  target: 100,
  title: 'Strategic Thinking',
  description: 'Plan your moves carefully in this challenging puzzle.',
  createdAt: Date.now(),
};

// Example: Hard Puzzle
const hardPuzzle: Puzzle = {
  id: 'hard-master',
  difficulty: 'hard',
  blocks: [
    [1, 2, 3, 4, 5, 6, 7, 8],
    [2, 3, 4, 5, 6, 7, 8, 1],
    [3, 4, 5, 6, 7, 8, 1, 2],
    [4, 5, 6, 7, 8, 1, 2, 3],
    [5, 6, 7, 8, 1, 2, 3, 4],
    [6, 7, 8, 1, 2, 3, 4, 5],
    [7, 8, 1, 2, 3, 4, 5, 6],
    [8, 1, 2, 3, 4, 5, 6, 7],
  ],
  target: 200,
  title: 'Master Challenge',
  description: 'Only the best players can complete this ultimate challenge.',
  createdAt: Date.now(),
};

/**
 * SETUP WITH CUSTOM PUZZLES
 * --------------------------
 */

export async function setupPuzzleDatabaseWithCustomPuzzles() {
  // Create custom puzzles
  await createPuzzle(tutorialPuzzle);
  await createPuzzle(easyPuzzle);
  await createPuzzle(mediumPuzzle);
  await createPuzzle(hardPuzzle);
  console.log('✓ Custom puzzles created');

  // Assign today's puzzle
  await assignDailyPuzzle('tutorial-match4');

  // Queue upcoming puzzles
  await addUpcomingPuzzle('tutorial-match4');
  await addUpcomingPuzzle('easy-cascade');
  await addUpcomingPuzzle('medium-strategy');
  await addUpcomingPuzzle('hard-master');

  console.log('✓ Puzzle database setup complete');
}

/**
 * GRID GENERATION HELPER
 * ----------------------
 * 
 * Create puzzle grids programmatically:
 */

/**
 * Generate a random puzzle grid
 */
export function generateRandomGrid(width: number, height: number, maxColors: number): number[][] {
  const grid: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      row.push(Math.floor(Math.random() * maxColors) + 1);
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Generate a grid with patterns (good for puzzle design)
 */
export function generatePatternGrid(width: number, height: number): number[][] {
  const grid: number[][] = [];
  const blockSize = 2;
  let color = 1;

  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      // Fill a block of the same color
      for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
        if (!grid[y + dy]) grid[y + dy] = [];
        for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
          grid[y + dy][x + dx] = color;
        }
      }
      color = (color % 4) + 1; // Cycle through 4 colors
    }
  }

  return grid;
}

/**
 * DAILY PUZZLE ROTATION LOGIC
 * ----------------------------
 * 
 * Implement automatic daily puzzle rotation:
 */

export async function rotateToNextDailyPuzzle() {
  // In production, this would be called by a scheduled job (cron, scheduler, etc.)
  // For now, it's an example of how to structure the rotation
  
  import { 
    getNextUpcomingPuzzle, 
    archivePuzzle, 
    assignDailyPuzzle 
  } from './src/server/core/puzzle';

  try {
    const nextPuzzle = await getNextUpcomingPuzzle();
    
    if (!nextPuzzle) {
      console.log('No upcoming puzzles available');
      return;
    }

    // Assign as new daily puzzle
    await assignDailyPuzzle(nextPuzzle.id);
    
    // Archive the puzzle (move from upcoming to past)
    await archivePuzzle(nextPuzzle.id);
    
    console.log(`Daily puzzle rotated to: ${nextPuzzle.title}`);
  } catch (error) {
    console.error('Failed to rotate daily puzzle:', error);
  }
}

/**
 * INTEGRATION WITH DEVVIT TRIGGERS
 * ---------------------------------
 * 
 * To set up automatic daily puzzle rotation, add this to your
 * src/server/routes/triggers.ts:
 * 
 * import { ScheduledJobEvent } from '@devvit/public-api';
 * import { rotateToNextDailyPuzzle } from '../core/puzzle';
 * 
 * Devvit.addTrigger(
 *   ScheduledJobEvent.Daily,
 *   async (event) => {
 *     await rotateToNextDailyPuzzle();
 *   }
 * );
 */

/**
 * PUZZLE VALIDATION
 * -----------------
 */

export function validatePuzzle(puzzle: Puzzle): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!puzzle.id) errors.push('Puzzle must have an id');
  if (!puzzle.title) errors.push('Puzzle must have a title');
  if (!['tutorial', 'easy', 'medium', 'hard'].includes(puzzle.difficulty)) {
    errors.push('Invalid difficulty level');
  }
  if (!puzzle.blocks || puzzle.blocks.length === 0) {
    errors.push('Puzzle must have a grid');
  }
  if (puzzle.target <= 0) errors.push('Target must be positive');

  // Validate all rows have same length
  if (puzzle.blocks.length > 0) {
    const width = puzzle.blocks[0].length;
    for (let i = 0; i < puzzle.blocks.length; i++) {
      if (puzzle.blocks[i].length !== width) {
        errors.push(`Row ${i} has inconsistent width`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * RECOMMENDATIONS
 * ----------------
 * 
 * 1. Call setupPuzzleDatabase() or setupPuzzleDatabaseWithCustomPuzzles()
 *    in your server initialization (src/server/index.ts)
 * 
 * 2. For development: Use setupPuzzleDatabase() which creates sample puzzles
 * 
 * 3. For production:
 *    - Create your own puzzles using createPuzzle()
 *    - Import them from a separate puzzles file
 *    - Validate using validatePuzzle()
 * 
 * 4. Set up daily rotation:
 *    - Use Devvit triggers for scheduled daily rotation
 *    - Or call rotateToNextDailyPuzzle() from your backend logic
 * 
 * 5. Monitor:
 *    - Track puzzle statistics with updatePuzzleStats()
 *    - Use analytics to understand which puzzles are most popular
 *    - Adjust difficulty based on completion rates
 */

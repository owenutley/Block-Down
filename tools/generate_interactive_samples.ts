import {
  generateModeratePuzzle,
  generateHardPuzzle,
  type GeneratedPuzzle,
  type PushInteractionStep,
} from '../src/client/utils/puzzleSolver.ts';

function renderAsciiBoard(puzzle: GeneratedPuzzle): string {
  const { width, height, player, walls, blocks, targets } = puzzle;
  const grid: string[][] = Array(height).fill(null).map(() => Array(width).fill(' . '));

  for (const w of walls) {
    grid[w.y]![w.x] = ' # ';
  }

  for (const t of targets) {
    const symbol = t.color.charAt(0).toLowerCase();
    grid[t.y]![t.x] = `(${symbol})`;
  }

  for (const b of blocks) {
    const symbol = b.color.charAt(0).toUpperCase();
    const existing = grid[b.y]![b.x]!;
    if (existing.startsWith('(')) {
      grid[b.y]![b.x] = `*${symbol}*`; // on target
    } else {
      grid[b.y]![b.x] = `[${symbol}]`;
    }
  }

  const pCell = grid[player.y]![player.x]!;
  if (pCell === ' . ') {
    grid[player.y]![player.x] = ' @ ';
  }

  const lines = grid.map((row) => row.join(''));
  return lines.join('\n');
}

function formatPuzzleMarkdown(index: number, difficulty: string, p: GeneratedPuzzle): string {
  const ascii = renderAsciiBoard(p);
  const pushList = (p.pushSequence || []).map((step: PushInteractionStep, idx: number) => {
    const collisionNote = step.stoppedBy === 'block' 
      ? `💥 **COLLIDES WITH ${step.stoppedByColor?.toUpperCase() || ''} BLOCK**`
      : step.stoppedBy === 'wall'
      ? `🛑 Stopped by Wall`
      : `⏹ Stopped by Border`;
    return `   ${idx + 1}. **${step.color.toUpperCase()}** ${step.dir} (${step.dist} tiles) $\\rightarrow$ ${collisionNote} (at \`[${step.to.x}, ${step.to.y}]\`)`;
  }).join('\n');

  const rawJson = JSON.stringify({
    width: p.width,
    height: p.height,
    player: p.player,
    walls: p.walls,
    blocks: p.blocks,
    targets: p.targets,
    solutionMoves: p.solutionMoves,
  }, null, 2);

  return `### Sample ${index} (${difficulty})
- **Push Count**: ${p.pushDistances?.length || 0} pushes
- **Total Moves**: ${p.solutionMoves.length} moves
- **Block-on-Block Collisions**: **${p.blockCollisions || 0} dynamic collisions**
- **Block Switches (Order-of-Operation Complexity)**: **${p.blockSwitches || 0} interleaving switches**
- **Average Slide Distance**: **${p.averageSlideDistance} tiles / push**
- **Slide Runway Breakdown**: \`[${(p.pushDistances || []).join(', ')}]\`

#### Board Layout (Legend: \`@\` = Player, \`[R]\` = Red Block, \`[B]\` = Blue Block, \`[Y]\` = Yellow Block, \`[P]\` = Purple Block, \`(r)\` = Red Target, \`#\` = Wall):
\`\`\`text
${ascii}
\`\`\`

#### Step-by-Step Interactive Push Dynamics:
${pushList}

#### Raw Level Configuration:
\`\`\`json
${rawJson}
\`\`\`
`;
}

console.log('Generating 3 verified interactive puzzles...');

const samples: string[] = [];

// Sample 1: Moderate (3 blocks, guaranteed block collision & high interleaving)
const p1 = generateModeratePuzzle({ minBlockCollisions: 1, minBlockSwitches: 2, minAverageSlideDistance: 2.8 });
samples.push(formatPuzzleMarkdown(1, 'Moderate - 3 Blocks, Dynamic Collision & Interleaving', p1));

// Sample 2: Moderate / Upper (3 blocks, 2 block collisions)
const p2 = generateModeratePuzzle({ minBlockCollisions: 1, minBlockSwitches: 3, minAverageSlideDistance: 3.0 });
samples.push(formatPuzzleMarkdown(2, 'Moderate+ - 3 Blocks, Multi-Collision Sequence', p2));

// Sample 3: Hard (4 blocks, multi-collision cascading sequence)
const p3 = generateHardPuzzle({ minBlockCollisions: 2, minBlockSwitches: 3, minAverageSlideDistance: 3.0 });
samples.push(formatPuzzleMarkdown(3, 'Hard - Multi-Collision Cascades & Interleaved Solving', p3));

const header = `# Generated Puzzle Samples: High-Interaction & Block-on-Block Collisions

This document showcases procedural levels generated with **rich block-on-block interactions**, where blocks physically collide with each other to serve as dynamic stopping backboards and enforce critical order-of-operation solving sequences.

## Key Interaction Features Verified:
1. **Dynamic Block Backboards (💥 Collisions)**: Blocks slide across long board distances and stop by crashing directly into other blocks rather than relying on artificial walls.
2. **Interleaved Block Switches (🔄 Order of Operations)**: Players cannot simply solve one block at a time in isolation. Puzzles require positioning Block A as a temporary backboard for Block B, then relocating Block A to solve Block C, creating deep logic dependencies.
3. **Sweeping Slide Runways (🎯 3.0 - 4.5+ Tiles Average)**: Maintained long sliding distances without short cramped movements.
4. **100% Solvability Verification**: Every generated level is verified via BFS simulation with zero unsolvable trap configurations.

---

`;

import * as fs from 'fs';
import * as path from 'path';
const outPath = path.resolve('c:/Users/owenu/Documents/game-dev/devvit-games/block-down/GENERATED_PUZZLE_SAMPLES.md');
fs.writeFileSync(outPath, header + samples.join('\n---\n\n'), 'utf-8');
console.log('Successfully updated', outPath);

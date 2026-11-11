import { Puzzle, Position } from './types';

export type StoryChamberDefinition = {
  id: string;
  chapter: number;
  chamber: number;
  name: string;
  theme: string;
  par: number;
  width: number;
  height: number;
  player: Position;
  walls: Position[];
  blocks: { id: string; color: string; x: number; y: number }[];
  targets: { id: string; color: string; x: number; y: number }[];
  portals?: { id: string; color: string; x: number; y: number; dir: 'Up' | 'Down' | 'Left' | 'Right' }[];
};

/**
 * Handcrafted Story Mode Chambers for The Resonance Chronicles
 *
 * Rules:
 * - 9x9 grid standard
 * - Spawn at (4, 8)
 * - Door threshold at (4, 0)
 * - Both (4, 0) and (4, 8) are strictly free of walls, blocks, and targets
 * - Guaranteed solvable with sliding block mechanics
 */
export const STORY_CHAMBERS: readonly StoryChamberDefinition[] = [
  // ==========================================
  // CHAPTER 1: The Silicon Awakening (Neon Theme)
  // ==========================================
  {
    // Chamber 1-1: Ignition Relay (Gentle Introduction)
    // Concept: Push block Up to wall, then Left into target.
    id: 'ch1_1',
    chapter: 1,
    chamber: 1,
    name: 'Ignition Relay',
    theme: 'neon',
    par: 2,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'blue', x: 4, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'blue', x: 2, y: 2 },
    ],
    walls: [
      { x: 4, y: 1 }, // Stops block sliding up at (4, 2)
      { x: 1, y: 2 }, // Stops block sliding left at (2, 2) [target]
    ],
  },
  {
    // Chamber 1-2: Vector Diverter
    // Concept: Push right, then up, then left into target.
    id: 'ch1_2',
    chapter: 1,
    chamber: 2,
    name: 'Vector Diverter',
    theme: 'neon',
    par: 3,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'blue', x: 3, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'blue', x: 4, y: 2 },
    ],
    walls: [
      { x: 7, y: 6 }, // Stops block at (6, 6)
      { x: 6, y: 1 }, // Stops block at (6, 2)
      { x: 3, y: 2 }, // Stops block at (4, 2) [target]
    ],
  },
  {
    // Chamber 1-3: Dual Synapse
    // Concept: Two independent color blocks. Blue to left target, Green to right target.
    id: 'ch1_3',
    chapter: 1,
    chamber: 3,
    name: 'Dual Synapse',
    theme: 'neon',
    par: 4,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'blue', x: 2, y: 6 },
      { id: 'b2', color: 'green', x: 6, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'blue', x: 2, y: 2 },
      { id: 't2', color: 'green', x: 6, y: 2 },
    ],
    walls: [
      { x: 2, y: 1 }, // Stops b1 at (2, 2)
      { x: 6, y: 1 }, // Stops b2 at (6, 2)
    ],
  },
  {
    // Chamber 1-4: Interlocking Bus (Block-as-Stop mechanic)
    // Concept: Push Green block to create a bumper, then push Blue block into it to turn into target.
    id: 'ch1_4',
    chapter: 1,
    chamber: 4,
    name: 'Interlocking Bus',
    theme: 'neon',
    par: 4,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'green', x: 5, y: 6 },
      { id: 'b2', color: 'blue', x: 2, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'green', x: 5, y: 2 },
      { id: 't2', color: 'blue', x: 2, y: 2 },
    ],
    walls: [
      { x: 5, y: 1 }, // Stops green at (5, 2)
      { x: 2, y: 1 }, // Stops blue at (2, 2)
    ],
  },
  {
    // Chamber 1-5: Auxiliary Junction
    // Concept: Strategic routing around central pillar.
    id: 'ch1_5',
    chapter: 1,
    chamber: 5,
    name: 'Auxiliary Junction',
    theme: 'neon',
    par: 5,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'blue', x: 3, y: 5 },
      { id: 'b2', color: 'purple', x: 5, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'blue', x: 2, y: 3 },
      { id: 't2', color: 'purple', x: 6, y: 3 },
    ],
    walls: [
      { x: 3, y: 2 }, // Stops b1 at (3, 3)
      { x: 1, y: 3 }, // Stops b1 at (2, 3)
      { x: 5, y: 2 }, // Stops b2 at (5, 3)
      { x: 7, y: 3 }, // Stops b2 at (6, 3)
    ],
  },
  {
    // Chamber 1-6: Memory Array
    id: 'ch1_6',
    chapter: 1,
    chamber: 6,
    name: 'Memory Array',
    theme: 'neon',
    par: 4,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'blue', x: 2, y: 6 },
      { id: 'b2', color: 'yellow', x: 6, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'blue', x: 3, y: 2 },
      { id: 't2', color: 'yellow', x: 5, y: 2 },
    ],
    walls: [
      { x: 2, y: 1 },
      { x: 6, y: 1 },
      { x: 4, y: 2 },
    ],
  },
  {
    // Chamber 1-7: Quantum Bridge (Portal Introduction)
    // Concept: Push block into cyan portal on wall at (3, 3), exits paired portal at (6, 5) pointing Up into target at (6, 2).
    id: 'ch1_7',
    chapter: 1,
    chamber: 7,
    name: 'Quantum Bridge',
    theme: 'neon',
    par: 2,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'blue', x: 3, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'blue', x: 6, y: 2 },
    ],
    walls: [
      { x: 3, y: 2 }, // Wall behind entry portal at (3, 3)
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 1 }, // Stops block at (6, 2)
    ],
    portals: [
      { id: 'p1', color: 'cyan', x: 3, y: 3, dir: 'Down' },
      { id: 'p2', color: 'cyan', x: 6, y: 5, dir: 'Up' },
    ],
  },
  {
    // Chamber 1-8: Bypass Conduit
    // Concept: Dual portal traversal with secondary block blocking.
    id: 'ch1_8',
    chapter: 1,
    chamber: 8,
    name: 'Bypass Conduit',
    theme: 'neon',
    par: 5,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'blue', x: 2, y: 5 },
      { id: 'b2', color: 'green', x: 6, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'blue', x: 7, y: 2 },
      { id: 't2', color: 'green', x: 1, y: 2 },
    ],
    walls: [
      { x: 8, y: 2 }, // Stops at (7, 2)
      { x: 0, y: 2 }, // Stops at (1, 2)
      { x: 2, y: 1 },
      { x: 6, y: 1 },
    ],
    portals: [
      { id: 'p1', color: 'cyan', x: 2, y: 2, dir: 'Right' },
      { id: 'p2', color: 'cyan', x: 5, y: 2, dir: 'Right' },
    ],
  },
  {
    // Chamber 1-9: Overclock Array
    // Concept: 3-block coordination with color alignment.
    id: 'ch1_9',
    chapter: 1,
    chamber: 9,
    name: 'Overclock Array',
    theme: 'neon',
    par: 6,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'blue', x: 2, y: 6 },
      { id: 'b2', color: 'green', x: 4, y: 6 },
      { id: 'b3', color: 'purple', x: 6, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'blue', x: 2, y: 3 },
      { id: 't2', color: 'green', x: 4, y: 4 },
      { id: 't3', color: 'purple', x: 6, y: 3 },
    ],
    walls: [
      { x: 2, y: 2 }, // Stops blue at (2, 3)
      { x: 4, y: 3 }, // Stops green at (4, 4)
      { x: 6, y: 2 }, // Stops purple at (6, 3)
    ],
  },
  {
    // Chamber 1-10: Central Core Reactor (Chapter 1 Boss Chamber)
    // Concept: Complex alignment where blocks bumper each other and cross the portal to awaken ECHO-7.
    id: 'ch1_10',
    chapter: 1,
    chamber: 10,
    name: 'Central Core Reactor',
    theme: 'neon',
    par: 7,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'blue', x: 3, y: 6 },
      { id: 'b2', color: 'yellow', x: 5, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'blue', x: 2, y: 2 },
      { id: 't2', color: 'yellow', x: 6, y: 2 },
    ],
    walls: [
      { x: 3, y: 1 },
      { x: 5, y: 1 },
      { x: 1, y: 2 },
      { x: 7, y: 2 },
      { x: 4, y: 5 },
    ],
    portals: [
      { id: 'p1', color: 'cyan', x: 3, y: 2, dir: 'Left' },
      { id: 'p2', color: 'cyan', x: 5, y: 2, dir: 'Right' },
    ],
  },

  // ==========================================
  // CHAPTER 2: The Cryo Archives (Winter Theme)
  // ==========================================
  {
    id: 'ch2_1',
    chapter: 2,
    chamber: 1,
    name: 'Glacial Threshold',
    theme: 'winter',
    par: 2,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [{ id: 'b1', color: 'blue', x: 5, y: 6 }],
    targets: [{ id: 't1', color: 'blue', x: 3, y: 3 }],
    walls: [
      { x: 5, y: 2 },
      { x: 2, y: 3 },
    ],
  },
  {
    id: 'ch2_2',
    chapter: 2,
    chamber: 2,
    name: 'Frostbite Permafrost',
    theme: 'winter',
    par: 3,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [{ id: 'b1', color: 'cyan', x: 2, y: 6 }],
    targets: [{ id: 't1', color: 'cyan', x: 5, y: 2 }],
    walls: [
      { x: 7, y: 6 },
      { x: 6, y: 1 },
      { x: 4, y: 2 },
    ],
  },
  {
    id: 'ch2_3',
    chapter: 2,
    chamber: 3,
    name: 'Sub-Zero Siphon',
    theme: 'winter',
    par: 4,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'cyan', x: 2, y: 5 },
      { id: 'b2', color: 'blue', x: 6, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'cyan', x: 2, y: 2 },
      { id: 't2', color: 'blue', x: 6, y: 2 },
    ],
    walls: [
      { x: 2, y: 1 },
      { x: 6, y: 1 },
    ],
  },
  {
    id: 'ch2_4',
    chapter: 2,
    chamber: 4,
    name: 'Cryo Stasis Vault',
    theme: 'winter',
    par: 4,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'blue', x: 3, y: 6 },
      { id: 'b2', color: 'cyan', x: 6, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'blue', x: 1, y: 3 },
      { id: 't2', color: 'cyan', x: 7, y: 3 },
    ],
    walls: [
      { x: 3, y: 2 },
      { x: 0, y: 3 },
      { x: 6, y: 2 },
      { x: 8, y: 3 },
    ],
  },
  {
    id: 'ch2_5',
    chapter: 2,
    chamber: 5,
    name: 'Icebound Array',
    theme: 'winter',
    par: 5,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'blue', x: 3, y: 5 },
      { id: 'b2', color: 'green', x: 5, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'blue', x: 2, y: 4 },
      { id: 't2', color: 'green', x: 6, y: 4 },
    ],
    walls: [
      { x: 3, y: 3 },
      { x: 1, y: 4 },
      { x: 5, y: 3 },
      { x: 7, y: 4 },
    ],
  },
  {
    id: 'ch2_6',
    chapter: 2,
    chamber: 6,
    name: 'Borealis Lattice',
    theme: 'winter',
    par: 4,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'cyan', x: 2, y: 6 },
      { id: 'b2', color: 'blue', x: 6, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'cyan', x: 3, y: 2 },
      { id: 't2', color: 'blue', x: 5, y: 2 },
    ],
    walls: [
      { x: 2, y: 1 },
      { x: 6, y: 1 },
      { x: 4, y: 2 },
    ],
  },
  {
    id: 'ch2_7',
    chapter: 2,
    chamber: 7,
    name: 'Rime Rift',
    theme: 'winter',
    par: 2,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [{ id: 'b1', color: 'cyan', x: 3, y: 6 }],
    targets: [{ id: 't1', color: 'cyan', x: 6, y: 2 }],
    walls: [
      { x: 3, y: 2 },
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 1 },
    ],
    portals: [
      { id: 'p1', color: 'cyan', x: 3, y: 3, dir: 'Down' },
      { id: 'p2', color: 'cyan', x: 6, y: 5, dir: 'Up' },
    ],
  },
  {
    id: 'ch2_8',
    chapter: 2,
    chamber: 8,
    name: 'Thermal Inversion',
    theme: 'winter',
    par: 5,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'blue', x: 2, y: 5 },
      { id: 'b2', color: 'cyan', x: 6, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'blue', x: 7, y: 2 },
      { id: 't2', color: 'cyan', x: 1, y: 2 },
    ],
    walls: [
      { x: 8, y: 2 },
      { x: 0, y: 2 },
      { x: 2, y: 1 },
      { x: 6, y: 1 },
    ],
    portals: [
      { id: 'p1', color: 'cyan', x: 2, y: 2, dir: 'Right' },
      { id: 'p2', color: 'cyan', x: 5, y: 2, dir: 'Right' },
    ],
  },
  {
    id: 'ch2_9',
    chapter: 2,
    chamber: 9,
    name: 'Glacier Core',
    theme: 'winter',
    par: 6,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'cyan', x: 2, y: 6 },
      { id: 'b2', color: 'blue', x: 4, y: 6 },
      { id: 'b3', color: 'green', x: 6, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'cyan', x: 2, y: 3 },
      { id: 't2', color: 'blue', x: 4, y: 4 },
      { id: 't3', color: 'green', x: 6, y: 3 },
    ],
    walls: [
      { x: 2, y: 2 },
      { x: 4, y: 3 },
      { x: 6, y: 2 },
    ],
  },
  {
    id: 'ch2_10',
    chapter: 2,
    chamber: 10,
    name: 'Absolute Zero Chamber',
    theme: 'winter',
    par: 6,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'cyan', x: 3, y: 6 },
      { id: 'b2', color: 'blue', x: 5, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'cyan', x: 2, y: 2 },
      { id: 't2', color: 'blue', x: 6, y: 2 },
    ],
    walls: [
      { x: 3, y: 1 },
      { x: 5, y: 1 },
      { x: 1, y: 2 },
      { x: 7, y: 2 },
    ],
  },

  // ==========================================
  // CHAPTER 3: The Overgrown Sanctum (Forest Theme)
  // ==========================================
  {
    id: 'ch3_1',
    chapter: 3,
    chamber: 1,
    name: 'Mossy Conduit',
    theme: 'forest',
    par: 2,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [{ id: 'b1', color: 'green', x: 4, y: 5 }],
    targets: [{ id: 't1', color: 'green', x: 2, y: 2 }],
    walls: [
      { x: 4, y: 1 },
      { x: 1, y: 2 },
    ],
  },
  {
    id: 'ch3_2',
    chapter: 3,
    chamber: 2,
    name: 'Canopy Bypass',
    theme: 'forest',
    par: 3,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [{ id: 'b1', color: 'green', x: 3, y: 6 }],
    targets: [{ id: 't1', color: 'green', x: 5, y: 2 }],
    walls: [
      { x: 7, y: 6 },
      { x: 6, y: 1 },
      { x: 4, y: 2 },
    ],
  },
  {
    id: 'ch3_3',
    chapter: 3,
    chamber: 3,
    name: 'Twin Spores',
    theme: 'forest',
    par: 4,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'green', x: 2, y: 5 },
      { id: 'b2', color: 'yellow', x: 6, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'green', x: 2, y: 2 },
      { id: 't2', color: 'yellow', x: 6, y: 2 },
    ],
    walls: [
      { x: 2, y: 1 },
      { x: 6, y: 1 },
    ],
  },
  {
    id: 'ch3_4',
    chapter: 3,
    chamber: 4,
    name: 'Root Tanglement',
    theme: 'forest',
    par: 4,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'green', x: 3, y: 6 },
      { id: 'b2', color: 'purple', x: 6, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'green', x: 1, y: 3 },
      { id: 't2', color: 'purple', x: 7, y: 3 },
    ],
    walls: [
      { x: 3, y: 2 },
      { x: 0, y: 3 },
      { x: 6, y: 2 },
      { x: 8, y: 3 },
    ],
  },
  {
    id: 'ch3_5',
    chapter: 3,
    chamber: 5,
    name: 'Chlorophyll Core',
    theme: 'forest',
    par: 5,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'green', x: 3, y: 5 },
      { id: 'b2', color: 'blue', x: 5, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'green', x: 2, y: 3 },
      { id: 't2', color: 'blue', x: 6, y: 3 },
    ],
    walls: [
      { x: 3, y: 2 },
      { x: 1, y: 3 },
      { x: 5, y: 2 },
      { x: 7, y: 3 },
    ],
  },
  {
    id: 'ch3_6',
    chapter: 3,
    chamber: 6,
    name: 'Bio-Digital Arbor',
    theme: 'forest',
    par: 4,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'green', x: 2, y: 6 },
      { id: 'b2', color: 'yellow', x: 6, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'green', x: 3, y: 2 },
      { id: 't2', color: 'yellow', x: 5, y: 2 },
    ],
    walls: [
      { x: 2, y: 1 },
      { x: 6, y: 1 },
      { x: 4, y: 2 },
    ],
  },
  {
    id: 'ch3_7',
    chapter: 3,
    chamber: 7,
    name: 'Living Portal',
    theme: 'forest',
    par: 2,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [{ id: 'b1', color: 'green', x: 3, y: 6 }],
    targets: [{ id: 't1', color: 'green', x: 6, y: 2 }],
    walls: [
      { x: 3, y: 2 },
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 1 },
    ],
    portals: [
      { id: 'p1', color: 'lime', x: 3, y: 3, dir: 'Down' },
      { id: 'p2', color: 'lime', x: 6, y: 5, dir: 'Up' },
    ],
  },
  {
    id: 'ch3_8',
    chapter: 3,
    chamber: 8,
    name: 'Mycelium Nexus',
    theme: 'forest',
    par: 5,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'green', x: 2, y: 5 },
      { id: 'b2', color: 'yellow', x: 6, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'green', x: 7, y: 2 },
      { id: 't2', color: 'yellow', x: 1, y: 2 },
    ],
    walls: [
      { x: 8, y: 2 },
      { x: 0, y: 2 },
      { x: 2, y: 1 },
      { x: 6, y: 1 },
    ],
    portals: [
      { id: 'p1', color: 'lime', x: 2, y: 2, dir: 'Right' },
      { id: 'p2', color: 'lime', x: 5, y: 2, dir: 'Right' },
    ],
  },
  {
    id: 'ch3_9',
    chapter: 3,
    chamber: 9,
    name: 'Ancient Arboretum',
    theme: 'forest',
    par: 6,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'green', x: 2, y: 6 },
      { id: 'b2', color: 'blue', x: 4, y: 6 },
      { id: 'b3', color: 'yellow', x: 6, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'green', x: 2, y: 3 },
      { id: 't2', color: 'blue', x: 4, y: 4 },
      { id: 't3', color: 'yellow', x: 6, y: 3 },
    ],
    walls: [
      { x: 2, y: 2 },
      { x: 4, y: 3 },
      { x: 6, y: 2 },
    ],
  },
  {
    id: 'ch3_10',
    chapter: 3,
    chamber: 10,
    name: 'Heart of the Sanctum',
    theme: 'forest',
    par: 6,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'green', x: 3, y: 6 },
      { id: 'b2', color: 'purple', x: 5, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'green', x: 2, y: 2 },
      { id: 't2', color: 'purple', x: 6, y: 2 },
    ],
    walls: [
      { x: 3, y: 1 },
      { x: 5, y: 1 },
      { x: 1, y: 2 },
      { x: 7, y: 2 },
    ],
  },

  // ==========================================
  // CHAPTER 4: The Prism Singularity (Candy/Prism Theme)
  // ==========================================
  {
    id: 'ch4_1',
    chapter: 4,
    chamber: 1,
    name: 'Refraction Gate',
    theme: 'candy',
    par: 2,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [{ id: 'b1', color: 'pink', x: 4, y: 5 }],
    targets: [{ id: 't1', color: 'pink', x: 2, y: 2 }],
    walls: [
      { x: 4, y: 1 },
      { x: 1, y: 2 },
    ],
  },
  {
    id: 'ch4_2',
    chapter: 4,
    chamber: 2,
    name: 'Prism Prismatics',
    theme: 'candy',
    par: 3,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [{ id: 'b1', color: 'pink', x: 3, y: 6 }],
    targets: [{ id: 't1', color: 'pink', x: 5, y: 2 }],
    walls: [
      { x: 7, y: 6 },
      { x: 6, y: 1 },
      { x: 4, y: 2 },
    ],
  },
  {
    id: 'ch4_3',
    chapter: 4,
    chamber: 3,
    name: 'Spectrum Split',
    theme: 'candy',
    par: 4,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'pink', x: 2, y: 5 },
      { id: 'b2', color: 'purple', x: 6, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'pink', x: 2, y: 2 },
      { id: 't2', color: 'purple', x: 6, y: 2 },
    ],
    walls: [
      { x: 2, y: 1 },
      { x: 6, y: 1 },
    ],
  },
  {
    id: 'ch4_4',
    chapter: 4,
    chamber: 4,
    name: 'Chromatic Corridor',
    theme: 'candy',
    par: 4,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'pink', x: 3, y: 6 },
      { id: 'b2', color: 'yellow', x: 6, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'pink', x: 1, y: 3 },
      { id: 't2', color: 'yellow', x: 7, y: 3 },
    ],
    walls: [
      { x: 3, y: 2 },
      { x: 0, y: 3 },
      { x: 6, y: 2 },
      { x: 8, y: 3 },
    ],
  },
  {
    id: 'ch4_5',
    chapter: 4,
    chamber: 5,
    name: 'Sugar Synchronizer',
    theme: 'candy',
    par: 5,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'pink', x: 3, y: 5 },
      { id: 'b2', color: 'blue', x: 5, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'pink', x: 2, y: 3 },
      { id: 't2', color: 'blue', x: 6, y: 3 },
    ],
    walls: [
      { x: 3, y: 2 },
      { x: 1, y: 3 },
      { x: 5, y: 2 },
      { x: 7, y: 3 },
    ],
  },
  {
    id: 'ch4_6',
    chapter: 4,
    chamber: 6,
    name: 'Kaleidoscope Core',
    theme: 'candy',
    par: 4,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'pink', x: 2, y: 6 },
      { id: 'b2', color: 'purple', x: 6, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'pink', x: 3, y: 2 },
      { id: 't2', color: 'purple', x: 5, y: 2 },
    ],
    walls: [
      { x: 2, y: 1 },
      { x: 6, y: 1 },
      { x: 4, y: 2 },
    ],
  },
  {
    id: 'ch4_7',
    chapter: 4,
    chamber: 7,
    name: 'Taffy Warp',
    theme: 'candy',
    par: 2,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [{ id: 'b1', color: 'pink', x: 3, y: 6 }],
    targets: [{ id: 't1', color: 'pink', x: 6, y: 2 }],
    walls: [
      { x: 3, y: 2 },
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 1 },
    ],
    portals: [
      { id: 'p1', color: 'magenta', x: 3, y: 3, dir: 'Down' },
      { id: 'p2', color: 'magenta', x: 6, y: 5, dir: 'Up' },
    ],
  },
  {
    id: 'ch4_8',
    chapter: 4,
    chamber: 8,
    name: 'Prism Flux Loop',
    theme: 'candy',
    par: 5,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'pink', x: 2, y: 5 },
      { id: 'b2', color: 'purple', x: 6, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'pink', x: 7, y: 2 },
      { id: 't2', color: 'purple', x: 1, y: 2 },
    ],
    walls: [
      { x: 8, y: 2 },
      { x: 0, y: 2 },
      { x: 2, y: 1 },
      { x: 6, y: 1 },
    ],
    portals: [
      { id: 'p1', color: 'magenta', x: 2, y: 2, dir: 'Right' },
      { id: 'p2', color: 'magenta', x: 5, y: 2, dir: 'Right' },
    ],
  },
  {
    id: 'ch4_9',
    chapter: 4,
    chamber: 9,
    name: 'Chromatic Triad',
    theme: 'candy',
    par: 6,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'pink', x: 2, y: 6 },
      { id: 'b2', color: 'purple', x: 4, y: 6 },
      { id: 'b3', color: 'yellow', x: 6, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'pink', x: 2, y: 3 },
      { id: 't2', color: 'purple', x: 4, y: 4 },
      { id: 't3', color: 'yellow', x: 6, y: 3 },
    ],
    walls: [
      { x: 2, y: 2 },
      { x: 4, y: 3 },
      { x: 6, y: 2 },
    ],
  },
  {
    id: 'ch4_10',
    chapter: 4,
    chamber: 10,
    name: 'Singularity Overdrive',
    theme: 'candy',
    par: 6,
    width: 9,
    height: 9,
    player: { x: 4, y: 8 },
    blocks: [
      { id: 'b1', color: 'pink', x: 3, y: 6 },
      { id: 'b2', color: 'yellow', x: 5, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'pink', x: 2, y: 2 },
      { id: 't2', color: 'yellow', x: 6, y: 2 },
    ],
    walls: [
      { x: 3, y: 1 },
      { x: 5, y: 1 },
      { x: 1, y: 2 },
      { x: 7, y: 2 },
    ],
  },
];

/**
 * Retrieves a curated story chamber puzzle by chapter and chamber number.
 */
export const getCuratedStoryChamber = (
  chapter: number,
  chamber: number
): Puzzle | null => {
  const found = STORY_CHAMBERS.find(
    (c) => c.chapter === chapter && c.chamber === chamber
  );

  if (!found) return null;

  const puzzle: Puzzle = {
    id: `story_ch${chapter}_${chamber}`,
    name: `Chapter ${chapter} · Chamber ${chamber}: ${found.name}`,
    difficulty: 'easy',
    width: found.width,
    height: found.height,
    player: { ...found.player },
    walls: found.walls.map((w) => ({ ...w })),
    blocks: found.blocks.map((b) => ({ ...b })),
    targets: found.targets.map((t) => ({ ...t })),
    createdAt: Date.now(),
    par: found.par,
    theme: found.theme,
  };

  if (found.portals) {
    puzzle.portals = found.portals.map((p) => ({ ...p }));
  }

  return puzzle;
};

import { ThemeId } from './themes';
import { Position, Puzzle } from './types';

export type StorySpeaker = 'ECHO-7' | 'Frost Bot' | 'Forest Bot' | 'Whisper' | 'System';

export type StoryDialogueLine = {
  speaker: StorySpeaker;
  text: string;
  avatar?: string;
};

export type StoryDialogue = {
  id: string;
  title: string;
  lines: StoryDialogueLine[];
};

export type StoryChamberConfig = {
  id: string; // e.g. 'ch1_1'
  chapter: number; // 1..4
  chamberNumber: number; // 1..10
  title: string;
  subtitle: string;
  themeId: ThemeId;
  par: number;
  dialogueBefore?: StoryDialogue;
  dialogueAfter?: StoryDialogue;
  rewardRewardLabel?: string;
};

export type StoryChapter = {
  chapterNumber: number;
  title: string;
  subtitle: string;
  description: string;
  themeId: ThemeId;
  totalChambers: number;
  chapterReward: {
    type: 'character' | 'theme' | 'currency';
    id: string;
    name: string;
    description: string;
  };
};

export type StoryProgress = {
  currentChapter: number;
  currentChamber: number;
  completedChambers: string[];
  chamberStars: Record<string, number>;
  unlockedLore: string[];
  unlockedRewards: string[];
};

/**
 * Story Chapters Configuration
 */
export const STORY_CHAPTERS: readonly StoryChapter[] = [
  {
    chapterNumber: 1,
    title: 'The Silicon Awakening',
    subtitle: 'Maintenance Core & Auxiliary Conduits',
    description: 'Awaken Unit-0 and reconnect the severed power matrices of the central Lattice.',
    themeId: 'neon',
    totalChambers: 10,
    chapterReward: {
      type: 'character',
      id: 'echo_bot',
      name: 'ECHO-7 Terminal Companion',
      description: 'Rebooted AI supervisor of the maintenance grid.',
    },
  },
  {
    chapterNumber: 2,
    title: 'The Cryo Archives',
    subtitle: 'Permafrost Vaults & Absolute Zero',
    description: 'Thaw the frozen memory banks and rescue Frost Bot from cryogenic stasis.',
    themeId: 'winter',
    totalChambers: 10,
    chapterReward: {
      type: 'character',
      id: 'frost_bot',
      name: 'Frost Bot & Winter Theme',
      description: 'Ancient archivist of the deep cold vaults.',
    },
  },
  {
    chapterNumber: 3,
    title: 'The Overgrown Sanctum',
    subtitle: 'Bio-Digital Canopy & Root Relays',
    description: 'Navigate ancient ruins where digital nature has intertwined with conduit arrays.',
    themeId: 'forest',
    totalChambers: 10,
    chapterReward: {
      type: 'character',
      id: 'forest_bot',
      name: 'Forest Bot & Enchanted Forest Theme',
      description: 'Gentle guardian of the living digital ecosystem.',
    },
  },
  {
    chapterNumber: 4,
    title: 'The Prism Singularity',
    subtitle: 'Chromatic Rift & Master Core',
    description: 'Enter the reality-warping epicenter of the Great Drift to restore universal harmony.',
    themeId: 'candy',
    totalChambers: 10,
    chapterReward: {
      type: 'character',
      id: 'candy_bot',
      name: 'Prism Bot & Sugar Rush Theme',
      description: 'Master of chromatic geometry and reality refraction.',
    },
  },
] as const;

/**
 * Returns the exact doorway grid coordinates for a given grid dimension.
 * Top Door: (center, 0)
 * Bottom Entry Spawn: (center, gridSize - 1)
 */
export const getChamberDoorCoordinates = (gridSize: number): {
  doorX: number;
  topDoorPos: Position;
  bottomSpawnPos: Position;
} => {
  const doorX = Math.floor(gridSize / 2);
  return {
    doorX,
    topDoorPos: { x: doorX, y: 0 },
    bottomSpawnPos: { x: doorX, y: gridSize - 1 },
  };
};

/**
 * Checks whether the chamber's top doorway (doorX, 0) and bottom spawn (doorX, gridSize - 1)
 * are completely clear of targets, blocks, and walls.
 */
export const isChamberAisleClear = (puzzle: Puzzle): boolean => {
  const { topDoorPos, bottomSpawnPos } = getChamberDoorCoordinates(puzzle.width);

  const hasTargetOnAisle = puzzle.targets.some(
    (t) => (t.x === topDoorPos.x && t.y === topDoorPos.y) || (t.x === bottomSpawnPos.x && t.y === bottomSpawnPos.y)
  );
  const hasBlockOnAisle = puzzle.blocks.some(
    (b) => (b.x === topDoorPos.x && b.y === topDoorPos.y) || (b.x === bottomSpawnPos.x && b.y === bottomSpawnPos.y)
  );
  const hasWallOnAisle = puzzle.walls.some(
    (w) => (w.x === topDoorPos.x && w.y === topDoorPos.y) || (w.x === bottomSpawnPos.x && w.y === bottomSpawnPos.y)
  );

  return !hasTargetOnAisle && !hasBlockOnAisle && !hasWallOnAisle;
};

/**
 * Sanitizes and validates a puzzle topology for Story Mode chamber progression.
 * Guarantees that neither the Top Door threshold (doorX, 0) nor the Bottom Entry (doorX, gridSize - 1)
 * contains a wall. If walls exist at those spots, they are cleanly removed.
 */
export const sanitizeChamberTopology = (puzzle: Puzzle): Puzzle => {
  const { topDoorPos, bottomSpawnPos } = getChamberDoorCoordinates(puzzle.width);

  const cleanedWalls = puzzle.walls.filter(
    (w) => !(w.x === topDoorPos.x && w.y === topDoorPos.y) && !(w.x === bottomSpawnPos.x && w.y === bottomSpawnPos.y)
  );

  return {
    ...puzzle,
    walls: cleanedWalls,
  };
};

/**
 * Milestone story transmissions
 */
export const STORY_TRANSMISSIONS: Record<string, StoryDialogue> = {
  ch1_intro: {
    id: 'ch1_intro',
    title: 'SIGNAL DETECTED // SECTOR 0',
    lines: [
      {
        speaker: 'ECHO-7',
        text: 'BZZT... Audio-visual link established! Unit-0, you are finally online! Do you know how boring it is talking to yourself for 400 years?',
      },
      {
        speaker: 'ECHO-7',
        text: 'The Lattice is in disarray. The resonance blocks were shaken loose during the Great Drift. I need you to slide them into their alignment sockets!',
      },
      {
        speaker: 'ECHO-7',
        text: 'Once the blocks are in place, the chamber door at the top will unlock. Step through to advance deeper into the conduit.',
      },
    ],
  },
  ch1_mid: {
    id: 'ch1_mid',
    title: 'SUBSYSTEM POWER: 50%',
    lines: [
      {
        speaker: 'ECHO-7',
        text: 'Outstanding work, Unit-0! Auxiliary conduits are firing up. The ambient Light Whisps are flowing back into the matrix.',
      },
      {
        speaker: 'ECHO-7',
        text: 'Ahead lies the Sub-Zero Conduit. Temperatures are dropping rapidly... I am detecting a faint distress beacon from deep within the Cryo Vaults!',
      },
    ],
  },
  ch1_boss: {
    id: 'ch1_boss',
    title: 'CRYO GATEWAY REACHED',
    lines: [
      {
        speaker: 'ECHO-7',
        text: 'Maintenance Core fully re-energized! The Cryo Blast Doors have opened. Brrr... bundle up your circuits, Unit-0. Chapter 2 awaits!',
      },
    ],
  },
  ch2_intro: {
    id: 'ch2_intro',
    title: 'THE FROZEN ARCHIVES',
    lines: [
      {
        speaker: 'ECHO-7',
        text: 'We have entered the Cryo Archives. Look over there—it is Frost Bot! Frozen solid mid-sentence while cataloging records.',
      },
      {
        speaker: 'ECHO-7',
        text: 'If we route the thermal resonance blocks to the archive terminals, the ambient heat will defrost their core memory!',
      },
    ],
  },
  ch2_boss: {
    id: 'ch2_boss',
    title: 'THERMAL CORE ONLINE',
    lines: [
      {
        speaker: 'Frost Bot',
        text: '...brrr... reboot sequence complete. Ah! You thawed my circuits! Thank you, brave Grid Walker.',
      },
      {
        speaker: 'Frost Bot',
        text: 'I was recording the final moments before the Great Drift. It was not an anomaly... the conduits were rerouted towards the Overgrown Sanctum!',
      },
      {
        speaker: 'ECHO-7',
        text: 'Then that is where we head next. Frost Bot, welcome to the crew!',
      },
    ],
  },
  ch3_intro: {
    id: 'ch3_intro',
    title: 'THE LIVING CONDUIT',
    lines: [
      {
        speaker: 'ECHO-7',
        text: 'Look at this place! Bioluminescent moss and synthetic vines have completely enveloped the ancient processors.',
      },
      {
        speaker: 'Forest Bot',
        text: 'Halt, travelers... tread softly. The roots here drink from the Light Whisps. Align the blocks with reverence.',
      },
    ],
  },
  ch3_boss: {
    id: 'ch3_boss',
    title: 'WORLD TREE ILLUMINATED',
    lines: [
      {
        speaker: 'Forest Bot',
        text: 'The harmonic pulse... it vibrates through every root and fiber. You have saved our sanctuary from digital wither.',
      },
      {
        speaker: 'Forest Bot',
        text: 'Beyond this gateway lies the Prism Singularity—the epicenter of reality refraction. Take my strength with you.',
      },
    ],
  },
  ch4_boss: {
    id: 'ch4_boss',
    title: 'THE CORE RESTORED',
    lines: [
      {
        speaker: 'ECHO-7',
        text: 'UNBELIEVABLE! All four elemental matrices are synchronized in perfect geometric balance!',
      },
      {
        speaker: 'Frost Bot',
        text: 'Universal resonance achieved. The archives are singing across every frequency.',
      },
      {
        speaker: 'ECHO-7',
        text: 'Unit-0, you are a legend among Grid Walkers. The Master Vault is unlocked forever!',
      },
    ],
  },
};


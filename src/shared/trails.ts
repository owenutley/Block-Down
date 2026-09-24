export type TrailId = 'none' | 'pulse' | 'ghost' | 'sparkle' | 'fire' | 'cyber';

export type Trail = {
  id: TrailId;
  name: string;
  cost: number;
  description: string;
  earnRequirement?: string;
};

export const TRAILS: Trail[] = [
  {
    id: 'none',
    name: 'No Trail',
    cost: 0,
    description: 'Play with a clean board without any block trail animations.',
  },
  {
    id: 'pulse',
    name: 'Pulse Trail',
    cost: 1000,
    description: 'The classic block-down trail. Matches the color of the sliding block across the board.',
  },
  {
    id: 'ghost',
    name: 'Neon Ghost',
    cost: 4000,
    description: 'A fading holographic echo of the block follows its path.',
  },
  {
    id: 'sparkle',
    name: 'Sparkle Dust',
    cost: 4000,
    description: 'A trail of shimmering sparkles left in the block\'s wake.',
  },
  {
    id: 'fire',
    name: 'Fire Wave',
    cost: 4000,
    description: 'A scorching wave of heat and flame trailing the sliding block.',
  },
  {
    id: 'cyber',
    name: 'Cyber Outrun',
    cost: 4000,
    description: 'Electric cyan and magenta cyberspace grid echoes.',
  },
];

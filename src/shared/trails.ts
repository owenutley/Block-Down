export type TrailId = 'none' | 'ghost' | 'sparkle' | 'fire' | 'cyber';

export type Trail = {
  id: TrailId;
  name: string;
  cost: number;
  description: string;
  earnRequirement?: string;
};

export const TRAILS: Trail[] = [
  {
    id: 'ghost',
    name: 'Neon Ghost',
    cost: 2000,
    description: 'A fading holographic echo of the block follows its path.',
  },
  {
    id: 'sparkle',
    name: 'Sparkle Dust',
    cost: 2000,
    description: 'A trail of shimmering sparkles left in the block\'s wake.',
  },
  {
    id: 'fire',
    name: 'Fire Wave',
    cost: 2000,
    description: 'A scorching wave of heat and flame trailing the sliding block.',
  },
  {
    id: 'cyber',
    name: 'Cyber Outrun',
    cost: 0,
    earnRequirement: '3-Day Streak',
    description: 'Exclusive 3-Day Streak reward! Electric cyan and magenta cyberspace grid echoes.',
  },
];

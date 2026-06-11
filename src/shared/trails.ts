export type TrailId = 'none' | 'ghost' | 'sparkle' | 'fire';

export type Trail = {
  id: TrailId;
  name: string;
  cost: number;
  description: string;
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
];

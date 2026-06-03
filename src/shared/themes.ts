export type ThemeId = 'neon' | 'arcade' | 'cosmic' | 'zen';

export type Theme = {
  id: ThemeId;
  name: string;
  cost: number;
  description: string;
};

export const THEMES: Theme[] = [
  {
    id: 'neon',
    name: 'Neon Cyber',
    cost: 0,
    description: 'The default neon glow cyber grid with pulsing light tracks.',
  },
  {
    id: 'arcade',
    name: 'Retro Arcade',
    cost: 2000,
    description: 'A classic 8-bit cabinet style with brick-textured walls and flat arcade pixels.',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Nebula',
    cost: 2000,
    description: 'Drift through a starry nebula with floating celestial orbits and solar-themed colors.',
  },
  {
    id: 'zen',
    name: 'Zen Garden',
    cost: 2000,
    description: 'Find inner peace with smooth river stones, mossy elements, and calming forest textures.',
  },
];

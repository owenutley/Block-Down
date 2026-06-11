export type ThemeId = string;

export type Theme = {
  id: ThemeId;
  name: string;
  cost: number;
  description: string;
  baseTheme?: string;
  bgGradient?: string;
  panelClass?: string;
  cellClass?: string;
  wallClass?: string;
};

export const THEMES: Theme[] = [
  {
    id: 'neon',
    name: 'Neon Cyber',
    cost: 0,
    description: 'The default neon glow cyber grid with pulsing light tracks.',
    bgGradient: 'bg-mesh-gradient',
    panelClass: 'glass-panel border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    cellClass: 'glass-cell border border-white/5',
    wallClass: 'wall-cell',
  },
  {
    id: 'winter',
    name: 'Winter Wonderland',
    cost: 1000,
    description: 'Ice cold theme with blue and white shades and snow/ice crystals.',
    bgGradient: 'bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900',
    panelClass: 'bg-sky-950/20 border border-sky-400/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(56,189,248,0.2)]',
    cellClass: 'bg-sky-950/10 border border-sky-800/10 rounded-lg',
    wallClass: 'bg-slate-800 border-2 border-slate-600 rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)]',
  },
  {
    id: 'forest',
    name: 'Enchanted Forest',
    cost: 1500,
    description: 'Deep woodland shades of green and brown with organic leaves and forest details.',
    bgGradient: 'bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-950',
    panelClass: 'bg-emerald-950/20 border border-emerald-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    cellClass: 'bg-emerald-950/10 border border-emerald-800/10 rounded-lg',
    wallClass: 'bg-stone-800 border-2 border-amber-950/60 rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.7)]',
  },
  {
    id: 'candy',
    name: 'Candy Land',
    cost: 2000,
    description: 'Sweet pastel pink and violet tones with sweet treats and dessert patterns.',
    bgGradient: 'bg-gradient-to-br from-pink-950 via-purple-950 to-slate-950',
    panelClass: 'bg-pink-950/20 border border-pink-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(244,63,94,0.15)]',
    cellClass: 'bg-pink-950/10 border border-pink-800/10 rounded-xl',
    wallClass: 'bg-fuchsia-900/80 border-2 border-fuchsia-700 rounded-xl shadow-[inset_0_4px_6px_rgba(0,0,0,0.5)]',
  },
  {
    id: 'space',
    name: 'Deep Space',
    cost: 2500,
    description: 'Journey through the cosmos with planets, stars, and alien spaceships.',
    bgGradient: 'bg-gradient-to-br from-indigo-950 via-slate-950 to-blue-950',
    panelClass: 'bg-indigo-950/20 border border-indigo-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(99,102,241,0.15)]',
    cellClass: 'bg-zinc-950/40 border border-zinc-800/10 rounded-lg',
    wallClass: 'bg-zinc-800 border-2 border-zinc-500 rounded-lg shadow-[inset_0_4px_6px_rgba(255,255,255,0.1)]',
  },
  {
    id: 'ocean',
    name: 'Abyssal Ocean',
    cost: 3000,
    description: 'Dive deep into the blue ocean filled with fish, anchors, and mysterious creatures.',
    bgGradient: 'bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-950',
    panelClass: 'bg-sky-950/20 border border-cyan-400/35 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(34,211,238,0.25)]',
    cellClass: 'bg-cyan-950/10 border border-cyan-800/10 rounded-lg',
    wallClass: 'bg-cyan-900/70 border-2 border-cyan-600 rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)]',
  },
  {
    id: 'retro',
    name: 'Retro Arcade',
    cost: 3500,
    description: 'Step into a 8-bit classic arcade with ghosts, joysticks, and retro pixels.',
    bgGradient: 'bg-gradient-to-br from-zinc-900 via-stone-950 to-black',
    panelClass: 'bg-zinc-900/40 border border-zinc-700/60 rounded-3xl backdrop-blur-md shadow-[0_0_35px_rgba(255,255,255,0.05)]',
    cellClass: 'bg-zinc-950/30 border border-zinc-800/10 rounded-md',
    wallClass: 'bg-zinc-800 border-2 border-zinc-600 rounded-md shadow-[inset_0_4px_6px_rgba(0,0,0,0.85)]',
  },
  {
    id: 'desert',
    name: 'Desert Oasis',
    cost: 4000,
    description: 'Journey across warm sands with pyramids, cacti, and hot desert suns.',
    bgGradient: 'bg-gradient-to-br from-amber-950 via-yellow-950 to-stone-950',
    panelClass: 'bg-amber-950/20 border border-amber-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.15)]',
    cellClass: 'bg-amber-950/10 border border-amber-800/10 rounded-lg',
    wallClass: 'bg-stone-900 border-2 border-rose-950 rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.9)]',
  },
  {
    id: 'spooky',
    name: 'Spooky Halloween',
    cost: 4500,
    description: 'A creepy, dark theme with pumpkins, bats, skulls, and eerie potions.',
    bgGradient: 'bg-gradient-to-br from-zinc-950 via-purple-950 to-black',
    panelClass: 'bg-purple-950/25 border border-purple-500/40 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.2)]',
    cellClass: 'bg-purple-950/10 border border-purple-800/10 rounded-xl',
    wallClass: 'bg-zinc-900 border-2 border-purple-900 rounded-xl shadow-[inset_0_4px_6px_rgba(0,0,0,0.8)]',
  },
  {
    id: 'volcanic',
    name: 'Volcanic Magma',
    cost: 5000,
    description: 'Enter the fiery depths of a volcano surrounded by magma and hot ash.',
    bgGradient: 'bg-gradient-to-br from-red-950 via-amber-950 to-black',
    panelClass: 'bg-red-950/25 border border-red-500/40 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.2)]',
    cellClass: 'bg-red-950/10 border border-red-800/10 rounded-lg',
    wallClass: 'bg-stone-900 border-2 border-red-950 rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.9)]',
  },
];

export const ALL_SHAPE_IDS = [
  'heart', 'diamond', 'crescent', 'circle', 'cross', 'square',
  'snowflake', 'crystal', 'sparkle', 'snowman', 'tree', 'cube',
  'leaf', 'acorn', 'mushroom', 'pinecone', 'flower', 'stump',
  'lollipop', 'wrapped_candy', 'candy_cane', 'cupcake', 'gummy_bear', 'donut',
  // Space
  'rocket', 'alien', 'planet', 'star', 'ufo', 'comet',
  // Ocean
  'fish', 'anchor', 'shell', 'wave', 'octopus', 'submarine',
  // Retro
  'ghost', 'joystick', 'crown', 'gem', 'sword', 'shield',
  // Desert
  'pyramid', 'cactus', 'camel', 'sun', 'eye_of_horus', 'palm_tree',
  // Spooky
  'skull', 'bat', 'pumpkin', 'witch_hat', 'potion',
  // Volcanic
  'fire', 'volcano', 'bomb', 'key', 'chest', 'anvil'
] as const;

export type ShapeId = typeof ALL_SHAPE_IDS[number];

export type ColorId =
  | 'red'
  | 'blue'
  | 'yellow'
  | 'purple'
  | 'green'
  | 'orange'
  | 'indigo'
  | 'cyan'
  | 'white'
  | 'sky'
  | 'teal'
  | 'cobalt'
  | 'emerald'
  | 'amber'
  | 'crimson'
  | 'pink'
  | 'lime'
  | 'fuchsia'
  | 'rose';

export type BlockThemeConfig = {
  shape: ShapeId;
  color: ColorId;
};

export type ThemeConfig = Record<
  'red-heart' | 'blue-diamond' | 'yellow-crescent' | 'purple-circle' | 'green-cross' | 'orange-square',
  BlockThemeConfig
>;

export const DEFAULT_THEME_CONFIGS: Record<
  'neon' | 'winter' | 'forest' | 'candy' | 'space' | 'ocean' | 'retro' | 'desert' | 'spooky' | 'volcanic',
  ThemeConfig
> = {
  neon: {
    'red-heart': { shape: 'heart', color: 'red' },
    'blue-diamond': { shape: 'diamond', color: 'blue' },
    'yellow-crescent': { shape: 'crescent', color: 'yellow' },
    'purple-circle': { shape: 'circle', color: 'purple' },
    'green-cross': { shape: 'cross', color: 'green' },
    'orange-square': { shape: 'square', color: 'orange' },
  },
  winter: {
    'red-heart': { shape: 'snowflake', color: 'indigo' },
    'blue-diamond': { shape: 'crystal', color: 'cyan' },
    'yellow-crescent': { shape: 'sparkle', color: 'white' },
    'purple-circle': { shape: 'snowman', color: 'sky' },
    'green-cross': { shape: 'tree', color: 'teal' },
    'orange-square': { shape: 'cube', color: 'cobalt' },
  },
  forest: {
    'red-heart': { shape: 'leaf', color: 'emerald' },
    'blue-diamond': { shape: 'acorn', color: 'amber' },
    'yellow-crescent': { shape: 'mushroom', color: 'crimson' },
    'purple-circle': { shape: 'pinecone', color: 'yellow' },
    'green-cross': { shape: 'flower', color: 'lime' },
    'orange-square': { shape: 'stump', color: 'teal' },
  },
  candy: {
    'red-heart': { shape: 'lollipop', color: 'pink' },
    'blue-diamond': { shape: 'wrapped_candy', color: 'yellow' },
    'yellow-crescent': { shape: 'candy_cane', color: 'rose' },
    'purple-circle': { shape: 'cupcake', color: 'fuchsia' },
    'green-cross': { shape: 'gummy_bear', color: 'lime' },
    'orange-square': { shape: 'donut', color: 'cyan' },
  },
  space: {
    'red-heart': { shape: 'rocket', color: 'purple' },
    'blue-diamond': { shape: 'alien', color: 'cyan' },
    'yellow-crescent': { shape: 'planet', color: 'orange' },
    'purple-circle': { shape: 'star', color: 'indigo' },
    'green-cross': { shape: 'ufo', color: 'yellow' },
    'orange-square': { shape: 'comet', color: 'white' },
  },
  ocean: {
    'red-heart': { shape: 'fish', color: 'cyan' },
    'blue-diamond': { shape: 'anchor', color: 'blue' },
    'yellow-crescent': { shape: 'shell', color: 'sky' },
    'purple-circle': { shape: 'wave', color: 'teal' },
    'green-cross': { shape: 'octopus', color: 'cobalt' },
    'orange-square': { shape: 'submarine', color: 'white' },
  },
  retro: {
    'red-heart': { shape: 'ghost', color: 'red' },
    'blue-diamond': { shape: 'joystick', color: 'green' },
    'yellow-crescent': { shape: 'crown', color: 'yellow' },
    'purple-circle': { shape: 'gem', color: 'fuchsia' },
    'green-cross': { shape: 'sword', color: 'white' },
    'orange-square': { shape: 'shield', color: 'blue' },
  },
  desert: {
    'red-heart': { shape: 'pyramid', color: 'amber' },
    'blue-diamond': { shape: 'cactus', color: 'lime' },
    'yellow-crescent': { shape: 'camel', color: 'orange' },
    'purple-circle': { shape: 'sun', color: 'yellow' },
    'green-cross': { shape: 'eye_of_horus', color: 'crimson' },
    'orange-square': { shape: 'palm_tree', color: 'emerald' },
  },
  spooky: {
    'red-heart': { shape: 'skull', color: 'lime' },
    'blue-diamond': { shape: 'bat', color: 'purple' },
    'yellow-crescent': { shape: 'pumpkin', color: 'orange' },
    'purple-circle': { shape: 'witch_hat', color: 'fuchsia' },
    'green-cross': { shape: 'potion', color: 'cyan' },
    'orange-square': { shape: 'ghost', color: 'yellow' },
  },
  volcanic: {
    'red-heart': { shape: 'fire', color: 'crimson' },
    'blue-diamond': { shape: 'volcano', color: 'orange' },
    'yellow-crescent': { shape: 'bomb', color: 'purple' },
    'purple-circle': { shape: 'key', color: 'yellow' },
    'green-cross': { shape: 'chest', color: 'rose' },
    'orange-square': { shape: 'anvil', color: 'white' },
  },
};

export type BaseThemeId = 'neon' | 'winter' | 'forest' | 'candy' | 'space' | 'ocean' | 'retro' | 'desert' | 'spooky' | 'volcanic';

export const getBaseThemeId = (themeId: string): BaseThemeId => {
  const validBases = ['neon', 'winter', 'forest', 'candy', 'space', 'ocean', 'retro', 'desert', 'spooky', 'volcanic'] as const;
  const isBaseTheme = (val: string): val is BaseThemeId => {
    return (validBases as readonly string[]).includes(val);
  };
  if (isBaseTheme(themeId)) {
    return themeId;
  }
  if (themeId.startsWith('custom_')) {
    const parts = themeId.split('_');
    const base = parts[1];
    if (base && isBaseTheme(base)) {
      return base;
    }
  }
  return 'neon';
};

export const getThemeBgClass = (themeId: ThemeId, activeThemeStyle?: Theme): string => {
  if (activeThemeStyle?.bgGradient) {
    return activeThemeStyle.bgGradient;
  }
  const base = getBaseThemeId(themeId);
  switch (base) {
    case 'winter':
      return 'bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900';
    case 'forest':
      return 'bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-950';
    case 'candy':
      return 'bg-gradient-to-br from-pink-950 via-purple-950 to-slate-950';
    case 'space':
      return 'bg-gradient-to-br from-indigo-950 via-slate-950 to-blue-950';
    case 'ocean':
      return 'bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-950';
    case 'retro':
      return 'bg-gradient-to-br from-zinc-900 via-stone-950 to-black';
    case 'desert':
      return 'bg-gradient-to-br from-amber-950 via-yellow-950 to-stone-950';
    case 'spooky':
      return 'bg-gradient-to-br from-zinc-950 via-purple-950 to-black';
    case 'volcanic':
      return 'bg-gradient-to-br from-red-950 via-amber-950 to-black';
    case 'neon':
    default:
      return 'bg-mesh-gradient';
  }
};


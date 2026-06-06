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
  },
  {
    id: 'winter',
    name: 'Winter Wonderland',
    cost: 1000,
    description: 'Ice cold theme with blue and white shades and snow/ice crystals.',
  },
  {
    id: 'forest',
    name: 'Enchanted Forest',
    cost: 1500,
    description: 'Deep woodland shades of green and brown with organic leaves and forest details.',
  },
  {
    id: 'candy',
    name: 'Candy Land',
    cost: 2000,
    description: 'Sweet pastel pink and violet tones with sweet treats and dessert patterns.',
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
  'pyramid', 'cactus', 'camel', 'sun', 'eye_of_horus', 'palm_tree'
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

export const DEFAULT_THEME_CONFIGS: Record<'neon' | 'winter' | 'forest' | 'candy', ThemeConfig> = {
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
};

export const getBaseThemeId = (themeId: string): 'neon' | 'winter' | 'forest' | 'candy' => {
  if (themeId === 'winter' || themeId === 'forest' || themeId === 'candy' || themeId === 'neon') {
    return themeId;
  }
  if (themeId.startsWith('custom_')) {
    const parts = themeId.split('_');
    const base = parts[1];
    if (base === 'winter' || base === 'forest' || base === 'candy' || base === 'neon') {
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
    case 'neon':
    default:
      return 'bg-mesh-gradient';
  }
};


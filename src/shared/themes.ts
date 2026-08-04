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
    description: 'The default neon glow cyber grid with tactile papercraft cutout tiles.',
    bgGradient: 'bg-gradient-to-br from-slate-950 via-cyan-950 to-zinc-950',
    panelClass: 'bg-cyan-950/40 border-4 border-cyan-500/80 rounded-2xl shadow-[6px_6px_0px_rgba(6,182,212,0.5)]',
    cellClass: 'bg-cyan-950/20 border-2 border-cyan-800/40 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-cyan-950/20 border-2 border-cyan-800/40 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  {
    id: 'winter',
    name: 'Winter Wonderland',
    cost: 1000,
    description: 'Ice cold theme with blue/white shades and papercraft layered ice crystals.',
    bgGradient: 'bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900',
    panelClass: 'bg-sky-950/50 border-4 border-sky-400/80 rounded-2xl shadow-[6px_6px_0px_rgba(56,189,248,0.5)]',
    cellClass: 'bg-sky-950/30 border-2 border-sky-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-sky-950/30 border-2 border-sky-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  {
    id: 'forest',
    name: 'Enchanted Forest',
    cost: 1500,
    description: 'Deep woodland papercraft craftbook with organic leaves and forest details.',
    bgGradient: 'bg-gradient-to-br from-stone-950 via-emerald-950 to-stone-900',
    panelClass: 'bg-emerald-950/50 border-4 border-emerald-500/80 rounded-2xl shadow-[6px_6px_0px_rgba(16,185,129,0.5)]',
    cellClass: 'bg-emerald-950/30 border-2 border-emerald-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-emerald-950/30 border-2 border-emerald-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  {
    id: 'candy',
    name: 'Candy Land',
    cost: 2000,
    description: 'Sweet pastel pink papercraft cutouts with dessert shapes and sweet treats.',
    bgGradient: 'bg-gradient-to-br from-pink-950 via-purple-950 to-slate-950',
    panelClass: 'bg-pink-950/50 border-4 border-pink-400/80 rounded-2xl shadow-[6px_6px_0px_rgba(244,63,94,0.5)]',
    cellClass: 'bg-pink-950/30 border-2 border-pink-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-pink-950/30 border-2 border-pink-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  {
    id: 'space',
    name: 'Deep Space',
    cost: 2500,
    description: 'Cosmic papercraft collage with floating space rockets, stars, and planets.',
    bgGradient: 'bg-gradient-to-br from-indigo-950 via-slate-950 to-blue-950',
    panelClass: 'bg-indigo-950/50 border-4 border-indigo-400/80 rounded-2xl shadow-[6px_6px_0px_rgba(99,102,241,0.5)]',
    cellClass: 'bg-indigo-950/30 border-2 border-indigo-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-indigo-950/30 border-2 border-indigo-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  {
    id: 'ocean',
    name: 'Abyssal Ocean',
    cost: 3000,
    description: 'Deep ocean papercraft cutouts with anchors, shells, and mysterious ocean sea life.',
    bgGradient: 'bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-950',
    panelClass: 'bg-sky-950/50 border-4 border-cyan-400/80 rounded-2xl shadow-[6px_6px_0px_rgba(34,211,238,0.5)]',
    cellClass: 'bg-cyan-950/30 border-2 border-cyan-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-cyan-950/30 border-2 border-cyan-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  {
    id: 'retro',
    name: 'Retro Arcade',
    cost: 3500,
    description: '8-bit arcade papercraft with pixel ghosts, joysticks, and retro paper cutouts.',
    bgGradient: 'bg-gradient-to-br from-zinc-950 via-stone-950 to-black',
    panelClass: 'bg-zinc-900 border-4 border-zinc-600/80 rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,0.8)]',
    cellClass: 'bg-zinc-950/80 border-2 border-zinc-800 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-zinc-950/80 border-2 border-zinc-800 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  {
    id: 'desert',
    name: 'Desert Oasis',
    cost: 4000,
    description: 'Warm papercraft sand dunes with pyramids, cacti, and desert sun cutouts.',
    bgGradient: 'bg-gradient-to-br from-amber-950 via-yellow-950 to-stone-950',
    panelClass: 'bg-amber-950/50 border-4 border-amber-500/80 rounded-2xl shadow-[6px_6px_0px_rgba(245,158,11,0.5)]',
    cellClass: 'bg-amber-950/30 border-2 border-amber-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-amber-950/30 border-2 border-amber-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  {
    id: 'spooky',
    name: 'Spooky Halloween',
    cost: 4500,
    description: 'Eerie dark papercraft with pumpkins, bats, skulls, and potion cutouts.',
    bgGradient: 'bg-gradient-to-br from-zinc-950 via-purple-950 to-black',
    panelClass: 'bg-purple-950/50 border-4 border-purple-500/80 rounded-2xl shadow-[6px_6px_0px_rgba(168,85,247,0.5)]',
    cellClass: 'bg-purple-950/30 border-2 border-purple-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-purple-950/30 border-2 border-purple-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  {
    id: 'volcanic',
    name: 'Volcanic Magma',
    cost: 5000,
    description: 'Fiery magma papercraft with hot ash, volcanoes, and anvil cutouts.',
    bgGradient: 'bg-gradient-to-br from-red-950 via-amber-950 to-black',
    panelClass: 'bg-red-950/50 border-4 border-red-500/80 rounded-2xl shadow-[6px_6px_0px_rgba(239,68,68,0.5)]',
    cellClass: 'bg-red-950/30 border-2 border-red-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-red-950/30 border-2 border-red-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  {
    id: 'vantage',
    name: 'High Vantage',
    cost: 5000,
    description: 'A 2D papercraft mountain sunset theme with tactile stacked layers and sharp drop shadows.',
    bgGradient: 'bg-gradient-to-b from-orange-950 via-amber-950 to-stone-950',
    panelClass: 'bg-stone-900 border-4 border-amber-600/80 rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,0.8)]',
    cellClass: 'bg-stone-950/80 border-2 border-stone-800 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-stone-950/80 border-2 border-stone-800 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  {
    id: 'papercraft',
    name: 'Paper Craftbook',
    cost: 0,
    description: 'A tactile 2D craftbook paper theme with warm cardstock textures, paper cutout blocks, and craft tape accents.',
    bgGradient: 'paper-cardstock',
    panelClass: 'bg-[#1c1917] border-4 border-[#78350f] rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,0.7)]',
    cellClass: 'bg-[#292524] border-2 border-[#44403c] rounded-xl shadow-[inset_2px_2px_0px_rgba(0,0,0,0.6)]',
    wallClass: 'bg-[#292524] border-2 border-[#44403c] rounded-xl shadow-[inset_2px_2px_0px_rgba(0,0,0,0.6)]',
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
  'fire', 'volcano', 'bomb', 'key', 'chest', 'anvil',
  // High Vantage Wilderness
  'mountain', 'pine', 'campfire', 'compass', 'cloud'
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
  | 'rose'
  | 'stone'
  | 'slate';

export type BlockThemeConfig = {
  shape: ShapeId;
  color: ColorId;
};

export type ThemeConfig = Record<
  'red-heart' | 'blue-diamond' | 'yellow-crescent' | 'purple-circle' | 'green-cross' | 'orange-square',
  BlockThemeConfig
>;

export const DEFAULT_THEME_CONFIGS: Record<
  'neon' | 'winter' | 'forest' | 'candy' | 'space' | 'ocean' | 'retro' | 'desert' | 'spooky' | 'volcanic' | 'vantage' | 'papercraft',
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
  vantage: {
    'red-heart': { shape: 'sun', color: 'rose' },
    'blue-diamond': { shape: 'mountain', color: 'slate' },
    'yellow-crescent': { shape: 'pine', color: 'emerald' },
    'purple-circle': { shape: 'campfire', color: 'amber' },
    'green-cross': { shape: 'compass', color: 'stone' },
    'orange-square': { shape: 'cloud', color: 'sky' },
  },
  papercraft: {
    'red-heart': { shape: 'heart', color: 'crimson' },
    'blue-diamond': { shape: 'diamond', color: 'cobalt' },
    'yellow-crescent': { shape: 'crescent', color: 'amber' },
    'purple-circle': { shape: 'circle', color: 'purple' },
    'green-cross': { shape: 'cross', color: 'emerald' },
    'orange-square': { shape: 'square', color: 'orange' },
  },
};

export type BaseThemeId = 'neon' | 'winter' | 'forest' | 'candy' | 'space' | 'ocean' | 'retro' | 'desert' | 'spooky' | 'volcanic' | 'vantage' | 'papercraft';

export const getBaseThemeId = (themeId: string): BaseThemeId => {
  const validBases = ['neon', 'winter', 'forest', 'candy', 'space', 'ocean', 'retro', 'desert', 'spooky', 'volcanic', 'vantage', 'papercraft'] as const;
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
    case 'vantage':
      return 'bg-gradient-to-b from-orange-950 via-amber-950 to-stone-950';
    case 'papercraft':
      return 'paper-cardstock';
    case 'neon':
    default:
      return 'bg-mesh-gradient';
  }
};

export type GameCharacter = {
  id: string;
  name: string;
  cost: number;
  description: string;
};

export const CHARACTERS: GameCharacter[] = [
  { id: 'neon', name: 'Cyber Sphere', cost: 0, description: 'Classic pulsing white cyber sphere with rotating rings.' },
  { id: 'winter', name: 'Snowman', cost: 1000, description: 'A cute snowman face with a carrot nose and rosy cheeks.' },
  { id: 'forest', name: 'Acorn Sprite', cost: 1500, description: 'A cute smiling acorn sprite with a little wooden cap.' },
  { id: 'candy', name: 'Candy Lollipop', cost: 2000, description: 'A sweet pink swirl lollipop with a rotating candy face.' },
  { id: 'space', name: 'Astronaut Helmet', cost: 2500, description: 'An astronaut helmet with a dark visor and cyan glow.' },
  { id: 'ocean', name: 'Yellow Submarine', cost: 3000, description: 'A yellow submarine with a porthole window and propeller.' },
  { id: 'retro', name: 'Retro Invader', cost: 3500, description: 'An 8-bit space invader pixel sprite in purple.' },
  { id: 'desert', name: 'Cactus Buddy', cost: 4000, description: 'A cute round green cactus with yellow spikes and a pink flower.' },
  { id: 'spooky', name: 'Jack-o\'-Lantern', cost: 4500, description: 'A carved glowing orange Halloween pumpkin.' },
  { id: 'volcanic', name: 'Magma Orb', cost: 5000, description: 'A magma core orb surrounded by a cracked obsidian shell.' },
  { id: 'vantage', name: 'Pine Peak', cost: 5000, description: 'A 2D papercraft pine tree peak sprite with crisp shadow edges.' },
  { id: 'papercraft', name: 'Paper Origami Bunny', cost: 0, description: 'A cute 2D papercraft folded origami character with paper shadow edges.' }
];


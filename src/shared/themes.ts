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
    bgGradient: 'bg-theme-neon',
    panelClass: 'bg-cyan-950/40 border-8 border-cyan-500/80 rounded-2xl shadow-[8px_8px_0px_rgba(6,182,212,0.5)]',
    cellClass: 'bg-cyan-950/40 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] rounded-xl',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'winter',
    name: 'Winter Wonderland',
    cost: 1000,
    description: 'Ice cold theme with blue/white shades and papercraft layered ice crystals.',
    bgGradient: 'bg-theme-winter',
    panelClass: 'bg-sky-950/50 border-8 border-sky-400/80 rounded-2xl shadow-[8px_8px_0px_rgba(56,189,248,0.5)]',
    cellClass: 'bg-sky-950/40 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] rounded-xl',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'forest',
    name: 'Enchanted Forest',
    cost: 1500,
    description: 'Deep woodland papercraft craftbook with organic leaves and forest details.',
    bgGradient: 'bg-theme-forest',
    panelClass: 'bg-emerald-950/50 border-8 border-emerald-500/80 rounded-2xl shadow-[8px_8px_0px_rgba(16,185,129,0.5)]',
    cellClass: 'bg-emerald-950/40 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] rounded-xl',
    wallClass: 'bg-stone-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'candy',
    name: 'Candy Land',
    cost: 2000,
    description: 'Sweet pastel pink papercraft cutouts with dessert shapes and sweet treats.',
    bgGradient: 'bg-theme-candy',
    panelClass: 'bg-pink-950/50 border-8 border-pink-400/80 rounded-2xl shadow-[8px_8px_0px_rgba(244,63,94,0.5)]',
    cellClass: 'bg-pink-950/40 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] rounded-xl',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'space',
    name: 'Deep Space',
    cost: 2500,
    description: 'Cosmic papercraft collage with floating space rockets, stars, and planets.',
    bgGradient: 'bg-theme-space',
    panelClass: 'bg-indigo-950/50 border-8 border-indigo-400/80 rounded-2xl shadow-[8px_8px_0px_rgba(99,102,241,0.5)]',
    cellClass: 'bg-indigo-950/40 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] rounded-xl',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'ocean',
    name: 'Abyssal Ocean',
    cost: 3000,
    description: 'Deep ocean papercraft cutouts with anchors, shells, and mysterious ocean sea life.',
    bgGradient: 'bg-theme-ocean',
    panelClass: 'bg-sky-950/50 border-8 border-cyan-400/80 rounded-2xl shadow-[8px_8px_0px_rgba(34,211,238,0.5)]',
    cellClass: 'bg-cyan-950/40 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] rounded-xl',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'retro',
    name: 'Retro Arcade',
    cost: 3500,
    description: '8-bit arcade papercraft with pixel ghosts, joysticks, and retro paper cutouts.',
    bgGradient: 'bg-theme-retro',
    panelClass: 'bg-zinc-900 border-8 border-zinc-600/80 rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,0.8)]',
    cellClass: 'bg-zinc-950/80 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] rounded-xl',
    wallClass: 'bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'desert',
    name: 'Desert Oasis',
    cost: 4000,
    description: 'Warm papercraft sand dunes with pyramids, cacti, and desert sun cutouts.',
    bgGradient: 'bg-theme-desert',
    panelClass: 'bg-amber-950/50 border-8 border-amber-500/80 rounded-2xl shadow-[8px_8px_0px_rgba(245,158,11,0.5)]',
    cellClass: 'bg-amber-950/40 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] rounded-xl',
    wallClass: 'bg-stone-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'spooky',
    name: 'Spooky Halloween',
    cost: 4500,
    description: 'Eerie dark papercraft with pumpkins, bats, skulls, and potion cutouts.',
    bgGradient: 'bg-theme-spooky',
    panelClass: 'bg-purple-950/50 border-8 border-purple-500/80 rounded-2xl shadow-[8px_8px_0px_rgba(168,85,247,0.5)]',
    cellClass: 'bg-purple-950/40 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] rounded-xl',
    wallClass: 'bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'volcanic',
    name: 'Volcanic Magma',
    cost: 5000,
    description: 'Fiery magma papercraft with hot ash, volcanoes, and anvil cutouts.',
    bgGradient: 'bg-theme-volcanic',
    panelClass: 'bg-red-950/50 border-8 border-red-500/80 rounded-2xl shadow-[8px_8px_0px_rgba(239,68,68,0.5)]',
    cellClass: 'bg-red-950/40 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] rounded-xl',
    wallClass: 'bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'vantage',
    name: 'High Vantage',
    cost: 5500,
    description: 'A 2D papercraft mountain sunset theme with tactile stacked layers and sharp drop shadows.',
    bgGradient: 'bg-theme-vantage',
    panelClass: 'bg-stone-900 border-8 border-amber-600/80 rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,0.8)]',
    cellClass: 'bg-stone-950/80 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] rounded-xl',
    wallClass: 'bg-stone-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'papercraft',
    name: 'Paper Craftbook',
    cost: 6000,
    description: 'A tactile 2D craftbook paper theme with warm cardstock textures, paper cutout blocks, and craft tape accents.',
    bgGradient: 'bg-theme-papercraft',
    panelClass: 'bg-[#1c1917] border-8 border-[#78350f] rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,0.7)]',
    cellClass: 'bg-[#292524] rounded-xl shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)]',
    wallClass: 'bg-[#1c1917] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
];

export const ALL_SHAPE_IDS = [
  'heart', 'diamond', 'crescent', 'circle', 'cross', 'square',
  'snowflake', 'crystal', 'sparkle', 'snowman', 'tree', 'cube', 'igloo', 'north_star', 'icicle',
  'leaf', 'acorn', 'mushroom', 'pinecone', 'owl', 'flower', 'stump',
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
  'skull', 'bat', 'pumpkin', 'witch_hat', 'cauldron', 'potion',
  // Volcanic
  'fire', 'volcano', 'bomb', 'key', 'chest', 'anvil', 'pickaxe',
  // High Vantage Wilderness
  'mountain', 'pine', 'campfire', 'compass', 'cloud',
  // Paper Craftbook Custom Shapes
  'origami_crane', 'paper_plane', 'scissors', 'stamp', 'pencil', 'tape_roll'
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
  | 'slate'
  | 'gray';

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
    'red-heart': { shape: 'snowflake', color: 'cyan' },
    'blue-diamond': { shape: 'north_star', color: 'amber' },
    'yellow-crescent': { shape: 'icicle', color: 'cobalt' },
    'purple-circle': { shape: 'snowman', color: 'fuchsia' },
    'green-cross': { shape: 'tree', color: 'emerald' },
    'orange-square': { shape: 'igloo', color: 'rose' },
  },
  forest: {
    'red-heart': { shape: 'leaf', color: 'emerald' },
    'blue-diamond': { shape: 'acorn', color: 'amber' },
    'yellow-crescent': { shape: 'mushroom', color: 'crimson' },
    'purple-circle': { shape: 'owl', color: 'yellow' },
    'green-cross': { shape: 'flower', color: 'fuchsia' },
    'orange-square': { shape: 'stump', color: 'lime' },
  },
  candy: {
    'red-heart': { shape: 'lollipop', color: 'pink' },
    'blue-diamond': { shape: 'wrapped_candy', color: 'yellow' },
    'yellow-crescent': { shape: 'candy_cane', color: 'crimson' },
    'purple-circle': { shape: 'cupcake', color: 'purple' },
    'green-cross': { shape: 'gummy_bear', color: 'lime' },
    'orange-square': { shape: 'donut', color: 'sky' },
  },
  space: {
    'red-heart': { shape: 'rocket', color: 'red' },
    'blue-diamond': { shape: 'alien', color: 'lime' },
    'yellow-crescent': { shape: 'planet', color: 'orange' },
    'purple-circle': { shape: 'star', color: 'yellow' },
    'green-cross': { shape: 'ufo', color: 'cyan' },
    'orange-square': { shape: 'comet', color: 'fuchsia' },
  },
  ocean: {
    'red-heart': { shape: 'fish', color: 'rose' },
    'blue-diamond': { shape: 'anchor', color: 'cobalt' },
    'yellow-crescent': { shape: 'shell', color: 'amber' },
    'purple-circle': { shape: 'wave', color: 'lime' },
    'green-cross': { shape: 'octopus', color: 'purple' },
    'orange-square': { shape: 'submarine', color: 'yellow' },
  },
  retro: {
    'red-heart': { shape: 'ghost', color: 'red' },
    'blue-diamond': { shape: 'joystick', color: 'green' },
    'yellow-crescent': { shape: 'crown', color: 'yellow' },
    'purple-circle': { shape: 'gem', color: 'fuchsia' },
    'green-cross': { shape: 'sword', color: 'cobalt' },
    'orange-square': { shape: 'shield', color: 'cyan' },
  },
  desert: {
    'red-heart': { shape: 'pyramid', color: 'crimson' },
    'blue-diamond': { shape: 'cactus', color: 'emerald' },
    'yellow-crescent': { shape: 'camel', color: 'amber' },
    'purple-circle': { shape: 'sun', color: 'yellow' },
    'green-cross': { shape: 'eye_of_horus', color: 'cobalt' },
    'orange-square': { shape: 'palm_tree', color: 'fuchsia' },
  },
  spooky: {
    'red-heart': { shape: 'skull', color: 'fuchsia' },
    'blue-diamond': { shape: 'bat', color: 'purple' },
    'yellow-crescent': { shape: 'pumpkin', color: 'orange' },
    'purple-circle': { shape: 'cauldron', color: 'lime' },
    'green-cross': { shape: 'potion', color: 'cyan' },
    'orange-square': { shape: 'ghost', color: 'crimson' },
  },
  volcanic: {
    'red-heart': { shape: 'fire', color: 'crimson' },
    'blue-diamond': { shape: 'volcano', color: 'orange' },
    'yellow-crescent': { shape: 'bomb', color: 'purple' },
    'purple-circle': { shape: 'key', color: 'yellow' },
    'green-cross': { shape: 'chest', color: 'cyan' },
    'orange-square': { shape: 'pickaxe', color: 'slate' },
  },
  vantage: {
    'red-heart': { shape: 'sun', color: 'rose' },
    'blue-diamond': { shape: 'mountain', color: 'cobalt' },
    'yellow-crescent': { shape: 'pine', color: 'emerald' },
    'purple-circle': { shape: 'campfire', color: 'orange' },
    'green-cross': { shape: 'compass', color: 'yellow' },
    'orange-square': { shape: 'cloud', color: 'sky' },
  },
  papercraft: {
    'red-heart': { shape: 'origami_crane', color: 'crimson' },
    'blue-diamond': { shape: 'paper_plane', color: 'cobalt' },
    'yellow-crescent': { shape: 'scissors', color: 'yellow' },
    'purple-circle': { shape: 'stamp', color: 'purple' },
    'green-cross': { shape: 'pencil', color: 'emerald' },
    'orange-square': { shape: 'tape_roll', color: 'orange' },
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
      return 'bg-theme-winter';
    case 'forest':
      return 'bg-theme-forest';
    case 'candy':
      return 'bg-theme-candy';
    case 'space':
      return 'bg-theme-space';
    case 'ocean':
      return 'bg-theme-ocean';
    case 'retro':
      return 'bg-theme-retro';
    case 'desert':
      return 'bg-theme-desert';
    case 'spooky':
      return 'bg-theme-spooky';
    case 'volcanic':
      return 'bg-theme-volcanic';
    case 'vantage':
      return 'bg-theme-vantage';
    case 'papercraft':
      return 'bg-theme-papercraft';
    case 'neon':
    default:
      return 'bg-theme-neon';
  }
};

export type GameCharacter = {
  id: string;
  name: string;
  cost: number;
  description: string;
};

export const CHARACTERS: GameCharacter[] = [
  { id: 'neon', name: 'Cyber Bot 3D', cost: 0, description: 'Futuristic 3D cyber robot with glowing visor, top antenna, and metallic chassis.' },
  { id: 'winter', name: 'Frost Bot 3D', cost: 1000, description: 'Ice-cold 3D robot with frosty sky-blue visor, icicle chassis, and a glowing snowflake antenna.' },
  { id: 'forest', name: 'Forest Bot 3D', cost: 1500, description: 'Bio-luminescent 3D woodland robot with emerald leaf visor, bark chassis, and vine gears.' },
  { id: 'candy', name: 'Sugar Bot 3D', cost: 2000, description: 'Sweet 3D candy robot with glowing magenta visor, lollipop antenna, and gummy side bolts.' },
  { id: 'space', name: 'Cosmic Bot 3D', cost: 2500, description: 'Astronaut 3D space bot with stellar visor, satellite antenna, and rocket thruster ears.' },
  { id: 'ocean', name: 'Abyssal Bot 3D', cost: 3000, description: 'Deep sea 3D diver bot with aqua sonar visor, periscope antenna, and anchor side vents.' },
  { id: 'retro', name: 'Pixel Bot 3D', cost: 3500, description: 'Arcade 3D pixel robot with CRT screen visor, joystick antenna, and D-pad side ears.' },
  { id: 'desert', name: 'Solar Bot 3D', cost: 4000, description: 'Golden 3D solar robot with sunburst visor, solar crown antenna, and pyramid chassis.' },
  { id: 'spooky', name: 'Phantom Bot 3D', cost: 4500, description: 'Eerie 3D Halloween bot with jack-o-lantern visor, bat wing ears, and haunted pumpkin stem.' },
  { id: 'volcanic', name: 'Magma Bot 3D', cost: 5000, description: 'Fiery obsidian 3D magma robot with molten core visor, heat exhaust pipes, and lava cracks.' },
  { id: 'vantage', name: 'Alpine Bot 3D', cost: 5500, description: 'Rugged 3D mountain robot with sunset amber visor, compass antenna, and pine-tree chassis.' },
  { id: 'papercraft', name: 'Origami Bot 3D', cost: 6000, description: 'Tactile 3D papercraft robot with stitched paper visor, origami crane antenna, and cardboard tabs.' }
];


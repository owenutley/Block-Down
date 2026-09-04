export type ThemeId = string;

export type Theme = {
  id: ThemeId;
  name: string;
  cost: number;
  description: string;
  earnRequirement?: string;
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
    description: 'High-tech cyan cyber grid featuring sleek neon glow effects, extruded 3D tokens, and dark futuristic wall blocks.',
    bgGradient: 'bg-theme-neon',
    panelClass: 'bg-cyan-950/85 border-6 border-cyan-500/50 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-cyan-950/45 backdrop-blur-[2px] border border-cyan-400/20 rounded-xl',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'winter',
    name: 'Winter Wonderland',
    cost: 1000,
    description: 'Sub-zero frozen realm with glowing sky-blue frost tiles, ice crystal highlights, and icy pushable blocks.',
    earnRequirement: 'Medium Campaign',
    bgGradient: 'bg-theme-winter',
    panelClass: 'bg-sky-950/85 border-6 border-sky-400/50 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-sky-950/45 backdrop-blur-[2px] border border-sky-400/20 rounded-xl',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'forest',
    name: 'Enchanted Forest',
    cost: 1500,
    description: 'Lush emerald woodland grid featuring organic leaf icons, mossy stone walls, and vibrant nature blocks.',
    earnRequirement: 'Hard Campaign',
    bgGradient: 'bg-theme-forest',
    panelClass: 'bg-emerald-950/85 border-6 border-emerald-500/50 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-emerald-950/45 backdrop-blur-[2px] border border-emerald-400/20 rounded-xl',
    wallClass: 'bg-stone-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'candy',
    name: 'Candy Land',
    cost: 2000,
    description: 'Vibrant pastel magenta dessert world filled with sweet treat shapes, glowing candy borders, and sugar tiles.',
    bgGradient: 'bg-theme-candy',
    panelClass: 'bg-pink-950/85 border-6 border-pink-400/50 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-pink-950/45 backdrop-blur-[2px] border border-pink-400/20 rounded-xl',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'space',
    name: 'Deep Space',
    cost: 2500,
    description: 'Stellar cosmic void with deep indigo background, floating rockets and stars, and space-age token blocks.',
    bgGradient: 'bg-theme-space',
    panelClass: 'bg-indigo-950/85 border-6 border-indigo-400/50 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-indigo-950/45 backdrop-blur-[2px] border border-indigo-400/20 rounded-xl',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'ocean',
    name: 'Abyssal Ocean',
    cost: 3000,
    description: 'Mysterious deep-sea ocean grid with glowing aqua underwater elements, anchor symbols, and abyss tiles.',
    bgGradient: 'bg-theme-ocean',
    panelClass: 'bg-cyan-950/85 border-6 border-cyan-400/50 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-cyan-950/45 backdrop-blur-[2px] border border-cyan-400/20 rounded-xl',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'retro',
    name: 'Retro Arcade',
    cost: 3500,
    description: 'Classic 8-bit arcade grid featuring pixel ghosts, retro joystick icons, CRT scanlines, and arcade blocks.',
    bgGradient: 'bg-theme-retro',
    panelClass: 'bg-zinc-950 border-6 border-cyan-400/50 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-cyan-950/45 backdrop-blur-[2px] border border-cyan-400/20 rounded-xl',
    wallClass: 'bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'desert',
    name: 'Desert Oasis',
    cost: 4000,
    description: 'Sun-drenched golden oasis with warm amber tones, ancient pyramids, cacti icons, and desert tiles.',
    bgGradient: 'bg-theme-desert',
    panelClass: 'bg-amber-950/85 border-6 border-amber-500/50 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-amber-950/45 backdrop-blur-[2px] border border-amber-400/20 rounded-xl',
    wallClass: 'bg-stone-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'spooky',
    name: 'Spooky Halloween',
    cost: 4500,
    description: 'Haunted purple graveyard atmosphere with glowing jack-o-lanterns, eerie skulls, bats, and Halloween blocks.',
    bgGradient: 'bg-theme-spooky',
    panelClass: 'bg-purple-950/85 border-6 border-purple-400/50 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-purple-950/45 backdrop-blur-[2px] border border-purple-400/20 rounded-xl',
    wallClass: 'bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'volcanic',
    name: 'Volcanic Magma',
    cost: 5000,
    description: 'Intense molten lava realm with glowing crimson magma trails, obsidian walls, and fiery pushable blocks.',
    bgGradient: 'bg-theme-volcanic',
    panelClass: 'bg-red-950/85 border-6 border-red-500/50 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-red-950/45 backdrop-blur-[2px] border border-red-400/20 rounded-xl',
    wallClass: 'bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'vantage',
    name: 'High Vantage',
    cost: 5500,
    description: 'Scenic mountain sunset grid featuring warm stone textures, pine trees, compass icons, and alpine tiles.',
    bgGradient: 'bg-theme-vantage',
    panelClass: 'bg-stone-950/85 border-6 border-amber-500/50 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-amber-950/45 backdrop-blur-[2px] border border-amber-400/20 rounded-xl',
    wallClass: 'bg-stone-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'papercraft',
    name: 'Paper Craftbook',
    cost: 6000,
    description: 'Tactile craftbook aesthetic featuring rich cardstock textures, origami icons, craft tape details, and cutout tiles.',
    bgGradient: 'bg-theme-papercraft',
    panelClass: 'bg-[#1c1917]/90 border-6 border-[#78350f]/60 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-[#292524]/50 backdrop-blur-[2px] border border-[#78350f]/20 rounded-xl',
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
  earnRequirement?: string;
};

export const CHARACTERS: GameCharacter[] = [
  { id: 'neon', name: 'Cyber Bot', cost: 0, description: 'Futuristic cyan cyber bot with glowing visor, top antenna, and metallic chassis.' },
  { id: 'winter', name: 'Frost Bot', cost: 1000, description: 'Sub-zero frost robot with sky-blue visor, icicle antenna, and side crystal ears.', earnRequirement: 'Easy Campaign' },
  { id: 'forest', name: 'Forest Bot', cost: 1500, description: 'Emerald woodland bot with glowing leaf visor, organic branch ears, and mossy chassis.', earnRequirement: 'Hard Campaign' },
  { id: 'candy', name: 'Sugar Bot', cost: 2000, description: 'Sweet magenta candy bot with glowing visor, swirl lollipop antenna, and candy side bolts.' },
  { id: 'space', name: 'Cosmic Bot', cost: 2500, description: 'Stellar astronaut bot with cosmic star visor, satellite dish antenna, and rocket ears.' },
  { id: 'ocean', name: 'Abyssal Bot', cost: 3000, description: 'Deep-sea diver bot with aqua sonar visor, periscope antenna, and anchor side fins.' },
  { id: 'retro', name: 'Pixel Bot', cost: 3500, description: 'Classic 8-bit pixel bot with CRT screen visor, joystick antenna, and D-pad ears.' },
  { id: 'desert', name: 'Solar Bot', cost: 4000, description: 'Golden solar bot with glowing sunburst visor, sun crown antenna, and desert chassis.' },
  { id: 'spooky', name: 'Phantom Bot', cost: 4500, description: 'Eerie Halloween phantom bot with jack-o-lantern visor, bat wing ears, and pumpkin stem.' },
  { id: 'volcanic', name: 'Magma Bot', cost: 5000, description: 'Fiery obsidian magma bot with molten core visor, lava horn antenna, and heat exhaust pipes.' },
  { id: 'vantage', name: 'Alpine Bot', cost: 5500, description: 'Rugged alpine bot with sunset amber visor, mountain crest antenna, and compass ears.' },
  { id: 'papercraft', name: 'Origami Bot', cost: 6000, description: 'Craftbook origami bot with cardstock paper visor, paper plane antenna, and folded paper ears.' }
];


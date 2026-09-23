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
    id: 'retro',
    name: 'Retro Arcade',
    cost: 0,
    description: 'Classic 8-bit arcade grid featuring pixel ghosts, retro joystick icons, CRT scanlines, and arcade blocks.',
    earnRequirement: 'Subreddit Subscription',
    bgGradient: 'bg-theme-retro',
    panelClass: 'bg-zinc-950 border-6 border-cyan-400/50 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-cyan-950/45 backdrop-blur-[2px] border border-cyan-400/20 rounded-xl',
    wallClass: 'bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
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
  {
    id: 'steampunk',
    name: 'Steampunk Foundry',
    cost: 6500,
    description: 'Victorian industrial brass and copper foundry with ticking clockwork cogs, steam pipes, and warm amber gaslight glow.',
    bgGradient: 'bg-theme-steampunk',
    panelClass: 'bg-[#291e14]/90 border-6 border-[#d97706]/60 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-[#3d2b1d]/50 backdrop-blur-[2px] border border-[#d97706]/20 rounded-xl',
    wallClass: 'bg-[#1c140c] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'olympus',
    name: 'Divine Olympus',
    cost: 7000,
    description: 'Celestial Greek pantheon featuring white marble tiles, golden filigree borders, azure storm clouds, and thunderous lightning.',
    bgGradient: 'bg-theme-olympus',
    panelClass: 'bg-[#0f172a]/90 border-6 border-[#fbbf24]/60 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-[#1e293b]/50 backdrop-blur-[2px] border border-[#fbbf24]/20 rounded-xl',
    wallClass: 'bg-[#090d16] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'pirate',
    name: 'Pirate Cove',
    cost: 7500,
    description: 'Sunken ghost ship grotto with weathered mahogany deck planks, gold doubloons, spectral lanterns, and pirate lore.',
    bgGradient: 'bg-theme-pirate',
    panelClass: 'bg-[#0d1f22]/90 border-6 border-[#2dd4bf]/60 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-[#132e32]/50 backdrop-blur-[2px] border border-[#2dd4bf]/20 rounded-xl',
    wallClass: 'bg-[#081315] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'synthwave',
    name: 'Cyber Synthwave',
    cost: 8000,
    description: '1980s Outrun horizon with electric magenta wireframes, sunset neon grids, chrome accents, and laser light.',
    bgGradient: 'bg-theme-synthwave',
    panelClass: 'bg-[#1a0b2e]/90 border-6 border-[#f43f5e]/60 rounded-2xl shadow-xl shadow-black/40',
    cellClass: 'bg-[#271042]/50 backdrop-blur-[2px] border border-[#f43f5e]/20 rounded-xl',
    wallClass: 'bg-[#0e061a] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)] rounded-xl',
  },
  {
    id: 'relic',
    name: 'Ancient Relic',
    cost: 0,
    description: 'Mythic 60-Day Streak reward! Sacred overgrown temple ruins featuring glowing runic gemstones, carved stone monoliths, and ancient golden artifacts.',
    earnRequirement: '60-Day Streak',
    bgGradient: 'bg-theme-relic',
    panelClass: 'bg-[#140f0b]/95 border-6 border-[#b45309]/90 rounded-2xl shadow-2xl shadow-black/85 ring-1 ring-[#fbbf24]/40',
    cellClass: 'bg-[#211a14]/90 backdrop-blur-[2px] border border-[#78350f]/35 rounded-xl',
    wallClass: 'bg-[#1b1510] border border-[#a16207]/50 shadow-[inset_0_2px_4px_rgba(251,191,36,0.2),inset_0_-2px_6px_rgba(0,0,0,0.9)] rounded-xl',
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
  'fish', 'anchor', 'shell', 'wave', 'trident', 'octopus', 'submarine',
  // Retro
  'ghost', 'joystick', 'crown', 'gem', 'sword', 'shield',
  // Desert
  'pyramid', 'cactus', 'camel', 'sun', 'eye_of_horus', 'scarab', 'palm_tree',
  // Spooky
  'skull', 'bat', 'pumpkin', 'witch_hat', 'cauldron', 'potion', 'spider', 'spellbook', 'tombstone',
  // Volcanic
  'fire', 'volcano', 'bomb', 'key', 'chest', 'anvil', 'pickaxe',
  // High Vantage Wilderness
  'mountain', 'pine', 'campfire', 'compass', 'cloud',
  // Paper Craftbook Custom Shapes
  'origami_crane', 'paper_plane', 'scissors', 'stamp', 'pencil', 'tape_roll', 'origami_star',
  // Steampunk
  'gear', 'pocket_watch', 'wrench', 'lightbulb', 'pressure_gauge', 'valve_wheel',
  // Divine Olympus
  'lightning_bolt', 'laurel_crown', 'golden_harp', 'winged_sandal', 'spartan_helmet', 'greek_amphora', 'temple_pillar', 'cyclops_eye',
  // Pirate Cove
  'pirate_cutlass', 'ship_helm', 'pirate_skull', 'cannon', 'treasure_map', 'gold_doubloon',
  // Cyber Synthwave
  'cassette_tape', 'retro_sunglasses', 'sunset_palm', 'neon_triangle', 'synth_keytar', 'retro_arcade_car', 'boombox', 'floppy_disk', 'retro_gamepad',
  // Ancient Relic
  'rune_stone', 'ancient_tablet', 'sun_disc', 'totem', 'monolith', 'scarab_amulet'
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

export type BaseThemeId =
  | 'neon'
  | 'winter'
  | 'forest'
  | 'candy'
  | 'space'
  | 'ocean'
  | 'retro'
  | 'desert'
  | 'spooky'
  | 'volcanic'
  | 'vantage'
  | 'papercraft'
  | 'steampunk'
  | 'olympus'
  | 'pirate'
  | 'synthwave'
  | 'relic';

export const DEFAULT_THEME_CONFIGS: Record<BaseThemeId, ThemeConfig> = {
  neon: {
    'red-heart': { shape: 'heart', color: 'red' },
    'blue-diamond': { shape: 'diamond', color: 'blue' },
    'yellow-crescent': { shape: 'crescent', color: 'yellow' },
    'purple-circle': { shape: 'circle', color: 'purple' },
    'green-cross': { shape: 'cross', color: 'green' },
    'orange-square': { shape: 'square', color: 'orange' },
  },
  winter: {
    'red-heart': { shape: 'snowman', color: 'red' },
    'blue-diamond': { shape: 'snowflake', color: 'blue' },
    'yellow-crescent': { shape: 'north_star', color: 'yellow' },
    'purple-circle': { shape: 'icicle', color: 'purple' },
    'green-cross': { shape: 'tree', color: 'green' },
    'orange-square': { shape: 'igloo', color: 'orange' },
  },
  forest: {
    'red-heart': { shape: 'mushroom', color: 'red' },
    'blue-diamond': { shape: 'acorn', color: 'blue' },
    'yellow-crescent': { shape: 'flower', color: 'yellow' },
    'purple-circle': { shape: 'owl', color: 'purple' },
    'green-cross': { shape: 'leaf', color: 'green' },
    'orange-square': { shape: 'stump', color: 'orange' },
  },
  candy: {
    'red-heart': { shape: 'candy_cane', color: 'red' },
    'blue-diamond': { shape: 'wrapped_candy', color: 'blue' },
    'yellow-crescent': { shape: 'lollipop', color: 'yellow' },
    'purple-circle': { shape: 'cupcake', color: 'purple' },
    'green-cross': { shape: 'gummy_bear', color: 'green' },
    'orange-square': { shape: 'donut', color: 'orange' },
  },
  space: {
    'red-heart': { shape: 'rocket', color: 'red' },
    'blue-diamond': { shape: 'comet', color: 'blue' },
    'yellow-crescent': { shape: 'star', color: 'yellow' },
    'purple-circle': { shape: 'planet', color: 'purple' },
    'green-cross': { shape: 'alien', color: 'green' },
    'orange-square': { shape: 'ufo', color: 'orange' },
  },
  ocean: {
    'red-heart': { shape: 'fish', color: 'red' },
    'blue-diamond': { shape: 'anchor', color: 'blue' },
    'yellow-crescent': { shape: 'submarine', color: 'yellow' },
    'purple-circle': { shape: 'octopus', color: 'purple' },
    'green-cross': { shape: 'trident', color: 'green' },
    'orange-square': { shape: 'shell', color: 'orange' },
  },
  retro: {
    'red-heart': { shape: 'ghost', color: 'red' },
    'blue-diamond': { shape: 'joystick', color: 'blue' },
    'yellow-crescent': { shape: 'crown', color: 'yellow' },
    'purple-circle': { shape: 'gem', color: 'purple' },
    'green-cross': { shape: 'sword', color: 'green' },
    'orange-square': { shape: 'shield', color: 'orange' },
  },
  desert: {
    'red-heart': { shape: 'pyramid', color: 'red' },
    'blue-diamond': { shape: 'scarab', color: 'blue' },
    'yellow-crescent': { shape: 'sun', color: 'yellow' },
    'purple-circle': { shape: 'camel', color: 'purple' },
    'green-cross': { shape: 'cactus', color: 'green' },
    'orange-square': { shape: 'palm_tree', color: 'orange' },
  },
  spooky: {
    'red-heart': { shape: 'skull', color: 'red' },
    'blue-diamond': { shape: 'tombstone', color: 'blue' },
    'yellow-crescent': { shape: 'spellbook', color: 'yellow' },
    'purple-circle': { shape: 'spider', color: 'purple' },
    'green-cross': { shape: 'potion', color: 'green' },
    'orange-square': { shape: 'pumpkin', color: 'orange' },
  },
  volcanic: {
    'red-heart': { shape: 'fire', color: 'red' },
    'blue-diamond': { shape: 'pickaxe', color: 'blue' },
    'yellow-crescent': { shape: 'key', color: 'yellow' },
    'purple-circle': { shape: 'bomb', color: 'purple' },
    'green-cross': { shape: 'chest', color: 'green' },
    'orange-square': { shape: 'volcano', color: 'orange' },
  },
  vantage: {
    'red-heart': { shape: 'campfire', color: 'red' },
    'blue-diamond': { shape: 'mountain', color: 'blue' },
    'yellow-crescent': { shape: 'sun', color: 'yellow' },
    'purple-circle': { shape: 'cloud', color: 'purple' },
    'green-cross': { shape: 'pine', color: 'green' },
    'orange-square': { shape: 'compass', color: 'orange' },
  },
  papercraft: {
    'red-heart': { shape: 'origami_crane', color: 'red' },
    'blue-diamond': { shape: 'paper_plane', color: 'blue' },
    'yellow-crescent': { shape: 'scissors', color: 'yellow' },
    'purple-circle': { shape: 'stamp', color: 'purple' },
    'green-cross': { shape: 'pencil', color: 'green' },
    'orange-square': { shape: 'origami_star', color: 'orange' },
  },
  steampunk: {
    'red-heart': { shape: 'pressure_gauge', color: 'red' },
    'blue-diamond': { shape: 'gear', color: 'blue' },
    'yellow-crescent': { shape: 'pocket_watch', color: 'yellow' },
    'purple-circle': { shape: 'valve_wheel', color: 'purple' },
    'green-cross': { shape: 'wrench', color: 'green' },
    'orange-square': { shape: 'lightbulb', color: 'orange' },
  },
  olympus: {
    'red-heart': { shape: 'cyclops_eye', color: 'red' },
    'blue-diamond': { shape: 'temple_pillar', color: 'blue' },
    'yellow-crescent': { shape: 'lightning_bolt', color: 'yellow' },
    'purple-circle': { shape: 'greek_amphora', color: 'purple' },
    'green-cross': { shape: 'spartan_helmet', color: 'green' },
    'orange-square': { shape: 'golden_harp', color: 'orange' },
  },
  pirate: {
    'red-heart': { shape: 'pirate_skull', color: 'red' },
    'blue-diamond': { shape: 'cannon', color: 'blue' },
    'yellow-crescent': { shape: 'gold_doubloon', color: 'yellow' },
    'purple-circle': { shape: 'ship_helm', color: 'purple' },
    'green-cross': { shape: 'pirate_cutlass', color: 'green' },
    'orange-square': { shape: 'treasure_map', color: 'orange' },
  },
  synthwave: {
    'red-heart': { shape: 'retro_gamepad', color: 'red' },
    'blue-diamond': { shape: 'boombox', color: 'blue' },
    'yellow-crescent': { shape: 'retro_sunglasses', color: 'yellow' },
    'purple-circle': { shape: 'floppy_disk', color: 'purple' },
    'green-cross': { shape: 'cassette_tape', color: 'green' },
    'orange-square': { shape: 'retro_arcade_car', color: 'orange' },
  },
  relic: {
    'red-heart': { shape: 'rune_stone', color: 'red' },
    'blue-diamond': { shape: 'ancient_tablet', color: 'blue' },
    'yellow-crescent': { shape: 'sun_disc', color: 'yellow' },
    'purple-circle': { shape: 'scarab_amulet', color: 'purple' },
    'green-cross': { shape: 'totem', color: 'green' },
    'orange-square': { shape: 'monolith', color: 'orange' },
  },
};

export const getBaseThemeId = (themeId: string): BaseThemeId => {
  const validBases = ['neon', 'winter', 'forest', 'candy', 'space', 'ocean', 'retro', 'desert', 'spooky', 'volcanic', 'vantage', 'papercraft', 'steampunk', 'olympus', 'pirate', 'synthwave', 'relic'] as const;
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
    case 'steampunk':
      return 'bg-theme-steampunk';
    case 'olympus':
      return 'bg-theme-olympus';
    case 'pirate':
      return 'bg-theme-pirate';
    case 'synthwave':
      return 'bg-theme-synthwave';
    case 'relic':
      return 'bg-theme-relic';
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
  { id: 'neon', name: 'Cyber Mecha', cost: 0, description: 'High-tech cyan mecha bot with dual laser antennas, angular helmet plating, and glowing cyber visor.' },
  { id: 'winter', name: 'Frost Golem', cost: 1000, description: 'Sub-zero crystalline frost golem with jagged icicle horns, icy visor plate, and frozen snow armor.', earnRequirement: 'Easy Campaign' },
  { id: 'forest', name: 'Forest Treant', cost: 1500, description: 'Organic woodland tree-spirit bot with leafy branch antlers, mossy bark armor, and glowing leaf visor.', earnRequirement: 'Hard Campaign' },
  { id: 'retro', name: 'Arcade Hero', cost: 0, description: 'Brave 8-bit arcade hero bot with a pixel crest helmet, arcade button ear guards, and a glowing CRT power visor.', earnRequirement: 'Subreddit Subscription' },
  { id: 'candy', name: 'Sugar Bear', cost: 2000, description: 'Pastel candy bear bot with swirl lollipop antenna, wrapped candy ears, and glowing sugar drop visor.' },
  { id: 'space', name: 'Cosmic Astral', cost: 2500, description: 'Stellar deep-space alien entity with planetary ring halo, triple star-lens visor, and cosmic starfield glow.' },
  { id: 'ocean', name: 'Abyssal Leviathan', cost: 3000, description: 'Bioluminescent deep-sea creature bot with sonar visor, glowing angler lure, and aquatic side tentacles.' },
  { id: 'desert', name: 'Sun Sphinx', cost: 4000, description: 'Golden Egyptian sphinx bot with pharaoh nemes crown, sunburst disc, and glowing solar visor.' },
  { id: 'spooky', name: 'Pumpkin Jack', cost: 4500, description: 'Eerie Halloween pumpkin phantom bot with carved jack-o-lantern face, bat wing ears, and glowing pumpkin stem.' },
  { id: 'volcanic', name: 'Lava Titan', cost: 5000, description: 'Fiery obsidian lava dragon bot with curved fiery horns, molten core visor, and volcanic exhaust vents.' },
  { id: 'vantage', name: 'Alpine Ram', cost: 5500, description: 'Rugged mountain ram bot with spiraled crest horns, compass visor plate, and sunset amber peak glow.' },
  { id: 'papercraft', name: 'Origami Fox', cost: 6000, description: 'Craftbook folded paper fox bot with geometric cardstock folds, paper plane antenna, and creased visor.' },
  { id: 'steampunk', name: 'Clockwork Automaton', cost: 6500, description: 'Victorian brass automaton bot with pressure gauge dials, spinning cog ears, and a brass chimney exhaust pipe.' },
  { id: 'olympus', name: 'Zeus Sentinel', cost: 7000, description: 'Celestial thunder titan bot with jagged lightning bolt crest horns, golden winged laurel helmet, and crackling storm eyes.' },
  { id: 'pirate', name: 'Captain Bones', cost: 7500, description: 'Spectral buccaneer captain bot with an angled bicorne hat, glowing skull crossbones, gold hoop earring, and a spyglass eye.' },
  { id: 'synthwave', name: 'Synth Racer', cost: 8000, description: 'Sleek 80s cyberpunk speedrunner bot with reflective aviator shades visor, cassette tape ear guards, and a chrome spoiler fin.' },
  { id: 'golden_mecha', name: 'Golden Mecha', cost: 0, description: 'Exclusive 30-Day Streak reward! Gleaming 24k polished gold mecha bot with royal crown crest, gold ear-jacks, and glowing amber solar visor.', earnRequirement: '30-Day Streak' }
];


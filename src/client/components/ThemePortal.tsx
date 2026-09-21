import { PortalDirection } from '../../shared/types';
import { ThemeId } from '../../shared/themes';

export type ThemePortalProps = {
  themeId: ThemeId;
  dir: PortalDirection;
  colorHex: string;
  colorClass?: string;
  portalColor?: string;
};

/**
 * Normalized 4-way rotation mapping:
 * Canonical orientation (0°) mounts on the North wall (top, y <= 0) and exits Downwards (y > 0).
 * - Down (North wall, exits Down):  0°  -> Upright doorway, lintel embedded in North wall
 * - Left (East wall, exits Left):   90° -> Rotated 90° CW, lintel in East wall
 * - Up (South wall, exits Up):      180° -> Rotated 180° CW, lintel in South wall
 * - Right (West wall, exits Right): 270° -> Rotated 270° CW, lintel in West wall
 */
const getRotationDeg = (dir: PortalDirection): number => {
  switch (dir) {
    case 'Down':
      return 0;
    case 'Left':
      return 90;
    case 'Up':
      return 180;
    case 'Right':
      return 270;
  }
};

export const ThemePortal = ({
  themeId,
  dir,
  colorHex,
  colorClass = 'text-cyan-400',
}: ThemePortalProps) => {
  const rotation = getRotationDeg(dir);

  const renderPortalArt = () => {
    switch (themeId) {
      // 1. NEON CYBER: Quantum Laser Warp Gate (28% depth, -12% wall embed)
      case 'neon':
        return (
          <>
            {/* Carbon wall mount embedded in wall */}
            <rect x="18" y="-12" width="64" height="12" rx="2" fill="#0f172a" stroke="#0284c7" strokeWidth="1.5" />
            {/* Emitter pylons */}
            <rect x="18" y="-4" width="8" height="16" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="74" y="-4" width="8" height="16" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="22" cy="4" r="2.5" fill="#ffffff" stroke={colorHex} strokeWidth="1.5" />
            <circle cx="78" cy="4" r="2.5" fill="#ffffff" stroke={colorHex} strokeWidth="1.5" />
            {/* Ambient Laser Field */}
            <path d="M 26 0 Q 50 20 74 0 Z" fill={colorHex} fillOpacity="0.25" className="animate-pulse" />
            {/* Planar Containment Laser Arc */}
            <path d="M 26 2 Q 50 18 74 2" stroke={colorHex} strokeWidth="3" strokeLinecap="round" />
            <path d="M 30 2 Q 50 16 70 2" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4 3" />
            {/* Downward Directional Vector Chevron */}
            <path d="M 44 8 L 50 16 L 56 8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="50" cy="18" r="2.5" fill="#ffffff" className="animate-ping" style={{ transformOrigin: '50px 18px' }} />
          </>
        );

      // 2. WINTER WONDERLAND: Glacial Frost Cave (28% depth, -10% wall embed)
      case 'winter':
        return (
          <>
            {/* Translucent Icicle Ridge in Wall */}
            <path d="M 18 0 L 22 -10 L 78 -10 L 82 0 Z" fill="#082f49" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Sub-Zero Cave Void */}
            <path d="M 22 0 Q 50 24 78 0 Z" fill="#0c4a6e" fillOpacity="0.9" />
            <path d="M 26 0 Q 50 20 74 0 Z" fill={colorHex} fillOpacity="0.3" className="animate-pulse" />
            {/* Hanging Icicle Teeth */}
            <polygon points="28,0 31,10 34,0" fill="#e0f2fe" />
            <polygon points="46,0 50,14 54,0" fill="#ffffff" />
            <polygon points="66,0 69,10 72,0" fill="#e0f2fe" />
            {/* Snowflake Crystal Core */}
            <circle cx="50" cy="18" r="3" fill="#ffffff" />
            <line x1="44" y1="18" x2="56" y2="18" stroke={colorHex} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="50" y1="12" x2="50" y2="24" stroke={colorHex} strokeWidth="1.5" strokeLinecap="round" />
          </>
        );

      // 3. ENCHANTED FOREST: Hollow Tree Arch / Fairy Gate (28% depth, -10% wall embed)
      case 'forest':
        return (
          <>
            {/* Mossy Wood Frame in Wall */}
            <path d="M 18 0 Q 50 -12 82 0 L 80 -8 Q 50 -14 20 -8 Z" fill="#3e2723" stroke="#2e1c14" strokeWidth="1.5" />
            {/* Hollow Tree Void */}
            <path d="M 22 0 Q 50 24 78 0 Z" fill="#141f17" />
            <path d="M 26 0 Q 50 20 74 0 Z" fill={colorHex} fillOpacity="0.3" className="animate-pulse" />
            {/* Glowing Bioluminescent Fairy Mushrooms */}
            <ellipse cx="22" cy="4" rx="4" ry="2.5" fill={colorHex} />
            <ellipse cx="78" cy="4" rx="4" ry="2.5" fill="#facc15" />
            {/* Drifting Emerald Leaf Arrow */}
            <polygon points="50,22 44,12 48,12 48,6 52,6 52,12 56,12" fill="#10b981" />
            <circle cx="50" cy="14" r="2" fill="#ffffff" className="animate-pulse" />
          </>
        );

      // 4. RETRO ARCADE: 8-Bit Pixel Warp Pipe (26% depth, flush with edge, mouth facing into room)
      case 'retro':
        return (
          <>
            {/* Pipe Stem Body emerging flush from wall edge y=0 */}
            <rect x="23" y="0" width="54" height="12" fill="#15803d" stroke="#0f172a" strokeWidth="1.5" />
            <rect x="27" y="0" width="6" height="12" fill="#86efac" />
            <rect x="67" y="0" width="6" height="12" fill="#14532d" />
            {/* Iconic Wide Green Pixel Pipe Lip */}
            <rect x="16" y="12" width="68" height="12" rx="1" fill="#16a34a" stroke="#0f172a" strokeWidth="1.5" />
            {/* 8-bit Highlights and Shadow on Lip */}
            <rect x="20" y="14" width="8" height="8" fill="#86efac" />
            <rect x="72" y="14" width="8" height="8" fill="#14532d" />
            {/* Dark Pipe Interior Opening at Mouth */}
            <rect x="24" y="20" width="52" height="6" rx="1" fill="#022c22" stroke="#0f172a" strokeWidth="1" />
            <rect x="28" y="21" width="44" height="4" fill={colorHex} fillOpacity="0.45" />
            {/* Flashing 8-bit Pixel Downward Arrow emerging from pipe mouth */}
            <polygon points="50,28 44,20 48,20 48,15 52,15 52,20 56,20" fill="#ffffff" className="animate-pulse" />
            <polygon points="50,27 45,21 49,21 49,17 51,17 51,21 55,21" fill={colorHex} />
          </>
        );

      // 5. CANDY LAND: Peppermint Swirl Chute (28% depth, -10% wall embed)
      case 'candy':
        return (
          <>
            {/* Peppermint Candy Cane Collar in Wall */}
            <rect x="18" y="-10" width="64" height="10" rx="2" fill="#ffffff" stroke="#f43f5e" strokeWidth="1.5" />
            {/* Red Diagonal Stripes on Collar */}
            <path d="M 24 -10 L 30 0 M 42 -10 L 48 0 M 60 -10 L 66 0 M 74 -10 L 80 0" stroke="#f43f5e" strokeWidth="3" />
            {/* Sugar Void Aperture */}
            <path d="M 22 0 Q 50 24 78 0 Z" fill="#831843" />
            <path d="M 26 0 Q 50 20 74 0 Z" fill={colorHex} fillOpacity="0.35" className="animate-pulse" />
            {/* Swirling Sugar Flow Disc */}
            <circle cx="50" cy="12" r="7" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 3" fill="none" className="animate-[spin_3s_linear_infinite]" style={{ transformOrigin: '50px 12px' }} />
            <circle cx="50" cy="12" r="3" fill="#ffffff" />
            <polygon points="50,22 46,16 54,16" fill={colorHex} />
          </>
        );

      // 6. DEEP SPACE: Cosmic Jump Ring / Wormhole Gate (28% depth, -10% wall embed)
      case 'space':
        return (
          <>
            {/* Titanium Gyro Wall Mount */}
            <rect x="18" y="-10" width="64" height="10" rx="2" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="24" cy="-5" r="2" fill={colorHex} />
            <circle cx="76" cy="-5" r="2" fill={colorHex} />
            {/* Event Horizon Void */}
            <ellipse cx="50" cy="12" rx="28" ry="14" fill="#030712" />
            <ellipse cx="50" cy="12" rx="22" ry="10" fill={colorHex} fillOpacity="0.35" className="animate-pulse" />
            {/* Rotating Titanium Gyro Arc */}
            <ellipse
              cx="50"
              cy="12"
              rx="26"
              ry="12"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeDasharray="14 4"
              fill="none"
              className="animate-[spin_4s_linear_infinite]"
              style={{ transformOrigin: '50px 12px' }}
            />
            {/* Pulsing Star Horizon Core */}
            <circle cx="50" cy="12" r="3" fill="#ffffff" className="animate-ping" style={{ transformOrigin: '50px 12px' }} />
            <circle cx="50" cy="12" r="2.5" fill="#ffffff" />
            <path d="M 46 18 L 50 24 L 54 18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      // 7. ABYSSAL OCEAN: Submarine Porthole / Whirlpool (28% depth, -10% wall embed)
      case 'ocean':
        return (
          <>
            {/* Heavy Bronze Porthole Rim in Wall */}
            <path d="M 18 0 Q 50 -12 82 0 L 80 -8 Q 50 -14 20 -8 Z" fill="#92400e" stroke="#b45309" strokeWidth="1.5" />
            {/* Golden Rivets */}
            <circle cx="28" cy="-5" r="1.8" fill="#fde68a" />
            <circle cx="50" cy="-7" r="1.8" fill="#fde68a" />
            <circle cx="72" cy="-5" r="1.8" fill="#fde68a" />
            {/* Trench Abyss Void */}
            <path d="M 22 0 Q 50 26 78 0 Z" fill="#021c27" />
            <path d="M 26 0 Q 50 22 74 0 Z" fill={colorHex} fillOpacity="0.3" className="animate-pulse" />
            {/* Swirling Turquoise Water Maelstrom */}
            <path
              d="M 50 12 Q 60 4 52 18 T 42 12"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              className="animate-[spin_3s_linear_infinite]"
              style={{ transformOrigin: '50px 12px' }}
            />
            <circle cx="45" cy="10" r="1.5" fill="#ffffff" />
            <circle cx="54" cy="15" r="1.8" fill="#ffffff" />
            <polygon points="50,24 45,18 55,18" fill="#38bdf8" />
          </>
        );

      // 8. DESERT OASIS: Ancient Egyptian Tomb Doorway (A Door! 28% depth, -12% wall embed)
      case 'desert':
        return (
          <>
            {/* Sandstone Lintel Beam in Wall */}
            <rect x="16" y="-12" width="68" height="12" rx="1" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
            {/* Carved Winged Scarab Emblem on Lintel */}
            <ellipse cx="50" cy="-6" rx="5" ry="2.5" fill="#facc15" />
            <line x1="38" y1="-6" x2="44" y2="-6" stroke="#fde68a" strokeWidth="1" />
            <line x1="56" y1="-6" x2="62" y2="-6" stroke="#fde68a" strokeWidth="1" />
            {/* Sandstone Doorway Jambs */}
            <rect x="18" y="0" width="8" height="24" fill="#b45309" stroke="#78350f" strokeWidth="1" />
            <rect x="74" y="0" width="8" height="24" fill="#b45309" stroke="#78350f" strokeWidth="1" />
            {/* Tomb Dark Chamber Interior */}
            <rect x="26" y="0" width="48" height="24" fill="#1c1005" />
            <rect x="28" y="0" width="44" height="22" fill={colorHex} fillOpacity="0.3" className="animate-pulse" />
            {/* Golden Sand Vortex & Exit Arrow */}
            <polygon points="50,20 44,10 48,10 48,4 52,4 52,10 56,10" fill="#facc15" />
            <circle cx="50" cy="10" r="1.5" fill="#ffffff" />
          </>
        );

      // 9. SPOOKY HALLOWEEN: Haunted Crypt Gate (A Gate/Door! 28% depth, -12% wall embed)
      case 'spooky':
        return (
          <>
            {/* Gothic Stone Lintel in Wall with Keystone */}
            <path d="M 16 0 L 16 -8 L 50 -13 L 84 -8 L 84 0 Z" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
            {/* Carved Skull Keystone */}
            <circle cx="50" cy="-6" r="3" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
            <circle cx="49" cy="-6" r="0.6" fill="#000000" />
            <circle cx="51" cy="-6" r="0.6" fill="#000000" />
            {/* Gothic Jambs */}
            <rect x="18" y="0" width="6" height="24" fill="#1e293b" />
            <rect x="76" y="0" width="6" height="24" fill="#1e293b" />
            {/* Crypt Eerie Mist Void */}
            <rect x="24" y="0" width="52" height="24" fill="#090514" />
            <rect x="26" y="0" width="48" height="22" fill={colorHex} fillOpacity="0.35" className="animate-pulse" />
            {/* Spiked Wrought-Iron Gate Bars */}
            <line x1="34" y1="0" x2="34" y2="18" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="44" y1="0" x2="44" y2="20" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="56" y1="0" x2="56" y2="20" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="66" y1="0" x2="66" y2="18" stroke="#0f172a" strokeWidth="1.5" />
            {/* Ghostly Ectoplasmic Mist Arrow */}
            <polygon points="50,22 45,14 55,14" fill="#a855f7" />
          </>
        );

      // 10. VOLCANIC MAGMA: Obsidian Lava Vent (28% depth, -10% wall embed)
      case 'volcanic':
        return (
          <>
            {/* Fractured Obsidian Rock Wall Lip */}
            <polygon points="16,-10 34,-12 50,-8 66,-12 84,-10 80,0 20,0" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
            <path d="M 28 -8 L 34 0 M 64 -8 L 58 0" stroke="#ef4444" strokeWidth="1.2" />
            {/* Molten Lava Chamber */}
            <path d="M 22 0 Q 50 26 78 0 Z" fill="#450a0a" />
            <path d="M 26 0 Q 50 22 74 0 Z" fill={colorHex} fillOpacity="0.4" className="animate-pulse" />
            {/* Erupting Magma Plume / Downward Heat Arrow */}
            <polygon points="50,24 44,12 48,12 48,4 52,4 52,12 56,12" fill="#f97316" />
            <circle cx="50" cy="12" r="2.5" fill="#facc15" className="animate-ping" style={{ transformOrigin: '50px 12px' }} />
          </>
        );

      // 11. HIGH VANTAGE: Alpine Mountain Mine Shaft (A Mine Tunnel! 28% depth, -12% wall embed)
      case 'vantage':
        return (
          <>
            {/* Heavy Timber Mine Crossbeam in Wall */}
            <rect x="14" y="-12" width="72" height="12" rx="1" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
            {/* Corner Iron Reinforcement Brackets */}
            <polygon points="18,-12 26,-12 18,-4" fill="#475569" />
            <polygon points="82,-12 74,-12 82,-4" fill="#475569" />
            {/* Timber Side Posts */}
            <rect x="16" y="0" width="8" height="24" fill="#78350f" stroke="#451a03" strokeWidth="1" />
            <rect x="76" y="0" width="8" height="24" fill="#78350f" stroke="#451a03" strokeWidth="1" />
            {/* Dark Stone Mine Interior */}
            <rect x="24" y="0" width="52" height="24" fill="#0c0a09" />
            <rect x="26" y="0" width="48" height="22" fill={colorHex} fillOpacity="0.25" className="animate-pulse" />
            {/* Hanging Miner's Oil Lantern */}
            <line x1="50" y1="-2" x2="50" y2="6" stroke="#d97706" strokeWidth="1.2" />
            <rect x="47" y="6" width="6" height="7" rx="1" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
            <circle cx="50" cy="9.5" r="1.5" fill="#f59e0b" />
            {/* Railroad Track Perspective Lines */}
            <line x1="38" y1="24" x2="44" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="62" y1="24" x2="56" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
            <polygon points="50,22 46,16 54,16" fill={colorHex} />
          </>
        );

      // 12. PAPER CRAFTBOOK: Pop-Up Cutout Door (A Pop-Up Door! 28% depth, -10% wall embed)
      case 'papercraft':
        return (
          <>
            {/* Fold Crease Line in Wall */}
            <line x1="16" y1="-2" x2="84" y2="-2" stroke="#a8a29e" strokeWidth="1.5" strokeDasharray="4 3" />
            {/* Decorative Washi Tape Strips */}
            <polygon points="18,-10 32,-10 28,0 14,0" fill={colorHex} fillOpacity="0.85" stroke="#ffffff" strokeWidth="1" />
            <polygon points="82,-10 68,-10 72,0 86,0" fill={colorHex} fillOpacity="0.85" stroke="#ffffff" strokeWidth="1" />
            {/* Folded Paper Door Cutout Flap */}
            <path d="M 22 0 L 22 18 L 50 26 L 78 18 L 78 0 Z" fill="#f5f5f4" stroke="#78350f" strokeWidth="1.5" />
            <path d="M 28 0 L 28 14 L 50 20 L 72 14 L 72 0" stroke="#a8a29e" strokeWidth="1" strokeDasharray="3 2" fill="none" />
            {/* Pop-Up Arrow Tab */}
            <polygon points="50,22 44,14 48,14 48,8 52,8 52,14 56,14" fill="#fef3c7" stroke="#78350f" strokeWidth="1" />
          </>
        );

      // 13. STEAMPUNK FOUNDRY: Pneumatic Brass Pressure Tube (28% depth, -12% wall embed)
      case 'steampunk':
        return (
          <>
            {/* Heavy Riveted Brass Flange in Wall */}
            <rect x="16" y="-12" width="68" height="12" rx="1" fill="#b45309" stroke="#f59e0b" strokeWidth="1.5" />
            {/* Brass Rivets */}
            <circle cx="22" cy="-6" r="1.8" fill="#fde68a" />
            <circle cx="34" cy="-6" r="1.8" fill="#fde68a" />
            <circle cx="66" cy="-6" r="1.8" fill="#fde68a" />
            <circle cx="78" cy="-6" r="1.8" fill="#fde68a" />
            {/* Central Pressure Gauge Dial */}
            <circle cx="50" cy="-6" r="4.5" fill="#fef3c7" stroke="#78350f" strokeWidth="1" />
            <line x1="50" y1="-6" x2="52.5" y2="-8.5" stroke="#dc2626" strokeWidth="1" strokeLinecap="round" />
            {/* Steam Pressure Chamber Void */}
            <path d="M 22 0 Q 50 24 78 0 Z" fill="#1a120b" />
            <path d="M 26 0 Q 50 20 74 0 Z" fill={colorHex} fillOpacity="0.35" className="animate-pulse" />
            {/* Mechanical Clockwork Cogs at Corners */}
            <circle cx="24" cy="4" r="3.5" fill="#d97706" stroke="#78350f" strokeWidth="1" />
            <circle cx="76" cy="4" r="3.5" fill="#d97706" stroke="#78350f" strokeWidth="1" />
            {/* Hissing Steam Jet Exit Arrow */}
            <polygon points="50,22 44,14 48,14 48,8 52,8 52,14 56,14" fill="#ffffff" />
          </>
        );

      // 14. DIVINE OLYMPUS: Celestial Temple Portico (Temple Gate! 28% depth, -12% wall embed)
      case 'olympus':
        return (
          <>
            {/* Classical Golden Pediment in Wall */}
            <polygon points="16,0 50,-13 84,0" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
            <polygon points="22,-1 50,-10 78,-1" fill="#fef08a" />
            {/* Fluted Marble Pillars */}
            <rect x="18" y="0" width="8" height="24" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="22" y1="0" x2="22" y2="24" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="74" y="0" width="8" height="24" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="78" y1="0" x2="78" y2="24" stroke="#e2e8f0" strokeWidth="1" />
            {/* Celestial Storm Void */}
            <rect x="26" y="0" width="48" height="24" fill="#0f172a" />
            <rect x="28" y="0" width="44" height="22" fill={colorHex} fillOpacity="0.35" className="animate-pulse" />
            {/* Crackling Divine Lightning Bolt Arrow */}
            <path d="M 52 4 L 46 12 L 54 12 L 48 22" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" className="animate-pulse" />
            <polygon points="48,22 43,16 52,16" fill="#ffffff" />
          </>
        );

      // 15. PIRATE COVE: Ghost Ship Cargo Hatch (Hatch Door! 28% depth, -12% wall embed)
      case 'pirate':
        return (
          <>
            {/* Weathered Ship Plank Hatch Coaming in Wall */}
            <rect x="16" y="-12" width="68" height="12" rx="1" fill="#451a03" stroke="#291205" strokeWidth="1.5" />
            {/* Iron Corner Straps and Bolts */}
            <rect x="24" y="-12" width="6" height="12" fill="#334155" />
            <circle cx="27" cy="-6" r="1.5" fill="#fde68a" />
            <rect x="70" y="-12" width="6" height="12" fill="#334155" />
            <circle cx="73" cy="-6" r="1.5" fill="#fde68a" />
            {/* Open Cargo Hatch Frame */}
            <rect x="22" y="0" width="56" height="24" fill="#052e2b" stroke="#78350f" strokeWidth="1.5" />
            <rect x="24" y="0" width="52" height="22" fill={colorHex} fillOpacity="0.3" className="animate-pulse" />
            {/* Ghost Sea Maelstrom & Exit Arrow */}
            <path d="M 50 6 Q 60 14 50 20 Q 40 14 50 6" stroke="#2dd4bf" strokeWidth="2" fill="none" className="animate-spin" style={{ transformOrigin: '50px 13px' }} />
            <polygon points="50,22 46,16 54,16" fill="#2dd4bf" />
          </>
        );

      // 16. CYBER SYNTHWAVE: 1980s Vector Wireframe Warp Tunnel (28% depth, -10% wall embed)
      case 'synthwave':
        return (
          <>
            {/* Neon Outrun Horizon Bar in Wall */}
            <rect x="18" y="-10" width="64" height="10" rx="1" fill="#0f051d" stroke="#f43f5e" strokeWidth="1.5" />
            {/* Horizon Infinity Void */}
            <rect x="22" y="0" width="56" height="24" fill="#0f051d" />
            <rect x="24" y="0" width="52" height="22" fill={colorHex} fillOpacity="0.35" className="animate-pulse" />
            {/* Perspective Wireframe Lines converging to Horizon */}
            <line x1="28" y1="24" x2="42" y2="0" stroke="#f43f5e" strokeWidth="1.5" />
            <line x1="50" y1="24" x2="50" y2="0" stroke="#06b6d4" strokeWidth="1.5" />
            <line x1="72" y1="24" x2="58" y2="0" stroke="#f43f5e" strokeWidth="1.5" />
            <line x1="24" y1="12" x2="76" y2="12" stroke="#a855f7" strokeWidth="1" />
            {/* Outrun Laser Vanishing Point Arrow */}
            <polygon points="50,22 44,14 48,14 48,6 52,6 52,14 56,14" fill="#ffffff" className="animate-pulse" />
          </>
        );

      // Fallback: Standard Neon Cyber
      default:
        return (
          <>
            <rect x="18" y="-12" width="64" height="12" rx="2" fill="#0f172a" stroke="#0284c7" strokeWidth="1.5" />
            <path d="M 22 0 Q 50 20 78 0 Z" fill={colorHex} fillOpacity="0.25" className="animate-pulse" />
            <path d="M 22 2 Q 50 18 78 2" stroke={colorHex} strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="50,20 44,12 48,12 48,6 52,6 52,12 56,12" fill="#ffffff" />
          </>
        );
    }
  };

  return (
    <div
      className={`w-full h-full relative flex items-center justify-center pointer-events-none select-none overflow-visible ${colorClass}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: '50% 50%',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible drop-shadow-[0_0_8px_currentColor]"
        fill="none"
      >
        {renderPortalArt()}
      </svg>
    </div>
  );
};

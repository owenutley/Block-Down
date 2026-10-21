/**
 * Clean Geometric Book Constellation Geometry:
 * Defines the 50 stellar nodes forming an architectural, clean, rectangular open book
 * with straight page borders, parallel manuscript ruled lines, central spine crease,
 * hanging bookmark ribbon, and corner binding accents.
 */

import {
  NODE_CUMULATIVE_THRESHOLDS,
  NODE_INCREMENTAL_COSTS,
} from '../../../shared/lichtenbergProgress';

export type BookSection =
  | 'heart'
  | 'head'
  | 'neck'
  | 'forelegs'
  | 'body'
  | 'hindquarters'
  | 'tail';

export type ConstellationMagnitude = 1 | 2 | 3; // 1 = detail star, 2 = structural star, 3 = major anchor/joint star

export type LichtenbergNode = {
  id: number; // 1 to 34
  x: number;
  y: number;
  parent: number | null; // parent node id
  section: BookSection;
  label: string;
  magnitude: ConstellationMagnitude;
  cumulativeCost: number;
  incrementalCost: number;
};

export type ConstellationEdge = {
  id: string;
  fromNode: number;
  toNode: number;
  isPrimary: boolean;
};

export const BOOK_VIEWBOX = {
  width: 400,
  height: 280,
};

/**
 * 34 Angle & Joint Stars forming a Majestic Galloping Celestial Steed / Horse
 */
export const LICHTENBERG_NODES: readonly LichtenbergNode[] = (() => {
  const rawNodes: Omit<LichtenbergNode, 'cumulativeCost' | 'incrementalCost'>[] = [
    // 1. Celestial Heart (Core Origin Star - Node 1)
    { id: 1, x: 205, y: 135, parent: null, section: 'heart', magnitude: 3, label: 'Celestial Heart Origin' },

    // 2. Neck, Mane & Noble Head (Nodes 2 to 12)
    { id: 2, x: 235, y: 102, parent: 1, section: 'neck', magnitude: 2, label: 'Withers Crest' },
    { id: 3, x: 265, y: 122, parent: 2, section: 'neck', magnitude: 2, label: 'Point of Shoulder' },
    { id: 4, x: 295, y: 105, parent: 3, section: 'head', magnitude: 2, label: 'Throatlatch' },
    { id: 5, x: 318, y: 95, parent: 4, section: 'head', magnitude: 2, label: 'Cheek Jaw Angle' },
    { id: 6, x: 345, y: 102, parent: 5, section: 'head', magnitude: 1, label: 'Chin & Lower Lip' },
    { id: 7, x: 362, y: 88, parent: 6, section: 'head', magnitude: 3, label: 'Muzzle & Nostril' },
    { id: 8, x: 338, y: 72, parent: 7, section: 'head', magnitude: 2, label: 'Forehead Brow' },
    { id: 9, x: 315, y: 62, parent: 8, section: 'head', magnitude: 2, label: 'Poll Crown' },
    { id: 10, x: 310, y: 40, parent: 9, section: 'head', magnitude: 3, label: 'Ear Tip' },
    { id: 11, x: 275, y: 65, parent: 9, section: 'neck', magnitude: 1, label: 'Mane Crest Upper' },
    { id: 12, x: 250, y: 78, parent: 11, section: 'neck', magnitude: 1, label: 'Mane Stream Lower' },

    // 3. Leaping Forelegs (Nodes 13 to 19)
    { id: 13, x: 255, y: 152, parent: 3, section: 'forelegs', magnitude: 2, label: 'Lead Forearm Elbow' },
    { id: 14, x: 290, y: 178, parent: 13, section: 'forelegs', magnitude: 2, label: 'Lead Front Knee' },
    { id: 15, x: 325, y: 192, parent: 14, section: 'forelegs', magnitude: 2, label: 'Lead Front Fetlock' },
    { id: 16, x: 348, y: 196, parent: 15, section: 'forelegs', magnitude: 3, label: 'Lead Front Hoof' },
    { id: 17, x: 248, y: 185, parent: 13, section: 'forelegs', magnitude: 1, label: 'Trailing Front Knee' },
    { id: 18, x: 262, y: 215, parent: 17, section: 'forelegs', magnitude: 1, label: 'Trailing Front Fetlock' },
    { id: 19, x: 272, y: 228, parent: 18, section: 'forelegs', magnitude: 2, label: 'Trailing Front Hoof' },

    // 4. Barrel & Spine (Nodes 20 to 22)
    { id: 20, x: 170, y: 112, parent: 1, section: 'body', magnitude: 2, label: 'Mid-Back Saddle' },
    { id: 21, x: 185, y: 162, parent: 1, section: 'body', magnitude: 2, label: 'Belly Underline' },
    { id: 22, x: 148, y: 152, parent: 21, section: 'body', magnitude: 2, label: 'Flank Angle' },

    // 5. Powerful Hindquarters & Extended Hind Legs (Nodes 23 to 31)
    { id: 23, x: 132, y: 108, parent: 20, section: 'hindquarters', magnitude: 3, label: 'Croup Rump Peak' },
    { id: 24, x: 115, y: 125, parent: 23, section: 'hindquarters', magnitude: 2, label: 'Point of Hip' },
    { id: 25, x: 128, y: 165, parent: 22, section: 'hindquarters', magnitude: 2, label: 'Lead Stifle Joint' },
    { id: 26, x: 82, y: 188, parent: 25, section: 'hindquarters', magnitude: 2, label: 'Lead Hind Hock' },
    { id: 27, x: 62, y: 224, parent: 26, section: 'hindquarters', magnitude: 2, label: 'Lead Hind Fetlock' },
    { id: 28, x: 45, y: 248, parent: 27, section: 'hindquarters', magnitude: 3, label: 'Lead Hind Hoof' },
    { id: 29, x: 112, y: 198, parent: 25, section: 'hindquarters', magnitude: 1, label: 'Trailing Hind Hock' },
    { id: 30, x: 102, y: 228, parent: 29, section: 'hindquarters', magnitude: 1, label: 'Trailing Hind Fetlock' },
    { id: 31, x: 94, y: 245, parent: 30, section: 'hindquarters', magnitude: 2, label: 'Trailing Hind Hoof' },

    // 6. Flowing Celestial Tail (Nodes 32 to 34)
    { id: 32, x: 102, y: 118, parent: 23, section: 'tail', magnitude: 2, label: 'Tail Dock Root' },
    { id: 33, x: 72, y: 122, parent: 32, section: 'tail', magnitude: 2, label: 'Tail Arch Plume' },
    { id: 34, x: 38, y: 142, parent: 33, section: 'tail', magnitude: 3, label: 'Tail Tip Flare' },
  ];

  return Object.freeze(
    rawNodes.map((n) => ({
      ...n,
      cumulativeCost: NODE_CUMULATIVE_THRESHOLDS[n.id] ?? 0,
      incrementalCost: NODE_INCREMENTAL_COSTS[n.id] ?? 0,
    }))
  );
})();

/**
 * Pre-computed architectural constellation edges connecting equine joints and angles
 */
export const CONSTELLATION_EDGES: readonly ConstellationEdge[] = (() => {
  const edges: ConstellationEdge[] = [];

  // 1. Primary tree edges (every node connects directly to its parent)
  for (const node of LICHTENBERG_NODES) {
    if (node.parent !== null) {
      edges.push({
        id: `tree_${node.parent}_${node.id}`,
        fromNode: node.parent,
        toNode: node.id,
        isPrimary: true,
      });
    }
  }

  // 2. Secondary structural edges (close equine contours, muscle ties, and anatomical facets)
  const secondaryPairs: [number, number][] = [
    // Head & Cheekbone closure: Brow to Jaw Angle
    [8, 5],
    // Ear base tie: Poll to Mane
    [10, 11],
    // Neck crest to Withers
    [12, 2],
    // Neck lower muscle tie: Mane Stream to Shoulder
    [12, 3],
    // Shoulder to Heart
    [3, 1],
    // Elbow to Belly underline
    [13, 21],
    // Heart to Mid-Back saddle
    [1, 20],
    // Ribcage vertical tie: Belly to Mid-Back
    [21, 20],
    // Flank to Hip
    [22, 24],
    // Haunch muscle: Hip to Stifle
    [24, 25],
    // Hamstring line: Hip to Hock
    [24, 26],
    // Tail plume to Point of Hip
    [33, 24],
  ];

  for (const [from, to] of secondaryPairs) {
    edges.push({
      id: `struct_${from}_${to}`,
      fromNode: from,
      toNode: to,
      isPrimary: false,
    });
  }

  return Object.freeze(edges);
})();

/**
 * Subtle background ambient stars
 */
export const BACKGROUND_STARS: readonly { x: number; y: number; r: number; opacity: number }[] = (() => {
  const stars: { x: number; y: number; r: number; opacity: number }[] = [];
  const seeds = [
    [25, 30], [50, 38], [90, 25], [140, 28], [260, 28], [310, 25], [350, 38], [375, 30],
    [20, 100], [20, 180], [380, 100], [380, 180],
    [25, 255], [80, 255], [130, 255], [270, 255], [320, 255], [375, 255],
  ];
  for (let i = 0; i < seeds.length; i++) {
    const pair = seeds[i];
    if (pair) {
      stars.push({
        x: pair[0] ?? 0,
        y: pair[1] ?? 0,
        r: i % 2 === 0 ? 1.0 : 0.7,
        opacity: 0.18 + (i % 3) * 0.08,
      });
    }
  }
  return Object.freeze(stars);
})();

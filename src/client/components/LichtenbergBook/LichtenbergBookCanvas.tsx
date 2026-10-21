import { memo, useState } from 'react';
import {
  LICHTENBERG_NODES,
  CONSTELLATION_EDGES,
  BACKGROUND_STARS,
  BOOK_VIEWBOX,
  LichtenbergNode,
} from './LichtenbergGeometry';
import { TOTAL_BOOK_NODES } from '../../../shared/lichtenbergProgress';

export type LichtenbergBookCanvasProps = {
  unlockedNodeCount: number; // 1 to TOTAL_BOOK_NODES
  totalPoints: number;
  forceFullDisplay?: boolean;
  className?: string;
  onSelectNode?: (node: LichtenbergNode) => void;
};

export const LichtenbergBookCanvas = memo(({
  unlockedNodeCount,
  totalPoints,
  forceFullDisplay = false,
  className = 'w-full h-full max-h-full max-w-[420px] aspect-[400/280]',
  onSelectNode,
}: LichtenbergBookCanvasProps) => {
  const [hoveredNode, setHoveredNode] = useState<LichtenbergNode | null>(null);

  // In full preview mode, all nodes are illuminated
  const effectiveUnlockedCount = forceFullDisplay ? TOTAL_BOOK_NODES : Math.max(1, Math.min(TOTAL_BOOK_NODES, unlockedNodeCount));
  const leadingNodeId = effectiveUnlockedCount;

  // Quick lookup for node coordinates
  const nodeMap = new Map<number, LichtenbergNode>();
  for (const n of LICHTENBERG_NODES) {
    nodeMap.set(n.id, n);
  }

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${BOOK_VIEWBOX.width} ${BOOK_VIEWBOX.height}`}
        className="w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(146,64,14,0.18)]"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>{`Constellation: Node ${effectiveUnlockedCount} of ${TOTAL_BOOK_NODES} awakened (${totalPoints} points)`}</title>
        <defs>
          {/* Subtle Dim Bronze Star Glow Filter */}
          <filter id="starGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gentle Line Bronze Glow */}
          <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dim Cosmic Bronze Nebula Haze */}
          <radialGradient id="nebulaCore" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#78350f" stopOpacity="0.14" />
            <stop offset="60%" stopColor="#451a03" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>

          {/* Dim Metallic Bronze Star Radial Gradient */}
          <radialGradient id="dimBronzeStarGrad" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="25%" stopColor="#d97706" />
            <stop offset="65%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </radialGradient>

          {/* Core Seed Star Gradient */}
          <radialGradient id="coreBronzeStarGrad" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="30%" stopColor="#d97706" />
            <stop offset="75%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#451a03" />
          </radialGradient>

          {/* Crystalline Dim Bronze Constellation Bridge Gradient */}
          <linearGradient id="bronzeLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>

        {/* 1. Ambient Background Bronze Nebula Clouds */}
        <circle cx="200" cy="140" r="135" fill="url(#nebulaCore)" className="pointer-events-none" />

        {/* Scattered background distant micro-stars */}
        <g className="pointer-events-none">
          {BACKGROUND_STARS.map((star, idx) => (
            <circle
              key={idx}
              cx={star.x}
              cy={star.y}
              r={star.r * 0.85}
              fill="#d97706"
              opacity={star.opacity * 0.45}
            />
          ))}
        </g>

        {/* 2. Subtle Equine Celestial Silhouette Washes (Only revealed upon full completion) */}
        {effectiveUnlockedCount >= TOTAL_BOOK_NODES && (
          <g className="pointer-events-none transition-opacity duration-700">
            {/* Torso & Muscular Barrel Wash */}
            <path
              d="M 235 102 L 265 122 L 255 152 L 185 162 L 148 152 L 128 165 L 115 125 L 132 108 L 170 112 Z"
              fill="#78350f"
              fillOpacity={0.10}
              stroke="#92400e"
              strokeWidth="0.6"
              strokeOpacity="0.25"
            />
            {/* Arched Neck & Head Silhouette Wash */}
            <path
              d="M 235 102 L 250 78 L 275 65 L 315 62 L 310 40 L 305 55 L 338 72 L 362 88 L 345 102 L 318 95 L 295 105 L 265 122 Z"
              fill="#78350f"
              fillOpacity={0.12}
              stroke="#92400e"
              strokeWidth="0.6"
              strokeOpacity="0.25"
            />
            {/* Flowing Tail Sweep Wash */}
            <path
              d="M 132 108 L 102 118 L 72 122 L 38 142 L 52 155 L 82 136 L 115 125 Z"
              fill="#92400e"
              fillOpacity={0.14}
              stroke="#78350f"
              strokeWidth="0.5"
              strokeOpacity="0.2"
            />
          </g>
        )}

        {/* 3. Illuminated Active Constellation Lines (Only between unlocked nodes) */}
        <g className="pointer-events-none">
          {CONSTELLATION_EDGES.map((edge) => {
            const isUnlocked = edge.fromNode <= effectiveUnlockedCount && edge.toNode <= effectiveUnlockedCount;
            if (!isUnlocked) return null;
            const from = nodeMap.get(edge.fromNode);
            const to = nodeMap.get(edge.toNode);
            if (!from || !to) return null;

            return (
              <g key={`active_${edge.id}`}>
                {/* Outer Dim Bronze Halo */}
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#92400e"
                  strokeWidth={edge.isPrimary ? '2.4' : '1.6'}
                  strokeOpacity="0.35"
                  filter="url(#lineGlow)"
                />
                {/* Crisp Metallic Bronze Thread */}
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="url(#bronzeLineGrad)"
                  strokeWidth={edge.isPrimary ? '1.4' : '1.0'}
                  strokeLinecap="round"
                />
                {/* Subtle Inner Warm Amber Core */}
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#fef3c7"
                  strokeWidth="0.4"
                  strokeOpacity="0.6"
                />
              </g>
            );
          })}
        </g>

        {/* 5. Active Illuminated Stars */}
        <g>
          {LICHTENBERG_NODES.map((node) => {
            const isUnlocked = node.id <= effectiveUnlockedCount;
            if (!isUnlocked) return null;

            const isLeading = node.id === leadingNodeId;
            const isHovered = hoveredNode?.id === node.id;
            const isMajorStar = node.magnitude === 3;
            const baseRadius = node.id === 1 ? 4.2 : isMajorStar ? 3.6 : node.magnitude === 2 ? 2.6 : 2.0;
            const currentRadius = isHovered ? baseRadius * 1.3 : baseRadius;

            return (
              <g
                key={`active_star_${node.id}`}
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelectNode?.(node)}
              >
                {/* Leading Active Node: Clean Static Indicator Ring (No ping/pulse animation) */}
                {isLeading && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={baseRadius * 2.2}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                    opacity="0.65"
                  />
                )}

                {/* Subtle Static Starlight Spikes for Major Anchor Stars */}
                {isMajorStar && (
                  <g className="pointer-events-none opacity-60">
                    <line
                      x1={node.x - 7}
                      y1={node.y}
                      x2={node.x + 7}
                      y2={node.y}
                      stroke="#fde68a"
                      strokeWidth="0.6"
                      strokeOpacity="0.75"
                    />
                    <line
                      x1={node.x}
                      y1={node.y - 7}
                      x2={node.x}
                      y2={node.y + 7}
                      stroke="#fde68a"
                      strokeWidth="0.6"
                      strokeOpacity="0.75"
                    />
                  </g>
                )}

                {/* Outer Dim Bronze Halo */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={currentRadius * 1.6}
                  fill="#92400e"
                  opacity={isHovered ? 0.45 : 0.25}
                  filter="url(#starGlow)"
                />

                {/* Primary Dim Bronze Star Sphere */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={currentRadius}
                  fill={node.id === 1 ? 'url(#coreBronzeStarGrad)' : 'url(#dimBronzeStarGrad)'}
                  stroke="#d97706"
                  strokeWidth={isHovered ? '0.9' : '0.5'}
                />

                {/* Warm Amber Center Nucleus */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={Math.max(0.6, currentRadius * 0.38)}
                  fill="#fef3c7"
                  opacity="0.85"
                />

                {/* Invisible larger hit target for clicking */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={12}
                  fill="transparent"
                />
              </g>
            );
          })}
        </g>

        {/* 6. Hover Tooltip Overlay */}
        {hoveredNode && (
          <g className="pointer-events-none">
            {/* Tooltip Background Pill */}
            <rect
              x={Math.max(10, Math.min(270, hoveredNode.x - 65))}
              y={hoveredNode.y < 65 ? hoveredNode.y + 14 : hoveredNode.y - 32}
              width="130"
              height="24"
              rx="6"
              fill="#090d16"
              fillOpacity="0.95"
              stroke="#b45309"
              strokeWidth="0.8"
            />
            {/* Tooltip Text */}
            <text
              x={Math.max(10, Math.min(270, hoveredNode.x - 65)) + 65}
              y={hoveredNode.y < 65 ? hoveredNode.y + 30 : hoveredNode.y - 16}
              textAnchor="middle"
              fill="#fef3c7"
              fontSize="9.5"
              fontWeight="600"
              fontFamily="sans-serif"
            >
              Node {hoveredNode.id}: {hoveredNode.label.length > 20 ? hoveredNode.label.slice(0, 20) + '…' : hoveredNode.label}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
});

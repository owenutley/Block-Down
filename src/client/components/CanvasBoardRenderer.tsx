import React, { useRef, useEffect, memo } from 'react';
import { Position, BlockData, DestinationData, PuzzlePortal } from '../types';
import { ThemeId, ThemeConfig, ColorId, DEFAULT_THEME_CONFIGS, getBaseThemeId, Theme } from '../../shared/themes';
import { COLOR_PALETTES, getBlockColors, getDestinationStyle } from './ThemeBoardRenderer';
import { shouldShowTrails } from '../utils/device';

export const positionKey = (pos: Position) => `${pos.x},${pos.y}`;

interface CanvasBoardRendererProps {
  gridSize: number;
  walls: Position[];
  destinations: DestinationData[];
  blocks: BlockData[];
  portals?: PuzzlePortal[];
  playerPos: Position;
  activeTheme: ThemeId;
  themeConfig?: ThemeConfig;
  cellSize?: string;
  gridPadding?: string;
  isAnimated?: boolean;
  prevBlocks?: BlockData[];
  prevPlayerPos?: Position;
  activeThemeStyle?: Theme;
  lastAction?: 'push' | 'undo' | 'reset' | 'load' | 'move' | 'teleport';
  activeCharacter?: string;
  shakeLevel?: 'none' | 'sm' | 'md';
  showTrails?: boolean;
}

const getSlideDuration = (distance: number): number => {
  if (distance <= 0) return 0;
  if (distance === 1) return 180;
  if (distance === 2) return 250;
  if (distance === 3) return 310;
  return 360;
};

// Canvas Helper: Draw Rounded Rect path across all browser versions
const pathRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Canvas Helper: Draw Shape Watermarks / Icons directly into Canvas Context
const drawCanvasShape = (
  ctx: CanvasRenderingContext2D,
  shape: string,
  cx: number,
  cy: number,
  size: number,
  color: string,
  opacity: number = 0.8
) => {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const r = size / 2;

  switch (shape) {
    case 'heart': {
      ctx.beginPath();
      const topCurveHeight = r * 0.7;
      ctx.moveTo(cx, cy + r * 0.8);
      ctx.bezierCurveTo(cx - r, cy + topCurveHeight, cx - r, cy - r * 0.7, cx, cy - r * 0.2);
      ctx.bezierCurveTo(cx + r, cy - r * 0.7, cx + r, cy + topCurveHeight, cx, cy + r * 0.8);
      ctx.fill();
      break;
    }
    case 'diamond': {
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'circle': {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'square': {
      pathRoundRect(ctx, cx - r * 0.7, cy - r * 0.7, r * 1.4, r * 1.4, r * 0.3);
      ctx.fill();
      break;
    }
    case 'cross': {
      const w = r * 0.4;
      ctx.beginPath();
      ctx.moveTo(cx - w, cy - r);
      ctx.lineTo(cx + w, cy - r);
      ctx.lineTo(cx + w, cy - w);
      ctx.lineTo(cx + r, cy - w);
      ctx.lineTo(cx + r, cy + w);
      ctx.lineTo(cx + w, cy + w);
      ctx.lineTo(cx + w, cy + r);
      ctx.lineTo(cx - w, cy + r);
      ctx.lineTo(cx - w, cy + w);
      ctx.lineTo(cx - r, cy + w);
      ctx.lineTo(cx - r, cy - w);
      ctx.lineTo(cx - w, cy - w);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'snowflake': {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.7, cy);
      ctx.lineTo(cx + r * 0.7, cy);
      ctx.moveTo(cx, cy - r * 0.7);
      ctx.lineTo(cx, cy + r * 0.7);
      ctx.moveTo(cx - r * 0.5, cy - r * 0.5);
      ctx.lineTo(cx + r * 0.5, cy + r * 0.5);
      ctx.moveTo(cx + r * 0.5, cy - r * 0.5);
      ctx.lineTo(cx - r * 0.5, cy + r * 0.5);
      ctx.stroke();
      break;
    }
    case 'fire': {
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.8);
      ctx.quadraticCurveTo(cx + r * 0.8, cy, cx + r * 0.6, cy + r * 0.7);
      ctx.quadraticCurveTo(cx, cy + r, cx - r * 0.6, cy + r * 0.7);
      ctx.quadraticCurveTo(cx - r * 0.8, cy, cx, cy - r * 0.8);
      ctx.fill();
      break;
    }
    case 'star':
    default: {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = cx + r * 0.75 * Math.cos(angle);
        const y = cy + r * 0.75 * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
  }

  ctx.restore();
};

export const CanvasBoardRenderer: React.FC<CanvasBoardRendererProps> = memo(({
  gridSize,
  walls,
  destinations,
  blocks,
  portals = [],
  playerPos,
  activeTheme,
  themeConfig,
  isAnimated = true,
  prevBlocks,
  lastAction = 'load',
  activeCharacter,
  shakeLevel = 'none',
  showTrails,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const trailsEnabled = shouldShowTrails(showTrails);
  const baseThemeId = getBaseThemeId(activeTheme);
  const config = themeConfig || DEFAULT_THEME_CONFIGS[baseThemeId] || DEFAULT_THEME_CONFIGS.neon;

  // Track position animations over time for smooth lerp
  const blockAnimStateRef = useRef<Map<number, { startX: number; startY: number; targetX: number; targetY: number; startTime: number; duration: number }>>(new Map());
  const playerAnimStateRef = useRef<{ startX: number; startY: number; targetX: number; targetY: number; startTime: number; duration: number }>({
    startX: playerPos.x,
    startY: playerPos.y,
    targetX: playerPos.x,
    targetY: playerPos.y,
    startTime: 0,
    duration: 0,
  });

  // Active slide trail coordinates
  const activeTrailsRef = useRef<{ x: number; y: number; colorHex: string; createdAt: number; delayMs: number }[]>([]);

  // Update Block Anim Targets
  useEffect(() => {
    const now = Date.now();

    blocks.forEach((block, idx) => {
      let anim = blockAnimStateRef.current.get(idx);
      const isInstant = lastAction === 'reset' || lastAction === 'undo' || lastAction === 'load' || block.noTransition || !isAnimated;

      if (!anim) {
        const prev = prevBlocks?.[idx];
        const startX = prev ? prev.pos.x : block.pos.x;
        const startY = prev ? prev.pos.y : block.pos.y;
        anim = { startX, startY, targetX: block.pos.x, targetY: block.pos.y, startTime: 0, duration: 0 };
        blockAnimStateRef.current.set(idx, anim);
      } else if (anim.targetX !== block.pos.x || anim.targetY !== block.pos.y) {
        const dx = block.pos.x - anim.targetX;
        const dy = block.pos.y - anim.targetY;
        const distance = Math.abs(dx) + Math.abs(dy);
        const duration = isInstant || distance === 0 ? 0 : getSlideDuration(distance);

        // Record trails for moving blocks
        if (trailsEnabled && !isInstant && distance > 0) {
          const colors = getBlockColors(config, baseThemeId, block.type);
          const colorHex = colors.colorHex || '#ef4444';
          const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
          const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

          for (let step = 0; step < distance; step++) {
            activeTrailsRef.current.push({
              x: anim.targetX + step * stepX,
              y: anim.targetY + step * stepY,
              colorHex,
              createdAt: now,
              delayMs: Math.round((step / distance) * duration),
            });
          }
        }

        blockAnimStateRef.current.set(idx, {
          startX: anim.targetX,
          startY: anim.targetY,
          targetX: block.pos.x,
          targetY: block.pos.y,
          startTime: now,
          duration,
        });
      }
    });
  }, [blocks, prevBlocks, lastAction, isAnimated, trailsEnabled, config, baseThemeId]);

  // Update Player Anim Targets
  useEffect(() => {
    const now = Date.now();
    const isInstant = lastAction === 'reset' || lastAction === 'undo' || lastAction === 'load' || lastAction === 'teleport' || !isAnimated;
    const pAnim = playerAnimStateRef.current;

    if (pAnim.targetX !== playerPos.x || pAnim.targetY !== playerPos.y) {
      const dx = playerPos.x - pAnim.targetX;
      const dy = playerPos.y - pAnim.targetY;
      const distance = Math.abs(dx) + Math.abs(dy);
      const duration = isInstant || distance === 0 ? 0 : 160;

      playerAnimStateRef.current = {
        startX: pAnim.targetX,
        startY: pAnim.targetY,
        targetX: playerPos.x,
        targetY: playerPos.y,
        startTime: now,
        duration,
      };
    }
  }, [playerPos, lastAction, isAnimated]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animFrameId: number;

    const wallSet = new Set(walls.map((w) => positionKey(w)));
    const destinationMap = new Map(destinations.map((d) => [positionKey(d.pos), d]));

    const render = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (width === 0 || height === 0) {
        animFrameId = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Board Dimensions - bounded by smallest dimension (width or height) to fit mobile screens
      const padding = 6;
      const gap = 1;
      const side = Math.min(width, height);
      const boardSize = Math.max(10, side - 2 * padding);
      const cellSize = Math.max(5, (boardSize - (gridSize - 1) * gap) / gridSize);
      const cellRadius = cellSize * 0.16;

      const boardOffsetX = (width - boardSize) / 2;
      const boardOffsetY = (height - boardSize) / 2;

      const now = Date.now();

      // Screen Shake Displacement
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (shakeLevel === 'sm') {
        shakeOffsetX = (Math.random() - 0.5) * 4;
        shakeOffsetY = (Math.random() - 0.5) * 4;
      } else if (shakeLevel === 'md') {
        shakeOffsetX = (Math.random() - 0.5) * 8;
        shakeOffsetY = (Math.random() - 0.5) * 8;
      }

      ctx.translate(shakeOffsetX, shakeOffsetY);

      // --- 1. DRAW BOARD CONTAINER PANEL ---
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      pathRoundRect(ctx, boardOffsetX, boardOffsetY, boardSize, boardSize, cellSize * 0.3);
      ctx.fill();
      ctx.stroke();

      // --- 2. DRAW GRID CELLS & DESTINATIONS ---
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const key = `${x},${y}`;
          const cellX = boardOffsetX + padding + x * (cellSize + gap);
          const cellY = boardOffsetY + padding + y * (cellSize + gap);

          const hasWall = wallSet.has(key);
          const destination = destinationMap.get(key);

          if (hasWall) {
            // Wall Block 3D Fill
            ctx.fillStyle = '#1e293b';
            pathRoundRect(ctx, cellX, cellY, cellSize, cellSize, cellRadius);
            ctx.fill();

            // 3D Bevel Lighting
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            pathRoundRect(ctx, cellX, cellY, cellSize, cellSize * 0.25, cellRadius);
            ctx.fill();
          } else if (destination) {
            // Destination Target Slot
            const destTypeKey = destination.type as keyof ThemeConfig;
            const destStyle = getDestinationStyle(config, activeTheme, destination.type);

            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = destStyle.colorHex || '#3b82f6';
            ctx.lineWidth = 2;

            pathRoundRect(ctx, cellX, cellY, cellSize, cellSize, cellRadius);
            ctx.fill();
            ctx.stroke();

            // Shape Watermark
            if (config[destTypeKey]) {
              drawCanvasShape(
                ctx,
                config[destTypeKey].shape,
                cellX + cellSize / 2,
                cellY + cellSize / 2,
                cellSize * 0.45,
                destStyle.colorHex || '#ffffff',
                0.55
              );
            }
          } else {
            // Standard Empty Cell
            ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
            ctx.lineWidth = 1;

            pathRoundRect(ctx, cellX, cellY, cellSize, cellSize, cellRadius);
            ctx.fill();
            ctx.stroke();
          }

          // Active Slide Trails
          if (trailsEnabled && activeTrailsRef.current.length > 0) {
            const trail = activeTrailsRef.current.find((t) => t.x === x && t.y === y);
            if (trail && now - trail.createdAt > trail.delayMs && now - trail.createdAt < trail.delayMs + 450) {
              ctx.fillStyle = trail.colorHex;
              ctx.globalAlpha = 0.35;
              pathRoundRect(ctx, cellX + 2, cellY + 2, cellSize - 4, cellSize - 4, cellRadius);
              ctx.fill();
              ctx.globalAlpha = 1.0;
            }
          }
        }
      }

      // Cleanup Old Trails
      activeTrailsRef.current = activeTrailsRef.current.filter((t) => now - t.createdAt < 650);

      // --- 3. DRAW PORTALS ---
      portals.forEach((portal) => {
        const portalX = boardOffsetX + padding + portal.x * (cellSize + gap) + cellSize / 2;
        const portalY = boardOffsetY + padding + portal.y * (cellSize + gap) + cellSize / 2;
        const colorPalette = COLOR_PALETTES[portal.color as ColorId] || COLOR_PALETTES.blue;

        ctx.save();
        ctx.beginPath();
        ctx.arc(portalX, portalY, cellSize * 0.32, 0, Math.PI * 2);
        ctx.fillStyle = `${colorPalette.colorHex}55`;
        ctx.strokeStyle = colorPalette.colorHex;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Portal Center Eye
        ctx.beginPath();
        ctx.arc(portalX, portalY, cellSize * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      });

      // --- 4. DRAW BLOCKS ---
      blocks.forEach((block, idx) => {
        const anim = blockAnimStateRef.current.get(idx);
        let curX = block.pos.x;
        let curY = block.pos.y;

        if (anim && anim.duration > 0) {
          const elapsed = now - anim.startTime;
          const t = Math.min(1, Math.max(0, elapsed / anim.duration));
          const ease = 1 - Math.pow(1 - t, 3); // Smooth cubic ease-out
          curX = anim.startX + (anim.targetX - anim.startX) * ease;
          curY = anim.startY + (anim.targetY - anim.startY) * ease;
        }

        const blockX = boardOffsetX + padding + curX * (cellSize + gap);
        const blockY = boardOffsetY + padding + curY * (cellSize + gap);

        const destination = destinationMap.get(positionKey(block.pos));
        const isSolved = destination !== undefined && destination.type === block.type;
        const colors = getBlockColors(config, baseThemeId, block.type);

        ctx.save();

        // Block Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        pathRoundRect(ctx, blockX + 2, blockY + 4, cellSize, cellSize, cellRadius);
        ctx.fill();

        // Main Block Body Fill
        ctx.fillStyle = isSolved ? colors.colorHex || '#22c55e' : colors.solidFill || '#3b82f6';
        ctx.strokeStyle = colors.colorHex || '#ffffff';
        ctx.lineWidth = isSolved ? 3 : 2;

        pathRoundRect(ctx, blockX, blockY, cellSize, cellSize, cellRadius);
        ctx.fill();
        ctx.stroke();

        // Inner Shape Icon
        const shape = config[block.type as keyof ThemeConfig]?.shape;
        if (shape) {
          drawCanvasShape(
            ctx,
            shape,
            blockX + cellSize / 2,
            blockY + cellSize / 2,
            cellSize * 0.45,
            isSolved ? '#ffffff' : colors.colorHex || '#ffffff',
            1.0
          );
        }

        ctx.restore();
      });

      // --- 5. DRAW PLAYER CHARACTER ORB ---
      const pAnim = playerAnimStateRef.current;
      let px = playerPos.x;
      let py = playerPos.y;

      if (pAnim.duration > 0) {
        const elapsed = now - pAnim.startTime;
        const t = Math.min(1, Math.max(0, elapsed / pAnim.duration));
        const ease = 1 - Math.pow(1 - t, 3);
        px = pAnim.startX + (pAnim.targetX - pAnim.startX) * ease;
        py = pAnim.startY + (pAnim.targetY - pAnim.startY) * ease;
      }

      const playerX = boardOffsetX + padding + px * (cellSize + gap) + cellSize / 2;
      const playerY = boardOffsetY + padding + py * (cellSize + gap) + cellSize / 2;
      const orbRadius = cellSize * 0.38;

      ctx.save();

      // Orb Glow Shadow
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;

      // Outer Glowing Orb Sphere
      const grad = ctx.createRadialGradient(
        playerX - orbRadius * 0.3,
        playerY - orbRadius * 0.3,
        orbRadius * 0.1,
        playerX,
        playerY,
        orbRadius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#38bdf8');
      grad.addColorStop(1, '#0284c7');

      ctx.beginPath();
      ctx.arc(playerX, playerY, orbRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Dark Helmet Visor Band
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(playerX - orbRadius * 0.7, playerY - orbRadius * 0.25, orbRadius * 1.4, orbRadius * 0.5);

      // Bright Visor Eye Light
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(playerX - orbRadius * 0.4, playerY - orbRadius * 0.12, orbRadius * 0.8, orbRadius * 0.24);

      ctx.restore();

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [gridSize, walls, destinations, blocks, portals, playerPos, activeTheme, config, baseThemeId, shakeLevel, trailsEnabled, activeCharacter]);

  return (
    <div ref={containerRef} className="w-full h-full relative flex items-center justify-center pointer-events-none select-none">
      <canvas ref={canvasRef} className="max-w-full max-h-full block pointer-events-auto" />
    </div>
  );
});

CanvasBoardRenderer.displayName = 'CanvasBoardRenderer';

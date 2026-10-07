import { useEffect, useRef, useCallback } from 'react';
import { RelicProgressState, FaceProgressKey } from '../../shared/relicProgress';
import { ThemeId } from '../../shared/themes';

export interface RelicBlockProps {
  progressState: RelicProgressState;
  activeTheme?: ThemeId;
  onInspectMilestones?: () => void;
  className?: string;
  size?: number;
}

type Point3D = { x: number; y: number; z: number };
type Point2D = { x: number; y: number };

export const RelicBlock = ({
  progressState,
  onInspectMilestones,
  className = '',
  size = 320,
}: RelicBlockProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Rotation angles (radians)
  const rotationRef = useRef({ yaw: 0.78, pitch: 0.52 });
  const velocityRef = useRef({ yaw: 0.006, pitch: 0 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef<Point2D>({ x: 0, y: 0 });
  const pulseRef = useRef(0);

  // Ambient cosmic dust particles in space
  const particlesRef = useRef<
    Array<{ x: number; y: number; z: number; size: number; alpha: number; speed: number }>
  >([]);

  useEffect(() => {
    const count = progressState.cosmicParticlesCount || 25;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 500,
      y: (Math.random() - 0.5) * 500,
      z: (Math.random() - 0.5) * 500,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.005 + 0.002,
    }));
  }, [progressState.cosmicParticlesCount]);

  // Main 3D Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const cubeHalfSize = 60; // Base half dimension of cube

    // 8 Vertices of a cube
    const rawVertices: Point3D[] = [
      { x: -cubeHalfSize, y: -cubeHalfSize, z: -cubeHalfSize }, // 0
      { x: cubeHalfSize, y: -cubeHalfSize, z: -cubeHalfSize },  // 1
      { x: cubeHalfSize, y: cubeHalfSize, z: -cubeHalfSize },   // 2
      { x: -cubeHalfSize, y: cubeHalfSize, z: -cubeHalfSize },  // 3
      { x: -cubeHalfSize, y: -cubeHalfSize, z: cubeHalfSize },  // 4
      { x: cubeHalfSize, y: -cubeHalfSize, z: cubeHalfSize },   // 5
      { x: cubeHalfSize, y: cubeHalfSize, z: cubeHalfSize },    // 6
      { x: -cubeHalfSize, y: cubeHalfSize, z: cubeHalfSize },   // 7
    ];

    type FaceColor = {
      base: string;
      highlight: string;
      shade: string;
      glow: string;
      gem: string;
    };

    type FaceDef = {
      v: [number, number, number, number];
      normal: Point3D;
      name: string;
      faceKey: FaceProgressKey;
      color: FaceColor;
    };

    // 6 Faces mapped to the 6 Growth Metrics:
    // Red: Streak, Blue: Daily, Yellow: Campaign, Green: Shop, Orange: Weekly, Purple: Builder
    const faces: FaceDef[] = [
      {
        v: [4, 5, 6, 7],
        normal: { x: 0, y: 0, z: 1 },
        name: 'front',
        faceKey: 'red', // Daily Streak
        color: {
          base: '#991b1b',
          highlight: '#ef4444',
          shade: '#450a0a',
          glow: '#f87171',
          gem: '#fca5a5',
        },
      },
      {
        v: [7, 6, 2, 3],
        normal: { x: 0, y: 1, z: 0 },
        name: 'bottom',
        faceKey: 'blue', // Daily Puzzles
        color: {
          base: '#1e40af',
          highlight: '#3b82f6',
          shade: '#0f172a',
          glow: '#60a5fa',
          gem: '#bfdbfe',
        },
      },
      {
        v: [0, 1, 5, 4],
        normal: { x: 0, y: -1, z: 0 },
        name: 'top',
        faceKey: 'yellow', // Campaign
        color: {
          base: '#854d0e',
          highlight: '#eab308',
          shade: '#422006',
          glow: '#fde047',
          gem: '#fef08a',
        },
      },
      {
        v: [5, 1, 2, 6],
        normal: { x: 1, y: 0, z: 0 },
        name: 'right',
        faceKey: 'green', // Shop / Items
        color: {
          base: '#166534',
          highlight: '#22c55e',
          shade: '#052e16',
          glow: '#4ade80',
          gem: '#bbf7d0',
        },
      },
      {
        v: [0, 4, 7, 3],
        normal: { x: -1, y: 0, z: 0 },
        name: 'left',
        faceKey: 'orange', // Weekly Awards
        color: {
          base: '#9a3412',
          highlight: '#f97316',
          shade: '#431407',
          glow: '#fb923c',
          gem: '#fed7aa',
        },
      },
      {
        v: [1, 0, 3, 2],
        normal: { x: 0, y: 0, z: -1 },
        name: 'back',
        faceKey: 'purple', // Puzzle Builder
        color: {
          base: '#6b21a8',
          highlight: '#a855f7',
          shade: '#3b0764',
          glow: '#c084fc',
          gem: '#e9d5ff',
        },
      },
    ];

    const rotatePoint = (p: Point3D, yaw: number, pitch: number): Point3D => {
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const y1 = p.y * cosP - p.z * sinP;
      const z1 = p.y * sinP + p.z * cosP;

      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const x2 = p.x * cosY + z1 * sinY;
      const z2 = -p.x * sinY + z1 * cosY;

      return { x: x2, y: y1, z: z2 };
    };

    // True Perspective Camera Projection: foreshortening where closer points (+Z) are larger
    const project = (p: Point3D, width: number, height: number): Point2D => {
      const cameraDistance = 380;
      const fov = 380;
      const scale = fov / Math.max(10, cameraDistance - p.z);
      return {
        x: width / 2 + p.x * scale,
        y: height / 2 + p.y * scale,
      };
    };

    const render = () => {
      time += 0.02;

      // Inertia and auto-rotation
      if (!isDraggingRef.current) {
        rotationRef.current.yaw += velocityRef.current.yaw;
        rotationRef.current.pitch += velocityRef.current.pitch;
        velocityRef.current.yaw = velocityRef.current.yaw * 0.95 + 0.004 * 0.05;
        velocityRef.current.pitch = velocityRef.current.pitch * 0.95;
      }

      const yaw = rotationRef.current.yaw;
      const pitch = rotationRef.current.pitch;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Ambient Cosmic Dust in Space
      particlesRef.current.forEach((pt) => {
        pt.y -= pt.speed * 20;
        if (pt.y < -250) pt.y = 250;

        const rotatedPt = rotatePoint(pt, yaw * 0.3, pitch * 0.3);
        const screenPt = project(rotatedPt, width, height);

        const flicker = Math.sin(time * 3 + pt.x) * 0.2 + 0.8;
        ctx.fillStyle = '#67e8f9';
        ctx.globalAlpha = Math.max(0, Math.min(1, pt.alpha * flicker * 0.6));
        ctx.beginPath();
        ctx.arc(screenPt.x, screenPt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;

      // 2. Draw Floor Pedestal Shadow
      const floorY = cubeHalfSize * 1.55;
      const shadowCenter = project({ x: 0, y: floorY, z: 0 }, width, height);
      const shadowGrad = ctx.createRadialGradient(
        shadowCenter.x,
        shadowCenter.y,
        10,
        shadowCenter.x,
        shadowCenter.y,
        cubeHalfSize * 1.8
      );
      shadowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
      shadowGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.12)');
      shadowGrad.addColorStop(1, 'transparent');

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(shadowCenter.x, shadowCenter.y, cubeHalfSize * 1.6, cubeHalfSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = shadowGrad;
      ctx.fill();
      ctx.restore();

      // 3. Project all 8 cube vertices
      const transformedVerts = rawVertices.map((v) => rotatePoint(v, yaw, pitch));
      const projectedVerts = transformedVerts.map((v) => project(v, width, height));

      // 4. Calculate Face Depths and Normals
      const faceList = faces.map((face) => {
        const transformedNormal = rotatePoint(face.normal, yaw, pitch);
        const [i0, i1, i2, i3] = face.v;
        const v0 = transformedVerts[i0] ?? { x: 0, y: 0, z: 0 };
        const v1 = transformedVerts[i1] ?? { x: 0, y: 0, z: 0 };
        const v2 = transformedVerts[i2] ?? { x: 0, y: 0, z: 0 };
        const v3 = transformedVerts[i3] ?? { x: 0, y: 0, z: 0 };
        const centerZ = (v0.z + v1.z + v2.z + v3.z) / 4;

        return {
          ...face,
          normalZ: transformedNormal.z,
          normalY: transformedNormal.y,
          normalX: transformedNormal.x,
          centerZ,
        };
      });

      // Painter's Algorithm: sort faces ascending by depth (furthest -Z drawn first)
      faceList.sort((a, b) => a.centerZ - b.centerZ);

      // 5. Draw Cube Faces - Each Face is an Individual Growth Pillar!
      faceList.forEach((face) => {
        // Only draw visible faces facing towards camera (normal.z > 0)
        if (face.normalZ <= 0.05) return;

        const faceProgress = progressState.faces[face.faceKey] || {
          progressPercent: 0,
          tier: 0,
          hasRunes: false,
          hasGem: false,
          hasMasterGlyph: false,
          hasAscendedGlow: false,
          glowIntensity: 0.1,
        };

        const [i0, i1, i2, i3] = face.v;
        const p0 = projectedVerts[i0] ?? { x: 0, y: 0 };
        const p1 = projectedVerts[i1] ?? { x: 0, y: 0 };
        const p2 = projectedVerts[i2] ?? { x: 0, y: 0 };
        const p3 = projectedVerts[i3] ?? { x: 0, y: 0 };

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();

        // Calculate dynamic lighting from top-left
        const lightDot = Math.max(0.15, -face.normalY * 0.6 + face.normalX * 0.3 + face.normalZ * 0.5);
        const progressFactor = faceProgress.progressPercent / 100;

        // Base facet gradient: unawakened faces are subtle slate; awakened faces glow richly
        const faceGrad = ctx.createLinearGradient(p0.x, p0.y, p2.x, p2.y);
        if (progressFactor < 0.1) {
          // Dormant stone slate with slight tint
          faceGrad.addColorStop(0, '#1e293b');
          faceGrad.addColorStop(1, '#0f172a');
        } else if (lightDot > 0.6) {
          faceGrad.addColorStop(0, face.color.highlight);
          faceGrad.addColorStop(1, face.color.base);
        } else if (lightDot > 0.3) {
          faceGrad.addColorStop(0, face.color.base);
          faceGrad.addColorStop(1, face.color.shade);
        } else {
          faceGrad.addColorStop(0, face.color.shade);
          faceGrad.addColorStop(1, '#05070a');
        }

        ctx.fillStyle = faceGrad;
        ctx.fill();

        // Tier 1+ (>= 25%): Glowing Runic Border along Edges for THIS Face
        if (faceProgress.hasRunes) {
          ctx.strokeStyle = face.color.glow;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = face.color.glow;
          ctx.shadowBlur = 10 * faceProgress.glowIntensity;
          ctx.stroke();

          // Inscribed Inner Runic Circuit
          ctx.beginPath();
          const inset = 0.18;
          const ip0 = { x: p0.x + (p2.x - p0.x) * inset, y: p0.y + (p2.y - p0.y) * inset };
          const ip1 = { x: p1.x + (p3.x - p1.x) * inset, y: p1.y + (p3.y - p1.y) * inset };
          const ip2 = { x: p2.x + (p0.x - p2.x) * inset, y: p2.y + (p0.y - p2.y) * inset };
          const ip3 = { x: p3.x + (p1.x - p3.x) * inset, y: p3.y + (p1.y - p3.y) * inset };

          ctx.moveTo(ip0.x, ip0.y);
          ctx.lineTo(ip1.x, ip1.y);
          ctx.lineTo(ip2.x, ip2.y);
          ctx.lineTo(ip3.x, ip3.y);
          ctx.closePath();
          ctx.strokeStyle = `${face.color.glow}99`;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 6;
          ctx.stroke();
        }

        const centerX = (p0.x + p1.x + p2.x + p3.x) / 4;
        const centerY = (p0.y + p1.y + p2.y + p3.y) / 4;

        // Tier 2+ (>= 50%): Geometric Gemstone Facet Inlay in Center
        if (faceProgress.hasGem) {
          const gemPulse = Math.sin(time * 2 + face.normalZ) * 0.12 + 0.88;
          const gemSize = 0.26 * gemPulse;

          const gp0 = { x: centerX + (p0.x - centerX) * gemSize, y: centerY + (p0.y - centerY) * gemSize };
          const gp1 = { x: centerX + (p1.x - centerX) * gemSize, y: centerY + (p1.y - centerY) * gemSize };
          const gp2 = { x: centerX + (p2.x - centerX) * gemSize, y: centerY + (p2.y - centerY) * gemSize };
          const gp3 = { x: centerX + (p3.x - centerX) * gemSize, y: centerY + (p3.y - centerY) * gemSize };

          ctx.beginPath();
          ctx.moveTo(gp0.x, gp0.y);
          ctx.lineTo(gp1.x, gp1.y);
          ctx.lineTo(gp2.x, gp2.y);
          ctx.lineTo(gp3.x, gp3.y);
          ctx.closePath();

          ctx.fillStyle = face.color.gem;
          ctx.shadowColor = face.color.glow;
          ctx.shadowBlur = 14;
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Tier 3+ (>= 75%): Radiating Master Geometric Sigil Channels
        if (faceProgress.hasMasterGlyph) {
          ctx.strokeStyle = `${face.color.glow}cc`;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = face.color.glow;
          ctx.shadowBlur = 8;

          // Cross diagonals connecting center gem to inner corners
          const inset = 0.18;
          const ip0 = { x: p0.x + (p2.x - p0.x) * inset, y: p0.y + (p2.y - p0.y) * inset };
          const ip1 = { x: p1.x + (p3.x - p1.x) * inset, y: p1.y + (p3.y - p1.y) * inset };
          const ip2 = { x: p2.x + (p0.x - p2.x) * inset, y: p2.y + (p0.y - p2.y) * inset };
          const ip3 = { x: p3.x + (p1.x - p3.x) * inset, y: p3.y + (p1.y - p3.y) * inset };

          [ip0, ip1, ip2, ip3].forEach((corner) => {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(corner.x, corner.y);
            ctx.stroke();

            // Luminous node dots
            ctx.beginPath();
            ctx.arc(corner.x, corner.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          });
        }

        // Tier 4 (100% Mastery): Radiant Brilliant White Corner Lights on this Face
        if (faceProgress.hasAscendedGlow) {
          const whiteLight = '#ffffff';
          ctx.strokeStyle = whiteLight;
          ctx.lineWidth = 2;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 14;

          [p0, p1, p2, p3].forEach((corner) => {
            ctx.beginPath();
            ctx.arc(corner.x, corner.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = whiteLight;
            ctx.fill();
            ctx.stroke();
          });
        }

        ctx.restore();
      });

      // 6. Interactive Click Pulse Ripple
      if (pulseRef.current > 0) {
        const center = project({ x: 0, y: 0, z: 0 }, width, height);
        ctx.save();
        ctx.beginPath();
        ctx.arc(center.x, center.y, (1 - pulseRef.current) * 120 + 20, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3 * pulseRef.current;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = pulseRef.current;
        ctx.stroke();
        ctx.restore();
        pulseRef.current -= 0.03;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [progressState]);

  // Mouse Drag Handlers (Desktop Only)
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: clientX, y: clientY };
    velocityRef.current = { yaw: 0, pitch: 0 };
  };

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - lastMousePosRef.current.x;
    const deltaY = clientY - lastMousePosRef.current.y;

    rotationRef.current.yaw += deltaX * 0.012;
    rotationRef.current.pitch = Math.max(-1.1, Math.min(1.1, rotationRef.current.pitch - deltaY * 0.012));

    velocityRef.current = {
      yaw: deltaX * 0.008,
      pitch: -deltaY * 0.008,
    };

    lastMousePosRef.current = { x: clientX, y: clientY };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleClick = () => {
    pulseRef.current = 1.0;
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Tier & Overall Awakened Badge - Positioned cleanly above the 3D shape */}
      <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900/90 border border-white/15 backdrop-blur-md shadow-lg pointer-events-none whitespace-nowrap mb-2">
        <div className="w-2 h-2 rounded-full animate-pulse bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        <span className="text-[11px] font-black tracking-wider uppercase text-white font-sans">
          {progressState.tierInfo.name}
        </span>
        <span className="text-[10px] font-mono text-zinc-400">
          • {progressState.overallProgress}% Awakened
        </span>
      </div>

      {/* 3D Canvas Centerpiece (Touch-pass enabled on mobile for smooth scrolling) */}
      <div className="relative sm:cursor-grab sm:active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onClick={handleClick}
          onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onMouseUp={handlePointerUp}
          className="pointer-events-none sm:pointer-events-auto"
        />
      </div>

      {/* Progress Bar & Growth Chart Trigger */}
      <div className="w-full max-w-xs mt-1 flex flex-col items-center gap-1.5 px-3">
        <div className="w-full h-2 rounded-full bg-slate-800 border border-white/10 overflow-hidden relative shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-700 relative"
            style={{
              width: `${progressState.overallProgress}%`,
              background: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7)',
              boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
            }}
          />
        </div>

        <div className="flex items-center justify-between w-full text-[11px] font-mono text-zinc-400">
          <span>Tier {progressState.activeTier} of 4</span>
          {onInspectMilestones && (
            <button
              onClick={onInspectMilestones}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer hover:scale-105 transition-all active:scale-95"
            >
              Growth Chart ✦
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

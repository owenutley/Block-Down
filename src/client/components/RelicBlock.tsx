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

    const cubeHalfSize = 58; // Base half dimension of cube

    // 8 Base Vertices of the Obsidian Monolith Core
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
      gemHighlight: string;
      gemShade: string;
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
          gem: '#f87171',
          gemHighlight: '#fecaca',
          gemShade: '#7f1d1d',
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
          gem: '#60a5fa',
          gemHighlight: '#dbeafe',
          gemShade: '#172554',
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
          gem: '#fde047',
          gemHighlight: '#fef9c3',
          gemShade: '#713f12',
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
          gem: '#4ade80',
          gemHighlight: '#dcfce7',
          gemShade: '#14532d',
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
          gem: '#fb923c',
          gemHighlight: '#ffedd5',
          gemShade: '#7c2d12',
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
          gem: '#c084fc',
          gemHighlight: '#f3e8ff',
          gemShade: '#581c87',
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

    // Directional Light Vector for specular & 3D bevel shading
    const lightDir: Point3D = { x: -0.38, y: -0.68, z: 0.62 };
    const lightLen = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
    const normLightDir: Point3D = { x: lightDir.x / lightLen, y: lightDir.y / lightLen, z: lightDir.z / lightLen };

    // True Perspective Camera Projection with Levitation Bob Offset
    const project = (p: Point3D, width: number, height: number, hoverY: number = 0): Point2D => {
      const cameraDistance = 380;
      const fov = 380;
      const scale = fov / Math.max(10, cameraDistance - p.z);
      return {
        x: width / 2 + p.x * scale,
        y: height / 2 + (p.y + hoverY) * scale,
      };
    };

    const render = () => {
      time += 0.02;

      // Weightless Sine-Wave Levitation Bobbing & Subtle Breathing
      const hoverY = Math.sin(time * 1.8) * 5.5;
      const hoverPitch = Math.cos(time * 1.2) * 0.025;

      // Inertia and auto-rotation
      if (!isDraggingRef.current) {
        rotationRef.current.yaw += velocityRef.current.yaw;
        rotationRef.current.pitch += velocityRef.current.pitch;
        velocityRef.current.yaw = velocityRef.current.yaw * 0.95 + 0.004 * 0.05;
        velocityRef.current.pitch = velocityRef.current.pitch * 0.95;
      }

      const yaw = rotationRef.current.yaw;
      const pitch = rotationRef.current.pitch + hoverPitch;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Ambient Cosmic Dust Particles in Space
      particlesRef.current.forEach((pt) => {
        pt.y -= pt.speed * 20;
        if (pt.y < -250) pt.y = 250;

        const rotatedPt = rotatePoint(pt, yaw * 0.3, pitch * 0.3);
        const screenPt = project(rotatedPt, width, height, hoverY * 0.4);

        const flicker = Math.sin(time * 3 + pt.x) * 0.2 + 0.8;
        ctx.fillStyle = '#67e8f9';
        ctx.globalAlpha = Math.max(0, Math.min(1, pt.alpha * flicker * 0.65));
        ctx.beginPath();
        ctx.arc(screenPt.x, screenPt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;

      // 2. Dynamic Floor Pedestal Shadow (Contracts/expands with levitation hover)
      const floorY = cubeHalfSize * 1.6;
      const shadowCenter = project({ x: 0, y: floorY, z: 0 }, width, height, 0);
      const shadowScale = 1 - (hoverY / 30);
      const shadowGrad = ctx.createRadialGradient(
        shadowCenter.x,
        shadowCenter.y,
        10,
        shadowCenter.x,
        shadowCenter.y,
        cubeHalfSize * 1.8 * shadowScale
      );
      shadowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.32)');
      shadowGrad.addColorStop(0.4, 'rgba(99, 102, 241, 0.16)');
      shadowGrad.addColorStop(1, 'transparent');

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        shadowCenter.x,
        shadowCenter.y,
        cubeHalfSize * 1.65 * shadowScale,
        cubeHalfSize * 0.55 * shadowScale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = shadowGrad;
      ctx.fill();
      ctx.restore();

      // 3. Project 8 Base Vertices of the Monolith Core
      const transformedVerts = rawVertices.map((v) => rotatePoint(v, yaw, pitch));
      const projectedVerts = transformedVerts.map((v) => project(v, width, height, hoverY));

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
          v0,
          v1,
          v2,
          v3,
        };
      });

      // Painter's Algorithm: sort faces ascending by depth (furthest -Z drawn first)
      faceList.sort((a, b) => a.centerZ - b.centerZ);

      // 5. Draw Multi-Layered 3D Extruded Relic Faces (Full Back-to-Front Depth Rendering)
      faceList.forEach((face) => {
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

        const raw0 = rawVertices[i0] ?? { x: 0, y: 0, z: 0 };
        const raw1 = rawVertices[i1] ?? { x: 0, y: 0, z: 0 };
        const raw2 = rawVertices[i2] ?? { x: 0, y: 0, z: 0 };
        const raw3 = rawVertices[i3] ?? { x: 0, y: 0, z: 0 };

        // Normal lighting calculation
        const lightDot = Math.max(0.12, face.normalX * normLightDir.x + face.normalY * normLightDir.y + face.normalZ * normLightDir.z);

        ctx.save();

        // ════════════════════════════════════════════════════════════
        // LAYER 0: BASE OBSIDIAN FOUNDATION SLATE
        // ════════════════════════════════════════════════════════════
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();

        const baseGrad = ctx.createLinearGradient(p0.x, p0.y, p2.x, p2.y);
        if (lightDot > 0.6) {
          baseGrad.addColorStop(0, '#1e293b');
          baseGrad.addColorStop(1, '#090d16');
        } else if (lightDot > 0.3) {
          baseGrad.addColorStop(0, '#0f172a');
          baseGrad.addColorStop(1, '#04070e');
        } else {
          baseGrad.addColorStop(0, '#080d1a');
          baseGrad.addColorStop(1, '#020408');
        }
        ctx.fillStyle = baseGrad;
        ctx.fill();

        // Subtle base chamfer perimeter line
        ctx.strokeStyle = '#33415555';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Center 3D point calculations for extrusion
        const centerRaw: Point3D = {
          x: (raw0.x + raw1.x + raw2.x + raw3.x) / 4,
          y: (raw0.y + raw1.y + raw2.y + raw3.y) / 4,
          z: (raw0.z + raw1.z + raw2.z + raw3.z) / 4,
        };

        // ════════════════════════════════════════════════════════════
        // LAYER 1 (Tier 1+ >= 25%): STEPPED 3D RELIEF FACE PLATE
        // ════════════════════════════════════════════════════════════
        if (faceProgress.hasRunes) {
          const plateExtrude = 4.2; // Extrusion distance in 3D along normal
          const plateInset = 0.12;  // Inset ratio from edge

          const getSteppedVertex = (rawCorner: Point3D): Point3D => {
            const dx = rawCorner.x - centerRaw.x;
            const dy = rawCorner.y - centerRaw.y;
            const dz = rawCorner.z - centerRaw.z;
            return {
              x: centerRaw.x + dx * (1 - plateInset) + face.normal.x * plateExtrude,
              y: centerRaw.y + dy * (1 - plateInset) + face.normal.y * plateExtrude,
              z: centerRaw.z + dz * (1 - plateInset) + face.normal.z * plateExtrude,
            };
          };

          const spRaw0 = getSteppedVertex(raw0);
          const spRaw1 = getSteppedVertex(raw1);
          const spRaw2 = getSteppedVertex(raw2);
          const spRaw3 = getSteppedVertex(raw3);

          const spProj0 = project(rotatePoint(spRaw0, yaw, pitch), width, height, hoverY);
          const spProj1 = project(rotatePoint(spRaw1, yaw, pitch), width, height, hoverY);
          const spProj2 = project(rotatePoint(spRaw2, yaw, pitch), width, height, hoverY);
          const spProj3 = project(rotatePoint(spRaw3, yaw, pitch), width, height, hoverY);

          // Side Skirt Bevel 1: Top edge skirt
          const skirtGrad = ctx.createLinearGradient(p0.x, p0.y, spProj2.x, spProj2.y);
          skirtGrad.addColorStop(0, face.color.shade);
          skirtGrad.addColorStop(1, '#020408');

          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(spProj1.x, spProj1.y);
          ctx.lineTo(spProj0.x, spProj0.y);
          ctx.closePath();
          ctx.fillStyle = skirtGrad;
          ctx.fill();

          // Side Skirt Bevel 2: Right edge skirt
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(spProj2.x, spProj2.y);
          ctx.lineTo(spProj1.x, spProj1.y);
          ctx.closePath();
          ctx.fillStyle = skirtGrad;
          ctx.fill();

          // Side Skirt Bevel 3: Bottom edge skirt
          ctx.beginPath();
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(spProj3.x, spProj3.y);
          ctx.lineTo(spProj2.x, spProj2.y);
          ctx.closePath();
          ctx.fillStyle = skirtGrad;
          ctx.fill();

          // Side Skirt Bevel 4: Left edge skirt
          ctx.beginPath();
          ctx.moveTo(p3.x, p3.y);
          ctx.lineTo(p0.x, p0.y);
          ctx.lineTo(spProj0.x, spProj0.y);
          ctx.lineTo(spProj3.x, spProj3.y);
          ctx.closePath();
          ctx.fillStyle = skirtGrad;
          ctx.fill();

          // Top Face of Stepped Plate
          ctx.beginPath();
          ctx.moveTo(spProj0.x, spProj0.y);
          ctx.lineTo(spProj1.x, spProj1.y);
          ctx.lineTo(spProj2.x, spProj2.y);
          ctx.lineTo(spProj3.x, spProj3.y);
          ctx.closePath();

          const plateGrad = ctx.createLinearGradient(spProj0.x, spProj0.y, spProj2.x, spProj2.y);
          if (lightDot > 0.5) {
            plateGrad.addColorStop(0, face.color.highlight);
            plateGrad.addColorStop(1, face.color.base);
          } else if (lightDot > 0.25) {
            plateGrad.addColorStop(0, face.color.base);
            plateGrad.addColorStop(1, face.color.shade);
          } else {
            plateGrad.addColorStop(0, face.color.shade);
            plateGrad.addColorStop(1, '#05070f');
          }
          ctx.fillStyle = plateGrad;
          ctx.fill();

          // Luminous Runic Border along Stepped Plate Edges
          ctx.strokeStyle = face.color.glow;
          ctx.lineWidth = 2.2;
          ctx.shadowColor = face.color.glow;
          ctx.shadowBlur = 10 * faceProgress.glowIntensity;
          ctx.stroke();

          // Inscribed Inner Circuit
          const innerInset = 0.16;
          const ip0 = { x: spProj0.x + (spProj2.x - spProj0.x) * innerInset, y: spProj0.y + (spProj2.y - spProj0.y) * innerInset };
          const ip1 = { x: spProj1.x + (spProj3.x - spProj1.x) * innerInset, y: spProj1.y + (spProj3.y - spProj1.y) * innerInset };
          const ip2 = { x: spProj2.x + (spProj0.x - spProj2.x) * innerInset, y: spProj2.y + (spProj0.y - spProj2.y) * innerInset };
          const ip3 = { x: spProj3.x + (spProj1.x - spProj3.x) * innerInset, y: spProj3.y + (spProj1.y - spProj3.y) * innerInset };

          ctx.beginPath();
          ctx.moveTo(ip0.x, ip0.y);
          ctx.lineTo(ip1.x, ip1.y);
          ctx.lineTo(ip2.x, ip2.y);
          ctx.lineTo(ip3.x, ip3.y);
          ctx.closePath();
          ctx.strokeStyle = `${face.color.glow}aa`;
          ctx.lineWidth = 1.4;
          ctx.shadowBlur = 6;
          ctx.stroke();

          // ════════════════════════════════════════════════════════════
          // LAYER 2 (Tier 2+ >= 50%): 3D RAISED PRISMATIC GEMSTONE PYRAMID
          // ════════════════════════════════════════════════════════════
          if (faceProgress.hasGem) {
            const gemSize = 0.28;
            const gemHeight = 9.5; // Raised apex peak extrusion

            // Gem 4 base vertices on plate
            const getGemBaseVertex = (rawCorner: Point3D): Point3D => {
              const dx = rawCorner.x - centerRaw.x;
              const dy = rawCorner.y - centerRaw.y;
              const dz = rawCorner.z - centerRaw.z;
              return {
                x: centerRaw.x + dx * gemSize + face.normal.x * plateExtrude,
                y: centerRaw.y + dy * gemSize + face.normal.y * plateExtrude,
                z: centerRaw.z + dz * gemSize + face.normal.z * plateExtrude,
              };
            };

            const gpRaw0 = getGemBaseVertex(raw0);
            const gpRaw1 = getGemBaseVertex(raw1);
            const gpRaw2 = getGemBaseVertex(raw2);
            const gpRaw3 = getGemBaseVertex(raw3);

            // Apex Vertex (Extruded outward from center)
            const apexRaw: Point3D = {
              x: centerRaw.x + face.normal.x * (plateExtrude + gemHeight),
              y: centerRaw.y + face.normal.y * (plateExtrude + gemHeight),
              z: centerRaw.z + face.normal.z * (plateExtrude + gemHeight),
            };

            const gp0 = project(rotatePoint(gpRaw0, yaw, pitch), width, height, hoverY);
            const gp1 = project(rotatePoint(gpRaw1, yaw, pitch), width, height, hoverY);
            const gp2 = project(rotatePoint(gpRaw2, yaw, pitch), width, height, hoverY);
            const gp3 = project(rotatePoint(gpRaw3, yaw, pitch), width, height, hoverY);
            const apexProj = project(rotatePoint(apexRaw, yaw, pitch), width, height, hoverY);

            // 4 Triangles connecting base to apex
            const drawGemFacet = (pA: Point2D, pB: Point2D, isTop: boolean) => {
              ctx.beginPath();
              ctx.moveTo(pA.x, pA.y);
              ctx.lineTo(pB.x, pB.y);
              ctx.lineTo(apexProj.x, apexProj.y);
              ctx.closePath();

              ctx.fillStyle = isTop ? face.color.gemHighlight : face.color.gem;
              ctx.shadowColor = face.color.glow;
              ctx.shadowBlur = 12;
              ctx.fill();

              ctx.strokeStyle = isTop ? '#ffffff' : `${face.color.glow}dd`;
              ctx.lineWidth = 1;
              ctx.stroke();
            };

            // Top & Left facets catch light, Bottom & Right are shaded
            drawGemFacet(gp0, gp1, lightDot > 0.4);
            drawGemFacet(gp1, gp2, false);
            drawGemFacet(gp2, gp3, false);
            drawGemFacet(gp3, gp0, lightDot > 0.4);
          }

          // ════════════════════════════════════════════════════════════
          // LAYER 3 (Tier 3+ >= 75%): STEPPED CORNER CHEVRONS & FILIGREE FRAMING
          // ════════════════════════════════════════════════════════════
          if (faceProgress.hasMasterGlyph) {
            const centerX = (spProj0.x + spProj1.x + spProj2.x + spProj3.x) / 4;
            const centerY = (spProj0.y + spProj1.y + spProj2.y + spProj3.y) / 4;
            const corners = [spProj0, spProj1, spProj2, spProj3];

            ctx.strokeStyle = `${face.color.glow}ee`;
            ctx.lineWidth = 1.6;
            ctx.shadowColor = face.color.glow;
            ctx.shadowBlur = 8;

            corners.forEach((c, idx) => {
              const prev = corners[(idx + 3) % 4]!;
              const next = corners[(idx + 1) % 4]!;

              const toPrevX = prev.x - c.x;
              const toPrevY = prev.y - c.y;
              const toNextX = next.x - c.x;
              const toNextY = next.y - c.y;
              const toCenterX = centerX - c.x;
              const toCenterY = centerY - c.y;

              // 1. Primary Outer L-Bracket Chevron
              const arm1Len = 0.28;
              const p1x = c.x + toPrevX * arm1Len;
              const p1y = c.y + toPrevY * arm1Len;
              const p2x = c.x + toNextX * arm1Len;
              const p2y = c.y + toNextY * arm1Len;

              ctx.beginPath();
              ctx.moveTo(p1x, p1y);
              ctx.lineTo(c.x + toPrevX * 0.06, c.y + toPrevY * 0.06);
              ctx.lineTo(c.x + toNextX * 0.06, c.y + toNextY * 0.06);
              ctx.lineTo(p2x, p2y);
              ctx.stroke();

              // 2. Secondary Inset Stepped Chevron
              const insetFactor = 0.16;
              const icx = c.x + toCenterX * insetFactor;
              const icy = c.y + toCenterY * insetFactor;

              const arm2Len = 0.20;
              const ip1x = icx + toPrevX * arm2Len;
              const ip1y = icy + toPrevY * arm2Len;
              const ip2x = icx + toNextX * arm2Len;
              const ip2y = icy + toNextY * arm2Len;

              ctx.beginPath();
              ctx.moveTo(ip1x, ip1y);
              ctx.lineTo(icx, icy);
              ctx.lineTo(ip2x, ip2y);
              ctx.stroke();

              // 3. Luminous Diamond Pip at Stepped Chevron Vertex
              const pipSize = 2.8;
              ctx.beginPath();
              ctx.moveTo(icx, icy - pipSize);
              ctx.lineTo(icx + pipSize, icy);
              ctx.lineTo(icx, icy + pipSize);
              ctx.lineTo(icx - pipSize, icy);
              ctx.closePath();
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = '#ffffff';
              ctx.shadowBlur = 10;
              ctx.fill();
            });
          }

          // ════════════════════════════════════════════════════════════
          // LAYER 4 (Tier 4 100% Mastery): ASCENDED CROWN BRACKETS & NODES
          // ════════════════════════════════════════════════════════════
          if (faceProgress.hasAscendedGlow) {
            const crownWhite = '#ffffff';
            ctx.strokeStyle = crownWhite;
            ctx.lineWidth = 2.2;
            ctx.shadowColor = crownWhite;
            ctx.shadowBlur = 16;

            [spProj0, spProj1, spProj2, spProj3].forEach((corner) => {
              ctx.beginPath();
              ctx.arc(corner.x, corner.y, 4.5, 0, Math.PI * 2);
              ctx.fillStyle = crownWhite;
              ctx.fill();
              ctx.stroke();
            });
          }
        }

        ctx.restore();
      });

      // 6. Interactive Click Pulse Ripple
      if (pulseRef.current > 0) {
        const center = project({ x: 0, y: 0, z: 0 }, width, height, hoverY);
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


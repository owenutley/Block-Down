import { describe, it, expect } from 'vitest';
import { THEMES } from '../../shared/themes';
import { PortalDirection } from '../../shared/types';
import { ThemePortal } from './ThemePortal';

describe('ThemePortal Component', () => {
  it('is defined and is a valid functional component', () => {
    expect(ThemePortal).toBeDefined();
    expect(typeof ThemePortal).toBe('function');
  });

  it('renders without errors for every theme in THEMES across all 4 directions', () => {
    const directions: PortalDirection[] = ['Up', 'Right', 'Down', 'Left'];
    for (const theme of THEMES) {
      for (const dir of directions) {
        const portalElement = ThemePortal({
          themeId: theme.id,
          dir,
          colorHex: '#38bdf8',
          colorClass: 'text-sky-400',
          portalColor: 'blue',
        });
        expect(portalElement).toBeDefined();
        expect(portalElement.props).toBeDefined();
        expect(portalElement.props.style).toBeDefined();
      }
    }
  });

  it('computes correct CSS rotation transform for each portal direction', () => {
    const directions: { dir: PortalDirection; expectedDeg: number }[] = [
      { dir: 'Down', expectedDeg: 0 },
      { dir: 'Left', expectedDeg: 90 },
      { dir: 'Up', expectedDeg: 180 },
      { dir: 'Right', expectedDeg: 270 },
    ];

    for (const { dir, expectedDeg } of directions) {
      const portalElement = ThemePortal({
        themeId: 'steampunk',
        dir,
        colorHex: '#facc15',
        colorClass: 'text-yellow-400',
        portalColor: 'yellow',
      });
      expect(portalElement.props.style.transform).toBe(`rotate(${expectedDeg}deg)`);
    }
  });

  it('safely handles unknown or fallback theme IDs gracefully', () => {
    const portalElement = ThemePortal({
      themeId: 'unknown_theme_id',
      dir: 'Down',
      colorHex: '#ec4899',
      colorClass: 'text-pink-500',
      portalColor: 'red',
    });
    expect(portalElement).toBeDefined();
    expect(portalElement.props.style.transform).toBe('rotate(0deg)');
  });

  it('binds the pair colorClass and colorHex into the portal container and SVG elements', () => {
    const testColorHex = '#a855f7';
    const testColorClass = 'text-purple-500';
    const portalElement = ThemePortal({
      themeId: 'spooky',
      dir: 'Down',
      colorHex: testColorHex,
      colorClass: testColorClass,
      portalColor: 'purple',
    });

    expect(portalElement.props.className).toContain(testColorClass);
    expect(portalElement.props.style.transform).toBe('rotate(0deg)');

    // Verify SVG child exists
    const svgChild = portalElement.props.children;
    expect(svgChild).toBeDefined();
    expect(svgChild.type).toBe('svg');
    expect(svgChild.props.viewBox).toBe('0 0 100 100');
  });

  it('renders all 16 unique theme portal designs', () => {
    const themeIds = THEMES.map((t) => t.id);
    expect(themeIds).toHaveLength(16);

    for (const id of themeIds) {
      const el = ThemePortal({
        themeId: id,
        dir: 'Up',
        colorHex: '#22c55e',
        colorClass: 'text-green-500',
        portalColor: 'green',
      });
      expect(el).toBeDefined();
      const svg = el.props.children;
      expect(svg.props.children).toBeDefined();
    }
  });
});

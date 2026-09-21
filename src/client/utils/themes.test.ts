import { describe, it, expect } from 'vitest';
import { THEMES, ALL_SHAPE_IDS, DEFAULT_THEME_CONFIGS } from '../../shared/themes';
import { THEME_COLOR_PALETTES } from '../components/ThemeBoardRenderer';

describe('Themes and Shapes Configuration', () => {
  it('should have an entry in DEFAULT_THEME_CONFIGS for every theme in THEMES', () => {
    for (const theme of THEMES) {
      expect(DEFAULT_THEME_CONFIGS).toHaveProperty(theme.id);
    }
  });

  it('should map all blocks in DEFAULT_THEME_CONFIGS to valid shapes in ALL_SHAPE_IDS', () => {
    const shapeSet = new Set<string>(ALL_SHAPE_IDS);
    for (const config of Object.values(DEFAULT_THEME_CONFIGS)) {
      for (const blockConfig of Object.values(config)) {
        expect(shapeSet.has(blockConfig.shape)).toBe(true);
      }
    }
  });

  it('should configure Steampunk with wrench', () => {
    expect(DEFAULT_THEME_CONFIGS.steampunk['green-cross'].shape).toBe('wrench');
  });

  it('should configure Olympus with lightning bolt, spartan helmet, and greek amphora', () => {
    expect(DEFAULT_THEME_CONFIGS.olympus['yellow-crescent'].shape).toBe('lightning_bolt');
    expect(DEFAULT_THEME_CONFIGS.olympus['green-cross'].shape).toBe('spartan_helmet');
    expect(DEFAULT_THEME_CONFIGS.olympus['purple-circle'].shape).toBe('greek_amphora');
  });

  it('should configure Pirate with pirate skull', () => {
    expect(DEFAULT_THEME_CONFIGS.pirate['red-heart'].shape).toBe('pirate_skull');
  });

  it('should configure Cyber Synthwave with familiar 80s icons', () => {
    const synthConfig = DEFAULT_THEME_CONFIGS.synthwave;
    expect(synthConfig['red-heart'].shape).toBe('retro_gamepad');
    expect(synthConfig['blue-diamond'].shape).toBe('boombox');
    expect(synthConfig['yellow-crescent'].shape).toBe('retro_sunglasses');
    expect(synthConfig['purple-circle'].shape).toBe('floppy_disk');
    expect(synthConfig['green-cross'].shape).toBe('cassette_tape');
    expect(synthConfig['orange-square'].shape).toBe('retro_arcade_car');
  });

  it('should ensure high color distinction in Steampunk red, yellow, and orange', () => {
    const palette = THEME_COLOR_PALETTES.steampunk;
    expect(palette).toBeDefined();
    expect(palette?.red?.colorHex).toBe('#dc2626');
    expect(palette?.yellow?.colorHex).toBe('#facc15');
    expect(palette?.orange?.colorHex).toBe('#f97316');
    expect(palette?.red?.colorHex).not.toBe(palette?.yellow?.colorHex);
    expect(palette?.red?.colorHex).not.toBe(palette?.orange?.colorHex);
    expect(palette?.yellow?.colorHex).not.toBe(palette?.orange?.colorHex);
  });

  it('should ensure high color distinction in Olympus yellow and orange', () => {
    const palette = THEME_COLOR_PALETTES.olympus;
    expect(palette).toBeDefined();
    expect(palette?.yellow?.colorHex).toBe('#fde047');
    expect(palette?.orange?.colorHex).toBe('#ea580c');
    expect(palette?.yellow?.colorHex).not.toBe(palette?.orange?.colorHex);
  });

  it('should ensure high color distinction in Pirate blue and green', () => {
    const palette = THEME_COLOR_PALETTES.pirate;
    expect(palette).toBeDefined();
    expect(palette?.blue?.colorHex).toBe('#0284c7');
    expect(palette?.green?.colorHex).toBe('#10b981');
    expect(palette?.blue?.colorHex).not.toBe(palette?.green?.colorHex);
  });
});

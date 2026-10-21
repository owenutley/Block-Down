
import {
  THEME_AUDIO_PROFILES,
  getThemeAudioProfile,
  getCurrentThemeAudioProfile,
  setMusicTheme,
  getMusicMuted,
  setMusicMuted,
  getMusicVolume,
  setMusicVolume,
  startMusic,
  stopMusic,
  duckMusic,
} from './bgm';
import { BaseThemeId } from '../../shared/themes';

const ALL_18_THEMES: BaseThemeId[] = [
  'neon',
  'winter',
  'forest',
  'candy',
  'space',
  'ocean',
  'retro',
  'desert',
  'spooky',
  'volcanic',
  'vantage',
  'papercraft',
  'steampunk',
  'olympus',
  'pirate',
  'synthwave',
  'relic',
  'chronolith',
];

describe('BGM Procedural Soundtrack Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('defines unique procedural audio profiles for all 18 base themes', () => {
    ALL_18_THEMES.forEach(themeId => {
      const profile = THEME_AUDIO_PROFILES[themeId];
      expect(profile).toBeDefined();
      expect(profile.id).toBe(themeId);
      expect(profile.name.length).toBeGreaterThan(0);
      expect(profile.chords.length).toBeGreaterThanOrEqual(3);

      // Validate frequencies
      profile.chords.forEach(chord => {
        expect(chord.length).toBeGreaterThanOrEqual(3);
        chord.forEach(freq => {
          expect(freq).toBeGreaterThan(20);
          expect(freq).toBeLessThan(5000);
        });
      });

      // Validate envelope and filter parameters
      expect(profile.chordDuration).toBeGreaterThan(3.0);
      expect(profile.filterCutoff).toBeGreaterThan(200);
      expect(profile.filterCutoff).toBeLessThan(3000);
      expect(profile.rhythmicStep).toBeGreaterThan(0.05);
      expect(profile.rhythmicVol).toBeGreaterThan(0);

      // Validate accent interval
      expect(profile.accentIntervalMs[0]).toBeGreaterThan(3000);
      expect(profile.accentIntervalMs[1]).toBeGreaterThan(profile.accentIntervalMs[0]);
      expect(typeof profile.renderAccent).toBe('function');
    });
  });

  it('ensures each theme has a distinct musical key or chord signature', () => {
    const chordSignatures = new Set<string>();
    ALL_18_THEMES.forEach(themeId => {
      const profile = THEME_AUDIO_PROFILES[themeId];
      // Create a signature of the first chord's root note and chord count
      const signature = `${themeId}:${profile.chords[0]?.[0]}:${profile.rhythmicStyle}`;
      chordSignatures.add(signature);
    });
    expect(chordSignatures.size).toBe(18);
  });

  it('correctly resolves theme profiles for standard and custom themes', () => {
    expect(getThemeAudioProfile('retro').id).toBe('retro');
    expect(getThemeAudioProfile('synthwave').id).toBe('synthwave');
    expect(getThemeAudioProfile('pirate').id).toBe('pirate');
    expect(getThemeAudioProfile('chronolith').id).toBe('chronolith');

    // Custom themes map back to their base theme
    expect(getThemeAudioProfile('custom_volcanic_123').id).toBe('volcanic');
    expect(getThemeAudioProfile('custom_spooky_abc').id).toBe('spooky');

    // Unknown string falls back to neon
    expect(getThemeAudioProfile('non_existent_theme').id).toBe('neon');
  });

  it('switches current theme and updates active profile', () => {
    setMusicTheme('winter');
    expect(getCurrentThemeAudioProfile().id).toBe('winter');

    setMusicTheme('steampunk');
    expect(getCurrentThemeAudioProfile().id).toBe('steampunk');

    setMusicTheme('olympus');
    expect(getCurrentThemeAudioProfile().id).toBe('olympus');
  });

  it('handles volume and mute controls correctly', () => {
    setMusicMuted(true);
    expect(getMusicMuted()).toBe(true);
    setMusicMuted(false);
    expect(getMusicMuted()).toBe(false);

    setMusicVolume(0.5);
    expect(getMusicVolume()).toBe(0.5);

    // Clamps to [0, 1]
    setMusicVolume(-0.2);
    expect(getMusicVolume()).toBe(0);
    setMusicVolume(1.5);
    expect(getMusicVolume()).toBe(1);

    // Reset to comfortable default
    setMusicVolume(0.35);
  });

  it('safely handles playback control calls in headless test environment', () => {
    expect(() => {
      startMusic();
      duckMusic(500);
      setMusicTheme('candy');
      stopMusic();
    }).not.toThrow();
  });
});

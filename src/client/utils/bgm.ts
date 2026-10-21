import { getAudioContext } from './audio';
import { BaseThemeId, getBaseThemeId } from '../../shared/themes';

export type RhythmicStyle =
  | 'chiptune'
  | 'synthwave_bass'
  | 'neon_glitch'
  | 'crystal_plucks'
  | 'marimba_taps'
  | 'music_box'
  | 'stardust_echoes'
  | 'whale_song'
  | 'sea_shanty'
  | 'oud_plucks'
  | 'relic_gongs'
  | 'theremin_lead'
  | 'geothermal_thud'
  | 'mountain_flute'
  | 'paper_plucks'
  | 'clockwork_ticks'
  | 'harp_glissando'
  | 'prismatic_arps'
  | 'none';

export type ThemeAudioProfile = {
  id: BaseThemeId;
  name: string;
  chords: number[][];
  chordDuration: number;
  overlap: number;
  padWaveform: OscillatorType;
  padAttack: number;
  padRelease: number;
  filterCutoff: number;
  filterQ?: number;
  rhythmicStyle: RhythmicStyle;
  rhythmicStep: number;
  rhythmicVol: number;
  accentIntervalMs: [number, number];
  renderAccent: (ctx: AudioContext, now: number, filter: BiquadFilterNode) => void;
};

// Backwards compatibility alias
export type BgmThemeStyle = BaseThemeId;

type ChordVoice = {
  osc: OscillatorNode;
  gain: GainNode;
  stopAt: number;
};

// Safe localStorage persistence keys
const STORAGE_MUTED_KEY = 'block_down_bgm_muted';
const STORAGE_VOL_KEY = 'block_down_bgm_volume';

let isMusicMuted = false;
let musicVolume = 0.35; // Comfortable ambient background volume

if (typeof window !== 'undefined') {
  try {
    const savedMuted = localStorage.getItem(STORAGE_MUTED_KEY);
    if (savedMuted !== null) {
      isMusicMuted = savedMuted === 'true';
    }
    const savedVol = localStorage.getItem(STORAGE_VOL_KEY);
    if (savedVol !== null) {
      const parsed = parseFloat(savedVol);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        musicVolume = parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading BGM preferences from localStorage:', e);
  }
}

// Master Audio Nodes
let masterBgmGain: GainNode | null = null;
let masterFilter: BiquadFilterNode | null = null;
let padFilter: BiquadFilterNode | null = null;
let melodyFilter: BiquadFilterNode | null = null;

let isRunning = false;
let currentBaseTheme: BaseThemeId = 'neon';
let activeVoices: ChordVoice[] = [];
let loopTimeoutId: ReturnType<typeof setTimeout> | null = null;
let accentTimeoutId: ReturnType<typeof setTimeout> | null = null;
let isDucked = false;
let chordIndex = 0;

// Clean up finished voices from tracking
const pruneFinishedVoices = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  activeVoices = activeVoices.filter(v => {
    if (v.stopAt <= now) {
      try {
        v.osc.disconnect();
        v.gain.disconnect();
      } catch {
        // Node may already be disconnected
      }
      return false;
    }
    return true;
  });
};

// ---------------------------------------------------------------------------
// 18 INDIVIDUAL THEME AUDIO PROFILES
// ---------------------------------------------------------------------------

export const THEME_AUDIO_PROFILES: Record<BaseThemeId, ThemeAudioProfile> = {
  // 1. Retro Arcade
  retro: {
    id: 'retro',
    name: 'Retro Arcade',
    chords: [
      [130.81, 196.00, 261.63, 329.63], // C major
      [98.00, 146.83, 196.00, 246.94],  // G major
      [110.00, 164.81, 220.00, 261.63], // A minor
      [87.31, 130.81, 174.61, 220.00],  // F major
    ],
    chordDuration: 5.5,
    overlap: 0.3,
    padWaveform: 'triangle',
    padAttack: 0.15,
    padRelease: 0.35,
    filterCutoff: 1800,
    filterQ: 0.5,
    rhythmicStyle: 'chiptune',
    rhythmicStep: 0.18,
    rhythmicVol: 0.05,
    accentIntervalMs: [5000, 8000],
    renderAccent: (ctx, now, filter) => {
      // 8-bit coin jump blip (two-tone frequency hop)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 0.25);
    },
  },

  // 2. Cyber Synthwave
  synthwave: {
    id: 'synthwave',
    name: 'Cyber Synthwave',
    chords: [
      [87.31, 130.81, 174.61, 207.65, 311.13], // Fm9
      [69.30, 103.83, 138.59, 174.61, 261.63], // Dbmaj7
      [77.78, 116.54, 155.56, 196.00, 277.18], // Eb7
      [65.41, 98.00, 130.81, 164.81, 233.08],  // C7
    ],
    chordDuration: 6.2,
    overlap: 0.5,
    padWaveform: 'sawtooth',
    padAttack: 1.2,
    padRelease: 1.5,
    filterCutoff: 1100,
    filterQ: 2.2,
    rhythmicStyle: 'synthwave_bass',
    rhythmicStep: 0.13, // 16th notes ~116 BPM
    rhythmicVol: 0.055,
    accentIntervalMs: [7000, 10000],
    renderAccent: (ctx, now, filter) => {
      // Resonant laser tom sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.16);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 0.2);
    },
  },

  // 3. Neon Cyber
  neon: {
    id: 'neon',
    name: 'Neon Cyber',
    chords: [
      [73.42, 110.00, 146.83, 220.00, 293.66], // Dm
      [58.27, 87.31, 116.54, 174.61, 233.08],  // Bb
      [98.00, 146.83, 196.00, 233.08, 293.66], // Gm
      [55.00, 82.41, 110.00, 164.81, 220.00],  // A7
    ],
    chordDuration: 5.8,
    overlap: 0.4,
    padWaveform: 'square',
    padAttack: 1.0,
    padRelease: 1.4,
    filterCutoff: 950,
    filterQ: 2.0,
    rhythmicStyle: 'neon_glitch',
    rhythmicStep: 0.22,
    rhythmicVol: 0.045,
    accentIntervalMs: [6000, 9000],
    renderAccent: (ctx, now, filter) => {
      // Holographic modem data packet burst
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1760, now);
      osc.frequency.setValueAtTime(2637, now + 0.04);
      osc.frequency.setValueAtTime(1318, now + 0.08);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 0.15);
    },
  },

  // 4. Winter Wonderland
  winter: {
    id: 'winter',
    name: 'Winter Wonderland',
    chords: [
      [146.83, 220.00, 277.18, 329.63, 369.99], // Dmaj9
      [92.50, 138.59, 220.00, 329.63, 369.99],  // F#m7
      [123.47, 185.00, 293.66, 329.63, 440.00], // Bm11
      [98.00, 146.83, 246.94, 369.99, 440.00],  // Gmaj7
    ],
    chordDuration: 6.8,
    overlap: 1.4,
    padWaveform: 'sine',
    padAttack: 1.8,
    padRelease: 2.2,
    filterCutoff: 1200,
    filterQ: 0.6,
    rhythmicStyle: 'crystal_plucks',
    rhythmicStep: 0.32,
    rhythmicVol: 0.05,
    accentIntervalMs: [6500, 9500],
    renderAccent: (ctx, now, filter) => {
      // Glacial frost crackle / crystal chime sprinkle
      const freqs = [1760.00, 2349.32, 2793.83];
      freqs.forEach((freq, idx) => {
        const stepTime = now + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, stepTime);

        gain.gain.setValueAtTime(0.0001, stepTime);
        gain.gain.linearRampToValueAtTime(0.035, stepTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, stepTime + 1.2);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(stepTime);
        osc.stop(stepTime + 1.3);
      });
    },
  },

  // 5. Enchanted Forest
  forest: {
    id: 'forest',
    name: 'Enchanted Forest',
    chords: [
      [98.00, 146.83, 246.94, 369.99, 440.00], // Gmaj7
      [130.81, 196.00, 293.66, 329.63, 392.00], // Cadd9
      [82.41, 123.47, 196.00, 293.66, 369.99],  // Em9
      [123.47, 185.00, 293.66, 440.00, 493.88], // Bm7
    ],
    chordDuration: 6.5,
    overlap: 1.2,
    padWaveform: 'triangle',
    padAttack: 1.5,
    padRelease: 1.8,
    filterCutoff: 1100,
    filterQ: 0.8,
    rhythmicStyle: 'marimba_taps',
    rhythmicStep: 0.28,
    rhythmicVol: 0.055,
    accentIntervalMs: [6500, 9500],
    renderAccent: (ctx, now, filter) => {
      // Hollow bamboo knocks (two-tone wood strike)
      [480, 640].forEach((freq, idx) => {
        const t = now + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + 0.04);

        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + 0.14);
      });
    },
  },

  // 6. Candy Land
  candy: {
    id: 'candy',
    name: 'Candy Land',
    chords: [
      [174.61, 261.63, 329.63, 440.00], // Fmaj7
      [116.54, 174.61, 293.66, 440.00], // Bbmaj7
      [130.81, 196.00, 329.63, 466.16], // C7
      [146.83, 220.00, 349.23, 523.25], // Dm7
    ],
    chordDuration: 5.6,
    overlap: 0.5,
    padWaveform: 'sine',
    padAttack: 0.6,
    padRelease: 1.0,
    filterCutoff: 1800,
    filterQ: 0.7,
    rhythmicStyle: 'music_box',
    rhythmicStep: 0.22,
    rhythmicVol: 0.048,
    accentIntervalMs: [5500, 8500],
    renderAccent: (ctx, now, filter) => {
      // Ascending 5-note sugar fairy wand glissando
      const notes = [1046.50, 1174.66, 1318.51, 1567.98, 2093.00];
      notes.forEach((freq, idx) => {
        const stepTime = now + idx * 0.05;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, stepTime);

        gain.gain.setValueAtTime(0.035, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, stepTime + 0.28);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(stepTime);
        osc.stop(stepTime + 0.3);
      });
    },
  },

  // 7. Deep Space
  space: {
    id: 'space',
    name: 'Deep Space',
    chords: [
      [77.78, 116.54, 174.61, 185.00, 277.18],  // Ebm9
      [61.74, 92.50, 155.56, 233.08, 349.23],   // Bmaj7#11
      [103.83, 155.56, 233.08, 246.94, 369.99], // Abm9
      [69.30, 103.83, 174.61, 246.94, 311.13],  // Db7
    ],
    chordDuration: 7.5,
    overlap: 2.0,
    padWaveform: 'sine',
    padAttack: 2.5,
    padRelease: 2.8,
    filterCutoff: 750,
    filterQ: 1.4,
    rhythmicStyle: 'stardust_echoes',
    rhythmicStep: 0.55,
    rhythmicVol: 0.04,
    accentIntervalMs: [7500, 11000],
    renderAccent: (ctx, now, filter) => {
      // Sputnik satellite telemetry pulsar beacon ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760.00, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 1.7);
    },
  },

  // 8. Abyssal Ocean
  ocean: {
    id: 'ocean',
    name: 'Abyssal Ocean',
    chords: [
      [65.41, 98.00, 155.56, 233.08, 293.66],  // Cm9
      [87.31, 130.81, 207.65, 311.13, 392.00], // Fm9
      [103.83, 155.56, 261.63, 392.00, 523.25],// Abmaj7
      [98.00, 146.83, 261.63, 349.23, 392.00], // Gsus4
    ],
    chordDuration: 7.2,
    overlap: 1.8,
    padWaveform: 'sine',
    padAttack: 2.0,
    padRelease: 2.4,
    filterCutoff: 650,
    filterQ: 2.0,
    rhythmicStyle: 'whale_song',
    rhythmicStep: 0.9,
    rhythmicVol: 0.045,
    accentIntervalMs: [7000, 10500],
    renderAccent: (ctx, now, filter) => {
      // Submarine sonar ping (crisp high-Q pure sine ping echoing into the abyss)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400.00, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 2.3);
    },
  },

  // 9. Pirate Cove
  pirate: {
    id: 'pirate',
    name: 'Pirate Cove',
    chords: [
      [73.42, 110.00, 146.83, 174.61, 220.00], // Dm
      [65.41, 98.00, 130.81, 164.81, 196.00],  // C
      [58.27, 87.31, 116.54, 146.83, 174.61],  // Bb
      [55.00, 82.41, 110.00, 138.59, 196.00],  // A7
    ],
    chordDuration: 5.6,
    overlap: 0.4,
    padWaveform: 'sawtooth',
    padAttack: 0.5,
    padRelease: 0.7,
    filterCutoff: 1000,
    filterQ: 1.4,
    rhythmicStyle: 'sea_shanty',
    rhythmicStep: 0.26, // 6/8 swing meter
    rhythmicVol: 0.05,
    accentIntervalMs: [6000, 9000],
    renderAccent: (ctx, now, filter) => {
      // Weathered ship bronze bell strike
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 1.9);
    },
  },

  // 10. Desert Oasis
  desert: {
    id: 'desert',
    name: 'Desert Oasis',
    chords: [
      [82.41, 123.47, 164.81, 207.65, 293.66], // E Hijaz (Phrygian Dominant)
      [87.31, 130.81, 220.00, 246.94, 329.63], // Fmaj7#11
      [73.42, 110.00, 174.61, 261.63, 293.66], // Dm
      [82.41, 123.47, 164.81, 207.65, 246.94], // E5
    ],
    chordDuration: 6.0,
    overlap: 0.8,
    padWaveform: 'triangle',
    padAttack: 1.1,
    padRelease: 1.4,
    filterCutoff: 1200,
    filterQ: 1.6,
    rhythmicStyle: 'oud_plucks',
    rhythmicStep: 0.24,
    rhythmicVol: 0.05,
    accentIntervalMs: [6500, 9500],
    renderAccent: (ctx, now, filter) => {
      // Shimmering brass finger cymbals (zill strike)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(3200, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 0.38);
    },
  },

  // 11. Ancient Relic
  relic: {
    id: 'relic',
    name: 'Ancient Relic',
    chords: [
      [110.00, 164.81, 196.00, 261.63, 329.63], // Am7
      [82.41, 123.47, 196.00, 293.66, 369.99],  // Em9
      [92.50, 130.81, 164.81, 220.00, 261.63],  // F#m7b5
      [87.31, 146.83, 220.00, 293.66, 349.23],  // Dm/F
    ],
    chordDuration: 7.2,
    overlap: 1.8,
    padWaveform: 'sine',
    padAttack: 2.0,
    padRelease: 2.2,
    filterCutoff: 850,
    filterQ: 1.8,
    rhythmicStyle: 'relic_gongs',
    rhythmicStep: 1.2,
    rhythmicVol: 0.048,
    accentIntervalMs: [8000, 12000],
    renderAccent: (ctx, now, filter) => {
      // Sacred Tibetan singing bowl sustain
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(432.00, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 2.6);
    },
  },

  // 12. Spooky Halloween
  spooky: {
    id: 'spooky',
    name: 'Spooky Halloween',
    chords: [
      [65.41, 98.00, 155.56, 261.63],          // Cm
      [92.50, 130.81, 155.56, 220.00],         // F#dim7
      [87.31, 130.81, 146.83, 207.65],         // Fm6
      [49.00, 73.42, 174.61, 207.65, 246.94],  // G7b9
    ],
    chordDuration: 6.0,
    overlap: 0.8,
    padWaveform: 'sawtooth',
    padAttack: 0.8,
    padRelease: 1.1,
    filterCutoff: 850,
    filterQ: 1.4,
    rhythmicStyle: 'theremin_lead',
    rhythmicStep: 0.38,
    rhythmicVol: 0.045,
    accentIntervalMs: [6000, 9000],
    renderAccent: (ctx, now, filter) => {
      // Midnight grandfather clock tower chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(370.00, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 2.1);
    },
  },

  // 13. Volcanic Magma
  volcanic: {
    id: 'volcanic',
    name: 'Volcanic Magma',
    chords: [
      [36.71, 55.00, 73.42, 110.00],  // Low D1-A1 primal fifth power drone
      [58.27, 87.31, 116.54, 146.83], // Bb5 tension
      [49.00, 73.42, 116.54, 146.83], // G5
      [69.30, 103.83, 138.59, 164.81],// C#5 tension
    ],
    chordDuration: 6.5,
    overlap: 1.2,
    padWaveform: 'sawtooth',
    padAttack: 1.4,
    padRelease: 1.6,
    filterCutoff: 550,
    filterQ: 2.5,
    rhythmicStyle: 'geothermal_thud',
    rhythmicStep: 0.75,
    rhythmicVol: 0.055,
    accentIntervalMs: [7000, 10000],
    renderAccent: (ctx, now, filter) => {
      // Volcanic steam geyser release & rumble sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 0.45);
    },
  },

  // 14. High Vantage
  vantage: {
    id: 'vantage',
    name: 'High Vantage',
    chords: [
      [130.81, 196.00, 293.66, 329.63, 493.88], // Cmaj9
      [123.47, 196.00, 293.66, 392.00],         // G/B
      [110.00, 164.81, 261.63, 392.00],         // Am7
      [87.31, 130.81, 220.00, 329.63],          // Fmaj7
    ],
    chordDuration: 6.5,
    overlap: 1.2,
    padWaveform: 'triangle',
    padAttack: 1.2,
    padRelease: 1.6,
    filterCutoff: 1300,
    filterQ: 0.7,
    rhythmicStyle: 'mountain_flute',
    rhythmicStep: 0.35,
    rhythmicVol: 0.045,
    accentIntervalMs: [7500, 11000],
    renderAccent: (ctx, now, filter) => {
      // Distant mountain echo flutter / hawk whistle
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1174.66, now); // D6
      osc.frequency.linearRampToValueAtTime(1318.51, now + 0.12); // E6

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 1.3);
    },
  },

  // 15. Paper Craftbook
  papercraft: {
    id: 'papercraft',
    name: 'Paper Craftbook',
    chords: [
      [130.81, 196.00, 246.94, 329.63], // Cmaj7
      [110.00, 164.81, 196.00, 246.94], // Am9
      [146.83, 220.00, 261.63, 349.23], // Dm7
      [98.00, 146.83, 174.61, 246.94],  // G7
    ],
    chordDuration: 5.6,
    overlap: 0.8,
    padWaveform: 'triangle',
    padAttack: 0.9,
    padRelease: 1.2,
    filterCutoff: 1000,
    filterQ: 0.8,
    rhythmicStyle: 'paper_plucks',
    rhythmicStep: 0.28,
    rhythmicVol: 0.048,
    accentIntervalMs: [5500, 8500],
    renderAccent: (ctx, now, filter) => {
      // Crisp craft scissor snip / paper fold crease click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.03);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 0.07);
    },
  },

  // 16. Steampunk Foundry
  steampunk: {
    id: 'steampunk',
    name: 'Steampunk Foundry',
    chords: [
      [116.54, 174.61, 233.08, 277.18], // Bbm
      [92.50, 138.59, 185.00, 233.08],  // Gb
      [103.83, 155.56, 207.65, 261.63], // Ab
      [87.31, 130.81, 174.61, 207.65],  // Fm
    ],
    chordDuration: 5.8,
    overlap: 0.6,
    padWaveform: 'sawtooth',
    padAttack: 0.7,
    padRelease: 1.0,
    filterCutoff: 1100,
    filterQ: 1.6,
    rhythmicStyle: 'clockwork_ticks',
    rhythmicStep: 0.24,
    rhythmicVol: 0.045,
    accentIntervalMs: [6500, 9500],
    renderAccent: (ctx, now, filter) => {
      // High-pressure steam valve release burst
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 0.3);
    },
  },

  // 17. Divine Olympus
  olympus: {
    id: 'olympus',
    name: 'Divine Olympus',
    chords: [
      [146.83, 220.00, 277.18, 369.99], // Dmaj7
      [98.00, 146.83, 185.00, 277.18],  // Gmaj7#11
      [110.00, 164.81, 220.00, 277.18], // A
      [123.47, 185.00, 246.94, 293.66], // Bm7
    ],
    chordDuration: 6.2,
    overlap: 1.0,
    padWaveform: 'sawtooth',
    padAttack: 1.1,
    padRelease: 1.4,
    filterCutoff: 1400,
    filterQ: 1.0,
    rhythmicStyle: 'harp_glissando',
    rhythmicStep: 0.15,
    rhythmicVol: 0.045,
    accentIntervalMs: [7000, 10500],
    renderAccent: (ctx, now, filter) => {
      // Heavenly angelic harp flourish / divine bell chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1760.00, now); // A6
      osc.frequency.setValueAtTime(2217.46, now + 0.08); // C#7

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 1.9);
    },
  },

  // 18. Chronolith Ascended
  chronolith: {
    id: 'chronolith',
    name: 'Chronolith Ascended',
    chords: [
      [123.47, 185.00, 277.18, 293.66, 440.00], // Bm9
      [98.00, 146.83, 246.94, 369.99, 440.00],  // Gmaj9
      [92.50, 138.59, 220.00, 246.94, 329.63],  // F#m11
      [82.41, 123.47, 196.00, 293.66, 440.00],  // Em9
    ],
    chordDuration: 6.8,
    overlap: 1.4,
    padWaveform: 'sine',
    padAttack: 1.8,
    padRelease: 2.2,
    filterCutoff: 1200,
    filterQ: 1.4,
    rhythmicStyle: 'prismatic_arps',
    rhythmicStep: 0.17,
    rhythmicVol: 0.045,
    accentIntervalMs: [7500, 11500],
    renderAccent: (ctx, now, filter) => {
      // Living starlight rune chime / temporal reverse swell
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1479.98, now); // F#6
      osc.frequency.exponentialRampToValueAtTime(1975.53, now + 0.2); // B6

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 1.9);
    },
  },
};

export const getThemeAudioProfile = (themeId: string): ThemeAudioProfile => {
  const baseId = getBaseThemeId(themeId);
  return THEME_AUDIO_PROFILES[baseId] || THEME_AUDIO_PROFILES.neon;
};

export const getCurrentThemeAudioProfile = (): ThemeAudioProfile => {
  return THEME_AUDIO_PROFILES[currentBaseTheme] || THEME_AUDIO_PROFILES.neon;
};

// ---------------------------------------------------------------------------
// MASTER AUDIO GRAPH SETUP
// ---------------------------------------------------------------------------

const setupBgmNodes = (ctx: AudioContext) => {
  if (!masterBgmGain || !masterFilter || !padFilter || !melodyFilter) {
    masterBgmGain = ctx.createGain();
    masterFilter = ctx.createBiquadFilter();
    padFilter = ctx.createBiquadFilter();
    melodyFilter = ctx.createBiquadFilter();

    masterFilter.type = 'lowpass';
    masterFilter.frequency.setValueAtTime(6500, ctx.currentTime);
    masterFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(1050, ctx.currentTime);
    padFilter.Q.setValueAtTime(0.8, ctx.currentTime);

    melodyFilter.type = 'lowpass';
    melodyFilter.frequency.setValueAtTime(4500, ctx.currentTime);
    melodyFilter.Q.setValueAtTime(0.8, ctx.currentTime);

    padFilter.connect(masterFilter);
    melodyFilter.connect(masterFilter);
    masterFilter.connect(masterBgmGain);
    masterBgmGain.connect(ctx.destination);

    const targetVol = isMusicMuted ? 0 : musicVolume;
    masterBgmGain.gain.setValueAtTime(targetVol, ctx.currentTime);
  }
  return { masterBgmGain, padFilter, melodyFilter };
};

// ---------------------------------------------------------------------------
// RHYTHMIC / ARPEGGIATOR / BASSLINE ENGINES
// ---------------------------------------------------------------------------

const renderRhythmicPattern = (
  ctx: AudioContext,
  profile: ThemeAudioProfile,
  chord: number[],
  startTime: number,
  duration: number,
  filter: BiquadFilterNode
) => {
  const style = profile.rhythmicStyle;
  if (style === 'none' || chord.length === 0) return;

  const stepTime = profile.rhythmicStep;
  const steps = Math.floor(duration / stepTime);
  const rootFreq = chord[0] || 130.81;

  switch (style) {
    case 'chiptune': {
      // 8-bit walking bassline + rapid alternating arpeggio
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(rootFreq, startTime);

      bassGain.gain.setValueAtTime(0.0001, startTime);
      bassGain.gain.linearRampToValueAtTime(0.065, startTime + 0.12);
      bassGain.gain.setValueAtTime(0.065, startTime + duration - 0.25);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      bassOsc.connect(bassGain);
      bassGain.connect(filter);
      bassOsc.start(startTime);
      bassOsc.stop(startTime + duration + 0.05);
      activeVoices.push({ osc: bassOsc, gain: bassGain, stopAt: startTime + duration + 0.05 });

      for (let s = 0; s < steps; s++) {
        const t = startTime + s * stepTime;
        const noteIdx = s % (chord.length * 2 - 2 || 1);
        const targetIdx = noteIdx < chord.length ? noteIdx : (chord.length * 2 - 2) - noteIdx;
        const freq = (chord[targetIdx] || rootFreq) * 2;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(profile.rhythmicVol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + stepTime * 0.9);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + stepTime);
        activeVoices.push({ osc, gain, stopAt: t + stepTime });
      }
      break;
    }

    case 'synthwave_bass': {
      // Rolling 16th-note saw bass pulse (Miami nights)
      for (let s = 0; s < steps; s++) {
        const t = startTime + s * stepTime;
        const noteFreq = s % 4 === 0 ? rootFreq : s % 4 === 2 ? rootFreq * 1.5 : rootFreq;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(noteFreq, t);

        gain.gain.setValueAtTime(profile.rhythmicVol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + stepTime * 0.85);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + stepTime);
        activeVoices.push({ osc, gain, stopAt: t + stepTime });
      }
      break;
    }

    case 'neon_glitch': {
      // Syncopated digital stutter micro-gates
      for (let s = 0; s < steps; s++) {
        if (s % 3 === 2) continue; // Syncopation gap
        const t = startTime + s * stepTime;
        const freq = (chord[s % chord.length] || rootFreq);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq * 1.5, t);

        gain.gain.setValueAtTime(profile.rhythmicVol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + stepTime * 0.65);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + stepTime * 0.7);
        activeVoices.push({ osc, gain, stopAt: t + stepTime * 0.7 });
      }
      break;
    }

    case 'crystal_plucks': {
      // Sparkling ice bell plucks cascading down the high register
      for (let s = 0; s < steps; s++) {
        if (s % 2 !== 0) continue;
        const t = startTime + s * stepTime;
        const noteIdx = (steps - s) % chord.length;
        const baseFreq = chord[noteIdx] || rootFreq;
        const freq = baseFreq * 2.5; // High crystal bell octave

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(profile.rhythmicVol, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + 0.5);
        activeVoices.push({ osc, gain, stopAt: t + 0.5 });
      }
      break;
    }

    case 'marimba_taps': {
      // Warm wooden marimba / kalimba taps with fast pitch drop
      for (let s = 0; s < steps; s++) {
        if (s % 2 === 1 && s % 4 !== 3) continue;
        const t = startTime + s * stepTime;
        const freq = chord[s % chord.length] || rootFreq;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * 1.5, t);
        osc.frequency.exponentialRampToValueAtTime(freq, t + 0.03);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(profile.rhythmicVol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + 0.28);
        activeVoices.push({ osc, gain, stopAt: t + 0.28 });
      }
      break;
    }

    case 'music_box': {
      // Mechanical music box tine strikes
      for (let s = 0; s < steps; s++) {
        if (s % 3 === 1) continue;
        const t = startTime + s * stepTime;
        const noteIdx = (s * 2) % chord.length;
        const freq = (chord[noteIdx] || rootFreq) * 2;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(profile.rhythmicVol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + 0.55);
        activeVoices.push({ osc, gain, stopAt: t + 0.55 });
      }
      break;
    }

    case 'stardust_echoes': {
      // Sparse echoing stardust pings
      for (let s = 0; s < steps; s++) {
        if (s % 3 !== 0) continue;
        const t = startTime + s * stepTime;
        const freq = (chord[s % chord.length] || rootFreq) * 3;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(profile.rhythmicVol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + 0.95);
        activeVoices.push({ osc, gain, stopAt: t + 0.95 });
      }
      break;
    }

    case 'whale_song': {
      // Eerie slow portamento whale-song sine glide
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(rootFreq * 1.5, startTime);
      osc.frequency.linearRampToValueAtTime(rootFreq * 2.2, startTime + duration * 0.5);
      osc.frequency.linearRampToValueAtTime(rootFreq * 1.2, startTime + duration);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(profile.rhythmicVol, startTime + 1.0);
      gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
      activeVoices.push({ osc, gain, stopAt: startTime + duration + 0.1 });
      break;
    }

    case 'sea_shanty': {
      // 6/8 swing meter bass thumps on beats 1 and 4 + accordion chuffs on 2, 3, 5, 6
      for (let s = 0; s < steps; s++) {
        const t = startTime + s * stepTime;
        const isBassBeat = s % 3 === 0;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (isBassBeat) {
          osc.type = 'triangle';
          const freq = s % 6 === 0 ? rootFreq : rootFreq * 1.33;
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(profile.rhythmicVol * 1.2, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + stepTime * 1.8);
        } else {
          osc.type = 'sawtooth';
          const freq = (chord[1] || rootFreq) * 1.5;
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(profile.rhythmicVol * 0.7, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + stepTime * 0.85);
        }

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + stepTime * 1.9);
        activeVoices.push({ osc, gain, stopAt: t + stepTime * 1.9 });
      }
      break;
    }

    case 'oud_plucks': {
      // Plucked Arabian Oud / sitar micro-transients
      for (let s = 0; s < steps; s++) {
        if (s % 2 === 1 && s % 4 !== 3) continue;
        const t = startTime + s * stepTime;
        const freq = chord[s % chord.length] || rootFreq;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * 2.0, t);
        osc.frequency.exponentialRampToValueAtTime(freq, t + 0.04);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(profile.rhythmicVol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + 0.3);
        activeVoices.push({ osc, gain, stopAt: t + 0.3 });
      }
      break;
    }

    case 'relic_gongs': {
      // Ceremonial stone gong overtones
      for (let s = 0; s < steps; s++) {
        if (s % 4 !== 0) continue;
        const t = startTime + s * stepTime;
        const freq = rootFreq * 1.25;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(profile.rhythmicVol, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + 2.1);
        activeVoices.push({ osc, gain, stopAt: t + 2.1 });
      }
      break;
    }

    case 'theremin_lead': {
      // Eerie gliding theremin lead with portamento and 6Hz vibrato
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const targetFreq = (chord[1] || rootFreq) * 2;
      osc.frequency.setValueAtTime(targetFreq, startTime);
      osc.frequency.linearRampToValueAtTime(targetFreq * 1.18, startTime + duration * 0.4);
      osc.frequency.linearRampToValueAtTime(targetFreq * 0.95, startTime + duration * 0.8);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(profile.rhythmicVol, startTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
      activeVoices.push({ osc, gain, stopAt: startTime + duration + 0.1 });
      break;
    }

    case 'geothermal_thud': {
      // Muffled low volcanic kick heartbeat
      for (let s = 0; s < steps; s++) {
        if (s % 2 !== 0) continue;
        const t = startTime + s * stepTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(95, t);
        osc.frequency.exponentialRampToValueAtTime(36, t + 0.14);

        gain.gain.setValueAtTime(profile.rhythmicVol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + 0.25);
        activeVoices.push({ osc, gain, stopAt: t + 0.25 });
      }
      break;
    }

    case 'mountain_flute': {
      // Soaring breathy mountain flute melody
      for (let s = 0; s < steps; s++) {
        if (s % 3 === 2) continue;
        const t = startTime + s * stepTime;
        const freq = (chord[s % chord.length] || rootFreq) * 1.5;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(profile.rhythmicVol, t + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + stepTime * 1.4);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + stepTime * 1.45);
        activeVoices.push({ osc, gain, stopAt: t + stepTime * 1.45 });
      }
      break;
    }

    case 'paper_plucks': {
      // Tactile thumb-piano plucks
      for (let s = 0; s < steps; s++) {
        if (s % 2 === 1) continue;
        const t = startTime + s * stepTime;
        const freq = chord[s % chord.length] || rootFreq;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * 2, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(profile.rhythmicVol, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + 0.35);
        activeVoices.push({ osc, gain, stopAt: t + 0.35 });
      }
      break;
    }

    case 'clockwork_ticks': {
      // Filtered clockwork cog ticks alternating high/low gear clicks
      for (let s = 0; s < steps; s++) {
        const t = startTime + s * stepTime;
        const freq = s % 2 === 0 ? 920 : 680;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(profile.rhythmicVol * 0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + 0.06);
        activeVoices.push({ osc, gain, stopAt: t + 0.06 });
      }
      break;
    }

    case 'harp_glissando': {
      // Rapid flowing golden harp glissando runs
      for (let s = 0; s < steps; s++) {
        const t = startTime + s * stepTime;
        const noteIdx = s % chord.length;
        const octaveMul = s >= chord.length ? 2.5 : 1.5;
        const freq = (chord[noteIdx] || rootFreq) * octaveMul;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(profile.rhythmicVol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + 0.45);
        activeVoices.push({ osc, gain, stopAt: t + 0.45 });
      }
      break;
    }

    case 'prismatic_arps': {
      // Multi-octave crystalline arpeggio cascade
      for (let s = 0; s < steps; s++) {
        const t = startTime + s * stepTime;
        const noteIdx = (s * 2) % (chord.length * 2);
        const freq = (chord[noteIdx % chord.length] || rootFreq) * (noteIdx >= chord.length ? 2.5 : 1.5);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(profile.rhythmicVol, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + 0.38);
        activeVoices.push({ osc, gain, stopAt: t + 0.38 });
      }
      break;
    }

    default:
      break;
  }
};

// ---------------------------------------------------------------------------
// CHORD SCHEDULER & AUDIO LOOP
// ---------------------------------------------------------------------------

const playThemeChord = (
  ctx: AudioContext,
  profile: ThemeAudioProfile,
  freqs: number[],
  duration: number,
  padBus: BiquadFilterNode,
  melodyBus: BiquadFilterNode
) => {
  const now = ctx.currentTime;
  pruneFinishedVoices(ctx);

  // Set pad filter characteristics
  padBus.frequency.cancelScheduledValues(now);
  padBus.frequency.linearRampToValueAtTime(profile.filterCutoff, now + 0.5);
  if (profile.filterQ) {
    padBus.Q.cancelScheduledValues(now);
    padBus.Q.linearRampToValueAtTime(profile.filterQ, now + 0.5);
  }

  // Set melody filter characteristics (open and bright so lead instruments are vibrant)
  const brightCutoff = Math.max(3500, profile.filterCutoff * 2.5);
  melodyBus.frequency.cancelScheduledValues(now);
  melodyBus.frequency.linearRampToValueAtTime(brightCutoff, now + 0.5);

  const attack = profile.padAttack;
  const release = profile.padRelease;
  const noteVol = 0.035 / Math.sqrt(Math.max(1, freqs.length));

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = profile.padWaveform;
    // Detune for lush chorus width
    const detuneCents = (i - freqs.length / 2) * 3.5;
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime(detuneCents, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(noteVol, now + attack);
    gain.gain.setValueAtTime(noteVol, Math.max(now + attack, now + duration - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(padBus);

    osc.start(now);
    osc.stop(now + duration + 0.1);

    activeVoices.push({ osc, gain, stopAt: now + duration + 0.1 });
  });

  // Render thematic rhythmic pattern (arpeggios, bassline, or percussive accents) into melody bus
  renderRhythmicPattern(ctx, profile, freqs, now, duration, melodyBus);
};

const scheduleNextChord = () => {
  if (!isRunning) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const { padFilter: padBus, melodyFilter: melodyBus } = setupBgmNodes(ctx);

  const profile = THEME_AUDIO_PROFILES[currentBaseTheme] || THEME_AUDIO_PROFILES.neon;
  const chordList = profile.chords;
  const currentChord = chordList[chordIndex % chordList.length] || [261.63];
  chordIndex++;

  playThemeChord(ctx, profile, currentChord, profile.chordDuration, padBus, melodyBus);

  // Schedule next chord before current finishes for seamless crossfade
  const nextDelayMs = Math.max(1000, (profile.chordDuration - profile.overlap) * 1000);
  loopTimeoutId = setTimeout(scheduleNextChord, nextDelayMs);
};

const schedulePeriodicAccent = () => {
  if (!isRunning) return;

  const ctx = getAudioContext();
  const profile = THEME_AUDIO_PROFILES[currentBaseTheme] || THEME_AUDIO_PROFILES.neon;

  if (ctx && melodyFilter && !isMusicMuted && profile.renderAccent) {
    try {
      profile.renderAccent(ctx, ctx.currentTime, melodyFilter);
    } catch (e) {
      console.warn('Error executing procedural theme accent:', e);
    }
  }

  const [minMs, maxMs] = profile.accentIntervalMs;
  const nextDelay = minMs + Math.random() * (maxMs - minMs);
  accentTimeoutId = setTimeout(schedulePeriodicAccent, nextDelay);
};

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export const startMusic = () => {
  if (isRunning) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  setupBgmNodes(ctx);
  isRunning = true;
  scheduleNextChord();
  schedulePeriodicAccent();
};

export const stopMusic = () => {
  isRunning = false;
  if (loopTimeoutId) {
    clearTimeout(loopTimeoutId);
    loopTimeoutId = null;
  }
  if (accentTimeoutId) {
    clearTimeout(accentTimeoutId);
    accentTimeoutId = null;
  }

  const ctx = getAudioContext();
  const now = ctx ? ctx.currentTime : 0;

  activeVoices.forEach(v => {
    try {
      v.gain.gain.cancelScheduledValues(now);
      v.gain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
      v.osc.stop(now + 0.2);
    } catch {
      // Voice may already have stopped
    }
  });
  activeVoices = [];
};

export const getMusicMuted = (): boolean => isMusicMuted;

export const setMusicMuted = (muted: boolean) => {
  isMusicMuted = muted;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_MUTED_KEY, String(muted));
    } catch (e) {
      console.warn('Failed saving BGM mute state:', e);
    }
  }

  const ctx = getAudioContext();
  if (ctx && masterBgmGain) {
    const targetVol = isMusicMuted ? 0 : isDucked ? musicVolume * 0.2 : musicVolume;
    masterBgmGain.gain.cancelScheduledValues(ctx.currentTime);
    masterBgmGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.2);
  }

  if (!isMusicMuted && !isRunning) {
    startMusic();
  }
};

export const getMusicVolume = (): number => musicVolume;

export const setMusicVolume = (vol: number) => {
  musicVolume = Math.max(0, Math.min(1, vol));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_VOL_KEY, String(musicVolume));
    } catch (e) {
      console.warn('Failed saving BGM volume:', e);
    }
  }

  const ctx = getAudioContext();
  if (ctx && masterBgmGain && !isMusicMuted) {
    const targetVol = isDucked ? musicVolume * 0.2 : musicVolume;
    masterBgmGain.gain.cancelScheduledValues(ctx.currentTime);
    masterBgmGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.1);
  }
};

export const setMusicTheme = (themeId: string) => {
  const nextBase = getBaseThemeId(themeId);
  if (nextBase === currentBaseTheme && isRunning) {
    return;
  }

  currentBaseTheme = nextBase;
  chordIndex = 0;

  if (isRunning) {
    // Fade out active voices smoothly over 200ms
    const ctx = getAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
      activeVoices.forEach(v => {
        try {
          v.gain.gain.cancelScheduledValues(now);
          v.gain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
          v.osc.stop(now + 0.25);
        } catch {
          // Voice already stopping
        }
      });
      activeVoices = [];
    }

    if (loopTimeoutId) {
      clearTimeout(loopTimeoutId);
      loopTimeoutId = null;
    }
    if (accentTimeoutId) {
      clearTimeout(accentTimeoutId);
      accentTimeoutId = null;
    }

    // Trigger immediate playback of new theme
    scheduleNextChord();
    schedulePeriodicAccent();
  }
};

// Duck background music smoothly during win fanfare
export const duckMusic = (durationMs: number = 2200) => {
  if (isMusicMuted || !masterBgmGain) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  isDucked = true;
  const now = ctx.currentTime;
  const duckedVol = musicVolume * 0.2;

  masterBgmGain.gain.cancelScheduledValues(now);
  masterBgmGain.gain.linearRampToValueAtTime(duckedVol, now + 0.15);

  setTimeout(() => {
    isDucked = false;
    if (masterBgmGain && ctx && !isMusicMuted) {
      masterBgmGain.gain.linearRampToValueAtTime(musicVolume, ctx.currentTime + 0.8);
    }
  }, durationMs);
};

// Handle document visibility (pause when user switches tabs)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    const ctx = getAudioContext();
    if (!ctx || !masterBgmGain || isMusicMuted) return;

    if (document.hidden) {
      masterBgmGain.gain.cancelScheduledValues(ctx.currentTime);
      masterBgmGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    } else {
      const targetVol = isDucked ? musicVolume * 0.2 : musicVolume;
      masterBgmGain.gain.cancelScheduledValues(ctx.currentTime);
      masterBgmGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.5);
    }
  });
}

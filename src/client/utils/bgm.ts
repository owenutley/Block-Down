import { getAudioContext } from './audio';

export type BgmThemeStyle = 'zen' | 'retro' | 'cyber';

type ChordVoice = {
  osc: OscillatorNode;
  gain: GainNode;
};

// Safe localStorage persistence keys
const STORAGE_MUTED_KEY = 'block_down_bgm_muted';
const STORAGE_VOL_KEY = 'block_down_bgm_volume';

let isMusicMuted = false;
let musicVolume = 0.35; // Default comfortable ambient background volume

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
let bgmFilter: BiquadFilterNode | null = null;

let isRunning = false;
let currentStyle: BgmThemeStyle = 'zen';
let activeVoices: ChordVoice[] = [];
let loopTimeoutId: ReturnType<typeof setTimeout> | null = null;
let chimeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let isDucked = false;

// Chord Definitions (Frequencies in Hz)
// Zen Pad Progressions (Peaceful modal chords: Fmaj9, G6, Em7, Am9)
const ZEN_CHORDS: number[][] = [
  [174.61, 261.63, 329.63, 392.00, 440.00], // Fmaj9
  [196.00, 293.66, 329.63, 392.00, 493.88], // G6
  [164.81, 246.94, 293.66, 329.63, 392.00], // Em7
  [220.00, 261.63, 329.63, 392.00, 523.25], // Am9
];

// Pentatonic high chime frequencies (Zen chime accents)
const ZEN_CHIMES: number[] = [523.25, 659.25, 783.99, 880.00, 1046.50, 1318.51];

// Retro Chords (Pentatonic Game Boy-like progression: C, G, Am, F)
const RETRO_CHORDS: number[][] = [
  [130.81, 196.00, 261.63, 329.63], // C major
  [98.00, 146.83, 196.00, 246.94],  // G major
  [110.00, 164.81, 220.00, 261.63], // A minor
  [87.31, 130.81, 174.61, 220.00],  // F major
];

// Cyber Drones (Deep atmospheric fifths & minor clusters)
const CYBER_CHORDS: number[][] = [
  [73.42, 110.00, 146.83, 220.00, 293.66], // Dm drone
  [65.41, 98.00, 130.81, 196.00, 261.63],  // C drone
  [55.00, 82.41, 110.00, 164.81, 220.00],  // A drone
  [61.74, 92.50, 123.47, 185.00, 246.94],  // B drone
];

let chordIndex = 0;

const setupBgmNodes = (ctx: AudioContext) => {
  if (!masterBgmGain || !bgmFilter) {
    masterBgmGain = ctx.createGain();
    bgmFilter = ctx.createBiquadFilter();

    bgmFilter.type = 'lowpass';
    bgmFilter.frequency.setValueAtTime(1050, ctx.currentTime);
    bgmFilter.Q.setValueAtTime(0.8, ctx.currentTime);

    bgmFilter.connect(masterBgmGain);
    masterBgmGain.connect(ctx.destination);

    // Set initial gain based on mute/volume
    const targetVol = isMusicMuted ? 0 : musicVolume;
    masterBgmGain.gain.setValueAtTime(targetVol, ctx.currentTime);
  }
  return { masterBgmGain, bgmFilter };
};

const playChordZen = (ctx: AudioContext, freqs: number[], duration: number) => {
  const filter = bgmFilter;
  if (!filter) return;

  const now = ctx.currentTime;
  const attack = 1.8;
  const release = 2.4;
  const noteVol = 0.05 / Math.sqrt(freqs.length);

  const voices: ChordVoice[] = [];

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Use gentle sine & triangle for warm acoustic warmth
    osc.type = i % 2 === 0 ? 'sine' : 'triangle';
    // Subtle detune for rich lush chorus width
    const detuneCents = (i - freqs.length / 2) * 3.5;
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime(detuneCents, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(noteVol, now + attack);
    gain.gain.setValueAtTime(noteVol, now + duration - release);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(filter);

    osc.start(now);
    osc.stop(now + duration + 0.1);

    voices.push({ osc, gain });
  });

  activeVoices.push(...voices);

  // Clean up finished voices from tracking
  setTimeout(() => {
    activeVoices = activeVoices.filter(v => !voices.includes(v));
  }, (duration + 0.2) * 1000);
};

const playChordRetro = (ctx: AudioContext, freqs: number[], duration: number) => {
  const filter = bgmFilter;
  if (!filter) return;

  const now = ctx.currentTime;
  const voices: ChordVoice[] = [];
  const arpStep = 0.18; // Arpeggio step timing
  const noteVol = 0.035;

  // Bass root note sustained softly
  const rootFreq = freqs[0];
  if (rootFreq) {
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(rootFreq, now);

    bassGain.gain.setValueAtTime(0.0001, now);
    bassGain.gain.linearRampToValueAtTime(0.06, now + 0.2);
    bassGain.gain.setValueAtTime(0.06, now + duration - 0.4);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    bassOsc.connect(bassGain);
    bassGain.connect(filter);
    bassOsc.start(now);
    bassOsc.stop(now + duration + 0.1);
    voices.push({ osc: bassOsc, gain: bassGain });
  }

  // Gentle chip arpeggios flowing upward and downward
  const steps = Math.floor(duration / arpStep);
  for (let s = 0; s < steps; s++) {
    const stepTime = now + s * arpStep;
    const noteIdx = (s % (freqs.length * 2 - 2));
    const targetFreqIdx = noteIdx < freqs.length ? noteIdx : (freqs.length * 2 - 2) - noteIdx;
    const freq = freqs[targetFreqIdx] || freqs[0] || 220;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 2, stepTime); // 1 octave higher for chiptune chime

    gain.gain.setValueAtTime(noteVol, stepTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, stepTime + arpStep * 0.95);

    osc.connect(gain);
    gain.connect(filter);
    osc.start(stepTime);
    osc.stop(stepTime + arpStep);
    voices.push({ osc, gain });
  }

  activeVoices.push(...voices);
  setTimeout(() => {
    activeVoices = activeVoices.filter(v => !voices.includes(v));
  }, (duration + 0.2) * 1000);
};

const playChordCyber = (ctx: AudioContext, freqs: number[], duration: number) => {
  const filter = bgmFilter;
  if (!filter) return;

  const now = ctx.currentTime;
  const attack = 2.0;
  const release = 2.5;
  const noteVol = 0.045 / Math.sqrt(freqs.length);
  const voices: ChordVoice[] = [];

  // Slow resonant filter sweep for cyberpunk atmosphere
  filter.frequency.setValueAtTime(450, now);
  filter.frequency.linearRampToValueAtTime(950, now + duration * 0.5);
  filter.frequency.linearRampToValueAtTime(500, now + duration);

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = i === 0 ? 'sawtooth' : 'triangle';
    const detune = (i - freqs.length / 2) * 5;
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime(detune, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(noteVol, now + attack);
    gain.gain.setValueAtTime(noteVol, now + duration - release);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(filter);
    osc.start(now);
    osc.stop(now + duration + 0.1);
    voices.push({ osc, gain });
  });

  activeVoices.push(...voices);
  setTimeout(() => {
    activeVoices = activeVoices.filter(v => !voices.includes(v));
  }, (duration + 0.2) * 1000);
};

const scheduleNextChord = () => {
  if (!isRunning) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  setupBgmNodes(ctx);

  const chordDuration = currentStyle === 'retro' ? 5.5 : 7.0;
  const overlap = currentStyle === 'retro' ? 0.3 : 1.8;

  let chordList: number[][];
  if (currentStyle === 'retro') {
    chordList = RETRO_CHORDS;
  } else if (currentStyle === 'cyber') {
    chordList = CYBER_CHORDS;
  } else {
    chordList = ZEN_CHORDS;
  }

  const currentChord = chordList[chordIndex % chordList.length] || ZEN_CHORDS[0] || [261.63];
  chordIndex++;

  if (currentStyle === 'retro') {
    playChordRetro(ctx, currentChord, chordDuration);
  } else if (currentStyle === 'cyber') {
    playChordCyber(ctx, currentChord, chordDuration);
  } else {
    playChordZen(ctx, currentChord, chordDuration);
  }

  // Schedule next chord before current finishes for seamless crossfade
  const nextDelayMs = Math.max(1000, (chordDuration - overlap) * 1000);
  loopTimeoutId = setTimeout(scheduleNextChord, nextDelayMs);
};

// Subtle occasional pentatonic chime (windchime effect in Zen mode)
const scheduleZenChime = () => {
  if (!isRunning || currentStyle !== 'zen') return;

  const ctx = getAudioContext();
  const filter = bgmFilter;
  if (ctx && filter && !isMusicMuted) {
    const now = ctx.currentTime;
    const randomFreq = ZEN_CHIMES[Math.floor(Math.random() * ZEN_CHIMES.length)] || 659.25;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(randomFreq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    gain.connect(filter);

    osc.start(now);
    osc.stop(now + 1.9);
  }

  const nextChimeDelay = 8000 + Math.random() * 8000;
  chimeTimeoutId = setTimeout(scheduleZenChime, nextChimeDelay);
};

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
  if (currentStyle === 'zen') {
    scheduleZenChime();
  }
};

export const stopMusic = () => {
  isRunning = false;
  if (loopTimeoutId) {
    clearTimeout(loopTimeoutId);
    loopTimeoutId = null;
  }
  if (chimeTimeoutId) {
    clearTimeout(chimeTimeoutId);
    chimeTimeoutId = null;
  }

  const ctx = getAudioContext();
  const now = ctx ? ctx.currentTime : 0;

  activeVoices.forEach(v => {
    try {
      v.gain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
      v.osc.stop(now + 0.35);
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
  let nextStyle: BgmThemeStyle = 'zen';
  const lower = themeId.toLowerCase();

  if (lower.includes('retro') || lower.includes('pixel') || lower.includes('arcade')) {
    nextStyle = 'retro';
  } else if (lower.includes('cyber') || lower.includes('neon') || lower.includes('future') || lower.includes('dungeon')) {
    nextStyle = 'cyber';
  } else {
    nextStyle = 'zen';
  }

  if (nextStyle !== currentStyle) {
    currentStyle = nextStyle;
    if (isRunning) {
      // Re-trigger with new chord palette on next loop
      chordIndex = 0;
    }
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

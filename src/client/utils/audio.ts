let audioCtx: AudioContext | null = null;
let isMuted = false;

// Load initial mute state from localStorage safely
if (typeof window !== 'undefined') {
  try {
    isMuted = localStorage.getItem('block_down_muted') === 'true';
  } catch (e) {
    console.warn('Failed to read from localStorage (likely blocked by iframe sandbox):', e);
  }
}

export const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      // @ts-expect-error webkitAudioContext is a legacy Safari feature
      window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

export const getMuted = (): boolean => isMuted;

export const setMuted = (muted: boolean) => {
  isMuted = muted;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('block_down_muted', String(muted));
    } catch (e) {
      console.warn('Failed to write to localStorage (likely blocked by iframe sandbox):', e);
    }
  }
};

let lastToneTime = 0;

const playTone = (freq: number, type: OscillatorType, duration: number, startVol = 0.1, endVol = 0.0001, pitchSlideTo?: number) => {
  if (isMuted) return;
  const nowMs = Date.now();
  if (nowMs - lastToneTime < 45) return;
  lastToneTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  if (pitchSlideTo) {
    osc.frequency.exponentialRampToValueAtTime(pitchSlideTo, ctx.currentTime + duration);
  }

  gainNode.gain.setValueAtTime(startVol, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(endVol, ctx.currentTime + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
};

export const playSlideSound = () => {
  // Quick frequency sweep upwards for a sliding movement
  playTone(220, 'triangle', 0.12, 0.08, 0.001, 440);
};

export const playBlockPushSound = () => {
  // Crisp wooden/stone clack sound synthesized via dual-resonance transient with natural micro-variation
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  // Subtle organic pitch variation (±4%) so repeated pushes feel natural and tactile
  const jitter = 0.96 + Math.random() * 0.08;

  // 1. Sharp high-frequency click/snap (880Hz down to 240Hz in 40ms)
  const snapOsc = ctx.createOscillator();
  const snapGain = ctx.createGain();
  snapOsc.type = 'triangle';
  snapOsc.frequency.setValueAtTime(880 * jitter, now);
  snapOsc.frequency.exponentialRampToValueAtTime(240 * jitter, now + 0.04);
  snapGain.gain.setValueAtTime(0.14, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  snapOsc.connect(snapGain);
  snapGain.connect(ctx.destination);
  snapOsc.start(now);
  snapOsc.stop(now + 0.045);

  // 2. Solid stone/wood body resonance (360Hz down to 130Hz in 55ms)
  const bodyOsc = ctx.createOscillator();
  const bodyGain = ctx.createGain();
  bodyOsc.type = 'sine';
  bodyOsc.frequency.setValueAtTime(360 * jitter, now);
  bodyOsc.frequency.exponentialRampToValueAtTime(130 * jitter, now + 0.055);
  bodyGain.gain.setValueAtTime(0.12, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
  bodyOsc.connect(bodyGain);
  bodyGain.connect(ctx.destination);
  bodyOsc.start(now);
  bodyOsc.stop(now + 0.06);
};

export const playPortalSound = () => {
  // Subtle, soft portal warp whoosh
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  // Gentle pitch swoop up and down
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
  osc.frequency.exponentialRampToValueAtTime(360, now + 0.18);

  // Smooth attack and decay
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.07, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.19);
};

export const playThudSound = () => {
  // Subtle, quiet low punch thud for wall bumps
  playTone(120, 'triangle', 0.08, 0.10, 0.001, 50);
};

export const playUndoSound = () => {
  // Gentle backwards swoop indicating a rewound move
  playTone(380, 'sine', 0.12, 0.08, 0.001, 190);
};

/**
 * Harmonic multi-voice chord synthesizer that plays lush, ascending chords
 * as consecutive blocks lock into destinations (Root -> 3rd -> 5th -> 7th/Octave).
 * Includes a tactile mechanical/crystal lock transient for crisp physical feedback.
 */
export const playMatchSound = (matchedIndex: number = 0) => {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const now = ctx.currentTime;

  // 1. Tactile socket lock transient snap (1400Hz -> 460Hz in 30ms)
  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();
  clickOsc.type = 'triangle';
  clickOsc.frequency.setValueAtTime(1400, now);
  clickOsc.frequency.exponentialRampToValueAtTime(460, now + 0.03);
  clickGain.gain.setValueAtTime(0.12, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);
  clickOsc.start(now);
  clickOsc.stop(now + 0.035);

  // 2. Harmonically ascending musical scale (C, D, E, F, G, A) with crystal octave chimes:
  // Tone 0 (Block 1): C (C5: 523.25Hz, G5: 783.99Hz, C6: 1046.50Hz)
  // Tone 1 (Block 2): D (D5: 587.33Hz, A5: 880.00Hz, D6: 1174.66Hz)
  // Tone 2 (Block 3): E (E5: 659.25Hz, B5: 987.77Hz, E6: 1318.51Hz)
  // Tone 3 (Block 4): F (F5: 698.46Hz, C6: 1046.50Hz, F6: 1396.91Hz)
  // Tone 4 (Block 5): G (G5: 783.99Hz, D6: 1174.66Hz, G6: 1567.98Hz)
  // Tone 5 (Block 6): A (A5: 880.00Hz, E6: 1318.51Hz, A6: 1760.00Hz)
  // If > 6 blocks are matched, wraps back to Tone 0 (C) using modulo 6
  const scaleToneSets = [
    [523.25, 783.99, 1046.50],  // Tone 0 (C): C5, G5, C6
    [587.33, 880.00, 1174.66],  // Tone 1 (D): D5, A5, D6
    [659.25, 987.77, 1318.51],  // Tone 2 (E): E5, B5, E6
    [698.46, 1046.50, 1396.91], // Tone 3 (F): F5, C6, F6
    [783.99, 1174.66, 1567.98], // Tone 4 (G): G5, D6, G6
    [880.00, 1318.51, 1760.00], // Tone 5 (A): A5, E6, A6
  ];

  // Modulo wrap around every 6 blocks (starts again with C if > 6)
  const safeIndex = ((matchedIndex % scaleToneSets.length) + scaleToneSets.length) % scaleToneSets.length;
  const chord = scaleToneSets[safeIndex] ?? scaleToneSets[0]!;

  // Warm bell lowpass filter to keep harmonics smooth and prevent clipping
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3600, now);
  filter.connect(ctx.destination);

  // Stagger notes by 14ms micro-strum for crystal bell acoustics
  chord.forEach((freq, idx) => {
    const noteTime = now + idx * 0.014;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, noteTime);

    const noteVol = 0.08 / (1 + idx * 0.28);
    const duration = 0.38 + idx * 0.04;

    gain.gain.setValueAtTime(0.001, noteTime);
    gain.gain.linearRampToValueAtTime(noteVol, noteTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + duration);

    osc.connect(gain);
    gain.connect(filter);

    osc.start(noteTime);
    osc.stop(noteTime + duration + 0.02);
  });
};

/**
 * Subtle descending unlatch sound played when a block is moved OUT of its target zone.
 */
export const playUnmatchSound = () => {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const notes = [587.33, 440.00]; // Soft D5 -> A4 descent

  notes.forEach((freq, idx) => {
    const noteTime = now + idx * 0.035;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0.001, noteTime);
    gain.gain.linearRampToValueAtTime(0.045, noteTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.15);
  });
};

/**
 * Celebratory orchestral synth fanfare on puzzle completion.
 * Plays an energetic ascending arpeggio resolving into a resonant, shimmering major chord.
 */
export const playWinMelody = () => {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const now = ctx.currentTime;

  // 1. Energetic ascending celebratory fanfare arpeggio (B5 -> C6 -> D6 -> E6 -> G6 -> C7)
  const arpeggio = [987.77, 1046.50, 1174.66, 1318.51, 1567.98, 2093.00];

  arpeggio.forEach((freq, index) => {
    const noteTime = now + index * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0.001, noteTime);
    gain.gain.linearRampToValueAtTime(0.09, noteTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.25);
  });

  // 2. Final sustained triumphant chord (C5 + G5 + C6 + E6 + G6) with shimmering vibrato
  const chordStart = now + arpeggio.length * 0.08 + 0.03;
  const finalChord = [523.25, 783.99, 1046.50, 1318.51, 1567.98];
  const chordDuration = 1.2;

  finalChord.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, chordStart);

    // Subtle pitch vibrato for lush shimmer on the top voices
    if (idx >= 2) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(5.5, chordStart); // 5.5 Hz vibrato
      lfoGain.gain.setValueAtTime(3.0, chordStart);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(chordStart);
      lfo.stop(chordStart + chordDuration);
    }

    gain.gain.setValueAtTime(0.001, chordStart);
    gain.gain.linearRampToValueAtTime(0.10 / (1 + idx * 0.2), chordStart + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, chordStart + chordDuration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(chordStart);
    osc.stop(chordStart + chordDuration + 0.05);
  });
};

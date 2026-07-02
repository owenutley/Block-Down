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

const getAudioContext = (): AudioContext | null => {
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

const playTone = (freq: number, type: OscillatorType, duration: number, startVol = 0.1, endVol = 0.0001, pitchSlideTo?: number) => {
  if (isMuted) return;
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
  playTone(220, 'triangle', 0.12, 0.1, 0.001, 440);
};

export const playThudSound = () => {
  // Low pitch thud noise for wall bump
  playTone(110, 'sawtooth', 0.08, 0.15, 0.001, 55);
};

export const playMatchSound = () => {
  // Satisfying two-tone chime when a block lands on a target
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(523.25, now); // C5
  gain1.gain.setValueAtTime(0.08, now);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.15);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
  gain2.gain.setValueAtTime(0.08, now + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.08 + 0.2);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.08 + 0.2);
};

export const playWinMelody = () => {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  // C major arpeggio rising
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 1046.50]; // C4, E4, G4, C5, E5, C6
  
  notes.forEach((freq, index) => {
    const noteTime = now + index * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = index === notes.length - 1 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, noteTime);
    
    // Hold the last note longer
    const duration = index === notes.length - 1 ? 0.6 : 0.25;
    gain.gain.setValueAtTime(0.08, noteTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(noteTime);
    osc.stop(noteTime + duration);
  });
};

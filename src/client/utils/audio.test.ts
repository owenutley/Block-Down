import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMuted,
  setMuted,
  playBlockPushSound,
  playUndoSound,
  playMatchSound,
  playUnmatchSound,
  playWinMelody,
  playPortalSound,
  playThudSound,
} from './audio';

describe('Audio Synthesizer Utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('toggles muted state correctly', () => {
    setMuted(true);
    expect(getMuted()).toBe(true);
    setMuted(false);
    expect(getMuted()).toBe(false);
  });

  it('safely handles sound calls when muted without error', () => {
    setMuted(true);
    expect(() => {
      playBlockPushSound();
      playUndoSound();
      playMatchSound(-1);
      playMatchSound(0); // Tone 0 (Block 1)
      playMatchSound(1); // Tone 1 (Block 2)
      playMatchSound(2); // Tone 2 (Block 3)
      playMatchSound(3); // Tone 3 (Block 4)
      playMatchSound(4); // Tone 4 (Block 5)
      playMatchSound(5); // Tone 5 (Block 6)
      playMatchSound(6); // Wrap to Tone 0 (Block 7)
      playMatchSound(7); // Wrap to Tone 1 (Block 8)
      playMatchSound(12); // Wrap to Tone 0
      playMatchSound(99);
      playUnmatchSound();
      playWinMelody();
      playPortalSound();
      playThudSound();
    }).not.toThrow();
  });

  it('safely handles sound calls in headless environment without audio context', () => {
    setMuted(false);
    expect(() => {
      playBlockPushSound();
      playUndoSound();
      playMatchSound(0);
      playMatchSound(1);
      playMatchSound(2);
      playMatchSound(3);
      playMatchSound(4);
      playMatchSound(5);
      playMatchSound(6);
      playUnmatchSound();
      playWinMelody();
    }).not.toThrow();
  });
});

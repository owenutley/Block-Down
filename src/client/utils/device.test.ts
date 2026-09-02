// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isMobileDevice, isSplashPage, shouldShowTrails } from './device';

describe('device & trail utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('shouldShowTrails', () => {
    it('respects explicit overrides', () => {
      expect(shouldShowTrails(true)).toBe(true);
      expect(shouldShowTrails(false)).toBe(false);
    });

    it('returns false on splash page', () => {
      window.history.pushState({}, '', '/splash.html');
      expect(isSplashPage()).toBe(true);
      expect(shouldShowTrails()).toBe(false);
    });

    it('returns false on mobile device', () => {
      window.history.pushState({}, '', '/game.html');
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      });
      expect(isMobileDevice()).toBe(true);
      expect(shouldShowTrails()).toBe(false);
    });

    it('returns true on desktop game page', () => {
      window.history.pushState({}, '', '/game.html');
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true,
      });
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(isSplashPage()).toBe(false);
      expect(isMobileDevice()).toBe(false);
      expect(shouldShowTrails()).toBe(true);
    });
  });
});

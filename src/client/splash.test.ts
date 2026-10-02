import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestExpandedMode } from '@devvit/web/client';

const { requestExpandedModeMock, navigateToMock } = vi.hoisted(() => ({
  requestExpandedModeMock: vi.fn(),
  navigateToMock: vi.fn(),
}));

vi.mock('@devvit/web/client', () => ({
  navigateTo: navigateToMock,
  context: {
    username: 'test-user',
  },
  requestExpandedMode: requestExpandedModeMock,
}));

afterEach(() => {
  requestExpandedModeMock.mockReset();
  navigateToMock.mockReset();
});

describe('Splash Navigation & Entrypoints', () => {
  it('triggers expanded game mode for daily puzzle', () => {
    const dummyEvent = {} as MouseEvent;
    requestExpandedMode(dummyEvent, 'game');
    expect(requestExpandedModeMock).toHaveBeenCalledWith(dummyEvent, 'game');
  });

  it('triggers expanded mode for official full menu', () => {
    const dummyEvent = {} as MouseEvent;
    requestExpandedMode(dummyEvent, 'menu');
    expect(requestExpandedModeMock).toHaveBeenCalledWith(dummyEvent, 'menu');
  });

  it('triggers expanded mode for weekly challenge', () => {
    const dummyEvent = {} as MouseEvent;
    requestExpandedMode(dummyEvent, 'weekly');
    expect(requestExpandedModeMock).toHaveBeenCalledWith(dummyEvent, 'weekly');
  });

  it('triggers expanded mode for all splash menu destinations', () => {
    const destinations: ('campaign' | 'community' | 'puzzle-maker' | 'shop' | 'profile')[] = [
      'campaign',
      'community',
      'puzzle-maker',
      'shop',
      'profile',
    ];

    const dummyEvent = {} as MouseEvent;
    for (const dest of destinations) {
      requestExpandedMode(dummyEvent, dest);
      expect(requestExpandedModeMock).toHaveBeenCalledWith(dummyEvent, dest);
    }
  });
});

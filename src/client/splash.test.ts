import { afterEach, describe, expect, it, vi } from 'vitest';

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

describe('Splash Navigation', () => {
  it('configures requestExpandedMode mock properly', () => {
    expect(requestExpandedModeMock).toBeDefined();
  });
});

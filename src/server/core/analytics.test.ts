import { expect } from 'vitest';
import { test } from '../test';
import { recordAnalyticsEvent, getAnalyticsDashboardData, resetAnalyticsData } from './analytics';

test('records an event and adds username to unique players and DAU sets', async () => {
  await recordAnalyticsEvent('testUser', 'screen_view_daily');

  const data = await getAnalyticsDashboardData();
  expect(data.totalUniquePlayers).toBe(1);
  expect(data.todayDau).toBe(1);
  expect(data.topFeatures.length).toBeGreaterThan(0);
});

test('accumulates multiple actions and solves', async () => {
  await recordAnalyticsEvent('player1', 'game_start');
  await recordAnalyticsEvent('player1', 'game_solve_completed');
  await recordAnalyticsEvent('player2', 'screen_view_shop');

  const data = await getAnalyticsDashboardData();
  expect(data.totalUniquePlayers).toBeGreaterThanOrEqual(2);
  expect(data.totalSolves).toBeGreaterThanOrEqual(1);
});

test('resets analytics data cleanly', async () => {
  await recordAnalyticsEvent('resetUser', 'game_start');
  await resetAnalyticsData();

  const data = await getAnalyticsDashboardData();
  expect(data.totalUniquePlayers).toBe(0);
  expect(data.todayDau).toBe(0);
  expect(data.totalSolves).toBe(0);
  expect(data.topFeatures).toEqual([]);
});

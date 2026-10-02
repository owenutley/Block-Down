import { trpc } from '../trpc';
import { AnalyticsEventName } from '../../shared/types';

// Track recently fired events to prevent duplicate burst firing
const recentEvents = new Map<string, number>();

/**
 * Fires an in-app analytics event to Devvit Redis with optional deduplication window.
 */
export const trackClientEvent = (eventName: AnalyticsEventName, debounceMs: number = 1000): void => {
  try {
    const now = Date.now();
    const lastFired = recentEvents.get(eventName) || 0;

    if (now - lastFired < debounceMs) {
      return;
    }

    recentEvents.set(eventName, now);

    // Clean up old entries
    if (recentEvents.size > 50) {
      for (const [key, time] of recentEvents.entries()) {
        if (now - time > 60000) {
          recentEvents.delete(key);
        }
      }
    }

    // Fire and forget
    trpc.analytics.trackEvent.mutate({ event: eventName }).catch(() => {
      // Ignore background analytics network hiccups
    });
  } catch {
    // Fail silently so gameplay is never blocked
  }
};

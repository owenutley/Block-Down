import type { MouseEvent as ReactMouseEvent } from 'react';
import { requestExpandedMode } from '@devvit/web/client';

export type ExpandedOptions = {
  title?: string;
};

export const safeRequestExpandedMode = (
  e: ReactMouseEvent | MouseEvent,
  targetEntry?: string,
  options?: ExpandedOptions
): boolean => {
  // Always record target screen into localStorage so expanded views know where to land
  if (targetEntry) {
    try {
      localStorage.setItem('block_down_target_screen', targetEntry);
    } catch {
      // LocalStorage could be unavailable in strict private modes
    }
  }

  const nativeEv: MouseEvent = 'nativeEvent' in e ? e.nativeEvent : e;
  if (!nativeEv) {
    console.error('safeRequestExpandedMode: missing native event');
    return false;
  }

  const devvitGlobal = (globalThis as unknown as { devvit?: { entrypoints?: Record<string, string> } }).devvit;
  const entrypoints = devvitGlobal?.entrypoints;

  let resolvedEntry = targetEntry;

  // If entrypoints map exists in devvit runtime, verify that the entry is known
  if (entrypoints && Object.keys(entrypoints).length > 0) {
    if (resolvedEntry && !entrypoints[resolvedEntry]) {
      console.warn(
        `safeRequestExpandedMode: Entrypoint "${resolvedEntry}" not found in devvit.entrypoints. Falling back to default expanded entry.`
      );
      if (entrypoints['game']) {
        resolvedEntry = 'game';
      } else if (entrypoints['default']) {
        resolvedEntry = 'default';
      } else {
        resolvedEntry = Object.keys(entrypoints)[0];
      }
    }
  } else if (!entrypoints || Object.keys(entrypoints).length === 0) {
    // If devvit.entrypoints is missing or empty on mobile, passing any non-null string entry
    // will trigger: throw Error('no entrypoint named ...')
    // Passing undefined avoids the entry lookup error in Devvit's emitModeEffect.
    resolvedEntry = undefined;
  }

  try {
    requestExpandedMode(nativeEv, resolvedEntry as string, options);
    return true;
  } catch (err) {
    console.error('safeRequestExpandedMode failed:', err);
    return false;
  }
};

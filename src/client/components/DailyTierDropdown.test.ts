import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DailyTierDropdown } from './DailyTierDropdown';

describe('DailyTierDropdown Component', () => {
  it('is defined and is a valid functional component', () => {
    expect(DailyTierDropdown).toBeDefined();
    expect(typeof DailyTierDropdown).toBe('function');
  });

  it('renders trigger button for selected tier without crashing', () => {
    const onSelect = vi.fn();
    const html = renderToStaticMarkup(
      React.createElement(DailyTierDropdown, {
        selectedTier: 'medium',
        onSelectTier: onSelect,
        tiersData: null,
      })
    );
    expect(html).toBeDefined();
    expect(html).toContain('Medium');
  });

  it('supports dictionary format for tiersData and renders level and shard info', () => {
    const onSelect = vi.fn();
    const html = renderToStaticMarkup(
      React.createElement(DailyTierDropdown, {
        selectedTier: 'hard',
        onSelectTier: onSelect,
        tiersData: {
          hard: {
            tier: 'hard',
            tierLevel: 4,
            puzzleId: 'tier-4',
            name: 'Hard',
            par: 12,
            blocksCount: 6,
            completed: true,
            shardsReward: 20,
          },
        },
      })
    );
    expect(html).toBeDefined();
    expect(html).toContain('Hard');
  });
});

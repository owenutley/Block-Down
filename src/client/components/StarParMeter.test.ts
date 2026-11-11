import { describe, it, expect } from 'vitest';
import { StarParMeter } from './StarParMeter';

describe('StarParMeter Component', () => {
  it('is defined and is a valid functional component', () => {
    expect(StarParMeter).toBeDefined();
    expect(typeof StarParMeter).toBe('function');
  });

  it('renders 3-star Gold state when pushes are under or equal to par', () => {
    const el = StarParMeter({
      pushCount: 5,
      par: 7,
    });
    expect(el).toBeDefined();
    expect(el.props.title).toContain('Gold: Par Master');
  });

  it('renders 2-star Silver state when pushes exceed par but within two-star threshold', () => {
    const el = StarParMeter({
      pushCount: 9,
      par: 7,
    });
    expect(el).toBeDefined();
    expect(el.props.title).toContain('Silver');
  });

  it('renders 1-star Bronze state when pushes significantly exceed par', () => {
    const el = StarParMeter({
      pushCount: 20,
      par: 7,
    });
    expect(el).toBeDefined();
    expect(el.props.title).toContain('Bronze');
  });

  it('respects compact mode without crashing', () => {
    const el = StarParMeter({
      pushCount: 4,
      par: 4,
      compact: true,
    });
    expect(el).toBeDefined();
    expect(el.props.title).toContain('Gold');
  });
});


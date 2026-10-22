import { createCatchSummary } from './catchStatistics';
import type { CatchRecord } from '@/database/database';

const records: CatchRecord[] = [
  { id: 1, species: 'Ahven', weight: 500, date: '2026-10-22', location: 'Lahti', imageUri: null },
  { id: 2, species: 'Ahven', weight: 300, date: '2026-10-20', location: 'Lahti', imageUri: null },
  { id: 3, species: 'Hauki', weight: 1200, date: '2026-10-18', location: 'Espoo', imageUri: null },
];

describe('catch statistics', () => {
  it('calculates totals, averages, and the heaviest catch', () => {
    const summary = createCatchSummary(records);

    expect(summary.totalWeight).toBe(2000);
    expect(summary.averageWeight).toBeCloseTo(666.67, 1);
    expect(summary.heaviestCatch?.species).toBe('Hauki');
    expect(summary.latestCatch?.date).toBe('2026-10-22');
  });

  it('counts species and locations and finds the most common species', () => {
    const summary = createCatchSummary(records);

    expect(summary.speciesCounts).toEqual({ Ahven: 2, Hauki: 1 });
    expect(summary.locationCounts).toEqual({ Lahti: 2, Espoo: 1 });
    expect(summary.mostCommonSpecies).toEqual({ name: 'Ahven', count: 2 });
  });

  it('returns safe empty statistics without records', () => {
    const summary = createCatchSummary([]);

    expect(summary.totalWeight).toBe(0);
    expect(summary.averageWeight).toBe(0);
    expect(summary.heaviestCatch).toBeNull();
    expect(summary.latestCatch).toBeNull();
    expect(summary.mostCommonSpecies).toBeNull();
  });
});

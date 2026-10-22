import type { CatchRecord } from '@/database/database';

export type CatchSummary = {
  totalWeight: number;
  averageWeight: number;
  heaviestCatch: CatchRecord | null;
  latestCatch: CatchRecord | null;
  speciesCounts: Record<string, number>;
  locationCounts: Record<string, number>;
  mostCommonSpecies: { name: string; count: number } | null;
};

export function createCatchSummary(records: CatchRecord[]): CatchSummary {
  const totalWeight = records.reduce((total, record) => total + record.weight, 0);
  const heaviestCatch = records.reduce<CatchRecord | null>(
    (heaviest, record) => (!heaviest || record.weight > heaviest.weight ? record : heaviest),
    null
  );
  const speciesCounts = countBy(records, (record) => record.species);
  const locationCounts = countBy(records, (record) => record.location);

  return {
    totalWeight,
    averageWeight: records.length > 0 ? totalWeight / records.length : 0,
    heaviestCatch,
    latestCatch: records[0] ?? null,
    speciesCounts,
    locationCounts,
    mostCommonSpecies: getMostCommon(speciesCounts),
  };
}

function countBy(records: CatchRecord[], getKey: (record: CatchRecord) => string) {
  return records.reduce<Record<string, number>>((counts, record) => {
    const key = getKey(record).trim() || 'Ei määritetty';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function getMostCommon(counts: Record<string, number>) {
  return Object.entries(counts).reduce<{ name: string; count: number } | null>(
    (mostCommon, [name, count]) =>
      !mostCommon || count > mostCommon.count ? { name, count } : mostCommon,
    null
  );
}

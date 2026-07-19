import { CpiIndex } from '../types';

export const DEFAULT_CPI_LIST = [
  // 2024
  { year: 2024, month: 1, value: 37851815.27 },
  { year: 2024, month: 2, value: 37996012.66 },
  { year: 2024, month: 3, value: 38212308.75 },
  { year: 2024, month: 4, value: 38536752.88 },
  { year: 2024, month: 5, value: 38608851.58 },
  { year: 2024, month: 6, value: 38644900.92 },
  { year: 2024, month: 7, value: 38861197.01 },
  { year: 2024, month: 8, value: 39221690.49 },
  { year: 2024, month: 9, value: 39149591.79 },
  { year: 2024, month: 10, value: 39329838.53 },
  { year: 2024, month: 11, value: 39185641.14 },
  { year: 2024, month: 12, value: 39077493.10 },
  // 2025
  { year: 2025, month: 1, value: 39297754.61 },
  { year: 2025, month: 2, value: 39297754.61 },
  { year: 2025, month: 3, value: 39491339.61 },
  { year: 2025, month: 4, value: 39917226.61 },
  { year: 2025, month: 5, value: 39801075.61 },
  { year: 2025, month: 6, value: 39917226.61 },
  { year: 2025, month: 7, value: 40072094.61 },
  { year: 2025, month: 8, value: 40343113.60 },
  { year: 2025, month: 9, value: 40110811.61 },
  { year: 2025, month: 10, value: 40304396.60 },
  { year: 2025, month: 11, value: 40110811.61 },
  { year: 2025, month: 12, value: 40110811.61 },
  // 2026
  { year: 2026, month: 1, value: 39994660.61 },
  { year: 2026, month: 2, value: 40072094.61 },
  { year: 2026, month: 3, value: 40226962.60 },
  { year: 2026, month: 4, value: 40691566.60 },
  { year: 2026, month: 5, value: 40575415.60 },
  { year: 2026, month: 6, value: 40575415.60 }
];

export const DEFAULT_CONSTRUCTION_LIST = [
  // 2024
  { year: 2024, month: 1, value: 88283466.75 },
  { year: 2024, month: 2, value: 88080048.62 },
  { year: 2024, month: 3, value: 88283466.75 },
  { year: 2024, month: 4, value: 88215660.71 },
  { year: 2024, month: 5, value: 88622496.96 },
  { year: 2024, month: 6, value: 88961527.17 },
  { year: 2024, month: 7, value: 89300557.38 },
  { year: 2024, month: 8, value: 89503975.51 },
  { year: 2024, month: 9, value: 89843005.72 },
  { year: 2024, month: 10, value: 90046423.84 },
  { year: 2024, month: 11, value: 90317648.01 },
  { year: 2024, month: 12, value: 90588872.18 },
  // 2025
  { year: 2025, month: 1, value: 92962083.65 },
  { year: 2025, month: 2, value: 93368919.9 },
  { year: 2025, month: 3, value: 93707950.11 },
  { year: 2025, month: 4, value: 93843562.2 },
  { year: 2025, month: 5, value: 93979174.28 },
  { year: 2025, month: 6, value: 93979174.28 },
  { year: 2025, month: 7, value: 94046980.32 },
  { year: 2025, month: 8, value: 94423168.24 },
  { year: 2025, month: 9, value: 94423168.24 },
  { year: 2025, month: 10, value: 94517215.23 },
  { year: 2025, month: 11, value: 95081497.11 },
  { year: 2025, month: 12, value: 95175544.09 },
  // 2026
  { year: 2026, month: 1, value: 95269591.07 },
  { year: 2026, month: 2, value: 95457685.03 },
  { year: 2026, month: 3, value: 95645778.99 },
  { year: 2026, month: 4, value: 96680295.77 },
  { year: 2026, month: 5, value: 97244577.65 },
  { year: 2026, month: 6, value: 97432671.62 }
];

export function convertToSept1951Base(value: number): number {
  if (!value) return 0;
  if (value >= 1000) return Math.round(value * 100) / 100;
  return Math.round(value * 340409.32838491953 * 100) / 100;
}

export function convertToBase(value: number, indexType: 'cpi' | 'construction' = 'cpi'): number {
  if (!value) return 0;
  if (value >= 1000) return Math.round(value * 100) / 100;
  if (indexType === 'construction') {
    return Math.round(value * 940469.8032366304 * 100) / 100;
  }
  return convertToSept1951Base(value);
}

export function deduplicateCpiHistory(cpiHistory: CpiIndex[], indexType: 'cpi' | 'construction' = 'cpi'): CpiIndex[] {
  const filtered = (cpiHistory || []).filter(item => {
    const itemType = item.indexType || 'cpi';
    return itemType === indexType;
  });

  const rawList = filtered.length > 0 
    ? filtered 
    : (indexType === 'construction' ? DEFAULT_CONSTRUCTION_LIST : DEFAULT_CPI_LIST as any[]).map((d, i) => ({ id: `default-${indexType}-${i}`, indexType, ...d }));

  const map = new Map<string, CpiIndex>();
  
  for (const item of rawList) {
    const key = `${item.year}-${item.month}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
    } else {
      const existingIsBase = existing.value >= 1000;
      const itemIsBase = item.value >= 1000;
      
      if (itemIsBase && !existingIsBase) {
        map.set(key, item);
      } else if (!itemIsBase && existingIsBase) {
        // Keep existing
      } else {
        if (item.value > existing.value) {
          map.set(key, item);
        }
      }
    }
  }
  
  return Array.from(map.values());
}

export function getCpiPublicationDate(year: number, month: number): Date {
  const pubYear = month === 12 ? year + 1 : year;
  const pubMonth = month === 12 ? 0 : month;
  return new Date(pubYear, pubMonth, 15, 18, 30, 0);
}

export function getLatestKnownCpi(date: Date, cpiHistory: CpiIndex[], indexType: 'cpi' | 'construction' = 'cpi'): CpiIndex | null {
  const historyToUse = deduplicateCpiHistory(cpiHistory, indexType);
  const sorted = [...historyToUse].sort((a, b) => b.year - a.year || b.month - a.month);
  const calcTime = date.getTime();
  
  for (const item of sorted) {
    const pubDate = getCpiPublicationDate(item.year, item.month);
    if (calcTime >= pubDate.getTime()) {
      return item;
    }
  }
  
  return sorted[0] || null;
}

export function getCpiForMonth(year: number, month: number, cpiHistory: CpiIndex[], indexType: 'cpi' | 'construction' = 'cpi'): CpiIndex | null {
  const historyToUse = deduplicateCpiHistory(cpiHistory, indexType);
  return historyToUse.find(c => Number(c.year) === Number(year) && Number(c.month) === Number(month)) || null;
}

export function calculateCpiLinkedRent(
  baseRent: number,
  baseYear: number,
  baseMonth: number,
  calcDate: Date,
  cpiHistory: CpiIndex[],
  indexType: 'cpi' | 'construction' = 'cpi'
): {
  adjustedRent: number;
  baseIndex: number;
  targetIndex: number;
  changePercent: number;
  targetYear: number;
  targetMonth: number;
  publicationDate: Date;
} {
  const fallback = {
    adjustedRent: baseRent,
    baseIndex: 100,
    targetIndex: 100,
    changePercent: 0,
    targetYear: baseYear,
    targetMonth: baseMonth,
    publicationDate: new Date()
  };

  if (!baseRent) return fallback;

  const baseItem = getCpiForMonth(baseYear, baseMonth, cpiHistory, indexType);
  const targetItem = getLatestKnownCpi(calcDate, cpiHistory, indexType);

  let bVal = 100;
  let tVal = 100;
  let tYr = baseYear;
  let tMo = baseMonth;

  if (baseItem && targetItem) {
    bVal = convertToBase(baseItem.value, indexType);
    tVal = convertToBase(targetItem.value, indexType);
    tYr = targetItem.year;
    tMo = targetItem.month;
  } else {
    const defaults = indexType === 'construction' ? DEFAULT_CONSTRUCTION_LIST : DEFAULT_CPI_LIST;
    const defBase = defaults.find(c => c.year === Number(baseYear) && c.month === Number(baseMonth));
    const defTarget = getLatestKnownCpi(calcDate, [], indexType);
    
    const bRaw = defBase ? defBase.value : (baseItem ? baseItem.value : 100);
    const tRaw = defTarget ? defTarget.value : (targetItem ? targetItem.value : 100);

    bVal = convertToBase(bRaw, indexType);
    tVal = convertToBase(tRaw, indexType);
    tYr = defTarget ? defTarget.year : (targetItem ? targetItem.year : calcDate.getFullYear());
    tMo = defTarget ? defTarget.month : (targetItem ? targetItem.month : calcDate.getMonth() + 1);
  }

  const change = bVal === 0 ? 0 : ((tVal / bVal) - 1) * 100;
  const adjusted = bVal === 0 ? baseRent : baseRent * (tVal / bVal);
  const pubDate = getCpiPublicationDate(tYr, tMo);

  return {
    adjustedRent: Math.round(adjusted * 100) / 100,
    baseIndex: bVal,
    targetIndex: tVal,
    changePercent: Math.round(change * 100) / 100,
    targetYear: tYr,
    targetMonth: tMo,
    publicationDate: pubDate
  };
}

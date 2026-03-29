import type { VideoStats } from './types';

const WEIGHTS = {
  view: 0.3,
  like: 0.25,
  favorite: 0.25,
  coin: 0.1,
  share: 0.1,
} as const;

export function calcPopularity(current: VideoStats, previous: VideoStats | null): number {
  if (!previous) return 0;

  let score = 0;
  const keys = Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[];
  for (const key of keys) {
    const prev = previous[key] || 1; // avoid division by zero
    const delta = current[key] - previous[key];
    const normalized = delta / prev; // percentage change
    score += normalized * WEIGHTS[key];
  }

  // Scale to 0-100 range, clamped
  return Math.max(0, Math.min(100, score * 1000));
}

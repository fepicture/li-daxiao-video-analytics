import fs from 'fs';
import path from 'path';
import type { VideoMeta, DailySnapshot, DataPoint, MetricKey, EventMarker } from './types';
import { calcPopularity } from './popularity';

export function loadVideos(): VideoMeta[] {
  const filePath = path.join(process.cwd(), 'data', 'videos.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function loadSnapshots(): DailySnapshot[] {
  const dir = path.join(process.cwd(), 'data', 'snapshots');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')));
}

export function buildCumulativeSeries(
  bvid: string,
  snapshots: DailySnapshot[],
  metric: MetricKey,
): DataPoint[] {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const points: DataPoint[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const snap = sorted[i];
    const stats = snap.videos[bvid];
    if (!stats) continue;

    let value: number;
    if (metric === 'popularity') {
      const prevStats = i > 0 ? sorted[i - 1].videos[bvid] : null;
      value = calcPopularity(stats, prevStats);
    } else {
      value = stats[metric];
    }

    points.push({ date: snap.date, value });
  }

  return points;
}

export function buildDeltaSeries(
  bvid: string,
  snapshots: DailySnapshot[],
  metric: MetricKey,
): DataPoint[] {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const points: DataPoint[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const snap = sorted[i];
    const stats = snap.videos[bvid];
    if (!stats) continue;

    const prevStats = i > 0 ? sorted[i - 1].videos[bvid] : null;

    let value: number;
    if (metric === 'popularity') {
      const currScore = calcPopularity(stats, prevStats);
      const prevScore = prevStats && i > 1
        ? calcPopularity(prevStats, sorted[i - 2].videos[bvid] ?? null)
        : 0;
      value = currScore - prevScore;
    } else {
      value = prevStats ? stats[metric] - prevStats[metric] : stats[metric];
    }

    points.push({ date: snap.date, value });
  }

  return points;
}

export function detectEvents(
  video: VideoMeta,
  deltaSeries: DataPoint[],
): EventMarker[] {
  const markers: EventMarker[] = [];

  const pubDate = new Date(video.pubdate * 1000).toISOString().split('T')[0];
  markers.push({ date: pubDate, type: 'publish', label: '发布' });

  if (deltaSeries.length >= 3) {
    const avgDelta = deltaSeries.reduce((sum, p) => sum + Math.abs(p.value), 0) / deltaSeries.length;
    for (const point of deltaSeries) {
      if (Math.abs(point.value) > avgDelta * 2 && avgDelta > 0) {
        markers.push({
          date: point.date,
          type: 'spike',
          label: point.value > 0 ? '数据飙升' : '数据骤降',
        });
      }
    }
  }

  return markers;
}

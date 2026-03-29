import fs from 'fs';
import path from 'path';
import type { VideoMeta, DailySnapshot, CandlePoint, MetricKey, VideoStats, EventMarker } from './types';
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

export function buildCandles(
  bvid: string,
  snapshots: DailySnapshot[],
  metric: MetricKey,
): CandlePoint[] {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const candles: CandlePoint[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const snap = sorted[i];
    const stats = snap.videos[bvid];
    if (!stats) continue;

    const prevStats = i > 0 ? sorted[i - 1].videos[bvid] : null;

    let closeVal: number;
    let openVal: number;

    if (metric === 'popularity') {
      closeVal = calcPopularity(stats, prevStats);
      openVal = i > 0 && prevStats
        ? calcPopularity(prevStats, i > 1 ? sorted[i - 2].videos[bvid] ?? null : null)
        : 0;
    } else {
      closeVal = stats[metric];
      openVal = prevStats ? prevStats[metric] : 0;
    }

    const high = Math.max(openVal, closeVal);
    const low = Math.min(openVal, closeVal);

    candles.push({
      date: snap.date,
      open: openVal,
      close: closeVal,
      high,
      low,
      delta: closeVal - openVal,
    });
  }

  return candles;
}

export function detectEvents(
  video: VideoMeta,
  candles: CandlePoint[],
): EventMarker[] {
  const markers: EventMarker[] = [];

  // Publish date marker
  const pubDate = new Date(video.pubdate * 1000).toISOString().split('T')[0];
  markers.push({ date: pubDate, type: 'publish', label: '发布' });

  // Spike detection: delta > 2x average delta
  if (candles.length >= 3) {
    const avgDelta = candles.reduce((sum, c) => sum + Math.abs(c.delta), 0) / candles.length;
    for (const candle of candles) {
      if (Math.abs(candle.delta) > avgDelta * 2 && avgDelta > 0) {
        markers.push({
          date: candle.date,
          type: 'spike',
          label: candle.delta > 0 ? '数据飙升' : '数据骤降',
        });
      }
    }
  }

  return markers;
}

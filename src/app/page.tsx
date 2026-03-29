import { loadVideos, loadSnapshots, buildCandles, detectEvents } from '@/lib/data';
import { calcPopularity } from '@/lib/popularity';
import type { MetricKey } from '@/lib/types';
import ClientPage from './ClientPage';

export default function Home() {
  const videos = loadVideos();
  const snapshots = loadSnapshots();

  // Pre-build all candle data for all videos and metrics
  const metrics: MetricKey[] = ['view', 'like', 'favorite', 'popularity'];
  const allCandles: Record<string, Record<MetricKey, any>> = {};
  const allMarkers: Record<string, any> = {};
  const latestStats: Record<string, any> = {};

  const latest = snapshots[snapshots.length - 1];
  const prevSnap = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;

  for (const video of videos) {
    allCandles[video.bvid] = {} as any;
    for (const m of metrics) {
      allCandles[video.bvid][m] = buildCandles(video.bvid, snapshots, m);
    }
    allMarkers[video.bvid] = detectEvents(video, allCandles[video.bvid].view);
    latestStats[video.bvid] = latest?.videos[video.bvid] ?? null;
  }

  // Compute latest popularity scores
  const popularityScores: Record<string, { score: number; delta: number }> = {};
  for (const video of videos) {
    const curr = latest?.videos[video.bvid];
    const prev = prevSnap?.videos[video.bvid] ?? null;
    const prev2 = snapshots.length > 2 ? snapshots[snapshots.length - 3]?.videos[video.bvid] ?? null : null;
    const score = curr ? calcPopularity(curr, prev) : 0;
    const prevScore = prev ? calcPopularity(prev, prev2) : 0;
    popularityScores[video.bvid] = { score, delta: score - prevScore };
  }

  return (
    <ClientPage
      videos={videos}
      allCandles={allCandles}
      allMarkers={allMarkers}
      latestStats={latestStats}
      popularityScores={popularityScores}
    />
  );
}

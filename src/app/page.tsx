import { loadVideos, loadSnapshots, buildCumulativeSeries, buildDeltaSeries, detectEvents } from '@/lib/data';
import { calcPopularity } from '@/lib/popularity';
import type { MetricKey } from '@/lib/types';
import ClientPage from './ClientPage';

export default function Home() {
  const videos = loadVideos();
  const snapshots = loadSnapshots();

  const metrics: MetricKey[] = ['view', 'like', 'favorite', 'popularity'];
  const allCumulative: Record<string, Record<MetricKey, any>> = {};
  const allDeltas: Record<string, Record<MetricKey, any>> = {};
  const allMarkers: Record<string, any> = {};
  const latestStats: Record<string, any> = {};

  const latest = snapshots[snapshots.length - 1];
  const prevSnap = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;

  for (const video of videos) {
    allCumulative[video.bvid] = {} as any;
    allDeltas[video.bvid] = {} as any;
    for (const m of metrics) {
      allCumulative[video.bvid][m] = buildCumulativeSeries(video.bvid, snapshots, m);
      allDeltas[video.bvid][m] = buildDeltaSeries(video.bvid, snapshots, m);
    }
    allMarkers[video.bvid] = detectEvents(video, allDeltas[video.bvid].view);
    latestStats[video.bvid] = latest?.videos[video.bvid] ?? null;
  }

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
      allCumulative={allCumulative}
      allDeltas={allDeltas}
      allMarkers={allMarkers}
      latestStats={latestStats}
      popularityScores={popularityScores}
    />
  );
}

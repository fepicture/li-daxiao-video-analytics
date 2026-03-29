'use client';

import { useState } from 'react';
import MetricChart from '@/components/MetricChart';
import MetricSwitcher from '@/components/MetricSwitcher';
import VideoCard from '@/components/VideoCard';
import PopularityIndex from '@/components/PopularityIndex';
import StatsOverview from '@/components/StatsOverview';
import { useMetric } from '@/hooks/useMetric';
import type { VideoMeta, DataPoint, EventMarker, VideoStats, MetricKey, ChartMode } from '@/lib/types';

interface Props {
  videos: VideoMeta[];
  allCumulative: Record<string, Record<MetricKey, DataPoint[]>>;
  allDeltas: Record<string, Record<MetricKey, DataPoint[]>>;
  allMarkers: Record<string, EventMarker[]>;
  latestStats: Record<string, VideoStats | null>;
  popularityScores: Record<string, { score: number; delta: number }>;
  snapshotCount: number;
}

export default function ClientPage({
  videos,
  allCumulative,
  allDeltas,
  allMarkers,
  latestStats,
  popularityScores,
  snapshotCount,
}: Props) {
  const [selectedBvid, setSelectedBvid] = useState(videos[0]?.bvid ?? '');
  const { metric, setMetric, label, allMetrics } = useMetric('view');
  const [chartMode, setChartMode] = useState<ChartMode>('cumulative');

  const data = chartMode === 'cumulative'
    ? (allCumulative[selectedBvid]?.[metric] ?? [])
    : (allDeltas[selectedBvid]?.[metric] ?? []);

  function addTradingMarkers(markers: EventMarker[], points: DataPoint[]): EventMarker[] {
    const enhanced = [...markers];
    for (const p of points) {
      const d = new Date(p.date + 'T00:00:00+08:00');
      if (d.getDay() === 1) {
        enhanced.push({ date: p.date, type: 'trading_open', label: '周一开盘' });
      }
    }
    return enhanced;
  }

  const markers = addTradingMarkers(allMarkers[selectedBvid] ?? [], data);
  const popularity = popularityScores[selectedBvid] ?? { score: 0, delta: 0 };
  const stats = latestStats[selectedBvid];
  const hasEnoughData = snapshotCount >= 3;

  return (
    <main className="max-w-lg mx-auto px-4 py-5 pb-20">
      <h1 className="text-lg font-bold">李大霄视频数据追踪</h1>
      <p className="text-xs text-slate-400 mt-1 mb-4">
        李大霄，英大证券首席经济学家，因频繁发表A股乐观言论而被散户广泛关注。
      </p>

      <div className="mb-4">
        <PopularityIndex score={popularity.score} delta={popularity.delta} />
      </div>

      <div className="mb-3">
        <MetricSwitcher current={metric} options={allMetrics} onChange={setMetric} />
      </div>

      {hasEnoughData && (
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setChartMode('cumulative')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              chartMode === 'cumulative'
                ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'
                : 'text-slate-400 active:bg-slate-700'
            }`}
          >
            累计
          </button>
          <button
            onClick={() => setChartMode('delta')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              chartMode === 'delta'
                ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'
                : 'text-slate-400 active:bg-slate-700'
            }`}
          >
            日增量
          </button>
        </div>
      )}

      <div className="bg-slate-800/50 rounded-xl p-3 mb-4">
        {hasEnoughData && data.length > 0 ? (
          <MetricChart data={data} markers={markers} metricLabel={label} mode={chartMode} />
        ) : stats ? (
          <StatsOverview stats={stats} snapshotCount={snapshotCount} />
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
            暂无数据
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-slate-300">近期视频</h2>
        {videos.map((v) => (
          <VideoCard
            key={v.bvid}
            video={v}
            stats={latestStats[v.bvid]}
            selected={v.bvid === selectedBvid}
            onSelect={() => setSelectedBvid(v.bvid)}
          />
        ))}
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        数据来源：B站公开数据 · 每4小时更新
      </div>
    </main>
  );
}

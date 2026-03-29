'use client';

import { useState } from 'react';
import CandlestickChart from '@/components/CandlestickChart';
import MetricSwitcher from '@/components/MetricSwitcher';
import VideoCard from '@/components/VideoCard';
import PopularityIndex from '@/components/PopularityIndex';
import { useMetric } from '@/hooks/useMetric';
import type { VideoMeta, CandlePoint, EventMarker, VideoStats, MetricKey } from '@/lib/types';

interface Props {
  videos: VideoMeta[];
  allCandles: Record<string, Record<MetricKey, CandlePoint[]>>;
  allMarkers: Record<string, EventMarker[]>;
  latestStats: Record<string, VideoStats | null>;
  popularityScores: Record<string, { score: number; delta: number }>;
}

export default function ClientPage({
  videos,
  allCandles,
  allMarkers,
  latestStats,
  popularityScores,
}: Props) {
  const [selectedBvid, setSelectedBvid] = useState(videos[0]?.bvid ?? '');
  const { metric, setMetric, label, allMetrics } = useMetric('view');

  const candles = allCandles[selectedBvid]?.[metric] ?? [];

  function addTradingMarkers(markers: EventMarker[], candles: CandlePoint[]): EventMarker[] {
    const enhanced = [...markers];
    // A-share trading sessions: 9:30-11:30, 13:00-15:00 Beijing time
    // For daily candles, we mark weekdays as trading days
    for (const c of candles) {
      const d = new Date(c.date + 'T00:00:00+08:00');
      const day = d.getDay();
      if (day >= 1 && day <= 5) {
        // Only mark Monday as start of trading week for visual rhythm
        if (day === 1) {
          enhanced.push({
            date: c.date,
            type: 'trading_open',
            label: '周一开盘',
          });
        }
      }
    }
    return enhanced;
  }

  const markers = addTradingMarkers(allMarkers[selectedBvid] ?? [], candles);
  const popularity = popularityScores[selectedBvid] ?? { score: 0, delta: 0 };

  return (
    <main className="max-w-lg mx-auto px-4 py-5 pb-20">
      {/* Header */}
      <h1 className="text-lg font-bold">李大霄视频数据追踪</h1>
      <p className="text-xs text-slate-400 mt-1 mb-4">
        李大霄，英大证券首席经济学家，因频繁发表A股乐观言论而被散户广泛关注。
      </p>

      {/* Popularity Index */}
      <div className="mb-4">
        <PopularityIndex score={popularity.score} delta={popularity.delta} />
      </div>

      {/* Metric Switcher */}
      <div className="mb-3">
        <MetricSwitcher current={metric} options={allMetrics} onChange={setMetric} />
      </div>

      {/* Candlestick Chart */}
      <div className="bg-slate-800/50 rounded-xl p-2 mb-4">
        {candles.length > 0 ? (
          <CandlestickChart candles={candles} markers={markers} metricLabel={label} />
        ) : (
          <div className="h-[320px] flex items-center justify-center text-slate-500 text-sm">
            暂无数据
          </div>
        )}
      </div>

      {/* Video List */}
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

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-500">
        数据来源：B站公开数据 · 每日更新
      </div>
    </main>
  );
}

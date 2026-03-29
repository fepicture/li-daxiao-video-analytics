import type { VideoStats } from '@/lib/types';

interface Props {
  stats: VideoStats;
  snapshotCount: number;
}

function formatNumber(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toLocaleString();
}

const STAT_CONFIG = [
  { key: 'view' as const, label: '播放', icon: '▶' },
  { key: 'like' as const, label: '点赞', icon: '👍' },
  { key: 'favorite' as const, label: '收藏', icon: '⭐' },
  { key: 'coin' as const, label: '投币', icon: '🪙' },
  { key: 'share' as const, label: '分享', icon: '↗' },
  { key: 'danmaku' as const, label: '弹幕', icon: '💬' },
];

export default function StatsOverview({ stats, snapshotCount }: Props) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {STAT_CONFIG.map(({ key, label, icon }) => (
          <div key={key} className="bg-slate-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold tabular-nums">{formatNumber(stats[key])}</div>
            <div className="text-xs text-slate-400 mt-1">{icon} {label}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 text-center mt-3">
        已采集 {snapshotCount} 次数据，趋势图将在采集 3 次后显示
      </p>
    </div>
  );
}

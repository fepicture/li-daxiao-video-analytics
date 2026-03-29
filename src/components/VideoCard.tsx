import type { VideoMeta, VideoStats } from '@/lib/types';

interface Props {
  video: VideoMeta;
  stats: VideoStats | null;
  selected: boolean;
  onSelect: () => void;
}

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toLocaleString();
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function VideoCard({ video, stats, selected, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full text-left p-3 rounded-lg transition-colors
        ${selected ? 'bg-slate-700 ring-1 ring-slate-500' : 'bg-slate-800 active:bg-slate-700'}
      `}
    >
      <div className="text-sm font-medium leading-snug line-clamp-2">
        {video.title}
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
        <span>{formatDate(video.pubdate)}</span>
        {stats && (
          <>
            <span>▶ {formatNumber(stats.view)}</span>
            <span>👍 {formatNumber(stats.like)}</span>
            <span>⭐ {formatNumber(stats.favorite)}</span>
          </>
        )}
      </div>
    </button>
  );
}

interface Props {
  score: number;
  delta: number;
}

export default function PopularityIndex({ score, delta }: Props) {
  const color = delta >= 0 ? 'text-up' : 'text-down';
  const arrow = delta >= 0 ? '↑' : '↓';

  return (
    <div className="flex items-baseline gap-2 px-1">
      <span className="text-2xl font-bold tabular-nums">{score.toFixed(1)}</span>
      <span className={`text-sm font-medium ${color}`}>
        {arrow} {Math.abs(delta).toFixed(1)}
      </span>
      <span className="text-xs text-slate-400">热度指数</span>
    </div>
  );
}

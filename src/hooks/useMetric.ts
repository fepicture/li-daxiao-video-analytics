'use client';

import { useState, useCallback } from 'react';
import type { MetricKey } from '@/lib/types';

const METRIC_LABELS: Record<MetricKey, string> = {
  view: '播放量',
  like: '点赞数',
  favorite: '收藏数',
  popularity: '热度指数',
};

export function useMetric(initial: MetricKey = 'view') {
  const [metric, setMetric] = useState<MetricKey>(initial);
  const label = METRIC_LABELS[metric];
  const allMetrics = Object.entries(METRIC_LABELS) as [MetricKey, string][];
  const cycle = useCallback(() => {
    const keys: MetricKey[] = ['view', 'like', 'favorite', 'popularity'];
    const idx = keys.indexOf(metric);
    setMetric(keys[(idx + 1) % keys.length]);
  }, [metric]);

  return { metric, setMetric, label, allMetrics, cycle };
}

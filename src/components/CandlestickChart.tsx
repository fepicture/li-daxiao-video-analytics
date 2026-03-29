'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { CandlestickChart as CandlestickSeries, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  MarkPointComponent,
  MarkLineComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { CandlePoint, EventMarker } from '@/lib/types';

echarts.use([
  CandlestickSeries,
  LineChart,
  GridComponent,
  TooltipComponent,
  MarkPointComponent,
  MarkLineComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

interface Props {
  candles: CandlePoint[];
  markers: EventMarker[];
  metricLabel: string;
}

const MARKER_SYMBOLS: Record<string, string> = {
  publish: 'diamond',
  spike: 'triangle',
  trading_open: 'circle',
  trading_close: 'circle',
};

export default function CandlestickChart({ candles, markers, metricLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const dates = candles.map((c) => c.date);
    // ECharts candlestick data format: [open, close, low, high]
    const ohlc = candles.map((c) => [c.open, c.close, c.low, c.high]);
    const deltas = candles.map((c) => c.delta);

    const markPoints = markers.map((m) => ({
      coord: [m.date, candles.find((c) => c.date === m.date)?.high ?? 0],
      name: m.label,
      symbol: MARKER_SYMBOLS[m.type] || 'pin',
      symbolSize: m.type === 'spike' ? 30 : 20,
      itemStyle: {
        color: m.type === 'publish' ? '#facc15' : m.type === 'spike' ? '#f97316' : '#64748b',
      },
      label: {
        show: true,
        formatter: m.label,
        fontSize: 10,
        color: '#f1f5f9',
      },
    }));

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        textStyle: { color: '#f1f5f9', fontSize: 12 },
        formatter(params: any) {
          const p = Array.isArray(params) ? params[0] : params;
          if (!p || !p.data) return '';
          const [open, close, low, high] = p.data;
          const delta = close - open;
          const arrow = delta >= 0 ? '↑' : '↓';
          const color = delta >= 0 ? '#ef4444' : '#22c55e';
          return `
            <div style="font-size:12px">
              <div>${p.axisValue}</div>
              <div>当前: <b>${close.toLocaleString()}</b></div>
              <div>变化: <span style="color:${color}">${arrow} ${Math.abs(delta).toLocaleString()}</span></div>
            </div>
          `;
        },
      },
      grid: {
        left: 8,
        right: 8,
        top: 32,
        bottom: 60,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          fontSize: 10,
          color: '#94a3b8',
          formatter(val: string) {
            return val.slice(5); // MM-DD
          },
        },
        axisLine: { lineStyle: { color: '#334155' } },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: {
          fontSize: 10,
          color: '#94a3b8',
          formatter(val: number) {
            if (val >= 10000) return (val / 10000).toFixed(1) + '万';
            return val.toString();
          },
        },
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          start: Math.max(0, 100 - (7 / Math.max(candles.length, 1)) * 100),
          end: 100,
        },
      ],
      series: [
        {
          name: metricLabel,
          type: 'candlestick',
          data: ohlc,
          itemStyle: {
            color: '#ef4444',        // up body fill (red in CN)
            color0: '#22c55e',       // down body fill (green in CN)
            borderColor: '#ef4444',
            borderColor0: '#22c55e',
          },
          markPoint: {
            data: markPoints,
            animation: false,
          },
        },
      ],
    };

    chartRef.current.setOption(option, true);

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [candles, markers, metricLabel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height: 320 }}
    />
  );
}

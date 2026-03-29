'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  MarkPointComponent,
  MarkLineComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { DataPoint, EventMarker, ChartMode } from '@/lib/types';

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  MarkPointComponent,
  MarkLineComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

interface Props {
  data: DataPoint[];
  markers: EventMarker[];
  metricLabel: string;
  mode: ChartMode;
}

const MARKER_SYMBOLS: Record<string, string> = {
  publish: 'diamond',
  spike: 'triangle',
  trading_open: 'circle',
  trading_close: 'circle',
};

function formatValue(val: number): string {
  if (val >= 10000) return (val / 10000).toFixed(1) + '万';
  return val.toLocaleString();
}

export default function MetricChart({ data, markers, metricLabel, mode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const dates = data.map((d) => d.date);
    const values = data.map((d) => d.value);

    const markPoints = markers.map((m) => {
      const point = data.find((d) => d.date === m.date);
      return {
        coord: [m.date, point?.value ?? 0],
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
      };
    });

    const series: any = mode === 'cumulative'
      ? {
          name: metricLabel,
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { width: 2, color: '#60a5fa' },
          itemStyle: { color: '#60a5fa' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(96, 165, 250, 0.25)' },
              { offset: 1, color: 'rgba(96, 165, 250, 0.02)' },
            ]),
          },
          markPoint: { data: markPoints, animation: false },
        }
      : {
          name: metricLabel + ' 日增量',
          type: 'bar',
          data: values.map((v) => ({
            value: v,
            itemStyle: {
              color: v >= 0 ? '#ef4444' : '#22c55e', // CN convention: red=up, green=down
            },
          })),
          markPoint: { data: markPoints, animation: false },
        };

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: mode === 'cumulative' ? 'line' : 'shadow' },
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        textStyle: { color: '#f1f5f9', fontSize: 12 },
        formatter(params: any) {
          const p = Array.isArray(params) ? params[0] : params;
          if (!p) return '';
          const val = typeof p.data === 'object' ? p.data.value : p.data;
          if (mode === 'cumulative') {
            return `<div style="font-size:12px">
              <div>${p.axisValue}</div>
              <div>${metricLabel}: <b>${formatValue(val)}</b></div>
            </div>`;
          }
          const arrow = val >= 0 ? '↑' : '↓';
          const color = val >= 0 ? '#ef4444' : '#22c55e';
          return `<div style="font-size:12px">
            <div>${p.axisValue}</div>
            <div>日增量: <span style="color:${color}">${arrow} ${formatValue(Math.abs(val))}</span></div>
          </div>`;
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
            if (Math.abs(val) >= 10000) return (val / 10000).toFixed(1) + '万';
            return val.toString();
          },
        },
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          start: Math.max(0, 100 - (14 / Math.max(data.length, 1)) * 100),
          end: 100,
        },
      ],
      series: [series],
    };

    chartRef.current.setOption(option, true);

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, markers, metricLabel, mode]);

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

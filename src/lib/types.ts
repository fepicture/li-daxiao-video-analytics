export interface VideoMeta {
  bvid: string;
  title: string;
  pubdate: number; // Unix timestamp
  duration: number; // seconds
  pic: string;
  owner: { mid: number; name: string };
}

export interface VideoStats {
  view: number;
  like: number;
  favorite: number;
  coin: number;
  share: number;
  danmaku: number;
  reply: number;
}

export interface DailySnapshot {
  date: string; // YYYY-MM-DD
  collected_at: string; // ISO 8601
  videos: Record<string, VideoStats>;
}

export interface CandlePoint {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  delta: number; // close - open
}

export type MetricKey = 'view' | 'like' | 'favorite' | 'popularity';

export interface EventMarker {
  date: string;
  type: 'publish' | 'spike' | 'trading_open' | 'trading_close';
  label: string;
}

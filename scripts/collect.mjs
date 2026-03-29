/**
 * Bilibili data collection script.
 * Fetches Li Daxiao video metadata and engagement metrics from public APIs.
 *
 * Usage: node scripts/collect.mjs
 *
 * Public Bilibili API endpoints used:
 * - Search: https://api.bilibili.com/x/web-interface/search/type
 * - Video info: https://api.bilibili.com/x/web-interface/view
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const SNAP_DIR = join(DATA_DIR, 'snapshots');

const SEARCH_KEYWORD = '李大霄';
const MAX_VIDEOS = 10;
const REQUEST_DELAY_MS = 1500; // Be polite to the API

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; LiDaxiaoAnalytics/0.1)',
  'Referer': 'https://www.bilibili.com',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function searchVideos(keyword, pageSize = 20) {
  const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(keyword)}&page=1&pagesize=${pageSize}&order=pubdate`;
  const data = await fetchJson(url);
  if (data.code !== 0) {
    console.error('Search API error:', data.message);
    return [];
  }
  const results = data.data?.result || [];
  return results.slice(0, MAX_VIDEOS).map((r) => ({
    bvid: r.bvid,
    title: r.title.replace(/<[^>]*>/g, ''), // Strip HTML highlight tags
    pubdate: r.pubdate,
    duration: parseDuration(r.duration),
    pic: r.pic.startsWith('//') ? 'https:' + r.pic : r.pic,
    owner: { mid: r.mid, name: r.author },
  }));
}

function parseDuration(dur) {
  if (typeof dur === 'number') return dur;
  // Format: "MM:SS" or "HH:MM:SS"
  const parts = String(dur).split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

async function fetchVideoStats(bvid) {
  const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
  const data = await fetchJson(url);
  if (data.code !== 0) {
    console.error(`Video API error for ${bvid}:`, data.message);
    return null;
  }
  const stat = data.data?.stat;
  if (!stat) return null;
  return {
    view: stat.view,
    like: stat.like,
    favorite: stat.favorite,
    coin: stat.coin,
    share: stat.share,
    danmaku: stat.danmaku,
    reply: stat.reply,
  };
}

async function main() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(SNAP_DIR)) mkdirSync(SNAP_DIR, { recursive: true });

  // Step 1: Search for recent videos
  console.log(`Searching for "${SEARCH_KEYWORD}" videos...`);
  const newVideos = await searchVideos(SEARCH_KEYWORD);
  console.log(`Found ${newVideos.length} videos from search.`);

  // Step 2: Merge with existing video list
  let existingVideos = [];
  const videosPath = join(DATA_DIR, 'videos.json');
  if (existsSync(videosPath)) {
    existingVideos = JSON.parse(readFileSync(videosPath, 'utf-8'));
  }

  const videoMap = new Map();
  for (const v of existingVideos) videoMap.set(v.bvid, v);
  for (const v of newVideos) videoMap.set(v.bvid, v);

  const allVideos = Array.from(videoMap.values()).sort((a, b) => b.pubdate - a.pubdate);
  writeFileSync(videosPath, JSON.stringify(allVideos, null, 2));
  console.log(`Total tracked videos: ${allVideos.length}`);

  // Step 3: Fetch stats for all tracked videos
  const today = new Date().toISOString().split('T')[0];
  const snapshot = {
    date: today,
    collected_at: new Date().toISOString(),
    videos: {},
  };

  for (const video of allVideos) {
    console.log(`Fetching stats for: ${video.bvid} — ${video.title.slice(0, 30)}...`);
    const stats = await fetchVideoStats(video.bvid);
    if (stats) {
      snapshot.videos[video.bvid] = stats;
    }
    await sleep(REQUEST_DELAY_MS);
  }

  // Step 4: Write snapshot
  const snapPath = join(SNAP_DIR, `${today}.json`);
  writeFileSync(snapPath, JSON.stringify(snapshot, null, 2));
  console.log(`Snapshot written: ${snapPath}`);
  console.log('Collection complete.');
}

main().catch((err) => {
  console.error('Collection failed:', err);
  process.exit(1);
});

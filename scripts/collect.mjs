/**
 * Bilibili data collection script for Li Daxiao (李大霄) videos.
 *
 * Strategy:
 * - The Bilibili search/space APIs require cookies, so we use the public
 *   video info API (/x/web-interface/view) which works without auth.
 * - We maintain a known list of BVIDs from Li Daxiao's official channel
 *   (mid: 2137589551) and also try the space API as a best-effort.
 * - Each run fetches fresh stats for all tracked videos.
 *
 * Usage: node scripts/collect.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const SNAP_DIR = join(DATA_DIR, 'snapshots');

const LI_DAXIAO_MID = 2137589551;
const REQUEST_DELAY_MS = 1500;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.bilibili.com',
};

// Known BVIDs from Li Daxiao's official channel (mid: 2137589551).
// These serve as seeds — new videos are discovered via the space API when possible.
const SEED_BVIDS = [
  'BV1WHQmBNE3X', // 成为李大霄粉丝的15个条件
  'BV1sQQRBoEKX', // 或迎来反弹的曙光
  'BV16yQdBHE7q', // 呼吁加大稳定力量
  'BV1MxQdBeEzV', // 呼吁稳市 保护散户
  'BV1yTAwzTEZp', // 游资的投降书
  'BV1unQ9BFEux', // 呼吁稳市 不必恐慌
  'BV1MUWPzzEXs', // 9.19 李大霄"大跳水"分析
  'BV1uez4BpEMD', // 突发停牌！下周五大预测
  'BV1yfzWBBEAy', // 封板不要秀肌肉
  'BV1wNQqBKEhu', // 业绩为王
  'BV1z86RBQEdD', // 增量资金来自何方
  'BV1memyB9ExY', // 展望2026机会与挑战
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null; // Graceful failure
  return res.json();
}

async function fetchVideoInfo(bvid) {
  const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
  const data = await fetchJson(url);
  if (!data || data.code !== 0) {
    console.warn(`  Skip ${bvid}: ${data?.message || 'request failed'}`);
    return null;
  }
  const d = data.data;
  const stat = d.stat;
  return {
    meta: {
      bvid: d.bvid,
      title: d.title,
      pubdate: d.pubdate,
      duration: d.duration,
      pic: d.pic,
      owner: { mid: d.owner.mid, name: d.owner.name },
    },
    stats: {
      view: stat.view,
      like: stat.like,
      favorite: stat.favorite,
      coin: stat.coin,
      share: stat.share,
      danmaku: stat.danmaku,
      reply: stat.reply,
    },
  };
}

// Best-effort: try the space API to discover new videos
async function tryDiscoverNewVideos() {
  const url = `https://api.bilibili.com/x/space/arc/search?mid=${LI_DAXIAO_MID}&ps=20&pn=1&order=pubdate`;
  const data = await fetchJson(url);
  if (!data || data.code !== 0) {
    console.log('Space API unavailable (requires cookies), using known BVIDs only.');
    return [];
  }
  const vlist = data.data?.list?.vlist || [];
  console.log(`Discovered ${vlist.length} videos from space API.`);
  return vlist.map((v) => v.bvid);
}

async function main() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(SNAP_DIR)) mkdirSync(SNAP_DIR, { recursive: true });

  // Step 1: Build full BVID list from all sources
  const bvidSet = new Set(SEED_BVIDS);

  // Try space API for new videos
  const discoveredBvids = await tryDiscoverNewVideos();
  for (const bvid of discoveredBvids) bvidSet.add(bvid);

  // Merge with existing tracked videos
  const videosPath = join(DATA_DIR, 'videos.json');
  let existingVideos = [];
  if (existsSync(videosPath)) {
    existingVideos = JSON.parse(readFileSync(videosPath, 'utf-8'));
    for (const v of existingVideos) bvidSet.add(v.bvid);
  }

  console.log(`Tracking ${bvidSet.size} videos total.`);

  // Step 2: Fetch info + stats for every BVID
  const videoMap = new Map();
  for (const v of existingVideos) videoMap.set(v.bvid, v);

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const hour = String(now.getUTCHours()).padStart(2, '0');
  const snapId = `${today}-${hour}`; // e.g. "2026-03-29-08"
  const snapshot = {
    date: today,
    collected_at: now.toISOString(),
    videos: {},
  };

  let fetched = 0;
  for (const bvid of bvidSet) {
    console.log(`[${++fetched}/${bvidSet.size}] Fetching ${bvid}...`);
    const result = await fetchVideoInfo(bvid);
    if (result) {
      // Only track videos from Li Daxiao's channel
      if (result.meta.owner.mid === LI_DAXIAO_MID) {
        videoMap.set(bvid, result.meta);
        snapshot.videos[bvid] = result.stats;
        console.log(`  ✓ ${result.meta.title.slice(0, 40)} (${result.stats.view} views)`);
      } else {
        console.log(`  ✗ Not Li Daxiao's video (owner: ${result.meta.owner.name}), skipping.`);
      }
    }
    await sleep(REQUEST_DELAY_MS);
  }

  // Step 3: Write video list (sorted by pubdate, newest first)
  const allVideos = Array.from(videoMap.values()).sort((a, b) => b.pubdate - a.pubdate);
  writeFileSync(videosPath, JSON.stringify(allVideos, null, 2));
  console.log(`\nWrote ${allVideos.length} videos to data/videos.json`);

  // Step 4: Write snapshot
  const snapPath = join(SNAP_DIR, `${snapId}.json`);
  writeFileSync(snapPath, JSON.stringify(snapshot, null, 2));
  console.log(`Wrote snapshot to data/snapshots/${snapId}.json`);
  console.log(`Collected stats for ${Object.keys(snapshot.videos).length} videos.`);
}

main().catch((err) => {
  console.error('Collection failed:', err);
  process.exit(1);
});

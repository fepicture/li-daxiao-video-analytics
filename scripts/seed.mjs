import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const SNAP_DIR = join(DATA_DIR, 'snapshots');

if (!existsSync(SNAP_DIR)) mkdirSync(SNAP_DIR, { recursive: true });

// Mock Li Daxiao videos
const videos = [
  {
    bvid: 'BV1seed00001',
    title: '李大霄：A股即将迎来重大转折点',
    pubdate: Math.floor(Date.now() / 1000) - 14 * 86400,
    duration: 612,
    pic: '',
    owner: { mid: 100001, name: '李大霄观点' },
  },
  {
    bvid: 'BV1seed00002',
    title: '李大霄最新观点：牛市已经开始了',
    pubdate: Math.floor(Date.now() / 1000) - 10 * 86400,
    duration: 485,
    pic: '',
    owner: { mid: 100001, name: '李大霄观点' },
  },
  {
    bvid: 'BV1seed00003',
    title: '李大霄解读：政策利好持续释放',
    pubdate: Math.floor(Date.now() / 1000) - 7 * 86400,
    duration: 723,
    pic: '',
    owner: { mid: 100001, name: '李大霄观点' },
  },
  {
    bvid: 'BV1seed00004',
    title: '李大霄：散户不要恐慌，钻石底已确认',
    pubdate: Math.floor(Date.now() / 1000) - 4 * 86400,
    duration: 390,
    pic: '',
    owner: { mid: 100001, name: '李大霄观点' },
  },
  {
    bvid: 'BV1seed00005',
    title: '李大霄紧急发声：这个板块即将爆发',
    pubdate: Math.floor(Date.now() / 1000) - 1 * 86400,
    duration: 556,
    pic: '',
    owner: { mid: 100001, name: '李大霄观点' },
  },
];

writeFileSync(join(DATA_DIR, 'videos.json'), JSON.stringify(videos, null, 2));
console.log('Wrote data/videos.json');

// Generate 14 days of snapshots
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const now = new Date();
for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
  const date = new Date(now);
  date.setDate(date.getDate() - dayOffset);
  const dateStr = date.toISOString().split('T')[0];

  const snapshot = {
    date: dateStr,
    collected_at: date.toISOString(),
    videos: {},
  };

  for (const v of videos) {
    const pubDate = new Date(v.pubdate * 1000);
    // Only include video if published before or on this date
    if (pubDate > date) continue;

    const daysLive = Math.floor((date.getTime() - pubDate.getTime()) / 86400000) + 1;

    // Engagement follows a decay curve: high initial, then tapering
    const decayFactor = Math.max(0.1, 1 / (1 + daysLive * 0.3));
    const baseViews = rand(5000, 30000);
    const dailyViews = Math.floor(baseViews * decayFactor) + rand(100, 500);

    // Cumulative values grow over time
    const totalViews = dailyViews * daysLive + rand(0, 2000);

    snapshot.videos[v.bvid] = {
      view: totalViews,
      like: Math.floor(totalViews * (rand(3, 8) / 100)),
      favorite: Math.floor(totalViews * (rand(1, 3) / 100)),
      coin: Math.floor(totalViews * (rand(1, 4) / 100)),
      share: Math.floor(totalViews * (rand(0.5, 2) / 100)),
      danmaku: Math.floor(totalViews * (rand(1, 5) / 100)),
      reply: Math.floor(totalViews * (rand(0.5, 3) / 100)),
    };
  }

  writeFileSync(join(SNAP_DIR, `${dateStr}.json`), JSON.stringify(snapshot, null, 2));
  console.log(`Wrote data/snapshots/${dateStr}.json`);
}

console.log('Seed data generated successfully.');

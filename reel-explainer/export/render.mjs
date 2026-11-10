// export/render.mjs — export image par image → out/reel.mp4
// Usage : node export/render.mjs   (options : --story chauffe-eau --out reel.mp4 --fps 30 --from 0 --to <s> --keep)
import { createServer } from 'node:http';
import { readFile, mkdir, rm, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright'));
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const KEEP = process.argv.includes('--keep');
const FRAMES = path.join(ROOT, 'frames'), OUT = path.join(ROOT, 'out');

// mini serveur statique (les modules ES ne marchent pas en file://)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(ROOT)) throw 0;
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

await rm(FRAMES, { recursive: true, force: true }); await mkdir(FRAMES, { recursive: true }); await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('pageerror:', e.message));
const story = arg('story');
await page.goto(`http://localhost:${port}/index.html?export=1${story ? '&story=' + story : ''}`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => document.fonts.ready.then(() => 1));
await page.waitForFunction(() => window.__reel, null, { timeout: 30000 });
const { fps: fps0, duration } = await page.evaluate(() => ({ fps: window.__reel.fps, duration: window.__reel.duration }));
const fps = +arg('fps', fps0), from = +arg('from', 0), to = Math.min(+arg('to', duration), duration);
const n = Math.round((to - from) * fps);
console.log(`→ ${n} frames @ ${fps} fps (${(to - from).toFixed(2)} s)`);
const stage = await page.$('#stage');
const t0 = Date.now();
for (let i = 0; i < n; i++) {
  await page.evaluate(t => { window.__reel.tl.seek(t, false); }, from + i / fps);
  await stage.screenshot({ path: path.join(FRAMES, String(i + 1).padStart(4, '0') + '.png') });
  if (i % 30 === 0) process.stdout.write(`\r  frame ${i + 1}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
await browser.close(); server.close();
console.log('\n→ ffmpeg');

const voice = path.join(ROOT, 'audio', 'voice.mp3');
const hasVoice = await access(voice).then(() => true, () => false);
const out = path.join(OUT, arg('out', story ? story + '.mp4' : 'reel.mp4'));
const ff = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(FRAMES, '%04d.png')];
if (hasVoice) ff.push('-i', voice);
ff.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-r', String(fps), '-movflags', '+faststart');
if (hasVoice) ff.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
ff.push(out);
const r = spawnSync('ffmpeg', ff, { stdio: 'inherit' });
if (r.status !== 0) { console.error('ffmpeg a échoué'); process.exit(1); }
if (!KEEP) await rm(FRAMES, { recursive: true, force: true });
console.log(`✓ ${path.relative(process.cwd(), out)}${hasVoice ? ' (avec voice.mp3)' : ''}`);

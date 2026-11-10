// outil de vérification : node shot.mjs "<query>" out.png [seekSeconds...]
import { createRequire } from 'module';
const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright'));
const [q = '', out = 'shot.png', ...times] = process.argv.slice(2);
const log = (...a) => process.env.DBG && console.log(...a);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', e => console.log('pageerror:', e.message));
await p.goto('http://localhost:5173/index.html?export=1' + q, { waitUntil: 'domcontentloaded' }); log('goto');
await p.waitForFunction(() => window.__reel || window.__pg, null, { timeout: 15000 }); log('ready');
await p.waitForTimeout(300);
if (!times.length) await p.screenshot({ path: out });
for (const t of times) { await p.evaluate(t => { window.__reel.tl.seek(+t, false); }, t); await p.screenshot({ path: out.replace('.png', `-${t}.png`) }); log('shot', t); }
await b.close();

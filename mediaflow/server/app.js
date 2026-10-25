import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { parseUserUrl, safeFetch, safeBaseName, UrlError } from './security.js';
import { findConnector, connectors, directConnector, MAX_REMOTE_BYTES, MEDIA_MIME } from './connectors.js';
import { FORMATS, probe, availableOptions, buildArgs, runFfmpeg, extractSubtitle, srtToText, MAX_DURATION_S } from './media.js';

const ERRORS = {
  url_empty: 400, url_invalid: 400, url_private: 400, unsupported_source: 400, not_media: 415,
  connector_not_configured: 501, source_unreachable: 502, too_many_redirects: 502, too_large: 413,
  bad_session: 401, not_found: 404, bad_request: 400, invalid_media: 415, too_long: 413,
  transcription_not_configured: 501, subtitle_failed: 422, not_ready: 409,
};

export function createApp({ workDir = path.join(os.tmpdir(), 'mediaflow'), ttlMinutes = Number(process.env.FILE_TTL_MIN || 60), maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 1024) } = {}) {
  fs.mkdirSync(workDir, { recursive: true, mode: 0o700 });
  const app = express();
  const uploads = new Map(); // id -> { owner, path, name, meta, expires }
  const tasks = new Map();   // id -> task
  const ttl = ttlMinutes * 60 * 1000;

  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: Number(process.env.RATE_LIMIT_PER_MIN || 60), standardHeaders: true, legacyHeaders: false, message: { error: 'rate_limited' } }));

  // Anonymous sessions: the browser sends a random id; every upload/task is bound to it.
  app.use('/api', (req, res, next) => {
    const sid = req.get('x-session-id');
    if (!sid || !/^[a-f0-9-]{32,40}$/i.test(sid)) return res.status(401).json({ error: 'bad_session' });
    req.sid = sid;
    next();
  });

  const fail = (code) => Object.assign(new Error(code), { code });
  const owned = (map, req) => {
    const item = map.get(req.params.id || req.body?.uploadId);
    if (!item || item.owner !== req.sid) throw fail('not_found'); // same response for "not yours"
    return item;
  };
  const publicTask = (t) => ({
    id: t.id, name: t.name, type: t.type, status: t.status, progress: Math.round(t.progress),
    size: t.size, outputName: t.outputName, error: t.error, createdAt: t.createdAt,
    finishedAt: t.finishedAt, expiresAt: t.expiresAt, format: t.format, height: t.height,
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/capabilities', (_req, res) => res.json({
    connectors: [...connectors, directConnector].map((c) => ({ id: c.id, name: c.name, configured: c.configured, capabilities: c.capabilities })),
    formats: Object.keys(FORMATS),
    transcription: false,
    limits: { uploadMb: maxUploadMb, remoteMb: MAX_REMOTE_BYTES / 1048576, durationMin: MAX_DURATION_S / 60, ttlMinutes },
  }));

  app.post('/api/media/analyze', async (req, res, next) => {
    try {
      const url = parseUserUrl(req.body?.url);
      const connector = findConnector(url);
      const info = await connector.analyze(url);
      // Without a probe we cannot know resolutions, so offer format choices only (no upscaled lies).
      const opts = Object.entries(FORMATS).map(([format, f]) => ({
        format, kind: f.kind, height: null, enabled: info.mediaType === 'video' || f.kind === 'audio', reason: null,
      }));
      res.json({ ...info, platform: connector.name, options: opts, url: url.toString() });
    } catch (e) { next(e); }
  });

  const upload = multer({
    storage: multer.diskStorage({ destination: workDir, filename: (_r, _f, cb) => cb(null, crypto.randomUUID()) }),
    limits: { fileSize: maxUploadMb * 1024 * 1024, files: 1 },
  });

  app.post('/api/media/upload', upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) throw fail('bad_request');
      let meta;
      try { meta = await probe(req.file.path); } catch { await fsp.rm(req.file.path, { force: true }); throw fail('invalid_media'); }
      if (!meta.hasVideo && !meta.hasAudio && !meta.subtitles.length) { await fsp.rm(req.file.path, { force: true }); throw fail('invalid_media'); }
      const id = crypto.randomUUID();
      uploads.set(id, { id, owner: req.sid, path: req.file.path, name: req.file.originalname, meta, expires: Date.now() + ttl });
      res.json({ uploadId: id, title: req.file.originalname, source: 'upload', platform: 'Fichier local', mediaType: meta.hasVideo ? 'video' : 'audio', ...meta, options: availableOptions(meta) });
    } catch (e) { next(e); }
  });

  async function download(task, url) {
    const res = await safeFetch(url, { timeoutMs: 30000, signal: task.abort.signal });
    if (!res.ok || !res.body) throw fail('source_unreachable');
    if (!MEDIA_MIME.test(res.headers.get('content-type') || '')) throw fail('not_media');
    const total = Number(res.headers.get('content-length')) || 0;
    if (total > MAX_REMOTE_BYTES) throw fail('too_large');
    let got = 0;
    const meter = new Transform({
      transform(chunk, _e, cb) {
        got += chunk.length;
        if (got > MAX_REMOTE_BYTES) return cb(fail('too_large'));
        if (total) task.progress = (got / total) * 30;
        cb(null, chunk);
      },
    });
    const file = path.join(workDir, crypto.randomUUID());
    task.files.push(file);
    await pipeline(Readable.fromWeb(res.body), meter, fs.createWriteStream(file, { mode: 0o600 }), { signal: task.abort.signal });
    return file;
  }

  async function run(task, src) {
    try {
      let input = src.path;
      if (src.url) { task.status = 'analyzing'; input = await download(task, src.url); }
      const meta = src.meta || await probe(input).catch(() => { throw fail('invalid_media'); });
      const f = FORMATS[task.format];
      if (f.kind === 'audio' && !meta.hasAudio) throw fail('invalid_media');
      if (f.kind === 'video' && !meta.hasVideo) throw fail('invalid_media');
      if (meta.duration && meta.duration > MAX_DURATION_S) throw fail('too_long');
      if (task.cancelled) throw fail('cancelled');
      task.status = 'processing';
      const out = path.join(workDir, crypto.randomUUID() + '.' + f.ext);
      task.files.push(out);
      const span = src.url ? 70 : 100, offset = src.url ? 30 : 0;
      const job = runFfmpeg(buildArgs(input, out, task.format, task.height, meta.height), meta.duration, (p) => { task.progress = offset + (p * span) / 100; });
      task.proc = job.proc;
      await job.done;
      task.output = out;
      task.size = (await fsp.stat(out)).size;
      task.status = 'ready';
      task.progress = 100;
    } catch (e) {
      if (task.cancelled) task.status = 'cancelled';
      else { task.status = 'failed'; task.error = ERRORS[e.code] ? e.code : (e.message === 'convert_failed' ? 'convert_failed' : 'processing_error'); }
    } finally {
      task.proc = null;
      task.finishedAt = Date.now();
      task.expiresAt = Date.now() + ttl;
    }
  }

  app.post('/api/media/convert', (req, res, next) => {
    try {
      const { format, height, uploadId, url } = req.body || {};
      if (!FORMATS[format]) throw fail('bad_request');
      if (height != null && (!Number.isInteger(height) || height < 144 || height > 4320)) throw fail('bad_request');
      let src, name;
      if (uploadId) {
        const up = owned(uploads, req);
        const opt = availableOptions(up.meta).find((o) => o.format === format && (FORMATS[format].kind === 'audio' || o.height === height));
        if (!opt || !opt.enabled) throw fail('bad_request');
        src = up; name = up.name;
      } else if (url) {
        const u = parseUserUrl(url);
        if (findConnector(u) !== directConnector) throw fail('connector_not_configured');
        src = { url: u.toString() }; name = decodeURIComponent(u.pathname.split('/').pop() || u.hostname);
      } else throw fail('bad_request');
      const id = crypto.randomUUID();
      const task = {
        id, owner: req.sid, name, type: FORMATS[format].kind === 'audio' ? 'extract_audio' : 'convert', format, height: height ?? null,
        status: 'queued', progress: 0, size: null, error: null, createdAt: Date.now(), files: [], abort: new AbortController(),
        outputName: `${safeBaseName(name)}${height ? '-' + height + 'p' : ''}.${FORMATS[format].ext}`,
      };
      tasks.set(id, task);
      run(task, src);
      res.status(202).json(publicTask(task));
    } catch (e) { next(e); }
  });

  app.post('/api/media/transcribe', (_req, _res, next) => next(fail('transcription_not_configured')));

  app.get('/api/media/:id/subtitles/:index', async (req, res, next) => {
    try {
      const up = owned(uploads, req);
      const idx = Number(req.params.index);
      const track = up.meta.subtitles[idx];
      if (!track || !track.textBased) throw fail('not_found');
      const fmt = ['srt', 'vtt', 'txt'].includes(req.query.format) ? req.query.format : 'srt';
      const srt = await extractSubtitle(up.path, idx, fmt === 'vtt' ? 'vtt' : 'srt').catch(() => { throw fail('subtitle_failed'); });
      res.type('text/plain; charset=utf-8').send(fmt === 'txt' ? srtToText(srt) : srt);
    } catch (e) { next(e); }
  });

  app.get('/api/tasks', (req, res) => res.json([...tasks.values()].filter((t) => t.owner === req.sid).map(publicTask)));
  app.get('/api/tasks/:id', (req, res, next) => { try { res.json(publicTask(owned(tasks, req))); } catch (e) { next(e); } });

  app.post('/api/tasks/:id/cancel', (req, res, next) => {
    try {
      const t = owned(tasks, req);
      if (['queued', 'analyzing', 'processing'].includes(t.status)) {
        t.cancelled = true;
        t.abort.abort();
        t.proc?.kill('SIGKILL');
      }
      res.json(publicTask(t));
    } catch (e) { next(e); }
  });

  app.get('/api/tasks/:id/file', (req, res, next) => {
    try {
      const t = owned(tasks, req);
      if (t.status !== 'ready' || !t.output) throw fail('not_ready');
      res.download(t.output, t.outputName, { headers: { 'Content-Type': FORMATS[t.format].mime, 'Cache-Control': 'private, no-store' } });
    } catch (e) { next(e); }
  });

  const removeTask = async (t) => {
    t.cancelled = true; t.abort.abort(); t.proc?.kill('SIGKILL');
    tasks.delete(t.id);
    await Promise.all(t.files.map((f) => fsp.rm(f, { force: true })));
  };
  app.delete('/api/tasks/:id', async (req, res, next) => {
    try { await removeTask(owned(tasks, req)); res.status(204).end(); } catch (e) { next(e); }
  });

  // Errors: map known codes to friendly ids, never leak internals.
  app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'too_large' : 'bad_request' });
    const code = err instanceof UrlError || ERRORS[err.code] ? err.code : 'server_error';
    if (code === 'server_error') console.error('[mediaflow]', err.message);
    res.status(ERRORS[code] || 500).json({ error: code });
  });

  // Expiry sweep: temporary files never outlive the configured TTL.
  const sweep = setInterval(async () => {
    const now = Date.now();
    for (const t of tasks.values()) if (t.expiresAt && t.expiresAt < now) await removeTask(t);
    for (const u of uploads.values()) if (u.expires < now) { uploads.delete(u.id); await fsp.rm(u.path, { force: true }); }
  }, 60_000);
  sweep.unref();

  app.mediaflow = { tasks, uploads, sweepNow: async () => { for (const t of tasks.values()) t.expiresAt = 0; } };
  return app;
}

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mf-test-'));
const SID = 'a'.repeat(32), OTHER = 'b'.repeat(32);
let app, video, subbed;

const waitFor = async (id, sid = SID) => {
  for (let i = 0; i < 200; i++) {
    const { body } = await request(app).get(`/api/tasks/${id}`).set('x-session-id', sid);
    if (!['queued', 'analyzing', 'processing'].includes(body.status)) return body;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('timeout');
};
const upload = (file, sid = SID) => request(app).post('/api/media/upload').set('x-session-id', sid).attach('file', file);

beforeAll(() => {
  app = createApp({ workDir: path.join(dir, 'work'), maxUploadMb: 5 });
  video = path.join(dir, 'clip.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc=size=1280x720:rate=25:duration=2', '-f', 'lavfi', '-i', 'sine=duration=2', '-shortest', '-c:v', 'libx264', '-c:a', 'aac', video]);
  const srt = path.join(dir, 's.srt');
  fs.writeFileSync(srt, '1\n00:00:00,000 --> 00:00:01,500\nBonjour le monde\n\n2\n00:00:01,500 --> 00:00:02,000\nSecond\n');
  subbed = path.join(dir, 'sub.mkv');
  execFileSync('ffmpeg', ['-v', 'error', '-i', video, '-i', srt, '-map', '0', '-map', '1', '-c', 'copy', '-metadata:s:s:0', 'language=fra', subbed]);
});

describe('session & validation', () => {
  it('rejects requests without a session', async () => {
    expect((await request(app).get('/api/tasks')).status).toBe(401);
  });
  it.each([
    ['', 'url_empty'], ['pas un lien', 'url_invalid'], ['ftp://x.com/a.mp4', 'url_invalid'],
    ['http://127.0.0.1/a.mp4', 'url_private'], ['http://localhost:8787/a', 'url_private'], ['http://[::1]/a', 'url_private'],
    ['http://192.168.1.4/a.mp4', 'url_private'], ['http://169.254.169.254/latest', 'url_private'],
  ])('analyze %j -> %s', async (url, code) => {
    const res = await request(app).post('/api/media/analyze').set('x-session-id', SID).send({ url });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(code);
  });
  it('reports unconfigured platform connectors instead of faking results', async () => {
    for (const url of ['https://www.youtube.com/watch?v=abc', 'https://www.instagram.com/p/x', 'https://www.tiktok.com/@a/video/1']) {
      const res = await request(app).post('/api/media/analyze').set('x-session-id', SID).send({ url });
      expect(res.status).toBe(501);
      expect(res.body.error).toBe('connector_not_configured');
    }
  });
  it('lists connectors with real capabilities', async () => {
    const { body } = await request(app).get('/api/capabilities').set('x-session-id', SID);
    expect(body.connectors.find((c) => c.id === 'youtube').configured).toBe(false);
    expect(body.connectors.find((c) => c.id === 'direct').configured).toBe(true);
    expect(body.transcription).toBe(false);
  });
  it('transcription reports not configured', async () => {
    expect((await request(app).post('/api/media/transcribe').set('x-session-id', SID)).body.error).toBe('transcription_not_configured');
  });
});

describe('upload & conversion', () => {
  it('rejects non-media files by content', async () => {
    const fake = path.join(dir, 'fake.mp4');
    fs.writeFileSync(fake, 'not a video at all');
    const res = await upload(fake);
    expect(res.status).toBe(415);
    expect(res.body.error).toBe('invalid_media');
  });
  it('rejects files over the size limit', async () => {
    const big = path.join(dir, 'big.bin');
    fs.writeFileSync(big, Buffer.alloc(6 * 1024 * 1024));
    expect((await upload(big)).body.error).toBe('too_large');
  });
  it('probes real metadata and never offers upscaled resolutions', async () => {
    const { body } = await upload(video);
    expect(body.height).toBe(720);
    expect(body.duration).toBeGreaterThan(1.5);
    const heights = body.options.filter((o) => o.format === 'mp4').map((o) => o.height);
    expect(heights).toEqual([720, 480, 360]);
  });
  it('converts to mp3 and serves the file only to its owner', async () => {
    const up = await upload(video);
    const created = await request(app).post('/api/media/convert').set('x-session-id', SID).send({ uploadId: up.body.uploadId, format: 'mp3', height: null });
    expect(created.status).toBe(202);
    const done = await waitFor(created.body.id);
    expect(done.status).toBe('ready');
    expect(done.progress).toBe(100);
    expect((await request(app).get(`/api/tasks/${done.id}`).set('x-session-id', OTHER)).status).toBe(404);
    expect((await request(app).get(`/api/tasks/${done.id}/file`).set('x-session-id', OTHER)).status).toBe(404);
    const file = await request(app).get(`/api/tasks/${done.id}/file`).set('x-session-id', SID).buffer(true);
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toContain('audio/mpeg');
  });
  it('downscales video to 360p', async () => {
    const up = await upload(video);
    const created = await request(app).post('/api/media/convert').set('x-session-id', SID).send({ uploadId: up.body.uploadId, format: 'mp4', height: 360 });
    expect((await waitFor(created.body.id)).status).toBe('ready');
  });
  it('refuses an upscale request', async () => {
    const up = await upload(video);
    const res = await request(app).post('/api/media/convert').set('x-session-id', SID).send({ uploadId: up.body.uploadId, format: 'mp4', height: 2160 });
    expect(res.status).toBe(400);
  });
  it('another session cannot use my upload', async () => {
    const up = await upload(video);
    const res = await request(app).post('/api/media/convert').set('x-session-id', OTHER).send({ uploadId: up.body.uploadId, format: 'mp3', height: null });
    expect(res.status).toBe(404);
  });
  it('cancels a running task', async () => {
    const up = await upload(video);
    const created = await request(app).post('/api/media/convert').set('x-session-id', SID).send({ uploadId: up.body.uploadId, format: 'webm', height: 720 });
    await request(app).post(`/api/tasks/${created.body.id}/cancel`).set('x-session-id', SID);
    expect((await waitFor(created.body.id)).status).toBe('cancelled');
  });
  it('deletes tasks and expires files', async () => {
    const up = await upload(video);
    const created = await request(app).post('/api/media/convert').set('x-session-id', SID).send({ uploadId: up.body.uploadId, format: 'wav', height: null });
    await waitFor(created.body.id);
    expect((await request(app).delete(`/api/tasks/${created.body.id}`).set('x-session-id', SID)).status).toBe(204);
    expect((await request(app).get(`/api/tasks/${created.body.id}`).set('x-session-id', SID)).status).toBe(404);
  });
});

describe('subtitles', () => {
  it('detects and exports embedded tracks with timestamps', async () => {
    const { body } = await upload(subbed);
    expect(body.subtitles[0]).toMatchObject({ language: 'fra', textBased: true });
    const srt = await request(app).get(`/api/media/${body.uploadId}/subtitles/0?format=srt`).set('x-session-id', SID);
    expect(srt.text).toMatch(/00:00:00,0\d\d --> 00:00:01,5\d\d/);
    const vtt = await request(app).get(`/api/media/${body.uploadId}/subtitles/0?format=vtt`).set('x-session-id', SID);
    expect(vtt.text).toMatch(/^WEBVTT/);
    const txt = await request(app).get(`/api/media/${body.uploadId}/subtitles/0?format=txt`).set('x-session-id', SID);
    expect(txt.text.trim()).toBe('Bonjour le monde\nSecond');
  });
});

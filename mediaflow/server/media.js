import { spawn } from 'node:child_process';

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe';
export const MAX_DURATION_S = Number(process.env.MAX_DURATION_MIN || 120) * 60;

// Output presets. Arguments are fixed arrays: no user input is ever interpolated into a shell.
export const FORMATS = {
  mp4: { kind: 'video', ext: 'mp4', mime: 'video/mp4', args: ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart'] },
  webm: { kind: 'video', ext: 'webm', mime: 'video/webm', args: ['-c:v', 'libvpx-vp9', '-deadline', 'realtime', '-cpu-used', '8', '-b:v', '0', '-crf', '33', '-c:a', 'libopus', '-b:a', '128k'] },
  mov: { kind: 'video', ext: 'mov', mime: 'video/quicktime', args: ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '160k'] },
  mp3: { kind: 'audio', ext: 'mp3', mime: 'audio/mpeg', args: ['-vn', '-c:a', 'libmp3lame', '-b:a', '192k'] },
  wav: { kind: 'audio', ext: 'wav', mime: 'audio/wav', args: ['-vn', '-c:a', 'pcm_s16le'] },
  m4a: { kind: 'audio', ext: 'm4a', mime: 'audio/mp4', args: ['-vn', '-c:a', 'aac', '-b:a', '192k'] },
  aac: { kind: 'audio', ext: 'aac', mime: 'audio/aac', args: ['-vn', '-c:a', 'aac', '-b:a', '192k', '-f', 'adts'] },
};
export const HEIGHTS = [360, 480, 720, 1080, 1440, 2160, 4320];

export function probe(file) {
  return new Promise((resolve, reject) => {
    const p = spawn(FFPROBE, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', '--', file]);
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.on('error', reject);
    p.on('close', (code) => {
      if (code !== 0) return reject(new Error('probe_failed'));
      try { resolve(summarize(JSON.parse(out))); } catch { reject(new Error('probe_failed')); }
    });
  });
}

export function summarize(info) {
  const streams = info.streams || [];
  const video = streams.find((s) => s.codec_type === 'video' && !s.disposition?.attached_pic);
  const audio = streams.find((s) => s.codec_type === 'audio');
  const duration = Number(info.format?.duration) || null;
  return {
    duration,
    size: Number(info.format?.size) || null,
    container: info.format?.format_name || null,
    hasVideo: !!video,
    hasAudio: !!audio,
    width: video?.width || null,
    height: video?.height || null,
    videoCodec: video?.codec_name || null,
    audioCodec: audio?.codec_name || null,
    subtitles: streams.filter((s) => s.codec_type === 'subtitle').map((s, i) => ({
      index: i,
      language: s.tags?.language || 'und',
      title: s.tags?.title || null,
      codec: s.codec_name,
      textBased: ['subrip', 'ass', 'ssa', 'webvtt', 'mov_text', 'text'].includes(s.codec_name),
    })),
  };
}

// Only options that make sense for this source: audio needs an audio track, video needs a
// video track, and resolutions are never upscaled.
export function availableOptions(meta) {
  const opts = [];
  for (const [id, f] of Object.entries(FORMATS)) {
    if (f.kind === 'audio') {
      opts.push({ format: id, kind: 'audio', height: null, enabled: meta.hasAudio, reason: meta.hasAudio ? null : 'no_audio' });
    } else if (!meta.hasVideo) {
      opts.push({ format: id, kind: 'video', height: null, enabled: false, reason: 'no_video' });
    } else {
      const heights = HEIGHTS.filter((h) => h < meta.height);
      for (const h of [meta.height, ...heights.reverse()]) {
        opts.push({ format: id, kind: 'video', height: h, original: h === meta.height, enabled: true, reason: null });
      }
    }
  }
  return opts;
}

export function buildArgs(input, output, format, height, sourceHeight) {
  const f = FORMATS[format];
  const args = ['-hide_banner', '-nostdin', '-y', '-i', input, '-map_metadata', '-1'];
  if (f.kind === 'video') {
    args.push('-map', '0:v:0', '-map', '0:a:0?');
    if (height && sourceHeight && height < sourceHeight) args.push('-vf', `scale=-2:${Number(height)}`);
  } else {
    args.push('-map', '0:a:0');
  }
  args.push(...f.args, '-t', String(MAX_DURATION_S), '-progress', 'pipe:1', '-nostats', output);
  return args;
}

// Runs ffmpeg and reports real progress from its -progress output.
export function runFfmpeg(args, duration, onProgress) {
  const proc = spawn(FFMPEG, args);
  let stderr = '';
  proc.stderr.on('data', (d) => { stderr = (stderr + d).slice(-4000); });
  proc.stdout.on('data', (d) => {
    const m = /out_time_us=(\d+)/.exec(String(d)) || /out_time_ms=(\d+)/.exec(String(d));
    if (m && duration) onProgress(Math.min(99, (Number(m[1]) / 1e6 / duration) * 100));
  });
  const done = new Promise((resolve, reject) => {
    proc.on('error', reject);
    proc.on('close', (code, sig) => (code === 0 ? resolve() : reject(Object.assign(new Error(sig ? 'cancelled' : 'convert_failed'), { stderr }))));
  });
  return { proc, done };
}

export function extractSubtitle(input, index, fmt) {
  return new Promise((resolve, reject) => {
    const p = spawn(FFMPEG, ['-hide_banner', '-nostdin', '-i', input, '-map', `0:s:${Number(index)}`, '-f', fmt === 'vtt' ? 'webvtt' : 'srt', 'pipe:1']);
    let out = '';
    p.stdout.on('data', (d) => { out += d; if (out.length > 5e6) p.kill(); });
    p.on('error', reject);
    p.on('close', (c) => (c === 0 ? resolve(out) : reject(new Error('subtitle_failed'))));
  });
}

export function srtToText(srt) {
  return srt.split(/\r?\n\r?\n/).map((b) => b.split(/\r?\n/).filter((l) => l && !/^\d+$/.test(l) && !/-->/.test(l)).join(' ')).filter(Boolean).join('\n');
}

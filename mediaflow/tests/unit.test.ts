import { describe, it, expect } from 'vitest';
import { isPrivateIp, parseUserUrl, safeBaseName } from '../server/security.js';
import { availableOptions, buildArgs } from '../server/media.js';
import { srtToVtt, vttToSrt, toText } from '../src/utils/subtitles';
import { validateUrl, qualityLabel } from '../src/utils/format';

describe('security', () => {
  it('classifies IPs', () => {
    for (const ip of ['10.0.0.1', '127.0.0.1', '172.20.1.1', '192.168.0.1', '169.254.1.1', '100.64.0.1', '::1', 'fd00::1', '::ffff:127.0.0.1']) expect(isPrivateIp(ip)).toBe(true);
    for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700::1111']) expect(isPrivateIp(ip)).toBe(false);
  });
  it('rejects credentials in URLs', () => expect(() => parseUserUrl('https://u:p@x.com/a')).toThrow());
  it('builds safe file names', () => expect(safeBaseName('../../etc/passwd;rm -rf.mp4')).not.toMatch(/[./;]/));
  it('passes user input only as discrete argv items', () => {
    const args = buildArgs('/in', '/out.mp4', 'mp4', 480, 1080);
    expect(args).toContain('scale=-2:480');
  });
});

describe('formats', () => {
  it('offers 4K and 8K only when the source has them', () => {
    const o = availableOptions({ hasVideo: true, hasAudio: true, height: 4320 }).filter((x) => x.format === 'mp4').map((x) => x.height);
    expect(o).toEqual([4320, 2160, 1440, 1080, 720, 480, 360]);
    expect(qualityLabel(2160)).toContain('4K');
  });
  it('disables audio outputs without an audio track', () => {
    expect(availableOptions({ hasVideo: true, hasAudio: false, height: 720 }).find((x) => x.format === 'mp3')?.enabled).toBe(false);
  });
});

describe('client utils', () => {
  it('validates urls', () => {
    expect(validateUrl('')).toBe('url_empty');
    expect(validateUrl('hello')).toBe('url_invalid');
    expect(validateUrl('https://a.com/v.mp4')).toBeNull();
  });
  it('round-trips subtitles', () => {
    const srt = '1\n00:00:01,000 --> 00:00:02,500\nSalut\n';
    const vtt = srtToVtt(srt);
    expect(vtt).toContain('00:00:01.000 --> 00:00:02.500');
    expect(vttToSrt(vtt).trim()).toBe(srt.trim());
    expect(toText(srt)).toBe('Salut');
  });
});

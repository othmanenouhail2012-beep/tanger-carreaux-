import { safeFetch, UrlError } from './security.js';

// Platform connectors. Streaming platforms forbid downloading in their terms of service and
// protect their streams; without an official, authorised API configured they report as
// "not configured" rather than pretending to work.
const platform = (id, name, hosts) => ({
  id, name, hosts, configured: false,
  capabilities: [],
  async analyze() { throw new UrlError('connector_not_configured'); },
});

export const MEDIA_MIME = /^(video|audio)\//;
export const MAX_REMOTE_BYTES = Number(process.env.MAX_REMOTE_MB || 500) * 1024 * 1024;

export const directConnector = {
  id: 'direct', name: 'Direct file', hosts: [], configured: true,
  capabilities: ['download', 'convert', 'extract_audio'],
  async analyze(url) {
    let res = await safeFetch(url.toString(), { method: 'HEAD' });
    if (res.status === 405 || res.status === 501) res = await safeFetch(url.toString());
    if (!res.ok) throw new UrlError('source_unreachable');
    const mime = (res.headers.get('content-type') || '').split(';')[0].trim();
    res.body?.cancel?.();
    if (!MEDIA_MIME.test(mime)) throw new UrlError('not_media');
    const size = Number(res.headers.get('content-length')) || null;
    if (size && size > MAX_REMOTE_BYTES) throw new UrlError('too_large');
    const title = decodeURIComponent(url.pathname.split('/').pop() || url.hostname);
    return { source: 'direct', title, mime, mediaType: mime.split('/')[0], size, duration: null, thumbnail: null };
  },
};

export const connectors = [
  platform('youtube', 'YouTube', ['youtube.com', 'youtu.be', 'm.youtube.com']),
  platform('instagram', 'Instagram', ['instagram.com']),
  platform('tiktok', 'TikTok', ['tiktok.com', 'vm.tiktok.com']),
  platform('facebook', 'Facebook', ['facebook.com', 'fb.watch']),
  platform('vimeo', 'Vimeo', ['vimeo.com']),
  platform('dailymotion', 'Dailymotion', ['dailymotion.com', 'dai.ly']),
  platform('reddit', 'Reddit', ['reddit.com', 'redd.it']),
];

export function findConnector(url) {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  return connectors.find((c) => c.hosts.some((h) => host === h || host.endsWith('.' + h))) || directConnector;
}

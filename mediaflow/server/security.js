import dns from 'node:dns/promises';
import net from 'node:net';

// Returns true for loopback, private, link-local, CGNAT, multicast and reserved ranges.
export function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === '::' || v === '::1') return true;
    if (v.startsWith('::ffff:')) return isPrivateIp(v.slice(7));
    return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v);
  }
  return true;
}

export class UrlError extends Error {
  constructor(code) { super(code); this.code = code; }
}

export function parseUserUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw) throw new UrlError('url_empty');
  if (raw.length > 2048) throw new UrlError('url_invalid');
  let url;
  try { url = new URL(raw); } catch { throw new UrlError('url_invalid'); }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new UrlError('url_invalid');
  if (url.username || url.password) throw new UrlError('url_invalid');
  return url;
}

// Resolve host and refuse any private address (SSRF guard). Returns the vetted address.
export async function assertPublicHost(hostname, lookup = dns.lookup) {
  const host = hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new UrlError('url_private');
    return host;
  }
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new UrlError('url_private');
  }
  const addrs = await lookup(host, { all: true }).catch(() => { throw new UrlError('source_unreachable'); });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new UrlError('url_private');
  return addrs[0].address;
}

// Fetch with manual, re-validated redirects and a timeout.
export async function safeFetch(urlStr, { method = 'GET', maxRedirects = 3, timeoutMs = 10000, signal } = {}) {
  let current = parseUserUrl(urlStr);
  for (let i = 0; i <= maxRedirects; i++) {
    await assertPublicHost(current.hostname);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    signal?.addEventListener('abort', () => ctrl.abort());
    let res;
    try {
      res = await fetch(current, { method, redirect: 'manual', signal: ctrl.signal, headers: { 'user-agent': 'MediaFlow/1.0' } });
    } catch {
      throw new UrlError('source_unreachable');
    } finally {
      clearTimeout(t);
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      current = parseUserUrl(new URL(res.headers.get('location'), current).toString());
      continue;
    }
    return res;
  }
  throw new UrlError('too_many_redirects');
}

export function safeBaseName(name) {
  return String(name || 'media').replace(/\.[^.]*$/, '').replace(/[^\p{L}\p{N}_ -]+/gu, '_').slice(0, 80).trim() || 'media';
}

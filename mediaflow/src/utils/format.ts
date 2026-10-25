export function formatBytes(n: number | null | undefined): string | null {
  if (!n) return null;
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`;
}
export function formatDuration(s: number | null | undefined): string | null {
  if (!s) return null;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return (h ? `${h}:${String(m).padStart(2, '0')}` : `${m}`) + `:${String(sec).padStart(2, '0')}`;
}
export function qualityLabel(h: number | null): string {
  if (!h) return '';
  if (h >= 4320) return `${h}p · 8K`;
  if (h >= 2160) return `${h}p · 4K`;
  if (h >= 1440) return `${h}p · 2K`;
  if (h >= 720) return `${h}p · HD`;
  return `${h}p`;
}
// Client-side mirror of the server's URL checks for instant feedback.
export function validateUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return 'url_empty';
  try {
    const u = new URL(v);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return 'url_invalid';
  } catch { return 'url_invalid'; }
  return null;
}

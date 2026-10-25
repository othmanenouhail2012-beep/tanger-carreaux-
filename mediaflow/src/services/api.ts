import type { Capabilities, MediaInfo, Task } from '../types';

export class ApiError extends Error {
  constructor(public code: string) { super(code); }
}

function sessionId(): string {
  let id: string | null = null;
  try { id = localStorage.getItem('mf.session'); } catch { /* storage unavailable */ }
  if (!id) {
    id = crypto.randomUUID();
    try { localStorage.setItem('mf.session', id); } catch { /* ignore */ }
  }
  return id;
}
const SID = sessionId();
const headers = (json = true): HeadersInit => ({ 'x-session-id': SID, ...(json ? { 'content-type': 'application/json' } : {}) });

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try { res = await fetch(path, { ...init, headers: { ...headers(!!init.body), ...init.headers } }); }
  catch (e) { if ((e as Error).name === 'AbortError') throw e; throw new ApiError('network'); }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({ error: 'server_error' }));
  if (!res.ok) throw new ApiError(data.error || 'server_error');
  return data as T;
}

export const api = {
  capabilities: () => req<Capabilities>('/api/capabilities'),
  analyze: (url: string, signal?: AbortSignal) => req<MediaInfo>('/api/media/analyze', { method: 'POST', body: JSON.stringify({ url }), signal }),
  convert: (body: { uploadId?: string; url?: string; format: string; height: number | null }) =>
    req<Task>('/api/media/convert', { method: 'POST', body: JSON.stringify(body) }),
  tasks: () => req<Task[]>('/api/tasks'),
  cancel: (id: string) => req<Task>(`/api/tasks/${id}/cancel`, { method: 'POST' }),
  remove: (id: string) => req<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
  subtitle: async (uploadId: string, index: number, format: string) => {
    const res = await fetch(`/api/media/${uploadId}/subtitles/${index}?format=${format}`, { headers: headers(false) }).catch(() => { throw new ApiError('network'); });
    if (!res.ok) throw new ApiError((await res.json().catch(() => ({}))).error || 'server_error');
    return res.text();
  },
  // Downloads go through fetch so the session header proves ownership; the blob is then saved.
  download: async (task: Task) => {
    const res = await fetch(`/api/tasks/${task.id}/file`, { headers: headers(false) }).catch(() => { throw new ApiError('network'); });
    if (!res.ok) throw new ApiError((await res.json().catch(() => ({}))).error || 'server_error');
    const blob = await res.blob().catch(() => { throw new ApiError('interrupted'); });
    saveBlob(blob, task.outputName);
  },
  // XHR gives real upload progress.
  upload: (file: File, onProgress: (p: number) => void) => new Promise<MediaInfo>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/media/upload');
    xhr.setRequestHeader('x-session-id', SID);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new ApiError('network'));
    xhr.onabort = () => reject(new ApiError('interrupted'));
    xhr.onload = () => {
      let data: { error?: string } = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* not json */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as MediaInfo);
      else reject(new ApiError(data.error || (xhr.status === 413 ? 'too_large' : 'server_error')));
    };
    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);
  }),
};

export function saveBlob(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

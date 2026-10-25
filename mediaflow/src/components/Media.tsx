import { useEffect, useState } from 'react';
import { Clock, Download, FileAudio, FileVideo, Loader2, RotateCcw, Trash2, X, Film, Music, Captions } from 'lucide-react';
import { useApp, interpolate } from '../store';
import { api } from '../services/api';
import { formatBytes, formatDuration, qualityLabel } from '../utils/format';
import type { MediaInfo, Option, Task } from '../types';

export function MediaPreview({ media, file }: { media: MediaInfo; file?: File | null }) {
  const { t, startTask, errText, toast } = useApp();
  const [sel, setSel] = useState<Option | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setSel(media.options.find((o) => o.enabled) ?? null), [media]);

  const rows: [string, string][] = [
    [t.result.source, media.platform],
    [t.result.type, media.mediaType === 'video' ? t.result.video : t.result.audio],
    [t.result.duration, formatDuration(media.duration) ?? t.result.unknown],
    [t.result.size, formatBytes(media.size) ?? t.result.sizeUnknown],
  ];
  if (media.height) rows.push([t.result.resolution, `${media.width}×${media.height}`]);
  if (media.container) rows.push([t.meta.container, media.container]);
  if (media.videoCodec) rows.push([t.meta.videoCodec, media.videoCodec]);
  if (media.audioCodec) rows.push([t.meta.audioCodec, media.audioCodec]);

  async function start() {
    if (!sel) return;
    setBusy(true);
    try {
      await startTask({ uploadId: media.uploadId, url: media.uploadId ? undefined : media.url, format: sel.format, height: sel.height });
      location.hash = '/tasks';
    } catch (e) { toast(errText(e), 'err'); } finally { setBusy(false); }
  }

  const video = media.options.filter((o) => o.kind === 'video');
  const audio = media.options.filter((o) => o.kind === 'audio');
  const isSel = (o: Option) => sel?.format === o.format && sel?.height === o.height;
  const chip = (o: Option) => (
    <button key={o.format + o.height} type="button" disabled={!o.enabled} onClick={() => setSel(o)} aria-pressed={isSel(o)}
      title={o.reason ? (t.reason as Record<string, string>)[o.reason] : undefined}
      className={`rounded-xl border px-3 py-2 text-start text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${isSel(o) ? 'border-brand bg-brand/10 ring-2 ring-brand/30' : 'border-line hover:bg-surface2'}`}>
      <span className="font-semibold uppercase">{o.format}</span>
      {o.height && <span className="ms-1.5 text-muted">{qualityLabel(o.height)}{o.original ? ` (${t.result.original})` : ''}</span>}
      {o.reason && <span className="block text-xs text-muted">{(t.reason as Record<string, string>)[o.reason]}</span>}
    </button>
  );
  const url = file ? URL.createObjectURL(file) : null;
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  return (
    <div className="card overflow-hidden text-start">
      <div className="grid gap-0 md:grid-cols-[280px_1fr]">
        <div className="grid min-h-40 place-items-center bg-surface2 p-4">
          {url && media.mediaType === 'video' ? <video src={url} controls className="max-h-56 w-full rounded-lg bg-black" />
            : url ? <audio src={url} controls className="w-full" />
            : media.thumbnail ? <img src={media.thumbnail} alt="" className="rounded-lg" />
            : <div className="flex flex-col items-center gap-2 text-sm text-muted">{media.mediaType === 'video' ? <FileVideo size={40} /> : <FileAudio size={40} />}{t.result.noThumb}</div>}
        </div>
        <div className="p-5">
          <h2 className="break-all text-lg font-bold">{media.title}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
            {rows.map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          </dl>
          {media.source === 'direct' && <p className="mt-3 text-xs text-muted">{t.result.noMeta}</p>}
          {!!media.subtitles?.length && (
            <a href="#/subtitles" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-dark underline-offset-4 hover:underline dark:text-brand"><Captions size={16} />{interpolate(t.result.subtitlesFound, { n: media.subtitles.length })} — {t.result.openSubtitles}</a>
          )}
        </div>
      </div>
      <div className="border-t border-line p-5">
        <h3 className="mb-3 font-semibold">{t.result.choose}</h3>
        {!media.options.some((o) => o.enabled) ? <p className="text-sm text-muted">{t.result.noOptions}</p> : (
          <div className="space-y-4">
            {video.length > 0 && <div><p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted"><Film size={14} />{t.result.video}</p><div className="flex flex-wrap gap-2">{video.map(chip)}</div></div>}
            {audio.length > 0 && <div><p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted"><Music size={14} />{t.result.audio}</p><div className="flex flex-wrap gap-2">{audio.map(chip)}</div></div>}
            <button className="btn-primary w-full sm:w-auto" disabled={!sel || busy} onClick={start}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}{t.result.start}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Elapsed({ task }: { task: Task }) {
  const [, tick] = useState(0);
  const live = !task.finishedAt;
  useEffect(() => { if (!live) return; const h = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(h); }, [live]);
  return <>{formatDuration(Math.max(1, ((task.finishedAt ?? Date.now()) - task.createdAt) / 1000))}</>;
}

export function TaskRow({ task }: { task: Task }) {
  const { t, refresh, errText, toast, startTask } = useApp();
  const running = ['queued', 'analyzing', 'processing'].includes(task.status);
  const [dl, setDl] = useState(false);
  const act = async (fn: () => Promise<unknown>, msg?: string) => {
    try { await fn(); if (msg) toast(msg); } catch (e) { toast(errText(e), 'err'); } finally { refresh(); }
  };
  const color = task.status === 'ready' ? 'bg-brand/15 text-brand-dark dark:text-brand' : task.status === 'failed' ? 'bg-red-500/10 text-red-600 dark:text-red-300' : 'bg-surface2 text-muted';
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold" title={task.outputName}>{task.outputName}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className={`chip ${color}`}>{(t.task as Record<string, string>)[task.status]}</span>
            <span>{(t.task as Record<string, string>)[task.type]} · {task.format.toUpperCase()}{task.height ? ` ${qualityLabel(task.height)}` : ''}</span>
            {task.size && <span>· {formatBytes(task.size)}</span>}
            <span className="inline-flex items-center gap-1">· <Clock size={12} /> <Elapsed task={task} /></span>
          </p>
        </div>
        <div className="flex gap-2">
          {running && <button className="btn-ghost !py-1.5" onClick={() => act(() => api.cancel(task.id), t.toast.cancelled)}><X size={16} />{t.task.cancel}</button>}
          {task.status === 'ready' && <button className="btn-primary !py-1.5" disabled={dl} onClick={() => { setDl(true); act(() => api.download(task)).finally(() => setDl(false)); }}>{dl ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}{t.task.download}</button>}
          {!running && <button className="btn-ghost !p-2" aria-label={t.task.remove} onClick={() => confirm(t.tasks.confirmRemove) && act(() => api.remove(task.id))}><Trash2 size={16} /></button>}
        </div>
      </div>
      {running && (
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={task.progress} aria-valuemin={0} aria-valuemax={100} aria-label={task.outputName}>
            <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${task.progress}%` }} />
          </div>
          <span className="w-10 text-end text-xs font-semibold tabular-nums">{task.progress}%</span>
        </div>
      )}
      {task.status === 'failed' && task.error && (
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-red-600 dark:text-red-300">
          {(t.errors as Record<string, string>)[task.error] ?? t.errors.processing_error}
        </p>
      )}
      {['failed', 'cancelled'].includes(task.status) && <RetryHint task={task} onRetry={startTask} />}
    </li>
  );
}

// Retrying needs the original upload/URL, which only the server keeps; we expose retry when the
// upload is still held in this browser session.
function RetryHint({ task, onRetry }: { task: Task; onRetry: ReturnType<typeof useApp>['startTask'] }) {
  const { t, current, toast, errText } = useApp();
  if (!current || current.title !== task.name) return null;
  return (
    <button className="btn-ghost mt-2 !py-1.5" onClick={() => onRetry({ uploadId: current.uploadId, url: current.uploadId ? undefined : current.url, format: task.format, height: task.height }).catch((e) => toast(errText(e), 'err'))}>
      <RotateCcw size={14} />{t.task.retry}
    </button>
  );
}

import { useRef, useState } from 'react';
import { Link2, Loader2, UploadCloud, X } from 'lucide-react';
import { useApp, interpolate } from '../store';
import { api } from '../services/api';
import { validateUrl } from '../utils/format';
import type { MediaInfo } from '../types';
import { Alert } from './Layout';

export function UrlInput({ onResult }: { onResult: (m: MediaInfo) => void }) {
  const { t, errText, toast } = useApp();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ctrl = useRef<AbortController | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateUrl(url);
    if (v) return setError((t.errors as Record<string, string>)[v]);
    ctrl.current?.abort(); // drop any stale request
    ctrl.current = new AbortController();
    setError(null); setLoading(true);
    try {
      onResult(await api.analyze(url.trim(), ctrl.current.signal));
      toast(t.toast.analyzed);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError(errText(err));
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <div className="card flex flex-col gap-2 p-2 sm:flex-row">
        <div className="relative flex flex-1 items-center">
          <Link2 className="pointer-events-none absolute start-3 text-muted" size={20} />
          <label htmlFor="url" className="sr-only">{t.hero.placeholder}</label>
          <input id="url" type="url" inputMode="url" autoComplete="off" value={url} onChange={(e) => { setUrl(e.target.value); setError(null); }}
            placeholder={t.hero.placeholder} aria-invalid={!!error} aria-describedby={error ? 'url-err' : undefined}
            className="h-12 w-full rounded-xl bg-transparent ps-11 pe-10 text-base outline-none placeholder:text-muted" />
          {url && <button type="button" onClick={() => { setUrl(''); setError(null); }} className="absolute end-2 rounded-lg p-1.5 text-muted hover:bg-surface2" aria-label={t.hero.clear}><X size={18} /></button>}
        </div>
        <button className="btn-primary h-12 px-7 text-base" disabled={loading}>
          {loading && <Loader2 size={18} className="animate-spin" />}{t.hero.analyze}
        </button>
      </div>
      {error && <div id="url-err" className="mt-3"><Alert>{error}</Alert></div>}
    </form>
  );
}

export function UploadDropzone({ onResult, compact }: { onResult: (m: MediaInfo, file: File) => void; compact?: boolean }) {
  const { t, caps, errText, toast } = useApp();
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const maxMb = caps?.limits.uploadMb ?? 1024;

  async function handle(file?: File) {
    if (!file) return;
    if (file.size > maxMb * 1048576) return setError(t.errors.too_large);
    setError(null); setProgress(0);
    try {
      onResult(await api.upload(file, setProgress), file);
      toast(t.toast.analyzed);
    } catch (e) { setError(errText(e)); } finally { setProgress(null); if (input.current) input.current.value = ''; }
  }

  return (
    <div>
      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed text-center transition ${compact ? 'p-6' : 'p-8'} ${drag ? 'border-brand bg-brand/10' : 'border-line bg-surface2/60'}`}>
        {progress !== null ? (
          <div className="w-full max-w-sm">
            <p className="mb-2 text-sm font-medium">{interpolate(t.drop.uploading, { p: progress })}</p>
            <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-brand transition-all" style={{ width: progress + '%' }} /></div>
          </div>
        ) : (
          <>
            <UploadCloud size={32} className="text-brand-dark dark:text-brand" />
            <div><p className="font-semibold">{t.drop.title}</p><p className="text-sm text-muted">{interpolate(t.drop.hint, { mb: maxMb })}</p></div>
            <button type="button" className="btn-ghost" onClick={() => input.current?.click()}>{t.drop.browse}</button>
            <input ref={input} type="file" accept="video/*,audio/*,.mkv" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
          </>
        )}
      </div>
      {error && <div className="mt-3"><Alert action={<button className="btn-ghost !py-1" onClick={() => input.current?.click()}>{t.task.retry}</button>}>{error}</Alert></div>}
    </div>
  );
}

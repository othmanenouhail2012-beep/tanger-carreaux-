import { useRef, useState } from 'react';
import { Captions, FileText, Loader2, Mic } from 'lucide-react';
import { useApp } from '../store';
import { api, saveBlob } from '../services/api';
import { Alert, PageHeader } from '../components/Layout';
import { UploadDropzone } from '../components/Inputs';
import { srtToVtt, toText, vttToSrt } from '../utils/subtitles';

export default function Subtitles() {
  const { t, current, setCurrent, errText, caps } = useApp();
  const media = current?.source === 'upload' ? current : null;
  const [track, setTrack] = useState<number | null>(null);
  const [srt, setSrt] = useState<string | null>(null);
  const [name, setName] = useState('subtitles');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const local = useRef<HTMLInputElement>(null);

  async function pick(i: number) {
    if (!media?.uploadId) return;
    setTrack(i); setError(null); setLoading(true);
    try {
      setSrt(await api.subtitle(media.uploadId, i, 'srt'));
      setName(media.title.replace(/\.[^.]+$/, '') + '.' + (media.subtitles?.[i].language ?? 'und'));
    } catch (e) { setError(errText(e)); setSrt(null); } finally { setLoading(false); }
  }
  async function openLocal(f?: File) {
    if (!f) return;
    const text = await f.text();
    setSrt(/^﻿?WEBVTT/.test(text) ? vttToSrt(text) : text);
    setName(f.name.replace(/\.[^.]+$/, '')); setTrack(null); setError(null);
  }
  const exp = (fmt: 'srt' | 'vtt' | 'txt') => {
    if (!srt) return;
    const body = fmt === 'srt' ? srt : fmt === 'vtt' ? srtToVtt(srt) : toText(srt);
    saveBlob(new Blob([body], { type: 'text/plain;charset=utf-8' }), `${name}.${fmt}`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader title={t.subs.title} subtitle={t.subs.subtitle} />
      <UploadDropzone compact onResult={(m) => { setCurrent(m); setSrt(null); setTrack(null); }} />
      <div className="mt-3 text-center">
        <button className="text-sm font-medium text-brand-dark underline-offset-4 hover:underline dark:text-brand" onClick={() => local.current?.click()}>{t.subs.localFile}</button>
        <input ref={local} type="file" accept=".srt,.vtt,text/vtt" className="hidden" onChange={(e) => openLocal(e.target.files?.[0])} />
      </div>

      {media && (
        <div className="card mt-6 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Captions size={18} />{t.subs.tracks} — <span className="truncate font-normal text-muted">{media.title}</span></h2>
          {!media.subtitles?.length ? <p className="text-sm text-muted">{t.subs.none}</p> : (
            <div className="flex flex-wrap gap-2">
              {media.subtitles.map((s) => (
                <button key={s.index} disabled={!s.textBased} onClick={() => pick(s.index)} aria-pressed={track === s.index}
                  className={`rounded-xl border px-3 py-2 text-sm disabled:opacity-40 ${track === s.index ? 'border-brand bg-brand/10' : 'border-line hover:bg-surface2'}`}>
                  <b className="uppercase">{s.language}</b>{s.title && ` · ${s.title}`} <span className="text-muted">({s.textBased ? s.codec : t.subs.imageBased})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {loading && <p className="mt-4 flex items-center gap-2 text-sm text-muted"><Loader2 size={16} className="animate-spin" />…</p>}
      {error && <div className="mt-4"><Alert>{error}</Alert></div>}
      {srt && (
        <div className="card mt-6 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold"><FileText size={18} />{t.subs.preview}</h2>
            <div className="flex gap-2">{(['srt', 'vtt', 'txt'] as const).map((f) => <button key={f} className="btn-ghost !py-1.5 uppercase" onClick={() => exp(f)}>{f}</button>)}</div>
          </div>
          <pre dir="auto" className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-surface2 p-4 text-xs leading-relaxed">{srt.slice(0, 20000)}</pre>
        </div>
      )}
      <div className="card mt-6 p-5">
        <h2 className="flex items-center gap-2 font-semibold"><Mic size={18} />{t.subs.transcribe}</h2>
        <div className="mt-2"><Alert kind="info">{caps?.transcription ? '' : t.subs.transcribeOff}</Alert></div>
      </div>
    </div>
  );
}

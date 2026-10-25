import { useState } from 'react';
import { Link2, Film, Music, AudioLines, Captions, Mic, PlayCircle, FolderOpen, Info, Image, Search } from 'lucide-react';
import { useApp, interpolate } from '../store';
import { api } from '../services/api';
import { PageHeader } from '../components/Layout';
import { TaskRow } from '../components/Media';

export function Tools() {
  const { t, caps } = useApp();
  const i = t.tools.items;
  const items: [typeof Film, string[], string, boolean][] = [
    [Link2, i.analyzer, '/', true], [Film, i.video, '/converter', true], [Music, i.audio, '/converter', true],
    [AudioLines, i.extract, '/converter', true], [Captions, i.subs, '/subtitles', true], [Mic, i.transcript, '/subtitles', !!caps?.transcription],
    [PlayCircle, i.preview, '/converter', true], [FolderOpen, i.files, '/tasks', true], [Info, i.meta, '/converter', true], [Image, i.thumb, '/tools', false],
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PageHeader title={t.tools.title} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([Icon, [title, desc], href, ok]) => (
          <div key={title} className="card flex flex-col p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand-dark dark:text-brand"><Icon size={20} /></span>
              <span className={`chip ${ok ? '!bg-brand/15 !text-brand-dark dark:!text-brand' : ''}`}>{ok ? t.tools.available : t.tools.soon}</span>
            </div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{desc}</p>
            {ok ? <a href={'#' + href} className="btn-ghost mt-4">{t.tools.open}</a> : <button disabled className="btn-ghost mt-4">{t.tools.soon}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Tasks() {
  const { t, tasks, caps, refresh } = useApp();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const list = tasks.filter((x) => (!q || x.outputName.toLowerCase().includes(q.toLowerCase())) && (!type || x.type === type) && (!status || x.status === status));
  const statuses = ['queued', 'analyzing', 'processing', 'ready', 'failed', 'cancelled'] as const;
  async function clearAll() {
    if (!confirm(t.tasks.confirmClear)) return;
    await Promise.all(tasks.map((x) => api.remove(x.id).catch(() => null)));
    refresh();
  }
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader title={t.tasks.title} subtitle={interpolate(t.tasks.subtitle, { min: caps?.limits.ttlMinutes ?? 60 })} />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative"><span className="sr-only">{t.tasks.search}</span><Search size={16} className="absolute start-3 top-3 text-muted" /><input className="input ps-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.tasks.search} /></label>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)} aria-label={t.tasks.allTypes}>
          <option value="">{t.tasks.allTypes}</option><option value="convert">{t.task.convert}</option><option value="extract_audio">{t.task.extract_audio}</option>
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t.tasks.allStatus}>
          <option value="">{t.tasks.allStatus}</option>{statuses.map((s) => <option key={s} value={s}>{t.task[s]}</option>)}
        </select>
        <button className="btn-ghost" disabled={!tasks.length} onClick={clearAll}>{t.tasks.clear}</button>
      </div>
      {list.length === 0 ? (
        <div className="card grid place-items-center gap-3 p-10 text-center text-muted"><FolderOpen size={32} /><p>{t.tasks.empty}</p><a href="#/" className="btn-primary">{t.hero.analyze}</a></div>
      ) : <ul className="space-y-3">{list.map((x) => <TaskRow key={x.id} task={x} />)}</ul>}
    </div>
  );
}

export function Help() {
  const { t } = useApp();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader title={t.help.title} />
      <div className="space-y-3">
        {t.help.faq.map(([q, a]) => (
          <details key={q} className="card group p-5">
            <summary className="cursor-pointer list-none font-semibold marker:hidden">{q}</summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function TextPage({ page }: { page: 'terms' | 'privacy' }) {
  const { t } = useApp();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader title={t[page].title} />
      <div className="card space-y-4 p-6 leading-relaxed">{t[page].body.map((p) => <p key={p}>{p}</p>)}</div>
    </div>
  );
}

export function NotFound() {
  const { t } = useApp();
  return (
    <div className="mx-auto grid max-w-xl place-items-center gap-3 px-4 py-24 text-center">
      <p className="text-7xl font-extrabold text-brand">404</p>
      <h1 className="text-2xl font-bold">{t.notFound.title}</h1>
      <p className="text-muted">{t.notFound.body}</p>
      <a href="#/" className="btn-primary mt-2">{t.notFound.back}</a>
    </div>
  );
}

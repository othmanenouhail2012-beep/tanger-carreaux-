import { useState } from 'react';
import { ShieldCheck, Zap, Languages } from 'lucide-react';
import { useApp } from '../store';
import { UrlInput, UploadDropzone } from '../components/Inputs';
import { MediaPreview } from '../components/Media';

export default function Home() {
  const { t, caps, current: media, setCurrent: set } = useApp();
  const [localFile, setLocalFile] = useState<File | null>(null);
  return (
    <>
      <section className="bg-gradient-to-b from-surface2 to-bg">
        <div className="mx-auto max-w-3xl px-4 pb-14 pt-14 text-center sm:pt-20">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">{t.hero.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{t.hero.subtitle}</p>
          <div className="mt-8"><UrlInput onResult={(m) => { setLocalFile(null); set(m); }} /></div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck size={14} />{t.hero.notice}</p>
          <div className="my-6 flex items-center gap-3 text-xs uppercase text-muted"><span className="h-px flex-1 bg-line" />{t.hero.or}<span className="h-px flex-1 bg-line" /></div>
          <UploadDropzone onResult={(m, f) => { setLocalFile(f); set(m); }} />
          {media && <div className="mt-8"><MediaPreview media={media} file={localFile} /></div>}
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-3">
        {([[Zap, t.tools.items.video], [Languages, t.tools.items.subs], [ShieldCheck, [t.privacy.title, t.privacy.body[1]]]] as [typeof Zap, string[]][]).map(([Icon, [h, p]]: [typeof Zap, string[]]) => (
          <div key={h} className="card p-5"><Icon className="mb-3 text-brand-dark dark:text-brand" /><h3 className="font-semibold">{h}</h3><p className="mt-1 text-sm text-muted">{p}</p></div>
        ))}
      </section>
      {caps && (
        <section className="mx-auto mt-10 max-w-6xl px-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-muted">{t.platforms.title}</h2>
          <div className="flex flex-wrap gap-2">
            {caps.connectors.map((c) => (
              <span key={c.id} className={`chip ${c.configured ? '!bg-brand/15 !text-brand-dark dark:!text-brand' : ''}`} title={c.configured ? t.platforms.configured : t.platforms.notConfigured}>
                <span className={`h-1.5 w-1.5 rounded-full ${c.configured ? 'bg-brand' : 'bg-muted/50'}`} />{c.id === 'direct' ? t.tools.items.analyzer[0] : c.name} · {c.configured ? t.platforms.configured : t.platforms.notConfigured}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  );
}


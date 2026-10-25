import { useState, type ReactNode } from 'react';
import { Download, Menu, Moon, Sun, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp, type Lang } from '../store';

export function Logo() {
  return (
    <a href="#/" dir="ltr" className="flex items-center gap-2 font-extrabold text-lg tracking-tight" aria-label="MediaFlow">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-[#14240a] shadow-sm"><Download size={20} strokeWidth={2.75} /></span>
      Media<span className="text-brand-dark dark:text-brand">Flow</span>
    </a>
  );
}

export function Navbar({ route }: { route: string }) {
  const { t, lang, setLang, dark, setDark, tasks } = useApp();
  const [open, setOpen] = useState(false);
  const running = tasks.filter((x) => ['queued', 'analyzing', 'processing'].includes(x.status)).length;
  const links: [string, string][] = [['/', t.nav.home], ['/tools', t.nav.tools], ['/converter', t.nav.converter], ['/subtitles', t.nav.subtitles], ['/tasks', t.nav.tasks], ['/help', t.nav.help]];
  const link = (href: string, label: string) => (
    <a key={href} href={'#' + href} onClick={() => setOpen(false)} aria-current={route === href ? 'page' : undefined}
      className={`relative rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-surface2 ${route === href ? 'text-ink bg-surface2' : 'text-muted'}`}>
      {label}
      {href === '/tasks' && running > 0 && <span className="ms-1.5 rounded-full bg-brand px-1.5 text-[10px] font-bold text-[#14240a]">{running}</span>}
    </a>
  );
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <div className="hidden items-center gap-1 lg:flex">{links.map(([h, l]) => link(h, l))}</div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="lang">{t.nav.language}</label>
          <select id="lang" value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm">
            <option value="fr">FR</option><option value="en">EN</option><option value="ar">ع</option>
          </select>
          <button className="btn-ghost !p-2" onClick={() => setDark(!dark)} aria-label={t.nav.theme}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button className="btn-ghost !p-2 lg:hidden" onClick={() => setOpen(!open)} aria-label={t.nav.menu} aria-expanded={open}>{open ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </nav>
      {open && <div className="flex flex-col gap-1 border-t border-line px-4 py-3 lg:hidden">{links.map(([h, l]) => link(h, l))}</div>}
    </header>
  );
}

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row">
        <span>© {new Date().getFullYear()} MediaFlow — {t.footer.rights}</span>
        <div className="flex gap-4"><a className="hover:text-ink" href="#/terms">{t.footer.terms}</a><a className="hover:text-ink" href="#/privacy">{t.footer.privacy}</a><a className="hover:text-ink" href="#/help">{t.nav.help}</a></div>
      </div>
    </footer>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-4 end-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((x) => (
        <div key={x.id} className="card pointer-events-auto flex items-start gap-2 p-3 text-sm animate-[fadeIn_.15s_ease-out]">
          {x.kind === 'ok' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-dark dark:text-brand" /> : <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />}
          <span>{x.text}</span>
        </div>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
    </div>
  );
}

export function Alert({ kind = 'err', children, action }: { kind?: 'err' | 'info'; children: ReactNode; action?: ReactNode }) {
  return (
    <div role={kind === 'err' ? 'alert' : 'note'} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm ${kind === 'err' ? 'border-red-300/60 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200' : 'border-line bg-surface2 text-muted'}`}>
      <span className="flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0" />{children}</span>
      {action}
    </div>
  );
}

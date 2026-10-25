import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { fr, type Dict } from './i18n/fr';
import { en } from './i18n/en';
import { ar } from './i18n/ar';
import { api, ApiError } from './services/api';
import type { Capabilities, MediaInfo, Task } from './types';

export type Lang = 'fr' | 'en' | 'ar';
const DICTS: Record<Lang, Dict> = { fr, en, ar };
type Toast = { id: number; text: string; kind: 'ok' | 'err' };

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export function interpolate(s: string, vars: Record<string, string | number> = {}) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

function useStore() {
  const [lang, setLangState] = useState<Lang>(() => (read('mf.lang') as Lang) || (navigator.language.startsWith('ar') ? 'ar' : navigator.language.startsWith('en') ? 'en' : 'fr'));
  const [dark, setDark] = useState(() => read('mf.theme') ? read('mf.theme') === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [current, setCurrent] = useState<MediaInfo | null>(null); // last analyzed media, shared across pages
  const t = DICTS[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    write('mf.lang', lang);
  }, [lang]);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); write('mf.theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => { api.capabilities().then(setCaps).catch(() => setCaps(null)); }, []);

  const toast = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((x) => [...x, { id, text, kind }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 4500);
  }, []);
  const errText = useCallback((e: unknown) => {
    const code = e instanceof ApiError ? e.code : 'server_error';
    return (t.errors as Record<string, string>)[code] || t.errors.server_error;
  }, [t]);

  // Poll real task state while something is running.
  const prev = useRef<Record<string, string>>({});
  const refresh = useCallback(async () => {
    try {
      const list = await api.tasks();
      for (const task of list) {
        const before = prev.current[task.id];
        if (before && before !== task.status) {
          if (task.status === 'ready') toast(interpolate(DICTS[lang].toast.ready, { name: task.outputName }));
          if (task.status === 'failed') toast(DICTS[lang].toast.failed, 'err');
        }
        prev.current[task.id] = task.status;
      }
      setTasks(list.sort((a, b) => b.createdAt - a.createdAt));
    } catch { /* server unreachable: keep last known state */ }
  }, [lang, toast]);
  const active = tasks.some((x) => ['queued', 'analyzing', 'processing'].includes(x.status));
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!active) return;
    const h = setInterval(refresh, 1000);
    return () => clearInterval(h);
  }, [active, refresh]);

  const startTask = useCallback(async (body: Parameters<typeof api.convert>[0]) => {
    const task = await api.convert(body);
    prev.current[task.id] = task.status;
    setTasks((x) => [task, ...x]);
    toast(DICTS[lang].toast.started);
    return task;
  }, [lang, toast]);

  return useMemo(() => ({
    lang, setLang: setLangState, t, dark, setDark, toasts, toast, errText, tasks, refresh, startTask, caps, current, setCurrent,
  }), [lang, t, dark, toasts, toast, errText, tasks, refresh, startTask, caps, current]);
}

type Store = ReturnType<typeof useStore>;
const Ctx = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={useStore()}>{children}</Ctx.Provider>;
}
export const useApp = () => useContext(Ctx)!;

// Minimal hash router: works on any static host without server rewrites.
export function useRoute() {
  const [route, setRoute] = useState(() => location.hash.slice(1) || '/');
  useEffect(() => {
    const on = () => { setRoute(location.hash.slice(1) || '/'); window.scrollTo(0, 0); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return route;
}

import { lazy, Suspense } from 'react';
import { StoreProvider, useRoute } from './store';
import { Navbar, Footer, Toasts } from './components/Layout';
import Home from './pages/Home';
import { Tools, Tasks, Help, TextPage, NotFound } from './pages/Misc';

const Converter = lazy(() => import('./pages/Converter'));
const Subtitles = lazy(() => import('./pages/Subtitles'));

function Router() {
  const route = useRoute();
  const page = {
    '/': <Home />, '/tools': <Tools />, '/converter': <Converter />, '/subtitles': <Subtitles />, '/tasks': <Tasks />,
    '/help': <Help />, '/terms': <TextPage page="terms" />, '/privacy': <TextPage page="privacy" />,
  }[route] ?? <NotFound />;
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 btn-primary">Skip</a>
      <Navbar route={route} />
      <main id="main" className="flex-1"><Suspense fallback={<div className="p-12" />}>{page}</Suspense></main>
      <Footer />
      <Toasts />
    </div>
  );
}

export default function App() {
  return <StoreProvider><Router /></StoreProvider>;
}

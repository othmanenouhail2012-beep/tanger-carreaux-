// GET -> diagnostic : clés VAPID présentes ? la fonction planifiée tourne-t-elle ? alertes en attente ?
import { getStore } from '@netlify/blobs';
export default async (req) => {
  const id = new URL(req.url).searchParams.get('id');
  const meta = await getStore('jarvis-meta').get('lastRun', { type: 'json' }).catch(() => null);
  const rec = id ? await getStore('jarvis-alerts').get(id, { type: 'json' }).catch(() => null) : null;
  return Response.json({
    vapid: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    lastRun: meta,
    pending: rec ? rec.alerts.map((a) => ({ at: a.at, title: a.title })) : [],
    now: Date.now(),
  }, { headers: { 'cache-control': 'no-store' } });
};

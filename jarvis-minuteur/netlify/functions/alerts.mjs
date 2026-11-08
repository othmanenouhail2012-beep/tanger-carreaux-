// POST  /.netlify/functions/alerts        { id, subscription, alerts:[{id,at,title,body}] }  -> remplace les alertes
// DELETE /.netlify/functions/alerts?id=... -> annule toutes les alertes de cet appareil
import { getStore } from '@netlify/blobs';
import { validId, validSubscription, cleanAlerts } from '../lib/push-core.mjs';

const json = (data, status = 200) => Response.json(data, { status });

export default async (req) => {
  const store = getStore('jarvis-alerts');
  if (req.method === 'DELETE') {
    const id = new URL(req.url).searchParams.get('id');
    if (!validId(id)) return json({ error: 'id invalide' }, 400);
    await store.delete(id);
    return json({ ok: true, cancelled: true });
  }
  if (req.method !== 'POST') return json({ error: 'méthode non autorisée' }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'JSON invalide' }, 400); }
  if (!validId(body.id)) return json({ error: 'id invalide' }, 400);
  const alerts = cleanAlerts(body.alerts).filter((a) => a.at > Date.now() - 60_000);
  if (!alerts.length) { await store.delete(body.id); return json({ ok: true, count: 0 }); }
  if (!validSubscription(body.subscription)) return json({ error: 'abonnement push invalide' }, 400);
  await store.setJSON(body.id, { subscription: body.subscription, alerts, updatedAt: Date.now() });
  return json({ ok: true, count: alerts.length, next: alerts[0].at });
};

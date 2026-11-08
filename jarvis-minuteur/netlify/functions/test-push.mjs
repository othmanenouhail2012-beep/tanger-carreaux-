// POST { subscription } -> envoie tout de suite une notification de test
import webpush from 'web-push';
import { configureWebPush, validSubscription, sendOne } from '../lib/push-core.mjs';

export default async (req) => {
  if (req.method !== 'POST') return new Response('méthode non autorisée', { status: 405 });
  const { subscription } = await req.json().catch(() => ({}));
  if (!validSubscription(subscription)) return Response.json({ error: 'abonnement invalide' }, { status: 400 });
  try {
    configureWebPush(webpush);
    await sendOne(webpush, subscription, { id: 'test', title: 'JARVIS est prêt ✔', body: 'Les notifications fonctionnent. Je te préviendrai à la fin de chaque activité.' });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message, status: e.statusCode }, { status: 502 });
  }
};

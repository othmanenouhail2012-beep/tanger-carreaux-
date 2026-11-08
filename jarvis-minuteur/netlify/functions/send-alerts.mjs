// Fonction planifiée : tourne chaque minute, envoie les notifications arrivées à échéance.
// Les heures sont stockées en timestamps absolus (calculés pour Africa/Casablanca par l'appli),
// donc aucune conversion de fuseau n'est nécessaire ici.
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';
import { configureWebPush, processDue } from '../lib/push-core.mjs';

export default async () => {
  let sent = 0, error = null;
  try {
    configureWebPush(webpush);
    sent = await processDue(getStore('jarvis-alerts'), webpush, Date.now());
  } catch (e) { error = e.message; console.error(e); }
  await getStore('jarvis-meta').setJSON('lastRun', { at: Date.now(), sent, error });
  console.log(`send-alerts: ${sent} notification(s) envoyée(s)`);
  return new Response('ok');
};

export const config = { schedule: '* * * * *' };

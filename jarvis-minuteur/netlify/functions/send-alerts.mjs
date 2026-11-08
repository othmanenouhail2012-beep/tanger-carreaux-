// Fonction planifiée : tourne chaque minute, envoie les notifications arrivées à échéance.
// Les heures sont stockées en timestamps absolus (calculés pour Africa/Casablanca par l'appli),
// donc aucune conversion de fuseau n'est nécessaire ici.
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';
import { configureWebPush, processDue } from '../lib/push-core.mjs';

export default async () => {
  configureWebPush(webpush);
  const sent = await processDue(getStore('jarvis-alerts'), webpush, Date.now());
  console.log(`send-alerts: ${sent} notification(s) envoyée(s)`);
  return new Response('ok');
};

export const config = { schedule: '* * * * *' };

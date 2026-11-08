// Renvoie la clé PUBLIQUE VAPID (la clé privée reste sur le serveur).
export default async () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) return Response.json({ error: 'VAPID_PUBLIC_KEY non configurée' }, { status: 500 });
  return Response.json({ publicKey }, { headers: { 'cache-control': 'no-store' } });
};

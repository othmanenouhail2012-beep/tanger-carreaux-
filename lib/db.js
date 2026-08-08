// Point d'accès unique à la base Postgres (Neon, provisionnée depuis Vercel ou
// directement chez Neon). Toute route dans /api qui a besoin de la DB importe `sql`
// d'ici plutôt que d'instancier son propre client -- garde la configuration de
// connexion à un seul endroit.
//
// @neondatabase/serverless (le driver recommandé pour un NOUVEAU projet -- @vercel/
// postgres est déprécié depuis la migration de Vercel Postgres vers Neon, voir
// https://neon.com/docs/guides/vercel-postgres-transition-guide). Son `sql\`...\`` en
// tagged-template renvoie directement un TABLEAU de lignes (pas de wrapper `.rows`
// comme avec @vercel/postgres) -- toutes les routes de ce projet écrivent donc
// `var rows = await sql\`...\`; rows[0]`, jamais `rows.rows[0]`.
//
// Nom de variable d'environnement : DATABASE_URL est la convention Neon. Si Vercel
// injecte encore POSTGRES_URL selon la version de l'intégration, on retombe dessus.
const { neon } = require("@neondatabase/serverless");

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  // neon() lève une erreur explicite dès l'import si la chaîne de connexion est vide
  // (pas seulement à la première requête) -- donc tant que .env.local n'est pas
  // rempli, toute route qui `require("../lib/db")` échouera immédiatement au
  // chargement. C'est le comportement attendu tant qu'aucune base n'existe encore
  // (voir la Phase 3 du plan) : ce message clarifie pourquoi, plutôt que de laisser
  // l'erreur brute de neon() sans contexte.
  console.warn("DATABASE_URL / POSTGRES_URL manquant -- voir .env.local.example. Les routes /api échoueront tant que ce n'est pas rempli.");
}
const sql = neon(connectionString || "postgresql://placeholder:placeholder@localhost/placeholder");

module.exports = { sql: sql };

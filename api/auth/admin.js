// POST /api/auth/admin?action=login  -- { email, password } -> session admin (cookie)
// POST /api/auth/admin?action=logout -- efface la session admin
//
// Fusionné depuis admin-login.js + admin-logout.js pour repasser sous la limite de 12
// fonctions serverless du forfait Vercel Hobby (13 fichiers dans /api au 28/08/2026,
// déploiement refusé). Non appelé actuellement par le front public -- l'écran de
// connexion admin a été retiré sur demande explicite (commit 48c4423), mais la
// protection serveur (requireAdmin(), voir api/admin/*.js) reste active. Cet endpoint
// reste prêt si un moyen de se connecter est un jour réintroduit côté UI.
const { sql } = require("../../lib/db");
const { verifyPassword, createSession, clearSession, ADMIN_COOKIE } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  var action = (req.query && req.query.action) || "login";

  if (action === "logout") {
    clearSession(res, ADMIN_COOKIE);
    return res.status(200).json({ ok: true });
  }

  var body = req.body || {};
  if (!body.email || !body.password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }
  var rows = await sql`SELECT id, email, password_hash FROM admin_users WHERE email = ${body.email}`;
  var user = rows[0];
  // Message volontairement générique -- ne révèle jamais si l'email existe ou non.
  if (!user || !(await verifyPassword(body.password, user.password_hash))) {
    return res.status(401).json({ error: "Identifiants incorrects." });
  }
  createSession(res, ADMIN_COOKIE, { role: "admin", id: user.id, email: user.email });
  return res.status(200).json({ ok: true, email: user.email });
};

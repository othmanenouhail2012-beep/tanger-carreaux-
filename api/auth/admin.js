// POST /api/auth/admin?action=login          -- { email, password } -> session admin (cookie)
// POST /api/auth/admin?action=logout         -- efface la session admin
// POST /api/auth/admin?action=update-account -- { currentPassword, newEmail?, newPassword? }
//                                                change l'email et/ou le mot de passe du
//                                                compte connecté (nécessite une session valide
//                                                + le mot de passe actuel, voir admin/admin.js
//                                                "Mon compte" dans le panneau Paramètres).
//
// Fusionné depuis admin-login.js + admin-logout.js pour repasser sous la limite de 12
// fonctions serverless du forfait Vercel Hobby (13 fichiers dans /api au 28/08/2026,
// déploiement refusé). L'écran de connexion admin (retiré au commit 48c4423) a été
// réintroduit le 29/08/2026 -- demande explicite pour restreindre le back-office au
// seul gérant, une fois une vraie base de données connectée.
const { sql } = require("../../lib/db");
const { verifyPassword, hashPassword, createSession, clearSession, requireAdmin, ADMIN_COOKIE } = require("../../lib/auth");

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

  if (action === "update-account") {
    var session = requireAdmin(req, res);
    if (!session) return;

    var body = req.body || {};
    if (!body.currentPassword) {
      return res.status(400).json({ error: "Mot de passe actuel requis." });
    }
    if (!body.newEmail && !body.newPassword) {
      return res.status(400).json({ error: "Renseigne un nouvel email et/ou un nouveau mot de passe." });
    }
    if (body.newPassword && String(body.newPassword).length < 8) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
    }

    var current = await sql`SELECT id, email, password_hash FROM admin_users WHERE id = ${session.id}`;
    var user = current[0];
    if (!user || !(await verifyPassword(body.currentPassword, user.password_hash))) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect." });
    }

    var newEmail = body.newEmail ? String(body.newEmail).trim() : user.email;
    if (newEmail !== user.email) {
      var existing = await sql`SELECT id FROM admin_users WHERE email = ${newEmail} AND id != ${user.id}`;
      if (existing.length) {
        return res.status(409).json({ error: "Cet email est déjà utilisé par un autre compte." });
      }
    }
    var newHash = body.newPassword ? await hashPassword(body.newPassword) : user.password_hash;

    await sql`UPDATE admin_users SET email = ${newEmail}, password_hash = ${newHash} WHERE id = ${user.id}`;
    // Ré-émet la session avec l'email à jour (sinon resterait l'ancien jusqu'à la prochaine connexion).
    createSession(res, ADMIN_COOKIE, { role: "admin", id: user.id, email: newEmail });
    return res.status(200).json({ ok: true, email: newEmail });
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

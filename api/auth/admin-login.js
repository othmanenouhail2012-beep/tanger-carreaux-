const { sql } = require("../../lib/db");
const { verifyPassword, createSession, ADMIN_COOKIE } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
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

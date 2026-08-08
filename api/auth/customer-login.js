const { sql } = require("../../lib/db");
const { verifyPassword, createSession, CUSTOMER_COOKIE } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  var body = req.body || {};
  if (!body.email || !body.password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }
  var rows = await sql`SELECT id, email, name, password_hash FROM customers WHERE email = ${body.email}`;
  var user = rows[0];
  if (!user || !(await verifyPassword(body.password, user.password_hash))) {
    return res.status(401).json({ error: "Identifiants incorrects." });
  }
  createSession(res, CUSTOMER_COOKIE, { role: "customer", id: user.id, email: user.email, name: user.name });
  return res.status(200).json({ ok: true, email: user.email, name: user.name });
};

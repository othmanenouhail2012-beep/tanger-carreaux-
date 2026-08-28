// POST /api/auth/customer?action=login   -- { email, password }
// POST /api/auth/customer?action=signup  -- { name, email, password, phone? }
// POST /api/auth/customer?action=logout
//
// Fusionné depuis customer-login.js + customer-signup.js + customer-logout.js pour
// repasser sous la limite de 12 fonctions serverless du forfait Vercel Hobby (13
// fichiers dans /api au 28/08/2026, déploiement refusé). Appelé depuis js/main.js
// (espace-client.html).
const { sql } = require("../../lib/db");
const { verifyPassword, hashPassword, createSession, clearSession, CUSTOMER_COOKIE } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  var action = (req.query && req.query.action) || "login";
  var body = req.body || {};

  if (action === "logout") {
    clearSession(res, CUSTOMER_COOKIE);
    return res.status(200).json({ ok: true });
  }

  if (action === "signup") {
    if (!body.email || !body.password || !body.name) {
      return res.status(400).json({ error: "Nom, email et mot de passe requis." });
    }
    if (String(body.password).length < 8) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    }
    var existing = await sql`SELECT id FROM customers WHERE email = ${body.email}`;
    if (existing.length) {
      return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
    }
    var hash = await hashPassword(body.password);
    var created = await sql`
      INSERT INTO customers (email, password_hash, name, phone)
      VALUES (${body.email}, ${hash}, ${body.name}, ${body.phone || ""})
      RETURNING id, email, name
    `;
    var newUser = created[0];
    createSession(res, CUSTOMER_COOKIE, { role: "customer", id: newUser.id, email: newUser.email, name: newUser.name });
    return res.status(201).json({ ok: true, email: newUser.email, name: newUser.name });
  }

  // action === "login" (défaut)
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

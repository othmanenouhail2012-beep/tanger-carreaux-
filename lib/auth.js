// Authentification admin + client : mots de passe hashés (bcrypt) et sessions par
// cookie signé (HMAC, sans dépendance JWT). Pas de table "sessions" en base -- le
// cookie contient directement les données signées, vérifiées à chaque requête.
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const ADMIN_COOKIE = "tc_admin_session";
const CUSTOMER_COOKIE = "tc_customer_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14; // 14 jours

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET manquant -- voir .env.local.example");
  }
  return secret;
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function sign(payloadObj) {
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return payload + "." + sig;
}

function verify(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  var payload = parts[0], sig = parts[1];
  var expected;
  try {
    expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  } catch (e) {
    return null;
  }
  if (sig.length !== expected.length) return null;
  var ok;
  try {
    ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch (e) {
    return null; // longueurs incompatibles après décodage -> pas une comparaison valide
  }
  if (!ok) return null;
  try {
    var data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function parseCookies(req) {
  var header = (req.headers && req.headers.cookie) || "";
  var out = {};
  header.split(";").forEach(function (pair) {
    var idx = pair.indexOf("=");
    if (idx === -1) return;
    var k = pair.slice(0, idx).trim();
    var v = pair.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function appendCookie(res, cookie) {
  var existing = res.getHeader("Set-Cookie");
  if (!existing) res.setHeader("Set-Cookie", cookie);
  else if (Array.isArray(existing)) res.setHeader("Set-Cookie", existing.concat(cookie));
  else res.setHeader("Set-Cookie", [existing, cookie]);
}

function isProd() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function createSession(res, cookieName, data) {
  var token = sign(Object.assign({}, data, { exp: Date.now() + SESSION_DURATION_MS }));
  var cookie =
    cookieName + "=" + encodeURIComponent(token) +
    "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + Math.floor(SESSION_DURATION_MS / 1000) +
    (isProd() ? "; Secure" : "");
  appendCookie(res, cookie);
}

function clearSession(res, cookieName) {
  appendCookie(res, cookieName + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" + (isProd() ? "; Secure" : ""));
}

function getSession(req, cookieName) {
  var cookies = parseCookies(req);
  return verify(cookies[cookieName]);
}

// requireAdmin/requireCustomer : à appeler en tout début de handler. Si non authentifié,
// répond directement 401 et renvoie null -- le handler appelant doit alors `return`.
function requireAdmin(req, res) {
  var session = getSession(req, ADMIN_COOKIE);
  if (!session || session.role !== "admin") {
    res.status(401).json({ error: "Non authentifié." });
    return null;
  }
  return session;
}

function requireCustomer(req, res) {
  var session = getSession(req, CUSTOMER_COOKIE);
  if (!session || session.role !== "customer") {
    res.status(401).json({ error: "Non authentifié." });
    return null;
  }
  return session;
}

// Comptes employés limités (demande explicite) : le champ session.role reste toujours
// "admin" pour TOUT compte du dashboard (manager ou employé) -- c'est le marqueur de
// TYPE de session (admin vs client), ne pas confondre avec staffRole ci-dessous qui
// distingue "manager" (accès total) de "employee" (accès restreint à session.permissions,
// un tableau d'identifiants de panneaux, ex. ["orders","stock"], voir admin/admin.js
// PANEL_PERMISSION_LIST). requireManager/requirePermission s'appuient sur requireAdmin
// pour ne jamais dupliquer la vérification de session.
function requireManager(req, res) {
  var session = requireAdmin(req, res);
  if (!session) return null;
  if (session.staffRole !== "manager") {
    res.status(403).json({ error: "Réservé au gérant." });
    return null;
  }
  return session;
}

function requirePermission(req, res, panelKey) {
  var session = requireAdmin(req, res);
  if (!session) return null;
  if (session.staffRole === "manager") return session;
  var perms = Array.isArray(session.permissions) ? session.permissions : [];
  if (perms.indexOf(panelKey) === -1) {
    res.status(403).json({ error: "Accès non autorisé pour ce compte." });
    return null;
  }
  return session;
}

// Le checkout invité reste valide (voir Phase 4 du plan) : cette variante ne renvoie
// jamais 401, juste null si personne n'est connecté, pour rattacher la commande à un
// compte quand une session existe sans jamais l'exiger.
function getOptionalCustomer(req) {
  return getSession(req, CUSTOMER_COOKIE);
}

module.exports = {
  hashPassword: hashPassword,
  verifyPassword: verifyPassword,
  createSession: createSession,
  clearSession: clearSession,
  requireAdmin: requireAdmin,
  requireManager: requireManager,
  requirePermission: requirePermission,
  requireCustomer: requireCustomer,
  getOptionalCustomer: getOptionalCustomer,
  ADMIN_COOKIE: ADMIN_COOKIE,
  CUSTOMER_COOKIE: CUSTOMER_COOKIE
};

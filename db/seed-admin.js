#!/usr/bin/env node
// Crée (ou met à jour) le compte admin -- à exécuter UNE FOIS localement, jamais via
// un endpoint public (il n'en existe volontairement aucun). Usage :
//
//   npm run seed:admin
//
// Le mot de passe est saisi de façon interactive (masqué) -- il ne transite jamais
// par le chat, un fichier suivi par git, ou un argument de ligne de commande visible
// dans l'historique du shell.
require("dotenv").config({ path: ".env.local" });
const readline = require("readline");
const { sql } = require("../lib/db");
const { hashPassword } = require("../lib/auth");

function prompt(question, hidden) {
  return new Promise(function (resolve) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (!hidden) {
      rl.question(question, function (answer) { rl.close(); resolve(answer.trim()); });
      return;
    }
    // Masque la saisie caractère par caractère (pas de dépendance externe).
    const stdin = process.stdin;
    process.stdout.write(question);
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    function onData(ch) {
      if (ch === "\n" || ch === "\r" || ch === "") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        rl.close();
        resolve(value.trim());
      } else if (ch === "") {
        process.exit(1);
      } else if (ch === "") {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    }
    stdin.on("data", onData);
  });
}

async function main() {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.error("DATABASE_URL manquant -- remplis .env.local d'abord (voir .env.local.example).");
    process.exit(1);
  }
  const email = await prompt("Email admin : ", false);
  const password = await prompt("Mot de passe admin (saisie masquée) : ", true);
  if (!email || password.length < 8) {
    console.error("Email requis et mot de passe d'au moins 8 caractères.");
    process.exit(1);
  }
  const hash = await hashPassword(password);
  await sql`
    INSERT INTO admin_users (email, password_hash)
    VALUES (${email}, ${hash})
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;
  console.log("Compte admin créé/mis à jour pour " + email + ".");
  process.exit(0);
}

main().catch(function (err) {
  console.error("Échec :", err.message);
  process.exit(1);
});

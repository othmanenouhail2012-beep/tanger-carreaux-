// ============================================================
//  Réseau de Secours — le serveur
//  Il tourne sur l'ordinateur portable (sur batterie).
//  Les téléphones s'y connectent par le Wi-Fi local, sans internet.
// ============================================================

const express = require('express');      // envoie les pages web
const http = require('http');            // le serveur web de base de Node.js
const { Server } = require('socket.io'); // les messages en temps réel
const os = require('os');                // infos sur l'ordinateur (adresses IP...)
const path = require('path');            // pour écrire des chemins de fichiers

const PORT = 3000; // la « porte » de l'ordinateur sur laquelle le serveur écoute

// --- 1. On crée le serveur ---
const app = express();
const serveur = http.createServer(app);
const io = new Server(serveur);
// Socket.IO ajoute tout seul l'adresse /socket.io/socket.io.js :
// le code client est donc servi par NOTRE serveur, pas par internet.

// --- 2. Les pages ---
// Tout ce qui est dans le dossier "public" peut être envoyé aux navigateurs.
// /eleve -> public/eleve/index.html     /prof -> public/prof/index.html
app.use(express.static(path.join(__dirname, 'public')));

// Si on tape juste l'adresse sans rien, on va sur la page élève.
app.get('/', (req, res) => res.redirect('/eleve'));

// --- 3. Le temps réel ---
// Cette fonction est appelée chaque fois qu'un appareil se connecte.
io.on('connection', (socket) => {
  console.log('+ Un appareil vient de se connecter (' + io.engine.clientsCount + ' en tout)');

  socket.on('disconnect', () => {
    console.log('- Un appareil est parti (' + io.engine.clientsCount + ' en tout)');
  });
});

// --- 4. Trouver l'adresse IP locale de l'ordinateur ---
// C'est l'adresse que le point d'accès Wi-Fi a donnée à l'ordinateur.
function trouverAdressesLocales() {
  const adresses = [];
  const cartesReseau = os.networkInterfaces();
  for (const nom in cartesReseau) {
    for (const carte of cartesReseau[nom]) {
      // On garde les adresses IPv4, sauf 127.0.0.1 qui veut dire « moi-même ».
      if (carte.family === 'IPv4' && !carte.internal) {
        adresses.push(carte.address);
      }
    }
  }
  return adresses;
}

// --- 5. On démarre ---
// '0.0.0.0' = accepter les appareils du réseau, pas seulement l'ordinateur lui-même.
serveur.listen(PORT, '0.0.0.0', () => {
  const adresses = trouverAdressesLocales();

  console.log('');
  console.log('==============================================');
  console.log('   RÉSEAU DE SECOURS — serveur démarré');
  console.log('==============================================');

  if (adresses.length === 0) {
    console.log(' Aucun réseau trouvé !');
    console.log(' Connecte l\'ordinateur au Wi-Fi du téléphone, puis relance.');
  } else {
    for (const ip of adresses) {
      console.log('');
      console.log(' Élèves (téléphones) : http://' + ip + ':' + PORT + '/eleve');
      console.log(' Prof                : http://' + ip + ':' + PORT + '/prof');
    }
  }

  console.log('');
  console.log(' Sur cet ordinateur  : http://localhost:' + PORT + '/prof');
  console.log(' Pour arrêter le serveur : Ctrl + C');
  console.log('==============================================');
  console.log('');
});

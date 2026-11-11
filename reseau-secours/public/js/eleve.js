// Le code de l'appli élève
// (Étape 2 : on vérifie juste que le téléphone arrive à parler au serveur.)

const socket = io(); // ouvre la connexion temps réel avec le serveur
const etat = document.getElementById('etat');

socket.on('connect', () => {
  etat.textContent = 'Connecté au serveur ✔';
});

socket.on('disconnect', () => {
  etat.textContent = 'Connexion perdue...';
});

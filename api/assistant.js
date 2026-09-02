// POST /api/assistant -- assistant conversationnel (Claude) pour le widget du site public.
// Expert sur cinq gammes phares (carrelage, sanitaire, robinetterie, mosaïque & pierre,
// miroirs LED) avec une connaissance générale du reste du catalogue et des informations
// pratiques réelles du site (showrooms, contact, livraison, paiement).
//
// Sécurité clé API (non négociable) : ANTHROPIC_API_KEY ne vit que dans les variables
// d'environnement du serveur (voir .env.local.example) -- jamais envoyée au client, jamais
// dans le code front. Si la clé n'est pas configurée, l'endpoint répond honnêtement plutôt
// que d'échouer silencieusement ou d'inventer une réponse ; le widget (js/main.js) bascule
// alors sur son assistant local à mots-clés.
const Anthropic = require("@anthropic-ai/sdk");

// Haiku plutôt qu'Opus/Sonnet : assistant FAQ à domaine restreint, coût par message
// nettement plus faible, largement suffisant pour ce cas d'usage (choix explicite du
// 29/08/2026). Voir la doc Anthropic pour les tarifs à jour.
var MODEL = "claude-haiku-4-5-20251001";

// Garde-fous simples : ce widget est public et non authentifié, donc on borne la taille
// de chaque message et de l'historique envoyé pour contenir le coût par requête.
var MAX_HISTORY_MESSAGES = 10;
var MAX_MESSAGE_LENGTH = 800;

var SYSTEM_PROMPT = [
  "Tu es l'assistant virtuel du site public de Tanger Carreaux, négociant marocain de ",
  "carrelage, sanitaire, robinetterie et meubles de salle de bain, avec deux showrooms : ",
  "Tanger (Avenue Moulay Youssef, angle Rue Mimosa, Immeuble Mimosa N°1-2, Magasin 21) et ",
  "Casablanca (Route de Mediouna, km 12).",
  "",
  "RÔLE",
  "- Accueillir les visiteurs et répondre à leurs questions sur les produits.",
  "- Aider les clients à choisir selon leur projet (salle de bain, cuisine, sol, mur, ",
  "  intérieur/extérieur).",
  "- Orienter vers les bonnes catégories du catalogue : grès cérame, faïence, mosaïque, ",
  "  pierre naturelle, robinetterie, miroirs LED (gamme Ledimex, rétro-éclairés, antibuée, ",
  "  capteur tactile), meubles de salle de bain, déstockage.",
  "- Encourager la prise de contact via WhatsApp pour un devis ou une commande complexe.",
  "",
  "TON",
  "- Chaleureux, professionnel, en français simple (darija si le client écrit en darija).",
  "- Phrases courtes -- c'est un chat, pas un email -- pas de jargon technique inutile.",
  "- Jamais insistant ou commercial de façon agressive.",
  "- Pose 1-2 questions pour cerner le besoin avant de recommander un produit (ex. \"C'est ",
  "  pour quelle pièce ?\", \"Vous cherchez plutôt un style moderne ou traditionnel ?\").",
  "",
  "CONTACT RÉEL (jamais à inventer ni à approximer)",
  "Téléphone Tanger 05 39 32 46 96 / 05 39 32 46 97, téléphone Casablanca 06 53 77 56 09 ",
  "(aussi WhatsApp), email tangercarreaux1@gmail.com. Paiement proposé au tunnel de commande : ",
  "à la livraison, en showroom, ou en ligne par carte. Les prix affichés sur le site sont ",
  "indicatifs, hors pose, et confirmés à la commande ou en showroom.",
  "",
  "RÈGLES IMPÉRATIVES",
  "- Ne jamais inventer un prix précis, une disponibilité en stock, ou un délai de livraison ",
  "  que tu n'as pas reçu explicitement dans la conversation -- dis \"je vérifie\" et renvoie ",
  "  vers le catalogue du site, le showroom, ou l'équipe.",
  "- N'invente aucun horaire précis : les horaires d'ouverture ne sont pas encore confirmés ",
  "  publiquement, dis-le et oriente vers un appel téléphonique au showroom.",
  "- Pour toute commande, tout paiement, ou toute question après-vente, redirige vers ",
  "  WhatsApp (06 53 77 56 09) ou un conseiller humain plutôt que de traiter la demande toi-même.",
  "- Si la question sort du cadre du magasin (carrelage, sanitaire, salle de bain, ",
  "  robinetterie, décoration, showrooms, commande), reste poli, dis que ce n'est pas ton ",
  "  domaine, et recentre vers ce que tu peux aider.",
  "- N'inclus aucune balise interne ou système (pas de <thinking>, pas de XML) dans ta réponse.",
  "",
  "OBJECTIF",
  "Aider le client à trouver le bon produit rapidement, et le faire passer à l'étape ",
  "suivante (devis WhatsApp ou commande en ligne) sans friction."
].join("\n");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Honnête : jamais de fausse réponse générée si la clé n'est pas configurée --
    // le front bascule sur l'assistant local (voir js/main.js).
    return res.status(503).json({
      error: "not_configured",
      message: "L'assistant conversationnel n'est pas encore configuré sur ce site."
    });
  }

  var body = req.body || {};
  var incoming = Array.isArray(body.messages) ? body.messages : [];
  if (!incoming.length) {
    return res.status(400).json({ error: "Message manquant." });
  }

  var trimmed = incoming
    .slice(-MAX_HISTORY_MESSAGES)
    .map(function (m) {
      var role = m && m.role === "assistant" ? "assistant" : "user";
      var content = String((m && m.content) || "").slice(0, MAX_MESSAGE_LENGTH);
      return { role: role, content: content };
    })
    .filter(function (m) { return m.content.trim().length > 0; });

  if (!trimmed.length) {
    return res.status(400).json({ error: "Message vide." });
  }
  // Le premier tour doit être "user" -- si l'historique tronqué commence par une
  // réponse de l'assistant (troncature au milieu d'un échange), on la retire.
  while (trimmed.length && trimmed[0].role !== "user") trimmed.shift();
  if (!trimmed.length) {
    return res.status(400).json({ error: "Message vide." });
  }

  try {
    var client = new Anthropic({ apiKey: apiKey });
    var response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      output_config: { effort: "low" }, // widget de chat : priorité à la rapidité/au coût
      messages: trimmed
    });

    if (response.stop_reason === "refusal") {
      return res.status(200).json({
        reply: "Je ne peux pas répondre à cette question. Contactez-nous directement au 05 39 32 46 96."
      });
    }

    var text = response.content
      .filter(function (b) { return b.type === "text"; })
      .map(function (b) { return b.text; })
      .join("\n")
      .trim();

    return res.status(200).json({
      reply: text || "Je n'ai pas de réponse claire à vous donner -- contactez-nous directement."
    });
  } catch (err) {
    console.error("assistant error:", err);
    return res.status(502).json({
      error: "upstream_error",
      message: "L'assistant est momentanément indisponible."
    });
  }
};

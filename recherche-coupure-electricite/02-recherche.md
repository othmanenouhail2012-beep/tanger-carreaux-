# Que se passe-t-il quand l'électricité est coupée ?

Dossier de recherche — projet d'informatique.

> **Comment lire ce dossier**
> - Chaque information importante est suivie de sa source (titre + lien).
> - **« non vérifié »** signifie : je n'ai pas trouvé de source assez fiable, ou les sources se contredisent.
> - **Limite de la méthode :** les faits ont été vérifiés par recherche web (résultats et extraits des pages). Les pages elles-mêmes n'ont pas pu être ouvertes une par une depuis l'outil utilisé. Avant de citer un chiffre à l'oral, il est conseillé de cliquer sur le lien pour le relire dans la source d'origine.
> - Recherche faite le 11 novembre 2026.

---

## 1. C'est quoi une coupure ?

### Le chemin de l'électricité

L'électricité est produite dans des **centrales** (barrages, centrales à gaz, parcs solaires, éoliennes…). Elle voyage ensuite sur des **lignes à haute tension** (le réseau de transport), puis sur des lignes plus petites (le réseau de distribution) jusqu'aux maisons, aux antennes de téléphone et aux centres de données.

Point très important : l'électricité se stocke difficilement. À chaque seconde, il faut produire **exactement** ce qui est consommé. Le « thermomètre » de cet équilibre, c'est la **fréquence** du courant : 50 Hz en Europe et au Maroc. Si on consomme plus qu'on ne produit, la fréquence baisse ; si on produit trop, elle monte.
(Source : [La fréquence électrique, un équilibre vital pour le réseau — EDF](https://www.edf.fr/la-centrale-nucleaire-du-tricastin/les-actualites-de-la-centrale-nucleaire-du-tricastin/la-frequence-electrique-un-equilibre-vital-pour-le-reseau-et-pour-la-centrale-nucleaire-du-tricastin))

### Les trois types de coupure

| Type | Ce que c'est | Exemple |
|---|---|---|
| **Panne locale** | Un quartier ou une ville n'a plus de courant à cause d'un problème proche (câble, poste électrique). Le reste du pays fonctionne. | Casablanca, 8 juillet 2020 (voir section 8) |
| **Délestage** | Coupure **volontaire** et limitée : on coupe certains clients pour soulager le réseau et éviter que tout s'effondre. Souvent « tournant » : chaque zone est coupée à son tour. | Afrique du Sud |
| **Blackout général** | Le réseau entier d'une région ou d'un pays s'effondre. Il faut le redémarrer morceau par morceau. | Espagne et Portugal, 28 avril 2025 |

**Le délestage en détail.** Quand la fréquence descend trop, des automatismes coupent une partie des clients pour sauver le reste : en Europe, le seuil de 49 Hz déclenche la déconnexion de lignes de distribution.
(Sources : [Rapport sur la panne du 4 novembre 2006 — Annales des Mines](https://www.annales.org/ri/2007/ri-aout-2007/leteurtrois.pdf) ; [Qu'est-ce que le délestage électrique ? — Choisir.com](https://www.choisir.com/energie/articles/104429/quest-ce-que-le-delestage-electrique))

En France, les coupures tournantes prévues pour l'hiver 2022-2023 devaient durer 2 heures maximum par zone — **non vérifié** dans une source officielle (chiffre repris d'un site grand public : [Effy](https://www.effy.fr/renovation-energetique/coupure-electricite-panne-que-faire)).

**L'exemple de l'Afrique du Sud.** La compagnie Eskom utilise des « paliers » (*stages*) : plus le palier est élevé, plus on coupe. Le palier 6 permet de retirer jusqu'à 6 000 MW du réseau. En 2023, le pays a connu un record de 332 jours avec délestage (contre 205 en 2022).
(Sources : [Eskom hits stage 8 load shedding — Daily Investor](https://dailyinvestor.com/energy/14618/eskom-hits-stage-8-load-shedding/) ; [A record 332 days of load shedding in 2023 — IOL](https://iol.co.za/news/south-africa/2023-12-11-the-year-we-were-plunged-into-darkness-a-record-332-days-of-load-shedding-in-2023-and-counting/))

---

## 2. Pourquoi ça arrive ?

### a) La météo
Tempête, gel, canicule : la météo abîme les lignes ou bloque les centrales.
- **Texas, février 2021** : pendant une vague de froid, plus de 4,5 millions de personnes ont perdu le courant, certaines pendant 4 jours. Le rapport officiel explique que 44 % des arrêts imprévus de centrales venaient d'équipements gelés. L'État du Texas a estimé le bilan à 246 morts.
(Sources : [Final Report on February 2021 Freeze — FERC](https://ferc.gov/news-events/news/final-report-february-2021-freeze-underscores-winterization-recommendations) ; [Deadly Texas winter storm power outages… — ABC13](https://abc13.com/amp/post/texas-winter-storm-2021-power-outage-report-finds-cause-deaths/11041471/) ; [US grid watchdog urges cold-weather protections — Argus Media](https://www.argusmedia.com/zh/news-and-insights/latest-market-news/2256993-us-grid-watchdog-urges-cold-weather-protections))

### b) La surcharge
Quand tout le monde consomme en même temps (climatiseurs pendant une canicule, chauffage en hiver), la demande peut dépasser ce que le réseau peut fournir. C'était le contexte de la panne géante en Inde en 2012 (section 3).

### c) La panne technique
Une ligne qui touche un arbre, un transformateur qui lâche, un logiciel d'alarme qui tombe en panne… C'est le point de départ du blackout nord-américain de 2003 (section 3).

### d) L'erreur humaine
- **Europe, 4 novembre 2006** : en Allemagne, une ligne à haute tension a été coupée volontairement pour laisser passer un navire de croisière sur le fleuve Ems. L'opération avait été mal préparée et les autres gestionnaires de réseau n'avaient pas été prévenus. Résultat : plus de 15 millions de foyers européens privés de courant, pendant près de deux heures.
(Sources : [Communiqué de la CRE sur l'incident du 4 novembre 2006](https://www.cre.fr/fileadmin/Documents/Communiques_de_presse/import/1170938766980.pdf) ; [E.ON blamed for November blackout — Power Engineering](https://www.power-eng.com/operations-maintenance/eon-blamed-for-november-blackout/))

### e) La cyberattaque
Des pirates peuvent prendre le contrôle des ordinateurs qui pilotent le réseau. C'est arrivé en Ukraine en 2015 (section 3).

### L'effet dominos
Un blackout géant n'a presque jamais une seule cause. Une première panne reporte la charge sur les autres lignes, qui se mettent en sécurité à leur tour, et ainsi de suite : c'est une **cascade**. Les enquêtes sur 2003, 2012 et 2025 décrivent toutes ce mécanisme.

---

## 3. Exemples réels

### Exemple 1 — Espagne et Portugal, 28 avril 2025

| | |
|---|---|
| **Date** | Lundi 28 avril 2025, à 12 h 33 (heure d'Espagne) |
| **Lieu** | Toute l'Espagne continentale et le Portugal ; une petite zone du sud-ouest de la France a été touchée très brièvement |
| **Cause** | Une combinaison de facteurs, avec au centre un problème de **tension trop élevée** (surtension) qui a fait se déconnecter les centrales en cascade |
| **Durée** | Environ 18 heures pour retrouver plus de 99 % du courant en Espagne (à 7 h le 29 avril) |
| **Conséquences** | Trains et métros arrêtés, internet et téléphone très perturbés, paiements par carte en chute, hôpitaux sur groupes électrogènes |

**Ce qui s'est passé.** À 12 h 33, le réseau espagnol a perdu d'un coup 15 gigawatts de production en 5 secondes, soit environ 60 % de ce que le pays consommait à ce moment-là. Le réseau s'est effondré : c'est ce qu'on appelle un « zéro électrique ».
(Sources : [28 April 2025 Blackout — ENTSO-E](https://www.entsoe.eu/publications/blackout/28-april-2025-iberian-blackout/) ; [Los cinco segundos del caos — El Independiente](https://www.elindependiente.com/economia/2025/04/28/los-cinco-segundos-del-caos-asi-cayo-cada-fuente-de-energia-de-repente/))

**La cause, d'après l'enquête européenne.** Un groupe de 49 experts a rendu son rapport final le 20 mars 2026. Sa conclusion : il n'y a pas un coupable unique mais plusieurs facteurs qui se sont additionnés — des oscillations sur le réseau, un contrôle insuffisant de la tension, puis des centrales qui se déconnectent les unes après les autres quand la tension monte trop vite. Le rapport précise qu'il n'attribue pas de responsabilité juridique.
(Sources : [ENTSO-E publishes Expert Panel Final Report](https://www.entsoe.eu/news/2026/03/20/entso-e-publishes-expert-panel-final-report-on-28-april-2025-blackout-in-spain-and-portugal/) ; [Note de presse de Red Eléctrica, 20 mars 2026](https://www.ree.es/sites/default/files/2026-03/NP%20-%20FinalReport%20Expert%20Panel%2020%20marzo.pdf) ; [Entso-E report finds systemic failures — pv magazine](https://www.pv-magazine.com/2026/03/23/entso-e-report-finds-systemic-failures-behind-2025-iberian-blackout/))

**Le retour du courant.** Le réseau a été rallumé petit à petit, grâce aux barrages hydroélectriques et aux liaisons avec la France et le Maroc. À 7 h le lendemain, plus de 99 % de la demande espagnole était rétablie. Au Portugal, le gestionnaire REN a annoncé que ses 6,4 millions de clients avaient retrouvé le courant.
(Sources : [Incident in the power systems of Spain and Portugal — ENTSO-E](https://www.entsoe.eu/news/2025/04/28/grid-incident-in-the-power-systems-of-spain-and-portugal/) ; [Power returns to Spain and Portugal — Associated Press](https://www.yahoo.com/news/spain-portugal-scramble-restore-electricity-041250461.html))

**Les conséquences.**
- **Trains** : 116 trains se sont retrouvés bloqués ; la compagnie Renfe a dû évacuer entre 30 000 et 35 000 voyageurs. (Source : [Fin al apagón… caos en trenes y Metro — Qué!](https://www.que.es/2025/04/28/fin-apagon-espana/))
- **Internet** : le trafic a chuté tout de suite d'environ 60 % en Espagne, puis jusqu'à 80 % dans les cinq heures suivantes ; au Portugal, d'environ 50 % puis jusqu'à 90 %. (Source : [How the April 28, 2025, power outage… impacted Internet traffic — Cloudflare](https://blog.cloudflare.com/how-power-outage-in-portugal-spain-impacted-internet))
- **Paiements** : les achats par carte en magasin ont baissé de 55 % par rapport à un lundi normal. (Source : [¿Cómo pagamos cuando se va la luz? — Banco de España](https://www.bde.es/wbe/es/noticias-eventos/blog/como-pagamos-cuando-todo-se-apaga-la-experiencia-del-apagon-en-espana.html))
- **Hôpitaux** : ils ont tenu grâce à leurs groupes électrogènes, en reportant les soins non urgents. (Source : [Los equipos electrógenos de emergencia permiten a los hospitales mantener servicios esenciales — elDiario.es](https://www.eldiario.es/sociedad/equipos-electrogenos-emergencia-permiten-hospitales-mantener-servicios-esenciales_1_12253592.html))
- **Coût** : les estimations varient beaucoup. Le patronat espagnol (CEOE) a parlé de 1,6 milliard d'euros ; CaixaBank Research estime l'effet réel sur le PIB à moins de 400 millions d'euros, parce que les achats ont repris les jours suivants. (Source : [Valoración del impacto económico del apagón — CaixaBank Research](https://www.caixabankresearch.com/es/publicaciones/notas-breves-actualidad-economica-y-financiera/espana/valoracion-del-impacto-economico) ; [Gobierno y empresarios discrepan — El Diario](https://www.eldiario.ec/mundo/gobierno-y-empresarios-discrepan-sobre-el-impacto-economico-del-apagon-en-espana-30042025/))
- **Victimes** : la presse a rapporté plusieurs décès liés à la panne (intoxication au monoxyde de carbone à cause d'un groupe électrogène, incendie causé par une bougie, appareil à oxygène arrêté). Au moins 5 morts étaient rapportés le 30 avril. **Bilan officiel définitif : non vérifié.** (Source : [Death toll from Spanish blackout climbs to five — Murcia Today](https://m.murciatoday.com/death-toll-from-spanish-blackout-climbs-to-five_1000207799-a.html))

**Et au Maroc ?** (vérifié)
- **Pas de coupure de courant au Maroc.** Le réseau marocain n'a pas été entraîné dans la panne. (Source : [Blackout en Europe : le système électrique national — Médias24](https://medias24.com/2025/05/04/blackout-en-europe-systeme-electrique-national/))
- **Le Maroc a aidé l'Espagne.** À la demande de Red Eléctrica, l'ONEE a remis en service la liaison par câbles sous-marins du détroit de Gibraltar pour envoyer du courant et aider à redémarrer les centrales espagnoles. Le chef du gouvernement espagnol a remercié le Maroc et la France. (Sources : [Comment le Maroc est venu en renfort à l'Espagne — Le360](https://fr.le360.ma/economie/panne-electrique-comment-le-maroc-est-venu-en-renfort-a-lespagne_TDBXHHBSOBBMRPNOV7RB2P3MUA/) ; [Sánchez remercie le Maroc pour son aide — Hespress](https://fr.hespress.com/421808-panne-delectricite-sanchez-remercie-le-maroc-pour-son-aide.html))
- **Combien ?** La presse cite environ 519 MW envoyés vers l'Espagne le soir du 28 avril. (Source : [Les centrales espagnoles réactivées grâce au câble sous-marin relié au Maroc — Le Desk](https://ledesk.ma/encontinu/les-centrales-espagnoles-reactivees-grace-au-cable-sous-marin-relie-au-maroc/)). L'affirmation « le Maroc a mobilisé 38 % de sa capacité » n'apparaît que dans un seul média : **non vérifié**.
- **Internet a été touché.** Orange Maroc a annoncé une perturbation de son trafic internet, parce que ses liaisons internationales passent par la péninsule ibérique. Cloudflare a aussi observé cette baisse. C'est un bon exemple : **on peut perdre internet à cause d'une panne de courant dans un autre pays.** (Sources : [Orange Maroc annonce le retour progressif d'internet — APA News](https://fr.apanews.net/news/orange-maroc-annonce-le-retour-progressif-dinternet-apres-la-panne-en-europe/) ; [Cloudflare](https://blog.cloudflare.com/how-power-outage-in-portugal-spain-impacted-internet))

### Exemple 2 — États-Unis et Canada, 14 août 2003

| | |
|---|---|
| **Date** | 14 août 2003, cascade finale à partir de 16 h 05 (heure de l'Est) |
| **Lieu** | 8 États américains (Ohio, Michigan, Pennsylvanie, New York, Vermont, Massachusetts, Connecticut, New Jersey) et la province canadienne de l'Ontario |
| **Cause** | En Ohio, des lignes de la compagnie FirstEnergy ont touché des arbres mal élagués ; le logiciel d'alarme de la salle de contrôle était en panne, donc personne n'a réagi à temps |
| **Durée** | Jusqu'à 2 jours pour la plupart des gens, jusqu'à 4 jours à certains endroits |
| **Conséquences** | Environ 50 millions de personnes touchées, 61 800 MW de consommation coupés ; coût estimé à environ 6 milliards de dollars par le ministère américain de l'Énergie |

(Sources : [Final Report on the August 14, 2003 Blackout — U.S.-Canada Power System Outage Task Force (Berkeley Lab)](https://emp.lbl.gov/publications/final-report-august-14-2003-blackout) ; [Blackout 2003 — IESO (Ontario)](https://ieso.ca/Corporate-IESO/Media/Also-of-Interest/Blackout-2003) ; [The 2003 Northeast Blackout — Five Years Later — Scientific American](https://www.scientificamerican.com/article/2003-blackout-five-years-later/) ; [The Economic Cost of the Blackout — ICF Consulting](https://www.solarstorms.org/ICFBlackout2003.pdf))

Leçon du rapport officiel : les règles pour éviter la panne existaient, mais elles n'ont pas été respectées. Un bug informatique (les alarmes) a transformé un petit incident en catastrophe.

### Exemple 3 — Inde, 30 et 31 juillet 2012

| | |
|---|---|
| **Date** | 30 juillet 2012 vers 2 h 30 du matin, puis de nouveau le 31 juillet vers 13 h |
| **Lieu** | Nord de l'Inde le premier jour ; nord, est et nord-est le deuxième jour (20 des 28 États de l'époque) |
| **Cause** | Plusieurs facteurs combinés : liaisons entre régions affaiblies, déclenchement de la ligne 400 kV Bina–Gwalior, et très forte demande pendant la chaleur |
| **Durée** | Plusieurs heures chaque jour ; le réseau a été entièrement rétabli le 1er août au matin |
| **Conséquences** | Environ 620 millions de personnes sans courant le 31 juillet (la plus grande panne de l'histoire en nombre de personnes) ; des centaines de trains arrêtés, feux de circulation éteints |

(Sources : [World's biggest blackout: 620 million people without power in India — Christian Science Monitor / AP](https://www.csmonitor.com/World/Latest-News-Wires/2012/0731/World-s-biggest-blackout-620-million-people-without-power-in-India) ; [Power restored across India after historic blackout — Fox News / AP](https://www.foxnews.com/world/power-restored-across-india-after-historic-blackout) ; ['No single factor responsible for grid failures' — PSEBEA](https://psebea.org/node/5114) ; point de départ : [2012 India blackouts — Wikipédia](https://en.wikipedia.org/wiki/2012_India_blackouts))

Le nombre exact de personnes touchées le 30 juillet varie selon les sources (300 à 400 millions) : **non vérifié**.

### Exemple 4 — Ukraine, 23 décembre 2015 (cyberattaque)

| | |
|---|---|
| **Date** | 23 décembre 2015 |
| **Lieu** | Ouest de l'Ukraine, trois compagnies régionales de distribution |
| **Cause** | Des pirates ont pris le contrôle à distance des ordinateurs des compagnies et ont ouvert les disjoncteurs |
| **Durée** | Plusieurs heures ; les opérateurs ont dû rétablir le courant à la main |
| **Conséquences** | Environ 225 000 clients sans électricité |

(Sources : [IR-ALERT-H-16-056-01, Cyber-Attack Against Ukrainian Critical Infrastructure — CISA (agence américaine de cybersécurité)](https://cisa.gov/news-events/ics-alerts/ir-alert-h-16-056-01) ; [NERC report highlights lessons learned — Hunton](https://www.hunton.com/privacy-and-cybersecurity-law-blog/nerc-report-highlights-lessons-learned-from-ukraine-electric-utility-cyber-attack))

Les pirates avaient espionné les systèmes pendant environ six mois avant d'agir. Des entreprises de cybersécurité attribuent l'attaque au groupe « Sandworm », lié à la Russie ; ce n'est pas l'alerte officielle américaine qui le dit. La durée précise (« 1 à 6 heures ») : **non vérifié**.

### Tableau récapitulatif

| Date | Lieu | Cause principale | Personnes touchées | Durée |
|---|---|---|---|---|
| 14 août 2003 | États-Unis / Canada | Panne technique + bug d'alarme | ≈ 50 millions | jusqu'à 2 à 4 jours |
| 4 nov. 2006 | Europe de l'Ouest | Erreur humaine | > 15 millions de foyers | ≈ 2 heures |
| 30-31 juil. 2012 | Inde | Surcharge + réseau fragile | ≈ 620 millions | plusieurs heures, 2 jours de suite |
| 23 déc. 2015 | Ukraine | Cyberattaque | ≈ 225 000 clients | plusieurs heures |
| Février 2021 | Texas | Météo (gel) | > 4,5 millions | jusqu'à 4 jours |
| 28 avril 2025 | Espagne / Portugal | Surtension en cascade | 2 pays entiers | ≈ 18 heures |

---

## 4. Conséquences

### À la maison
Plus de lumière, de frigo, de plaques électriques, de chauffage ou de climatisation électrique, d'ascenseur, de recharge de téléphone. La box internet s'éteint immédiatement (voir ci-dessous).

### Internet et téléphone

| Équipement | Que se passe-t-il ? | Combien de temps ça tient ? |
|---|---|---|
| **Box internet** | Elle n'a pas de batterie : elle s'éteint tout de suite. Le Wi-Fi et le téléphone fixe (qui passe par la box) s'arrêtent aussi. | 0 minute sans onduleur |
| **Antennes relais (réseau mobile)** | Elles passent sur batteries. Quand les batteries sont vides, l'antenne s'éteint, sauf si elle a un groupe électrogène. | En France, Orange annonçait environ 20 minutes ; d'autres sources parlent de 30 minutes à 2 heures |
| **Data centers** | Des batteries (onduleurs) prennent le relais le temps que les groupes électrogènes démarrent. | La norme Uptime Institute demande au moins 12 heures de carburant sur place ; beaucoup de sites en stockent pour 48 à 72 heures |

(Sources : [Que va changer la fermeture du réseau cuivre ? — Arcep](https://www.arcep.fr/mes-demarches-et-services/consommateurs/fiches-pratiques/que-va-changer-la-fermeture-du-reseau-cuivre.html) ; [Téléphone fixe et box muets en cas de coupure de courant — Selectra](https://selectra.info/telecom/actualites/marche/telephone-fixe-box-muet-coupure-courant) ; [En cas de délestage, le réseau mobile d'Orange tiendra pendant encore 20 minutes — Next](https://next.ink/brief-article/en-cas-de-delestage-le-reseau-mobile-dorange-tiendra-pendant-encore-20-minutes/) ; [Le réseau mobile tombe avec l'électricité : autonomie des antennes — Selectra](https://selectra.info/telecom/actualites/marche/reseau-mobile-tombe-avec-electricite-autonomie-antennes) ; [Data center tiers — Keentel Engineering](https://keentelengineering.com/data-center-tiers-1-2-3-4) ; [Uptime data center tier standards — TechTarget](https://techtarget.com/searchdatacenter/definition/Uptime-data-center-tier-standards))

- La durée exacte des batteries d'onduleur dans les data centers (souvent décrite comme « quelques minutes ») : **non vérifié**.
- L'autonomie des antennes relais **au Maroc** : **non vérifié** (aucune source trouvée).

**Ce que l'Espagne a montré en 2025.** Les opérateurs ont fonctionné sur batteries et groupes électrogènes, mais beaucoup d'antennes n'avaient pas assez d'autonomie. Une heure après le début de la panne, le plus grand opérateur (Movistar) ne transportait plus que 16,4 % de son trafic habituel. Le lendemain après-midi, Vodafone disait avoir récupéré 99,5 % de son trafic mobile.
(Sources : [Ya sabemos qué red de fibra y móvil aguantó — Bandaancha](https://bandaancha.eu/articulos/ya-sabemos-que-red-fibra-movil-aguanto-11342) ; [Apagón masivo expone vulnerabilidades críticas en las redes móviles — TeleSemana](https://www.telesemana.com/blog/2025/04/30/apagon-masivo-en-la-peninsula-iberica-expone-vulnerabilidades-criticas-en-las-redes-moviles/) ; [Telcos Disrupted by Iberian Power Outage — Telco Magazine](https://telcomagazine.com/articles/telcos-disrupted-by-iberian-power-outage-a-warning))

### Santé et hôpitaux
Les hôpitaux ont des groupes électrogènes de secours. En Espagne en 2025, ils ont démarré et les urgences ont continué, mais les opérations non urgentes ont été reportées. Exemple : l'hôpital Río Hortega (région de Castille-et-León) avait 18 000 litres de carburant, soit 31 heures d'autonomie.
(Sources : [elDiario.es](https://www.eldiario.es/sociedad/equipos-electrogenos-emergencia-permiten-hospitales-mantener-servicios-esenciales_1_12253592.html) ; [El Río Hortega cuenta con dos generadores — Salud Castilla y León](https://www.saludcastillayleon.es/HRHortega/en/noticias-medios-comunicacion/14-05-2025-rio-hortega-cuenta-dos-generadores-capacidad-lle))

En France, une circulaire de 2005 demandait aux hôpitaux assez de carburant pour au moins 48 heures. (Source : [Circulaire DHOS/E4 n° 2005-547 — AP-HP](https://affairesjuridiques.aphp.fr/textes/circulaire-dhose4-n-2005-547-du-13-decembre-2005-relative-a-la-prevention-des-risques-electriques-dans-des-conditions-climatiques-de-grands-froids/)). Règle équivalente au Maroc : **non vérifié**.

Le plus grand danger est à la maison, pour les personnes qui dépendent d'un appareil médical électrique (oxygène, par exemple).

### Eau
L'eau du robinet dépend de **pompes électriques**. Quand elles s'arrêtent, les réservoirs (châteaux d'eau) continuent d'alimenter le réseau un moment, puis la pression baisse ; les étages élevés sont touchés en premier. Les stations d'épuration s'arrêtent aussi, avec un risque de pollution.
(Source : [Coupures d'électricité : un risque majeur pour les installations d'eau et d'assainissement — Maire-info](https://www.maire-info.com/coupures-delectricite-cet-hiver-un-risque-majeur-pour-les-installations-deau-et-dassainissement-article2-26726))

### Transports
Trains électriques, métros et tramways s'arrêtent ; les feux de circulation s'éteignent, ce qui crée des embouteillages. En 2025 en Espagne, 116 trains ont été bloqués (voir section 3). À Casablanca, le tramway s'est arrêté pendant les pannes de 2020 et de 2026 (voir section 8).

### Paiements et banques
Les terminaux de carte ont besoin de courant **et** de réseau. Le 28 avril 2025 en Espagne, par rapport à un lundi normal :
- paiements par carte en magasin : −55 % ;
- retraits aux distributeurs : −34 % ;
- paiements par l'appli mobile Bizum : −75 %.

L'argent liquide est redevenu le moyen de paiement de secours.
(Sources : [¿Cómo pagamos cuando se va la luz? — Banco de España](https://www.bde.es/wbe/es/noticias-eventos/blog/como-pagamos-cuando-todo-se-apaga-la-experiencia-del-apagon-en-espana.html) ; [El apagón — Revista de Estabilidad Financiera, Banco de España](https://www.bde.es/f/webbe/GAP/Secciones/Publicaciones/InformesBoletinesRevistas/RevistaEstabilidadFinanciera/25/3_FSR49_Apagon.pdf))

### Économie
Usines arrêtées, magasins fermés, nourriture perdue dans les frigos. Les estimations sont toujours approximatives : environ 6 milliards de dollars pour 2003 en Amérique du Nord ; entre moins de 400 millions et 1,6 milliard d'euros selon les sources pour l'Espagne en 2025 (voir section 3).

---

## 5. Ce qui continue de fonctionner, et pourquoi

| Ce qui marche encore | Pourquoi | Limite |
|---|---|---|
| **Téléphone et ordinateur portables** | Ils ont leur propre batterie | Quelques heures ; et le réseau mobile peut tomber |
| **Batterie externe** | Réserve d'énergie pour recharger un téléphone | Doit être chargée avant |
| **Onduleur (UPS)** | Une batterie qui prend le relais instantanément pour une box ou un ordinateur | De quelques minutes à quelques heures selon le modèle |
| **Groupe électrogène** | Un moteur à carburant qui fabrique de l'électricité | Dépend du stock de carburant ; **jamais à l'intérieur** (monoxyde de carbone) |
| **Radio à piles** | Très peu d'énergie nécessaire ; les stations de radio émettent grâce à leurs groupes électrogènes | Sens unique : on écoute, on ne répond pas |
| **Panneaux solaires avec batterie** | Produisent et stockent leur propre énergie | Voir ci-dessous |
| **Voiture** | Batterie + carburant ; l'autoradio fonctionne | Réserve de carburant limitée |
| **Argent liquide** | Aucune technologie nécessaire | Il faut en avoir sur soi |

**La radio, héroïne de 2025.** Pendant le blackout ibérique, la radio à piles a été le moyen le plus fiable de s'informer ; les magasins ont été dévalisés en quelques heures et le chef du gouvernement espagnol a recommandé d'en avoir une chez soi.
(Sources : [El gran apagón revaloriza el papel de la radio — Merca2](https://www.merca2.es/2025/04/30/apagon-radio-transistor-2186283/) ; [La radio nunca se apaga — Reporters sans frontières](https://rsf.org/es/cr%C3%B3nica-la-radio-nunca-se-apaga-el-d%C3%ADa-en-que-espa%C3%B1a-se-enganch%C3%B3-las-ondas) ; [Qué recomiendan las autoridades — The Objective](https://theobjective.com/economia/2025-04-29/recomiendan-autoridades-listo-otro-apagon/))

**Le piège du solaire.** Des panneaux solaires classiques, branchés sur le réseau, **s'arrêtent aussi** pendant une coupure. C'est une sécurité obligatoire (protection « anti-îlotage ») : elle évite d'envoyer du courant dans des lignes que les techniciens croient éteintes. Pour garder du courant, il faut une batterie et un onduleur spécial (hybride).
(Sources : [Panneau solaire et coupure de courant — EDF Solutions Solaires](https://www.edf-solutions-solaires.com/guide-solaire/panneau-solaire-coupure-courant/) ; [Panneaux solaires pendant une coupure de courant — Selectra](https://selectra.info/energie/actualites/marche/panneaux-solaires-pendant-une-coupure-de-courant))

**Certains paiements par carte.** Quelques terminaux ont pu accepter des paiements sans réseau grâce au mode hors ligne de la puce des cartes. (Source : [Por qué algunos datáfonos funcionaban sin red y otros no — Xataka](https://www.xataka.com/servicios/resolviendo-grandes-incognitas-apagon-que-algunos-datafonos-funcionaban-red-otros-no))

---

## 6. Le lien avec internet (la partie informatique)

### Sans électricité, pas d'internet

Internet n'est pas « dans les nuages » : c'est une chaîne de machines qui ont **toutes** besoin de courant.

```
Ton téléphone → box Wi-Fi ou antenne relais → réseau de l'opérateur → câbles internationaux → data center
   (batterie)     (0 min / ≈ 20 min à 2 h)      (batteries + groupes)                         (≥ 12 h de carburant)
```

Il suffit qu'**un seul maillon** s'éteigne pour que l'appli ne réponde plus. Le maillon le plus fragile est le plus proche de nous : la box et l'antenne. Et comme l'a montré Orange Maroc en 2025, le maillon cassé peut même se trouver dans un autre pays.

### Comment une appli peut continuer à fonctionner hors ligne

**1. L'approche « offline-first » (hors ligne d'abord).** L'appli est conçue pour marcher **sans** réseau par défaut ; le réseau est un bonus qui sert à synchroniser.

**2. Le cache local avec un *service worker*.** Sur le web, un *service worker* est un petit programme JavaScript qui tourne en arrière-plan et intercepte les requêtes réseau de la page. À l'installation, il enregistre les fichiers de l'appli (HTML, CSS, JavaScript, images) dans un cache sur l'appareil. Ensuite, deux stratégies possibles :
- **cache d'abord** (*cache-first*) : on répond avec le cache, très rapide et marche sans réseau, mais le contenu peut être ancien ;
- **réseau d'abord** (*network-first*) : on essaie le serveur, et on se rabat sur le cache si on est hors ligne.

(Sources : [Service Worker API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) ; [Offline and background operation — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation) ; [Caching — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching))

**3. Les données sur l'appareil.** Les données de l'utilisateur (notes, messages en attente, formulaires) sont stockées localement, par exemple dans **IndexedDB**, la base de données intégrée au navigateur. (Source : [Client-side storage — MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_APIs/Client-side_storage))

**4. La synchronisation plus tard.** Ce que l'utilisateur fait hors ligne est mis dans une file d'attente, puis envoyé quand la connexion revient (*background sync*). Tous les navigateurs ne le gèrent pas : il faut prévoir un plan B qui réessaie quand l'appli détecte le retour du réseau. (Source : [Offline and background operation — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation))

### Communiquer sans internet

| Solution | Comment ça marche | Limite |
|---|---|---|
| **Réseau maillé (mesh) radio — ex. Meshtastic** | De petits boîtiers radio (technologie LoRa) se relaient les messages de proche en proche, sans antenne relais ni internet. Le téléphone se connecte au boîtier en Bluetooth. | Texte seulement ; quelques kilomètres par saut |
| **Mesh entre téléphones — ex. Briar** | Les téléphones s'échangent les messages directement en Bluetooth ou Wi-Fi. | Portée d'environ 10 mètres |
| **Alertes par diffusion cellulaire (cell broadcast)** | L'antenne envoie le même message à tous les téléphones de la zone, sans passer par internet ; ça ne sature pas le réseau. | L'antenne doit encore avoir du courant |
| **SMS** | Passe par le réseau mobile classique, sans données internet. | Même limite : il faut une antenne allumée |
| **Radio FM/AM** | Un émetteur puissant, des millions de récepteurs à piles. | Sens unique |

(Sources : [Messaging off the grid with Meshtastic — Linux Magazine](https://www.linux-magazine.com/Online/Features/Meshtastic) ; [How it works — Briar Project](https://briarproject.org/how-it-works/) ; [Quick start — Briar Project](https://briarproject.org/quick-start/) ; [Tout savoir sur le dispositif national FR-Alert — ministère de l'Intérieur (France)](https://www.interieur.gouv.fr/actualites/actualites-du-ministere/tout-savoir-sur-dispositif-national-fr-alert))

Existence d'un système national d'alerte par diffusion cellulaire **au Maroc** : **non vérifié**.

**Idée pour le projet :** une appli « utile en cas de coupure » devrait (1) s'ouvrir sans réseau, (2) garder en cache les infos vitales (numéros d'urgence, conseils, carte), (3) économiser la batterie, (4) synchroniser automatiquement au retour du réseau.

---

## 7. Comment se préparer

### Le kit d'urgence

L'Union européenne a présenté le 26 mars 2025 une stratégie de préparation aux crises qui encourage chaque foyer à pouvoir tenir **72 heures** (3 jours) en autonomie. C'était un mois avant le blackout ibérique.
(Sources : [Les citoyens européens invités à prévoir un kit de survie pour 3 jours — VRT](https://www.vrt.be/vrtnws/fr/2025/03/26/les-citoyens-europeens-invites-a-prevoir-un-kit-de-survie-pour-3/) ; [Pour ou contre les kits de survie en Europe ? — Euronews](https://fr.euronews.com/2025/04/01/pour-ou-contre-les-kits-de-survie-en-europe))

Contenu recommandé par le gouvernement français (guide « Tous responsables ») :
- **eau** : environ 6 litres par personne ;
- **nourriture** qui se conserve et se mange sans cuisson ;
- **radio à piles** et **lampe de poche**, avec des piles de rechange ;
- **trousse de secours** et médicaments habituels ;
- **argent liquide** ;
- copies des **papiers importants**, vêtements chauds, chargeur ou batterie externe.

(Sources : [Se préparer à une situation d'urgence — info.gouv.fr](https://www.info.gouv.fr/risques/se-preparer-a-une-situation-durgence) ; [Votre kit d'urgence 72 h — Géorisques](https://www.georisques.gouv.fr/sites/default/files/2022-08/KIT%2072H_A4-HD.pdf) ; [Tous responsables : un guide pour mieux faire face aux risques — info.gouv.fr](https://www.info.gouv.fr/index.php/actualite/tous-responsables-un-guide-pour-mieux-faire-face-aux-risques))

Recommandation officielle marocaine équivalente (kit d'urgence pour les familles) : **non vérifié**.

### Conseils pratiques

**Avant**
- Garder une batterie externe chargée et un peu d'argent liquide.
- Noter sur papier les numéros importants.
- Télécharger à l'avance ce qui peut servir hors ligne (cartes, documents).

**Pendant**
- Économiser la batterie du téléphone (mode économie, luminosité basse) et éviter les appels inutiles pour ne pas saturer le réseau.
- Ouvrir le frigo et le congélateur le moins possible.
- Préférer les lampes aux bougies (risque d'incendie).
- **Ne jamais utiliser un groupe électrogène, un barbecue ou un brasero à l'intérieur** : risque d'intoxication mortelle au monoxyde de carbone. Des décès de ce type ont été rapportés en Espagne en 2025 (voir section 3).
- Écouter la radio pour suivre les consignes officielles.
- Prendre des nouvelles des voisins âgés ou malades.

**Après**
- Rebrancher les appareils petit à petit.
- Vérifier la nourriture du frigo avant de la manger.

---

## 8. Au Maroc

### Qui gère le réseau ?
- **L'ONEE** (Office national de l'électricité et de l'eau potable) est l'opérateur public historique : il est présent dans la production, le transport et la distribution de l'électricité. (Sources : [Quels sont les acteurs du secteur de l'électricité au Maroc ? — Fondation Heinrich Böll](https://ma.boell.org/sites/default/files/2022-04/Quels%20sont%20les%20acteurs%20du%20secteur%20de%20l%E2%80%99%C3%A9lectricit%C3%A9%20au%20Maroc.pdf) ; [Maroc — Africa Energy Portal](https://africa-energy-portal.org/eri/country/morocco))
- **L'ANRE** (Autorité nationale de régulation de l'électricité) est le « gendarme » du secteur, créé par la loi n° 48-15 de 2016. (Source : [Loi n° 48-15 — FAOLEX](https://faolex.fao.org/docs/pdf/mor161464.pdf))
- **Les SRM** (sociétés régionales multiservices) reprennent progressivement la distribution de l'électricité, de l'eau et de l'assainissement dans chaque région (loi n° 83-21). Douze SRM sont prévues, une par région ; la première, Casablanca-Settat, a démarré le 1er octobre 2024. Elles remplacent petit à petit les régies et les sociétés privées délégataires. (Sources : [La première SRM du Royaume démarre le 1er octobre 2024 — Finances News Hebdo](https://fnh.ma/article/actualites-marocaines/srm-casablanca-settat) ; [Sociétés régionales multiservices — Médias24](https://medias24.com/2023/01/26/eau-potable-et-electricite-des-societes-regionales-multiservices-pour-ameliorer-la-gestion-des-installations/))

### Les liens avec les voisins
Le Maroc est relié à l'Espagne par **deux câbles sous-marins de 400 kV** sous le détroit de Gibraltar (le premier date de 1998, le second de 2006), pour une capacité totale de 1 400 MW. Ils appartiennent en commun à l'ONEE et à Red Eléctrica. Un troisième câble de 700 MW est prévu ; d'après la presse, il est repoussé à 2030.
(Sources : [Round-up : ce qu'il faut savoir sur les interconnexions électriques du Maroc — Médias24](https://medias24.com/2025/01/22/round-up-ce-quil-faut-savoir-sur-les-interconnexions-electriques-du-maroc/) ; [Spain and Morocco agree on the development of a third interconnection — Red Eléctrica](https://www.ree.es/en/press-office/news/press-releases/2019/02/spain-and-morocco-agree-development-third-interconnection-between-both-countries) ; [Le Maroc accélère ses interconnexions — Médias24](https://medias24.com/2026/07/12/electricite-le-maroc-accelere-ses-interconnexions-avec-leurope-et-vers-le-sud-1720791/))

État actuel de la liaison électrique avec l'Algérie : **non vérifié**.

### Coupures notables

**Casablanca, 8 juillet 2020.** À 6 h 26, une perturbation sur les lignes à très haute tension qui alimentent trois postes de la ville a coupé plus de 1 000 postes de distribution et plus de 200 000 clients. Le tramway s'est arrêté. Le courant a été entièrement rétabli à 19 h 40, soit environ 13 heures plus tard. Le distributeur de l'époque (Lydec) et l'ONEE n'étaient pas d'accord sur le responsable.
(Sources : [Coupure d'électricité à Casablanca : 100 % des clients rétablis — Médias24](https://medias24.com/2020/07/08/coupure-delectricite-a-casablanca-100-des-clients-retablis-lydec/) ; [Casablanca : l'ONEE dément formellement être à l'origine de la panne — Finances News Hebdo](https://fnh.ma/article/actualite-economique/casablanca-l-onee-dement-formellement-etre-a-l-origine-de-la-panne-d-electricite))

**28 avril 2025.** Pas de coupure de courant au Maroc, mais internet perturbé chez Orange Maroc, et aide de l'ONEE à l'Espagne (voir section 3).

**Casablanca, 11 novembre 2026** (le jour même de cette recherche — informations provisoires). Vers 17 h, pendant de fortes intempéries, une panne a touché plusieurs quartiers (Maârif, Aïn Chock, Hay Hassani, Sidi Maârouf…) ; tramway et feux de circulation se sont arrêtés. **Cause officielle et durée exacte : non vérifié** (les médias donnent des versions différentes).
(Sources : [Casablanca : une partie de la métropole paralysée par une coupure électrique — TelQuel](https://telquel.ma/instant-t/2026/11/11/casablanca-une-partie-de-la-metropole-paralysee-par-une-coupure-electrique_2017780) ; [Casablanca plongée dans le noir : ce que l'on sait — Le360](https://fr.le360.ma/societe/casablanca-plongee-dans-le-noir-ce-que-lon-sait_YQQX5OZLDJEG3OVQMZ26K34FFQ/))

### Plans d'urgence
- **Protection du réseau.** D'après un expert cité par la presse, le réseau marocain est réglé pour se séparer automatiquement du réseau européen si la fréquence chute trop, ce qui l'a protégé en 2025. Source de presse uniquement, pas de document officiel de l'ONEE trouvé : **non vérifié officiellement**. (Source : [Panne électrique ibérique : les leçons à tirer pour le Maroc — Le360](https://fr.le360.ma/economie/panne-electrique-iberique-les-lecons-a-tirer-pour-le-maroc_W4XL4BSWSFEYJFIFCWTPAB6N3Q/))
- **Plan national public en cas de blackout** (consignes aux habitants, durée d'autonomie des hôpitaux, des antennes, de l'eau) : **non vérifié** — aucun document officiel trouvé.

---

## 9. Conclusion

1. **Une coupure peut être petite ou géante.** Panne locale, délestage volontaire ou blackout général : ce n'est pas la même chose, ni la même durée.
2. **Les grandes pannes sont des cascades.** Météo, surcharge, panne technique, erreur humaine ou cyberattaque : il y a presque toujours plusieurs causes qui s'enchaînent.
3. **Tout est relié à l'électricité**, souvent sans qu'on y pense : l'eau, les trains, les paiements, les hôpitaux… et internet.
4. **Internet est fragile près de chez nous.** La box s'éteint tout de suite, les antennes tiennent de quelques dizaines de minutes à quelques heures, alors que les data centers tiennent au moins 12 heures. Une panne dans un autre pays peut même couper notre connexion.
5. **Les solutions simples sont les plus solides** : radio à piles, lampe, eau, argent liquide.
6. **L'informatique peut s'adapter** : une appli pensée « hors ligne d'abord », avec un cache local et une synchronisation au retour du réseau, reste utile quand tout le reste est éteint.

---

## Informations restées « non vérifiées »

1. Durée maximale de 2 heures par zone pour les délestages tournants en France (source grand public seulement).
2. Bilan officiel définitif des victimes du blackout du 28 avril 2025.
3. « Le Maroc a mobilisé 38 % de sa capacité » pour aider l'Espagne (un seul média).
4. Nombre exact de personnes touchées en Inde le 30 juillet 2012 (300 à 400 millions selon les sources).
5. Durée précise de la panne en Ukraine en 2015 (« 1 à 6 heures »).
6. Durée des batteries d'onduleur dans les data centers.
7. Autonomie des antennes relais au Maroc.
8. Règle d'autonomie des groupes électrogènes des hôpitaux au Maroc.
9. Existence d'un système d'alerte par diffusion cellulaire au Maroc.
10. Recommandation officielle marocaine de kit d'urgence.
11. État actuel de la liaison électrique Maroc–Algérie.
12. Cause officielle et durée de la panne de Casablanca du 11 novembre 2026.
13. Réglage de séparation automatique du réseau marocain (source de presse, pas de document officiel).
14. Existence d'un plan national public marocain en cas de blackout.

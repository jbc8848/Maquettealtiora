import { useState, useEffect } from "react";

/* ============ Version ============ */
const VERSION = "v1.4"; // maquette Altiora — accompagne la note de conception v1.4

/* ============ Design tokens ============ */
const C = {
  encre: "#14303E",      // mer profonde — fonds & textes forts
  ecume: "#F4F7F6",      // fond clair
  glacier: "#CDDDE0",    // surfaces secondaires
  ardoise: "#4E6E7A",    // textes secondaires
  corde: "#E8622C",      // signal : actions, alertes, compte à rebours
  vert: "#2E7D5B",       // confirmé
};

const FONT = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Instrument+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
.disp { font-family: 'Bricolage Grotesque', sans-serif; }
.body { font-family: 'Instrument Sans', sans-serif; }
.mono { font-family: 'Space Mono', monospace; }
button { cursor: pointer; }
button:focus-visible { outline: 3px solid ${C.corde}; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;

/* ============ Données de démo ============ */
const GUIDES = ["Seb", "Greg", "Hubert", "JB", "Alex", "Chris", "Dani", "Max"];
// Le guide "connecté" est choisi dans l'interface (sélecteur de démo en haut de la vue guide)

/* Disponibilité de base : motif déterministe par guide et par date (simule un planning rempli).
   Les taps du guide créent des surcharges par date ISO dans l'état `dispos`. */
const dispoBase = (guide, iso) => {
  const g = GUIDES.indexOf(guide);
  const [y, m, j] = iso.split("-").map(Number);
  return (g * 7 + j * 3 + m * 5 + y) % 11 < 7; // ~2 jours sur 3 dispo, motif propre à chaque guide
};

const initSorties = [
  {
    id: 1, titre: "Miroir de l'Argentine — grande voie d'initiation", tags: ["ROC"],
    iso: "2026-08-15", heure: "07:30", duree: "Journée", nbJours: 1, niveau: "Initié",
    prix: 180, places: 6, restantes: 3, guide: "Seb", statut: null,
    description: "La grande dalle calcaire des Alpes vaudoises, 450 mètres de voie normale en 4c au-dessus du vallon de Solalex. Une première grande voie idéale : escalade en adhérence, relais confortables, ambiance grandiose.",
    materiel: "Baudrier, casque et chaussons (location possible au bureau). Cordes et matériel technique fournis.", prerequis: "Aisance en second en salle ou en falaise école (niveau 5a).", inclus: "Encadrement par guide UIAGM, matériel collectif. Non compris : transport, pique-nique.",
  },
  {
    id: 2, titre: "Initiation alpinisme — Pigne d'Arolla (3787 m)", tags: ["ALPI"],
    iso: "2026-08-16", heure: "07:00", duree: "2 jours", nbJours: 2, niveau: "Débutant",
    prix: 560, places: 4, restantes: 4, guide: "Greg", statut: null,
    description: "Deux jours pour découvrir la haute montagne et gravir un 3700 accessible, avec nuit en cabane face aux glaciers du val d'Hérens. Cramponnage, encordement, marche en cordée : l'école idéale avant les grands sommets.",
    programme: ["Jour 1 — Montée à la cabane des Vignettes (3157 m), école de glace sur le glacier", "Jour 2 — Ascension du Pigne d'Arolla et descente sur Arolla"],
    materiel: "Chaussures cramponnables (location possible), gants, lunettes de glacier. Crampons, piolet et baudrier fournis.", prerequis: "Bonne condition physique (4 à 6 h de marche par jour). Aucune expérience d'alpinisme requise.", inclus: "Guide UIAGM, matériel technique. Non compris : demi-pension en cabane (~90 CHF), transports.",
  },
  {
    id: 3, titre: "Arête sud du Salbitschijen — granit majeur", tags: ["ALPI"],
    iso: "2026-08-12", heure: "05:30", duree: "2 jours", nbJours: 2, niveau: "Confirmé",
    prix: 640, places: 3, restantes: 2, guide: null, statut: null, // aucun guide dispo → alerte bureau
    description: "L'une des plus belles escalades de granit des Alpes : une arête effilée de tours et de fissures au-dessus du Göschenertal. Course longue et soutenue (5c obligatoire), réservée aux grimpeurs alpins aguerris.",
    programme: ["Jour 1 — Montée au refuge Salbit, gestes clés sur le granit", "Jour 2 — Arête sud intégrale (10 à 12 h) et descente"],
    materiel: "Matériel de grande voie personnel complet ; liste détaillée envoyée à l'inscription.", prerequis: "Niveau 5c en tête en terrain d'aventure, expérience des rappels multiples et des longues journées.", inclus: "Guide UIAGM (2 clients max). Non compris : nuitée au refuge, transports.",
  },
  {
    id: 4, titre: "Escalade en famille — dalles école des Gastlosen", tags: ["ROC"],
    iso: "2026-08-11", heure: "09:00", duree: "½ journée", nbJours: 1, niveau: "Débutant",
    prix: 95, places: 8, restantes: 6, guide: "Hubert", statut: null,
    description: "Une demi-journée sur les dalles école au pied des « Dolomites fribourgeoises ». Moulinettes, jeux de grimpe et premiers rappels : dès 6 ans, chacun grimpe à son rythme.",
    materiel: "Baskets ou chaussons ; tout le matériel technique est fourni, casques enfants compris.", prerequis: "Aucun prérequis.", inclus: "Guide ou professeur d'escalade, matériel complet. Non compris : goûter.",
  },
  {
    id: 5, titre: "Traversée des Aiguilles Dorées — granit du Trient", tags: ["ALPI"],
    iso: "2026-08-22", heure: "05:00", duree: "3 jours", nbJours: 3, niveau: "Confirmé",
    prix: 890, places: 3, restantes: 3, guide: "Seb", statut: null,
    description: "Trois jours d'arêtes de granit doré au-dessus du plateau du Trient : une traversée d'ampleur, aérienne et variée, au cœur d'un des plus beaux cirques glaciaires des Alpes valaisannes.",
    programme: ["Jour 1 — Montée à la cabane du Trient par le col de la Forclaz", "Jour 2 — Traversée des Aiguilles Dorées, retour cabane", "Jour 3 — Aiguille du Tour en aller-retour et descente"],
    materiel: "Matériel d'alpinisme personnel (liste envoyée) ; matériel collectif fourni.", prerequis: "Escalade 4c en montagne avec crampons, endurance sur trois jours consécutifs.", inclus: "Guide UIAGM (3 clients max). Non compris : demi-pensions en cabane, remontées, transports.",
  },
  {
    id: 6, titre: "Cervin (4478 m) — arête du Hörnli, cordée privée", tags: ["ALPI"], ratio: "1:1", paliers: [2450],
    iso: "2026-08-19", heure: "04:30", duree: "2 jours", nbJours: 2, niveau: "Engagé",
    prix: 2450, places: 1, restantes: 1, guide: "Dani", statut: null,
    description: "La pyramide mythique par son arête historique : 1200 mètres de ressauts rocheux et de terrain mixte, en aller-retour depuis la Hörnlihütte. Une course d'envergure exigeant rapidité et pied très sûr — en cordée privée exclusivement, comme l'exige la voie.",
    programme: ["Jour 1 — Zermatt, télécabine de Schwarzsee puis montée à la Hörnlihütte (3260 m), repérage du premier ressaut", "Jour 2 — Départ nocturne, sommet (5 à 6 h), descente en désescalade et rappels (4 à 5 h)"],
    materiel: "Équipement complet de course mixte ; liste détaillée et point matériel obligatoire avec le guide une semaine avant.", prerequis: "Alpiniste confirmé et entraîné : désescalade rapide en terrain III, courses préparatoires récentes exigées (nous consulter : Breithorn, Pollux, Riffelhorn).", inclus: "Guide UIAGM en engagement privé strict 1:1. Non compris : nuitée Hörnlihütte (~150 CHF x2 avec le guide), remontées, transports.",
  },
  {
    id: 7, titre: "Paroi de Devenson — grande voie TD, dépose en bateau", tags: ["MER", "ROC"], ratio: "1:1 à 1:2", paliers: [950, 580],
    iso: "2026-08-20", heure: "07:00", duree: "Journée", nbJours: 1, niveau: "Engagé",
    prix: 950, places: 2, restantes: 2, guide: "JB", statut: null,
    description: "La plus sauvage des parois des Calanques, accessible seulement par la mer : le Sandokan vous dépose au pied des 200 mètres de calcaire compact. Grande voie TD (6a obligatoire), retour à la nage jusqu'au bateau pour finir la journée.",
    materiel: "Chaussons, baudrier, casque, maillot ; matériel de voie fourni, sacs étanches à bord.", prerequis: "6a à vue en falaise, expérience de grande voie en second minimum.", inclus: "Guide UIAGM, skipper et bateau, matériel collectif. Non compris : repas de midi à bord (option 25 CHF).",
  },
  {
    id: 8, titre: "Dent Blanche (4357 m) — arête sud, cordée privée", tags: ["ALPI"], ratio: "1:1 à 1:2", paliers: [2850, 1720],
    iso: "2026-08-26", heure: "05:00", duree: "3 jours", nbJours: 3, niveau: "Engagé",
    prix: 2850, places: 2, restantes: 2, guide: "Alex", statut: null,
    description: "Le « 4000 des alpinistes » : une arête sud longue et racée, loin des foules, avec l'une des plus belles cabanes d'altitude des Alpes. Trois jours d'engagement pour un sommet qui se mérite.",
    programme: ["Jour 1 — Montée à la cabane de la Dent Blanche (3507 m) depuis Ferpècle", "Jour 2 — Arête sud en aller-retour (8 à 10 h)", "Jour 3 — Journée de réserve météo ou seconde course au choix"],
    materiel: "Équipement de course mixte complet ; liste envoyée à l'inscription.", prerequis: "Alpiniste autonome en second sur du III/IV, très bonne caisse (1400 m de dénivelé le premier jour).", inclus: "Guide UIAGM, engagement privé 1:1 ou 1:2. Non compris : demi-pensions en cabane, transports.",
  },
  {
    id: 21, titre: "Ski d'été sur le glacier du Théodule — Zermatt", tags: ["NEIGE"],
    iso: "2026-08-15", heure: "06:00", duree: "Journée", nbJours: 1, niveau: "Initié",
    prix: 220, places: 4, restantes: 4, guide: "Chris", statut: null,
    description: "Skier en plein mois d'août face au Cervin : neige de printemps au petit matin sur le glacier du Théodule, initiation aux conversions et à la lecture du glacier. Retour pour le déjeuner en terrasse.",
    materiel: "Skis de randonnée ou de piste (location possible), tenue chaude. DVA, pelle et sonde fournis.", prerequis: "Skieur à l'aise en piste rouge.", inclus: "Guide UIAGM, matériel de sécurité. Non compris : remontées Zermatt (~90 CHF), repas.",
  },
  {
    id: 22, titre: "Escalade plaisir au val d'Orny — granit du Trient", tags: ["ROC"],
    iso: "2026-08-12", heure: "08:00", duree: "Journée", nbJours: 1, niveau: "Débutant",
    prix: 160, places: 6, restantes: 6, guide: "Max", statut: null,
    description: "Couennes et petites voies sur le granit à cristaux du val d'Orny, à deux pas de la cabane. Cadre glaciaire, escalade ludique : la journée parfaite pour passer de la salle au rocher.",
    materiel: "Chaussons et baudrier (location possible) ; cordes et dégaines fournies.", prerequis: "Premiers pas en salle bienvenus, non obligatoires.", inclus: "Guide ou professeur d'escalade. Non compris : télésiège de Champex, pique-nique.",
  },
  {
    id: 23, titre: "Croisière découverte au coucher du soleil — à bord du Sandokan", tags: ["MER"],
    iso: "2026-08-13", heure: "18:00", duree: "Soirée", nbJours: 1, niveau: "Débutant",
    prix: 120, places: 8, restantes: 8, guide: "Dani", statut: null,
    description: "Trois heures sous voiles au couchant : manœuvres commentées, baignade au mouillage et apéritif à bord. La façon la plus douce de découvrir notre voilier — et de préparer vos prochaines aventures verticales par la mer.",
    materiel: "Coupe-vent et maillot de bain ; gilets fournis.", prerequis: "Aucun prérequis.", inclus: "Skipper professionnel, apéritif à bord. Non compris : —",
  },
  {
    id: 24, titre: "Gastlosen — journée dalles et fissures", tags: ["ROC"],
    iso: "2026-08-22", heure: "09:00", duree: "Journée", nbJours: 1, niveau: "Débutant",
    prix: 110, places: 8, restantes: 8, guide: "Hubert", statut: null,
    description: "Journée complète sur le calcaire des Gastlosen : moulinettes le matin, première voie de plusieurs longueurs l'après-midi pour ceux qui le souhaitent.",
    materiel: "Matériel complet fourni ; prévoir de bonnes chaussures d'approche.", prerequis: "Aucun prérequis.", inclus: "Guide ou professeur d'escalade, matériel complet. Non compris : pique-nique.",
  },
  {
    id: 25, titre: "Randonnée glaciaire — grand glacier d'Aletsch", tags: ["ALPI"],
    iso: "2026-08-19", heure: "07:00", duree: "Journée", nbJours: 1, niveau: "Initié",
    prix: 185, places: 6, restantes: 6, guide: "Alex", statut: null,
    description: "Marcher encordé au cœur du plus grand glacier des Alpes, entre moulins, bédières et tables glaciaires. Une immersion spectaculaire et accessible dans le monde de la glace, classée à l'UNESCO.",
    materiel: "Chaussures de randonnée rigides ; crampons, piolet et baudrier fournis.", prerequis: "Bon marcheur (5 à 6 h), pas d'expérience technique requise.", inclus: "Guide UIAGM, matériel technique. Non compris : téléphériques (~60 CHF), pique-nique.",
  },
  {
    id: 9, titre: "Stage grandes voies — autonome en second (5b–6a)", tags: ["ROC"],
    iso: "2026-09-07", heure: "08:00", duree: "3 jours", nbJours: 3, niveau: "Initié",
    prix: 490, places: 6, restantes: 5, guide: "JB", statut: null,
    description: "Trois jours pour devenir un second de cordée fiable : relais, rappels, manips de corde et gestion de l'itinéraire, sur les grandes voies calcaires des Préalpes. Objectif final : une voie de 300 mètres en cordées autonomes supervisées.",
    programme: ["Jour 1 — Manips fondamentales en falaise école", "Jour 2 — Grande voie d'application encadrée", "Jour 3 — Grande voie en autonomie supervisée"],
    materiel: "Chaussons, baudrier, casque ; le reste est fourni.", prerequis: "5b en moulinette ; l'envie d'apprendre fait le reste.", inclus: "Guide UIAGM (3 clients par guide). Non compris : nuitées et repas (formule camping ou auberge au choix).",
  },
  {
    id: 26, titre: "Journée escalade au Sanetsch — calcaire à gouttes d'eau", tags: ["ROC"],
    iso: "2026-09-08", heure: "08:30", duree: "Journée", nbJours: 1, niveau: "Initié",
    prix: 160, places: 6, restantes: 6, guide: "Alex", statut: null,
    description: "Le calcaire sculpté du col du Sanetsch, entre alpages et parois. Couennes techniques et petites grandes voies dans un décor de bout du monde, à une heure de route.",
    materiel: "Chaussons et baudrier ; cordes fournies.", prerequis: "5a en second.", inclus: "Guide ou professeur d'escalade. Non compris : transport, pique-nique.",
  },
  {
    id: 10, titre: "Calanques de Marseille — escalade depuis la mer, En-Vau", tags: ["MER", "ROC"],
    iso: "2026-09-19", heure: "08:00", duree: "Journée", nbJours: 1, niveau: "Initié",
    prix: 150, places: 6, restantes: 6, guide: "Hubert", statut: null,
    description: "Départ du port au lever du jour, mouillage dans l'eau turquoise d'En-Vau et grimpe sur le calcaire blanc au-dessus de la mer. Voies de tous niveaux, baignade entre les longueurs : la signature Altiora.",
    materiel: "Chaussons, maillot, casquette ; matériel technique et sacs étanches fournis.", prerequis: "4c en second pour profiter pleinement.", inclus: "Guide UIAGM, bateau et skipper. Non compris : repas de midi à bord (option 25 CHF).",
  },
  {
    id: 27, titre: "Wildhorn (3248 m) — alpinisme doux, nuit en cabane", tags: ["ALPI"],
    iso: "2026-09-19", heure: "07:00", duree: "2 jours", nbJours: 2, niveau: "Initié",
    prix: 560, places: 4, restantes: 4, guide: "Dani", statut: null,
    description: "Un 3000 débonnaire aux airs de grand voyage : glacier facile, arête finale panoramique et nuit à la cabane des Audannes. La course d'application idéale après une initiation.",
    programme: ["Jour 1 — Montée à la cabane des Audannes (2508 m) par le vallon", "Jour 2 — Sommet par le glacier de Ténéhet et descente"],
    materiel: "Chaussures cramponnables ; crampons, piolet et baudrier fournis.", prerequis: "Une première expérience de cramponnage (initiation ou équivalent).", inclus: "Guide UIAGM. Non compris : demi-pension en cabane (~85 CHF), transports.",
  },
  {
    id: 11, titre: "Kalymnos (Grèce) — semaine escalade (hors vols et hébergement)", tags: ["ROC", "EXPE"],
    iso: "2026-10-17", heure: "—", duree: "1 semaine", nbJours: 7, niveau: "Initié",
    prix: 1790, places: 6, restantes: 6, guide: "Chris", statut: null,
    description: "La Mecque méditerranéenne de l'escalade sportive : tufas, colonnettes et calcaire orange au-dessus de la mer Égée. Une semaine pour exploser son niveau, du 5b au 7a, entre grimpe, scooters et tavernes.",
    programme: ["Jours 1-2 — Secteurs école : Arginonta, Kasteli", "Jours 3-5 — Grande Grotta, Odyssey, Telendos selon niveaux", "Jour 6 — Grande voie au choix ou secteur projet", "Jour 7 — Session matinale et repos"],
    materiel: "Chaussons, baudrier, dégaines si vous en avez ; cordes fournies.", prerequis: "5b en tête en falaise.", inclus: "Encadrement guide toute la semaine, organisation sur place. Non compris : vols, hébergement (studios ~350 CHF/sem.), repas, scooter.",
  },
  {
    id: 12, titre: "Voile & escalade — Sardaigne et Corse à bord du Sandokan", tags: ["MER", "ROC", "EXPE"],
    iso: "2026-10-03", heure: "—", duree: "10 jours", nbJours: 10, niveau: "Initié",
    prix: 3900, places: 6, restantes: 6, guide: "Greg", statut: null,
    description: "Dix jours de cabotage entre les aiguilles de Bavella, les falaises de Gonone et les criques désertes de l'automne. On grimpe là où le bateau nous mène, on dort au mouillage, on vit au rythme de la météo : le grand produit signature du bureau.",
    programme: ["Jours 1-2 — Embarquement à Olbia, navigation vers Cala Gonone, premières voies", "Jours 3-5 — Falaises de la côte est sarde, calcaire sur mer", "Jours 6-8 — Traversée vers Bonifacio, granit corse", "Jours 9-10 — Aiguilles et retour, débarquement à Bonifacio"],
    materiel: "Chaussons, baudrier, affaires de mer ; tout le matériel technique et de navigation est à bord.", prerequis: "5a en second ; pied marin bienvenu.", inclus: "Guide UIAGM et skipper, pension complète à bord, place de port. Non compris : vols/ferry, restaurants à terre.",
  },
  {
    id: 28, titre: "Falaises du Salève — journée d'automne au-dessus du Léman", tags: ["ROC"],
    iso: "2026-10-06", heure: "09:00", duree: "Journée", nbJours: 1, niveau: "Initié",
    prix: 150, places: 6, restantes: 6, guide: "Alex", statut: null,
    description: "Le balcon calcaire du Léman aux couleurs d'automne : couennes et voies historiques, vue sur le lac et le Mont-Blanc.",
    materiel: "Chaussons et baudrier ; cordes fournies.", prerequis: "5a en second.", inclus: "Guide ou professeur d'escalade. Non compris : transport.",
  },
  {
    id: 13, titre: "Cascades de glace de Cogne (Italie) — journée grands itinéraires", tags: ["ALPI"],
    iso: "2027-01-16", heure: "06:30", duree: "Journée", nbJours: 1, niveau: "Confirmé",
    prix: 230, places: 3, restantes: 3, guide: "Greg", statut: null,
    description: "Le paradis européen de la glace : Lillaz, Valeille, Patri… Des lignes de 100 à 300 mètres dans un vallon gelé mythique. Journée pour glaciéristes déjà autonomes en second.",
    materiel: "Matériel de cascade personnel (location possible : piolets traction, crampons mono-pointe).", prerequis: "Une saison de cascade minimum, à l'aise en glace 3+.", inclus: "Guide UIAGM (3 clients max). Non compris : transport (covoiturage organisé), repas.",
  },
  {
    id: 29, titre: "Initiation cascade de glace — Kandersteg", tags: ["ALPI"],
    iso: "2027-01-16", heure: "08:00", duree: "Journée", nbJours: 1, niveau: "Débutant",
    prix: 210, places: 4, restantes: 4, guide: "Hubert", statut: null,
    description: "Premiers coups de piolets sur les cascades école d'Oeschinen : ancrages, techniques de pied, moulinettes sur glace bleue. Sensations garanties dès la première longueur.",
    materiel: "Tenue chaude et imperméable ; tout le matériel technique est fourni.", prerequis: "Aucun prérequis technique ; bonne forme générale.", inclus: "Guide UIAGM, matériel complet. Non compris : transport, repas.",
  },
  {
    id: 14, titre: "Cascade raide — Breitwangflue, cordée privée", tags: ["ALPI"], ratio: "1:1 à 1:2", paliers: [980, 600],
    iso: "2027-01-23", heure: "06:30", duree: "Journée", nbJours: 1, niveau: "Engagé",
    prix: 980, places: 2, restantes: 2, guide: "Max", statut: null,
    description: "Les grandes lignes raides au-dessus du lac d'Oeschinen : glace 5, ambiance verticale, engagement réel. Pour glaciéristes confirmés voulant franchir un cap, en cordée privée.",
    materiel: "Matériel de cascade complet personnel exigé.", prerequis: "Glace 4+ en second aisé, expérience des relais sur glace.", inclus: "Guide UIAGM en privé 1:1 ou 1:2. Non compris : téléphérique, transport.",
  },
  {
    id: 15, titre: "Stage ski de randonnée — val d'Hérens, nuits en cabane", tags: ["NEIGE"],
    iso: "2027-02-13", heure: "07:00", duree: "3 jours", nbJours: 3, niveau: "Initié",
    prix: 690, places: 5, restantes: 5, guide: "Greg", statut: null,
    description: "Trois jours d'itinérance douce entre cabanes valaisannes : technique de montée, conversions, gestion du risque avalanche (DVA, lecture du bulletin) et belles descentes en neige hivernale.",
    programme: ["Jour 1 — Bases DVA et montée à la cabane, 800 m", "Jour 2 — Sommet à 3000 m, exercices de recherche", "Jour 3 — Grande descente et retour vallée"],
    materiel: "Skis de rando avec couteaux (location possible) ; DVA, pelle, sonde fournis si besoin.", prerequis: "Skieur piste noire, première expérience de peaux bienvenue.", inclus: "Guide UIAGM. Non compris : demi-pensions en cabane (~90 CHF/nuit), transports.",
  },
  {
    id: 30, titre: "Journée freeride encadrée — Verbier, itinéraires du Mont-Fort", tags: ["NEIGE"],
    iso: "2027-02-14", heure: "08:00", duree: "Journée", nbJours: 1, niveau: "Confirmé",
    prix: 205, places: 4, restantes: 4, guide: "Dani", statut: null,
    description: "Les grands itinéraires hors-piste du domaine : couloirs du Mont-Fort, Vallon d'Arby, selon conditions. Sécurité avalanche active et choix de lignes commenté toute la journée.",
    materiel: "Skis freeride, DVA-pelle-sonde (location possible), airbag conseillé.", prerequis: "Très bon skieur toutes neiges.", inclus: "Guide UIAGM. Non compris : forfait Verbier, repas.",
  },
  {
    id: 16, titre: "Pente raide — couloir du Portalet en privé", tags: ["NEIGE"], ratio: "1:1", paliers: [990],
    iso: "2027-03-06", heure: "05:00", duree: "Journée", nbJours: 1, niveau: "Engagé",
    prix: 990, places: 1, restantes: 1, guide: "Dani", statut: null,
    description: "45 degrés soutenus au-dessus du glacier : approche en peaux, sommet au lever du jour et descente engagée dans le couloir. Le format pente raide par excellence, en 1:1 strict.",
    materiel: "Skis légers, crampons, piolet, matériel complet de rando exigé.", prerequis: "Skieur expert, expérience du 40°+, cramponnage aisé.", inclus: "Guide UIAGM en engagement privé 1:1. Non compris : transport.",
  },
  {
    id: 17, titre: "Haute Route Chamonix–Zermatt — la classique en 6 jours", tags: ["NEIGE"],
    iso: "2027-04-12", heure: "06:00", duree: "6 jours", nbJours: 6, niveau: "Confirmé",
    prix: 1690, places: 5, restantes: 5, guide: "Max", statut: null,
    description: "LA traversée mythique des Alpes à ski : six jours de cols glaciaires et de cabanes d'altitude, du Mont-Blanc au Cervin. Itinéraire des Trois Cols, dénivelés soutenus, récompense immense.",
    programme: ["Jour 1 — Argentière, col du Chardonnet, cabane du Trient", "Jour 2 — Val d'Arpette, Bourg-St-Pierre, cabane Valsorey", "Jour 3 — Plateau du Couloir, cabane de Chanrion", "Jour 4 — Otemma, cabane des Vignettes", "Jour 5 — Pigne d'Arolla, cabane des Bouquetins", "Jour 6 — Tête Blanche, Zermatt face au Cervin"],
    materiel: "Équipement complet de ski-alpinisme (liste détaillée envoyée) ; harnais et matériel glacier obligatoires.", prerequis: "Skieur de randonnée endurant : 1200 à 1500 m de montée par jour, 6 jours consécutifs. Une saison de rando minimum.", inclus: "Guide UIAGM (5 clients max). Non compris : demi-pensions en cabane (~550 CHF), remontées, taxi retour.",
  },
  {
    id: 31, titre: "Rosablanche (3336 m) — ski de printemps à la journée", tags: ["NEIGE"],
    iso: "2027-04-13", heure: "06:00", duree: "Journée", nbJours: 1, niveau: "Initié",
    prix: 190, places: 5, restantes: 5, guide: "Chris", statut: null,
    description: "La course de printemps par excellence : montée régulière depuis Siviez, sommet panoramique sur les 4000 valaisans et grande descente en neige transformée.",
    materiel: "Skis de rando avec couteaux ; DVA-pelle-sonde fournis si besoin.", prerequis: "1000 m de montée à un rythme tranquille.", inclus: "Guide UIAGM. Non compris : remontées Siviez, repas.",
  },
  {
    id: 18, titre: "Ski & voile — Alpes de Lyngen, Norvège (vols non compris)", tags: ["MER", "NEIGE", "EXPE"],
    iso: "2027-04-24", heure: "—", duree: "1 semaine", nbJours: 7, niveau: "Confirmé",
    prix: 4900, places: 6, restantes: 6, guide: "Greg", statut: null,
    description: "Une semaine à bord d'un voilier polaire sous le soleil de minuit : chaque matin, annexe vers un fjord différent, sommets de 1000 à 1500 mètres skis aux pieds jusqu'à la mer. Le produit qui a fait la réputation des voyages arctiques — version Altiora.",
    programme: ["Jour 1 — Vol Tromsø (individuel), embarquement, briefing sécurité", "Jours 2-6 — Un sommet par jour selon météo : Lakselvtinden, Store Kjostinden, Rørnestinden…", "Jour 7 — Dernière peau matinale, retour Tromsø"],
    materiel: "Matériel complet de ski de rando + affaires de mer chaudes (liste détaillée).", prerequis: "Skieur de randonnée régulier : 1000 à 1400 m par jour, toutes neiges.", inclus: "Guide UIAGM, skipper, pension complète à bord, sauna du bord. Non compris : vols Tromsø, boissons à terre.",
  },
  {
    id: 19, titre: "Expédition voile & ski — côte Est du Groenland", tags: ["MER", "NEIGE", "EXPE"],
    iso: "2027-05-03", heure: "—", duree: "4 semaines", nbJours: 28, niveau: "Confirmé",
    prix: 18900, places: 6, restantes: 6, guide: "Greg", statut: null,
    description: "Quatre semaines d'exploration dans les fjords du Scoresby Sund : navigation dans les glaces, sommets vierges skis aux pieds, autonomie complète à bord. Une expédition au sens propre — la mer comme camp de base, la carte comme terrain de jeu.",
    programme: ["Semaine 1 — Convoyage Islande–Groenland, premiers mouillages", "Semaines 2-3 — Exploration des fjords, un objectif par jour de beau", "Semaine 4 — Derniers sommets, retour Islande selon glaces"],
    materiel: "Liste d'expédition complète envoyée ; deux week-ends de préparation avec l'équipe inclus.", prerequis: "Skieur-alpiniste autonome, expérience du camping ou de la vie en équipage, engagement sur la durée.", inclus: "Guides UIAGM et skipper polaire, pension complète, logistique totale. Non compris : vols Islande, assurance expédition obligatoire.",
  },
  {
    id: 32, titre: "Calanques de printemps — grandes voies d'En-Vau, base bateau", tags: ["MER", "ROC"],
    iso: "2027-05-08", heure: "08:00", duree: "Journée", nbJours: 1, niveau: "Initié",
    prix: 165, places: 6, restantes: 6, guide: "Hubert", statut: null,
    description: "Grandes voies faciles au-dessus de l'eau turquoise, bateau mouillé en contrebas : la journée Altiora par excellence, entre deux longueurs et deux plongeons.",
    materiel: "Chaussons, maillot ; matériel technique et sacs étanches fournis.", prerequis: "4c en second.", inclus: "Guide UIAGM, bateau et skipper. Non compris : repas à bord (option 25 CHF).",
  },
  {
    id: 20, titre: "Expédition voile & alpinisme — Lofoten et Lyngen, sommets depuis la mer", tags: ["MER", "ALPI", "EXPE"],
    iso: "2027-07-05", heure: "—", duree: "5 semaines", nbJours: 35, niveau: "Engagé",
    prix: 24500, places: 6, restantes: 6, guide: "JB", statut: null,
    description: "Cinq semaines de granit arctique sous le jour permanent : arêtes des Lofoten, faces des Alpes de Lyngen, approches en annexe et bivouacs choisis. L'expédition estivale majeure du bureau, entre voile hauturière et alpinisme d'exploration.",
    programme: ["Semaine 1 — Convoyage et mise en jambes aux Lofoten (Svolværgeita, Vågakallen)", "Semaines 2-3 — Grandes arêtes et faces selon conditions", "Semaine 4 — Navigation vers Lyngen, objectifs mixtes", "Semaine 5 — Derniers sommets, retour Tromsø"],
    materiel: "Liste d'expédition complète ; deux week-ends de préparation inclus.", prerequis: "Alpiniste confirmé (D en second), grimpeur 5c montagne, goût de la vie d'équipage.", inclus: "Guides UIAGM et skipper, pension complète, logistique totale. Non compris : vols, assurance expédition obligatoire.",
  },
];

/* Activités : tag interne → étiquette client → couleur (code repris dans filtres, cartes et calendrier) */
const ACTIVITES = [
  ["MER",  "Bateau",            "#2456A6"],
  ["NEIGE", "Ski",              "#45A8B8"],
  ["ROC",  "Escalade",          "#E8622C"],
  ["ALPI", "Alpinisme",         "#6B4FA3"],
  ["EXPE", "Voyage / Expédition", "#D4A017"],
];
const COULEUR_TAG = Object.fromEntries(ACTIVITES.map(([t, , c]) => [t, c]));
const LABEL_TAG = Object.fromEntries(ACTIVITES.map(([t, l]) => [t, l]));

/* --- Helpers de dates (calendrier navigable sur plusieurs années) --- */
const pad = (n) => String(n).padStart(2, "0");
const isoDe = (y, m, j) => `${y}-${pad(m + 1)}-${pad(j)}`;                  // m: 0-11
const nbJoursDuMois = (y, m) => new Date(y, m + 1, 0).getDate();
const offsetDuMois = (y, m) => (new Date(y, m, 1).getDay() + 6) % 7;        // grille Lun→Dim
const semaineDe = (iso) => (new Date(iso + "T12:00:00").getDay() + 6) % 7;  // 0 = Lun
const fmtDate = (iso) => {
  const d = new Date(iso + "T12:00:00").toLocaleDateString("fr-CH", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return d.charAt(0).toUpperCase() + d.slice(1);
};
const fmtMois = (y, m) => {
  const d = new Date(y, m, 1).toLocaleDateString("fr-CH", { month: "long", year: "numeric" });
  return d.charAt(0).toUpperCase() + d.slice(1);
};
const addJours = (iso, n) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const finDe = (s) => addJours(s.iso, s.nbJours - 1);                 // dernier jour de la sortie
const couvre = (s, iso) => iso >= s.iso && iso <= finDe(s);          // la sortie occupe ce jour
const MOIS_MIN = { y: 2026, m: 7 };  // Août 2026 : pas de navigation dans le passé
const MOIS_MAX = { y: 2028, m: 11 }; // Horizon de programmation : fin 2028

const initDispos = {}; // surcharges par guide : { Seb: { "2026-08-15": false, ... } }

/* ============ Petits composants ============ */
const Chip = ({ t }) => (
  <span className="mono text-xs px-2 py-0.5 rounded-full border font-bold flex items-center gap-1.5"
    style={{ borderColor: COULEUR_TAG[t] ?? C.ardoise, color: COULEUR_TAG[t] ?? C.encre, background: "#fff" }}>
    <span className="w-2 h-2 rounded-full" style={{ background: COULEUR_TAG[t] ?? C.ardoise }} />{LABEL_TAG[t] ?? t}
  </span>
);

const Etape = ({ label, on, done }) => (
  <div className="flex items-center gap-1.5">
    <span className="w-2.5 h-2.5 rounded-full"
      style={{ background: done ? C.vert : on ? C.corde : C.glacier }} />
    <span className="body text-xs" style={{ color: done ? C.vert : on ? C.corde : C.ardoise }}>{label}</span>
  </div>
);

const FilStatut = ({ statut }) => (
  <div className="flex items-center gap-3 mt-2">
    <Etape label="Acompte versé" done={!!statut} on={false} />
    <span style={{ color: C.glacier }}>—</span>
    <Etape label="Guide (48 h)" done={statut === "confirmée"} on={statut === "attente" || statut === "alerte"} />
    <span style={{ color: C.glacier }}>—</span>
    <Etape label="Validée" done={statut === "confirmée"} on={false} />
  </div>
);

/* ============ App ============ */
export default function App() {
  const [role, setRole] = useState("client");
  const [sorties, setSorties] = useState(initSorties);
  const [dispos, setDispos] = useState(initDispos);
  const [modal, setModal] = useState(null);      // sortie en cours de résa
  const [filtres, setFiltres] = useState([]);    // tags d'activité sélectionnés
  const [jourSel, setJourSel] = useState(null);  // date ISO sélectionnée dans le calendrier
  const [mois, setMois] = useState({ ...MOIS_MIN }); // mois affiché (calendrier client)
  const [moisG, setMoisG] = useState({ ...MOIS_MIN }); // mois affiché (calendrier guide)
  const [selGuide, setSelGuide] = useState(null);      // jour sélectionné (détail de la sortie attribuée)
  const [moiGuide, setMoiGuide] = useState("Seb");     // guide dont on affiche l'espace
  const MOI = moiGuide;
  const [moisB, setMoisB] = useState({ ...MOIS_MIN }); // mois affiché (planning bureau)
  const [cgvOk, setCgvOk] = useState(false);     // CGV acceptées
  const [nbPart, setNbPart] = useState(1);       // participants de la réservation
  const [fiche, setFiche] = useState(null);      // fiche de sortie détaillée ouverte
  const [autoEval, setAutoEval] = useState(null); // auto-évaluation du niveau (courses Confirmé/Engagé)
  const [autoEvalTxt, setAutoEvalTxt] = useState(""); // courses de référence ou précisions, transmises au guide et au bureau
  const [coord, setCoord] = useState({ nom: "", email: "", tel: "", adresse: "" }); // coordonnées du client réservant
  const [cgvOuvertes, setCgvOuvertes] = useState(false);
  const [toast, setToast] = useState(null);
  const [alertes, setAlertes] = useState([]);
  const [demandes, setDemandes] = useState([]); // demandes de sortie sur mesure
  const [selBureau, setSelBureau] = useState(null); // cellule sélectionnée du planning { g, iso }
  const [nvOuvert, setNvOuvert] = useState(false);  // formulaire "nouvelle sortie"
  const [nv, setNv] = useState({ titre: "", tag: "ROC", iso: "", nbJours: 1, niveau: "Initié", prix: 150, places: 6 });
  const [propositions, setPropositions] = useState([]); // missions proposées aux guides par le bureau
  const [demandesGuide, setDemandesGuide] = useState([]); // demandes des guides au bureau (annulation, modification)
  const [questionsGuide, setQuestionsGuide] = useState([]); // questions des guides au bureau (niveau client, etc.)
  const [reponses, setReponses] = useState([]);     // réponses du bureau aux questions des guides
  const [repTxt, setRepTxt] = useState({});          // texte de réponse en cours, par question
  const [archivees, setArchivees] = useState([]);   // ids des réservations archivées par l'admin
  const [voirArchives, setVoirArchives] = useState(false);
  /* Bandeau d'installation : proposé à l'ouverture, masqué si déjà installé */
  const [promptInstall, setPromptInstall] = useState(null); // événement Android/Chrome
  const [bandeauInstall, setBandeauInstall] = useState(true);
  const [aideIOS, setAideIOS] = useState(false);
  const [qOuverte, setQOuverte] = useState(null); // encart question ouvert sur une résa à valider (id sortie)
  const [qTxt, setQTxt] = useState("");

  const estIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const dejaInstallee = typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator?.standalone === true);

  useEffect(() => {
    const capter = (e) => { e.preventDefault(); setPromptInstall(e); };
    window.addEventListener("beforeinstallprompt", capter);
    return () => window.removeEventListener("beforeinstallprompt", capter);
  }, []);

  const installer = async () => {
    if (promptInstall) {
      promptInstall.prompt();
      const { outcome } = await promptInstall.userChoice;
      setPromptInstall(null);
      setBandeauInstall(false);
      setToast({ ok: outcome === "accepted", txt: outcome === "accepted" ? "Application installée ✓" : "Installation annulée" });
    } else {
      setAideIOS(true); // iOS : pas d'installation automatique, on explique le geste
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const reserver = (s) => { setCgvOk(false); setCgvOuvertes(false); setNbPart(1); setAutoEval(null); setAutoEvalTxt(""); setCoord({ nom: "", email: "", tel: "", adresse: "" }); setFiche(null); setModal(s); };
  const evalRequise = (niv) => ["Confirmé", "Engagé"].includes(niv);
  const evalOk = (niv) => !evalRequise(niv) || (["ok", "proche"].includes(autoEval) && autoEvalTxt.trim().length >= 10);
  const coordOk = coord.nom.trim().length > 1 && /\S+@\S+\.\S+/.test(coord.email) && coord.tel.trim().length >= 8 && coord.adresse.trim().length > 3;

  const payerArrhes = () => {
    const s = modal;
    const prixPers = s.paliers ? s.paliers[nbPart - 1] : s.prix;
    const total = prixPers * nbPart;
    setSorties(prev => prev.map(x => x.id !== s.id ? x : {
      ...x,
      // une cordée privée réservée est fermée aux autres, quelle que soit sa taille
      restantes: x.paliers ? 0 : x.restantes - nbPart,
      statut: x.guide ? "attente" : "alerte",
      maResa: { nb: nbPart, total, acompte: Math.round(total * 0.3), client: { ...coord },
        niveau: evalRequise(s.niveau) ? { choix: autoEval === "ok" ? "Courses de ce niveau réalisées" : "Niveau approchant", details: autoEvalTxt.trim() } : null },
    }));
    if (!s.guide) {
      setAlertes(a => [...a, {
        id: Date.now(), sortieId: s.id,
        txt: `Aucun guide interne disponible pour « ${s.titre} » (${fmtDate(s.iso)}). Réservation client encaissée — contacter un guide externe.`,
      }]);
      setToast({ ok: true, txt: "Réservation confirmée. Acompte versé ✓ — alerte SMS envoyée au bureau" });
    } else {
      setToast({ ok: true, txt: `Réservation confirmée ✓ — ${s.guide} est notifié par SMS et valide sous 48 h` });
    }
    setModal(null);
  };

  const validerResa = (id) => {
    setSorties(prev => prev.map(x => x.id === id ? { ...x, statut: "confirmée" } : x));
    setToast({ ok: true, txt: "Sortie validée — le client est notifié (e-mail + SMS)" });
  };

  /* Un guide attribué à une sortie a forcément ouvert ces jours-là : l'attribution
     n'est possible que sur jours dispo, donc les jours couverts par ses sorties
     sont réputés ouverts (puis affichés "en sortie"). */
  const aSortieLe = (guide, iso) => sorties.some(s => s.guide === guide && couvre(s, iso));
  const dispoDe = (guide, iso) =>
    aSortieLe(guide, iso) ? true : (dispos[guide]?.[iso] ?? dispoBase(guide, iso));
  const toggleDispo = (guide, iso) => {
    if (aSortieLe(guide, iso)) {
      setToast({ ok: false, txt: "Sortie attribuée ce jour — contactez le bureau pour vous libérer" });
      return;
    }
    setDispos(prev => ({
      ...prev,
      [guide]: { ...(prev[guide] ?? {}), [iso]: !dispoDe(guide, iso) },
    }));
  };

  const resasEnAttente = sorties.filter(s => s.statut === "attente" && s.guide === MOI);

  /* --- Filtres client : activité (union) puis date --- */
  const toggleFiltre = (tag) =>
    setFiltres(f => f.includes(tag) ? f.filter(x => x !== tag) : [...f, tag]);
  const premierJour = isoDe(mois.y, mois.m, 1);
  const dernierJour = isoDe(mois.y, mois.m, nbJoursDuMois(mois.y, mois.m));
  const sortiesFiltrees = sorties
    .filter(s => filtres.length === 0 || s.tags.some(t => filtres.includes(t)))
    .filter(s => jourSel !== null
      ? couvre(s, jourSel)                                   // couvre le jour sélectionné
      : s.iso <= dernierJour && finDe(s) >= premierJour)     // chevauche le mois affiché
    .sort((a, b) => a.iso.localeCompare(b.iso));
  /* Tags d'activité présents un jour donné, sur TOUTE la durée des sorties */
  const tagsSetDuJour = (iso) => {
    const set = new Set();
    sorties.forEach(s => {
      if (!couvre(s, iso)) return;
      if (filtres.length > 0 && !s.tags.some(t => filtres.includes(t))) return;
      s.tags.forEach(t => { if (filtres.length === 0 || filtres.includes(t)) set.add(t); });
    });
    return set;
  };
  const tagsDuJour = (iso) => {
    const set = tagsSetDuJour(iso);
    return ACTIVITES.map(([t]) => t).filter(t => set.has(t)); // ordre stable du code couleur
  };
  /* Placement en pistes : chaque SORTIE trace une plage par activité, du départ au retour.
     Deux sorties distinctes — même consécutives et de même activité — restent deux segments
     séparés (autres clients, autre engagement). Les pistes sont attribuées de manière
     compacte (coloration d'intervalles gloutonne) : pas d'espace vide réservé, et deux
     segments qui s'enchaînent réutilisent la même piste, à la même hauteur. */
  const calculPistes = () => {
    const ordre = Object.fromEntries(ACTIVITES.map(([t], i) => [t, i]));
    const plages = [];
    sorties.forEach(s => {
      if (filtres.length > 0 && !s.tags.some(t => filtres.includes(t))) return;
      s.tags.forEach(t => {
        if (filtres.length > 0 && !filtres.includes(t)) return;
        plages.push({ t, ti: ordre[t], debut: s.iso, fin: finDe(s) });
      });
    });
    plages.sort((a, b) => a.debut.localeCompare(b.debut) || a.ti - b.ti);
    const finsPistes = [];
    plages.forEach(p => {
      let k = finsPistes.findIndex(f => f < p.debut);
      if (k === -1) { k = finsPistes.length; finsPistes.push(p.fin); }
      else finsPistes[k] = p.fin;
      p.piste = k;
    });
    const parJour = {};
    plages.forEach(p => {
      for (let d = p.debut; d <= p.fin; d = addJours(d, 1)) {
        (parJour[d] = parJour[d] ?? []).push({ t: p.t, piste: p.piste, avant: d > p.debut, apres: d < p.fin });
      }
    });
    return { parJour, nb: Math.max(1, finsPistes.length) };
  };
  const pistesClient = calculPistes();
  /* Hauteur des cellules : nombre de pistes réellement visibles dans le mois affiché */
  const nbPistesMois = (() => {
    let n = 1;
    for (let j = 1; j <= nbJoursDuMois(mois.y, mois.m); j++) {
      (pistesClient.parJour[isoDe(mois.y, mois.m, j)] ?? []).forEach(p => { n = Math.max(n, p.piste + 1); });
    }
    return n;
  })();
  const guidesLibres = (iso) => GUIDES.filter(g => dispoDe(g, iso) && !aSortieLe(g, iso));
  /* Carte de demande sur mesure, affichée sous le calendrier pour tout jour sélectionné */
  const carteSurMesure = (titre, texte) => (
    <div className="rounded-2xl p-4 bg-white border mt-4" style={{ borderColor: C.glacier }}>
      <p className="disp text-base font-semibold">{titre}</p>
      <p className="mono text-xs mt-1" style={{ color: C.ardoise }}>
        {fmtDate(jourSel)} · {guidesLibres(jourSel).length} guide{guidesLibres(jourSel).length > 1 ? "s" : ""} du bureau libre{guidesLibres(jourSel).length > 1 ? "s" : ""} ce jour
      </p>
      <p className="text-sm mt-2" style={{ color: C.ardoise }}>{texte}</p>
      {guidesLibres(jourSel).length > 0 ? (
        <button onClick={() => envoyerDemande(jourSel)}
          className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.corde }}>
          Envoyer ma demande au bureau
        </button>
      ) : (
        <p className="text-sm mt-3 font-semibold" style={{ color: C.ardoise }}>
          Tous les guides sont engagés ce jour — choisissez une autre date ou envoyez une demande sur un jour voisin.
        </p>
      )}
    </div>
  );
  /* Guides libres sur toute la période d'une nouvelle sortie (règle : attribution = jours ouverts) */
  const guidesLibresPeriode = (iso, nbJours) => {
    if (!iso) return [];
    return GUIDES.filter(g => {
      for (let k = 0; k < nbJours; k++) {
        const d = addJours(iso, k);
        if (!dispoDe(g, d) || aSortieLe(g, d)) return false;
      }
      return true;
    });
  };
  const creerSortie = () => {
    const libres = guidesLibresPeriode(nv.iso, nv.nbJours);
    if (!nv.titre.trim() || !nv.iso) { setToast({ ok: false, txt: "Titre et date sont requis" }); return; }
    if (libres.length === 0) { setToast({ ok: false, txt: "Aucun guide libre sur cette période — choisissez d'autres dates" }); return; }
    setSorties(prev => [...prev, {
      id: Date.now(), titre: nv.titre.trim(), tags: [nv.tag], iso: nv.iso, heure: "07:00",
      duree: nv.nbJours === 1 ? "Journée" : `${nv.nbJours} jours`, nbJours: nv.nbJours,
      niveau: nv.niveau, prix: Number(nv.prix), places: Number(nv.places), restantes: Number(nv.places),
      guide: libres[0], statut: null,
      description: "Sortie créée par le bureau — fiche détaillée à compléter avant publication.",
      materiel: "À préciser.", prerequis: "À préciser.", inclus: "Encadrement par guide UIAGM.",
    }]);
    setToast({ ok: true, txt: `Sortie créée et attribuée à ${libres[0]} ✓` });
    setNvOuvert(false);
    setNv({ titre: "", tag: "ROC", iso: "", nbJours: 1, niveau: "Initié", prix: 150, places: 6 });
  };
  /* Désistement du guide sur une réservation à valider : réattribution automatique en cascade,
     ou alerte gestionnaire si aucun guide interne n'est libre (jamais d'annulation client). */
  const seDesister = (s) => {
    /* Le refus est mémorisé sur la réservation : un guide qui a décliné ne revient
       jamais dans la rotation. Ses jours passent réellement en indisponible. */
    const refus = [...(s.refus ?? []), s.guide];
    setDispos(prev => {
      const maj = { ...(prev[s.guide] ?? {}) };
      for (let k = 0; k < s.nbJours; k++) maj[addJours(s.iso, k)] = false;
      return { ...prev, [s.guide]: maj };
    });
    const releve = GUIDES.find(g => {
      if (refus.includes(g)) return false; // déjà décliné : exclu de la rotation
      for (let k = 0; k < s.nbJours; k++) {
        const d = addJours(s.iso, k);
        if (!dispoDe(g, d) || aSortieLe(g, d)) return false;
      }
      return true;
    });
    if (releve) {
      setSorties(prev => prev.map(x => x.id === s.id ? { ...x, guide: releve, statut: "attente", refus } : x));
      setToast({ ok: true, txt: `Réservation réattribuée à ${releve} (${refus.length} refus) — SMS envoyé, 48 h pour valider` });
    } else {
      setSorties(prev => prev.map(x => x.id === s.id ? { ...x, guide: null, statut: "alerte", refus } : x));
      setAlertes(a => [...a, {
        id: Date.now(), sortieId: s.id,
        txt: `Rotation épuisée pour « ${s.titre} » (${fmtDate(s.iso)}) : ${refus.join(", ")} indisponible${refus.length > 1 ? "s" : ""}, aucun autre guide interne libre — mobiliser un guide externe. Réservation client encaissée et maintenue.`,
      }]);
      setToast({ ok: false, txt: "Tous les guides ont décliné — alerte envoyée au gestionnaire (guide externe)" });
    }
  };
  /* Bureau → guide : réponse instantanée à une question (site + SMS) */
  const repondreQuestion = (q) => {
    const txt = (repTxt[q.id] ?? "").trim();
    if (txt.length < 2) { setToast({ ok: false, txt: "Écrivez votre réponse avant d'envoyer" }); return; }
    setReponses(r => [...r, { id: Date.now(), g: q.g, sortieId: q.sortieId, titre: q.titre, iso: q.iso, question: q.txt, reponse: txt }]);
    setQuestionsGuide(x => x.filter(y => y.id !== q.id));
    setRepTxt(t => { const c = { ...t }; delete c[q.id]; return c; });
    setToast({ ok: true, txt: `Réponse envoyée à ${q.g} ✓ — notification et SMS transmis` });
  };
  /* Guide → bureau : question sur une réservation (niveau déclaré du client, logistique…) */
  const poserQuestion = (s) => {
    if (qTxt.trim().length < 5) { setToast({ ok: false, txt: "Écrivez votre question avant d'envoyer" }); return; }
    setQuestionsGuide(q => [...q, { id: Date.now(), g: MOI, sortieId: s.id, titre: s.titre, iso: s.iso, txt: qTxt.trim() }]);
    setQOuverte(null); setQTxt("");
    setToast({ ok: true, txt: "Question envoyée au bureau ✓ (notification + SMS aux administrateurs) — la réservation reste en attente" });
  };
  /* Guide → bureau : demande d'annulation de sa sortie (SMS + notification simulés) */
  const demanderAnnulation = (s, motif) => {
    if (demandesGuide.some(d => d.sortieId === s.id)) return;
    setDemandesGuide(d => [...d, { id: Date.now(), g: MOI, sortieId: s.id, titre: s.titre, iso: s.iso, motif }]);
    setToast({ ok: true, txt: "Demande d'annulation envoyée — SMS et notification transmis au bureau ✓" });
  };
  /* Bureau : annulation manuelle d'une sortie (utile quand la demande arrive par téléphone) */
  const annulerSortieBureau = (sortieId) => {
    const s = sorties.find(x => x.id === sortieId);
    if (!s) return;
    const avaitResa = !!s.maResa || (s.places - s.restantes > 0);
    setSorties(prev => prev.filter(x => x.id !== sortieId));
    setAlertes(prev => prev.filter(a => a.sortieId !== sortieId));
    setDemandesGuide(prev => prev.filter(d => d.sortieId !== sortieId));
    setSelBureau(null); setSelGuide(null);
    setToast({
      ok: true,
      txt: avaitResa
        ? "Sortie annulée — clients notifiés et acomptes remboursés (art. 8.11 CGC)"
        : "Sortie annulée — calendrier et planning mis à jour",
    });
  };
  const proposerMission = (g, iso, type) => {
    setPropositions(p => [...p, { id: Date.now(), g, iso, type }]);
    setToast({ ok: true, txt: `Proposition envoyée à ${g} ✓ — notification et SMS transmis` });
    setSelBureau(null);
  };
  const AUJOURDHUI = "2026-08-03";
  const annulerResa = (s) => {
    const jours = Math.round((new Date(s.iso + "T12:00:00") - new Date(AUJOURDHUI + "T12:00:00")) / 86400000);
    const pct = jours > 60 ? 0 : jours >= 31 ? 20 : jours >= 15 ? 50 : 100;
    const retenue = Math.round(s.maResa.total * pct / 100);
    setSorties(prev => prev.map(x => x.id !== s.id ? x : {
      ...x, statut: null, maResa: undefined,
      restantes: x.paliers ? x.places : x.restantes + s.maResa.nb,
    }));
    setAlertes(prev => prev.filter(a => a.sortieId !== s.id)); // l'alerte bureau liée tombe avec l'annulation
    setToast({
      ok: pct === 0,
      txt: pct === 0
        ? "Annulée — acompte remboursé (hors frais engagés, art. 8.2 CGC)"
        : `Annulée à ${jours} jours — retenue de ${pct} % des honoraires (${retenue} CHF, art. 8.2 CGC)`,
    });
  };
  const envoyerDemande = (iso) => {
    setDemandes(d => [...d, {
      id: Date.now(), iso,
      activites: filtres.length > 0 ? filtres.map(t => LABEL_TAG[t]).join(", ") : "toutes activités",
    }]);
    setToast({ ok: true, txt: "Demande envoyée au bureau ✓ (notification + SMS) — réponse sous 24 h" });
  };
  const memeMois = (a, b) => a.y === b.y && a.m === b.m;
  const moisSuivant = ({ y, m }, delta) => {
    const d = new Date(y, m + delta, 1);
    if (d < new Date(MOIS_MIN.y, MOIS_MIN.m, 1)) return { y, m };
    if (d > new Date(MOIS_MAX.y, MOIS_MAX.m, 1)) return { y, m };
    return { y: d.getFullYear(), m: d.getMonth() };
  };
  const changerMois = (delta) => {
    setMois(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      const prochain = { y: d.getFullYear(), m: d.getMonth() };
      if (d < new Date(MOIS_MIN.y, MOIS_MIN.m, 1)) return { y, m };
      if (d > new Date(MOIS_MAX.y, MOIS_MAX.m, 1)) return { y, m };
      return prochain;
    });
    setJourSel(null);
  };

  return (
    <div className="min-h-screen body" style={{ background: C.ecume, color: C.encre }}>
      <style>{FONT}</style>

      {/* ===== En-tête ===== */}
      <header className="px-5 pt-6 pb-4" style={{ background: C.encre, color: C.ecume }}>
        <div className="flex items-start justify-between">
          <p className="mono text-xs tracking-widest" style={{ color: C.glacier }}>EXPÉDITIONS GUIDÉES DE LA MER À LA MONTAGNE</p>
          <span className="mono px-2 py-1 rounded-lg font-bold shrink-0"
            style={{ fontSize: "11px", background: C.corde, color: "#fff", letterSpacing: ".03em" }}>
            MAQUETTE {VERSION.toUpperCase()}
          </span>
        </div>
        <h1 className="disp text-3xl font-extrabold leading-tight">Altiora</h1>
        {/* Sélecteur de rôle (démo) */}
        <div className="flex gap-1 mt-4 p-1 rounded-xl" style={{ background: "rgba(255,255,255,.08)" }}>
          {[["client", "Client"], ["guide", "Guide"], ["bureau", "Bureau"]].map(([k, l]) => (
            <button key={k} onClick={() => setRole(k)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={role === k ? { background: C.ecume, color: C.encre } : { color: C.glacier }}>
              {l}{k === "bureau" && (alertes.length + demandes.length + demandesGuide.length + questionsGuide.length + sorties.filter(s => s.statut === "attente").length) > 0 && role !== "bureau" &&
                <span className="ml-1.5 mono text-xs px-1.5 rounded-full" style={{ background: C.corde, color: "#fff" }}>{alertes.length + demandes.length + demandesGuide.length + questionsGuide.length + sorties.filter(s => s.statut === "attente").length}</span>}
            </button>
          ))}
        </div>
      </header>

      {/* ===== Bandeau d'installation (à l'ouverture) ===== */}
      {bandeauInstall && !dejaInstallee && (
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: C.glacier }}>
          <img src="apple-touch-icon.png" alt="" width="40" height="40"
            style={{ borderRadius: "9px", flexShrink: 0 }}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight" style={{ color: C.encre }}>Installer la maquette</p>
            <p style={{ fontSize: "11px", color: C.ardoise }}>
              {estIOS ? "Ajoutez-la à votre écran d'accueil pour l'ouvrir en plein écran." : "Accès direct depuis votre écran d'accueil, comme une application."}
            </p>
          </div>
          <button onClick={installer}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-white shrink-0" style={{ background: C.encre }}>
            Installer
          </button>
          <button onClick={() => setBandeauInstall(false)} aria-label="Fermer"
            className="px-1 text-xl leading-none shrink-0" style={{ color: C.ardoise }}>×</button>
        </div>
      )}

      {/* ===== Aide à l'installation sur iPhone / iPad ===== */}
      {aideIOS && (
        <div className="fixed inset-0 flex items-end justify-center p-4" style={{ background: "rgba(20,48,62,.55)", zIndex: 60 }}
          onClick={() => setAideIOS(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="disp text-lg font-bold">Ajouter à l'écran d'accueil</h3>
            <p className="text-sm mt-2" style={{ color: C.ardoise }}>Sur iPhone et iPad, l'installation se fait depuis Safari en trois gestes :</p>
            <ol className="text-sm mt-3 flex flex-col gap-2">
              <li><span className="font-semibold">1.</span> Touchez le bouton <span className="font-semibold">Partager</span> (le carré avec une flèche vers le haut, en bas de l'écran).</li>
              <li><span className="font-semibold">2.</span> Faites défiler et choisissez <span className="font-semibold">« Sur l'écran d'accueil »</span>.</li>
              <li><span className="font-semibold">3.</span> Touchez <span className="font-semibold">Ajouter</span> — l'icône Altiora apparaît avec vos applications.</li>
            </ol>
            <button onClick={() => { setAideIOS(false); setBandeauInstall(false); }}
              className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.encre }}>
              C'est fait
            </button>
          </div>
        </div>
      )}

      <main className="px-5 py-5 max-w-xl mx-auto pb-16">

        {/* ===================== VUE CLIENT ===================== */}
        {role === "client" && (
          <>
            {sorties.some(s => s.maResa) && (
              <>
                <h2 className="disp text-lg font-semibold mb-1">Mes réservations</h2>
                <div className="flex flex-col gap-3 mb-6">
                  {sorties.filter(s => s.maResa).map(s => (
                    <article key={"r" + s.id} className="rounded-2xl p-4 bg-white shadow-sm border" style={{ borderColor: C.glacier }}>
                      <p className="disp text-base font-semibold leading-snug">{s.titre}</p>
                      <p className="mono text-xs mt-1" style={{ color: C.ardoise }}>
                        {fmtDate(s.iso)} · {s.maResa.nb} participant{s.maResa.nb > 1 ? "s" : ""} · acompte versé : {s.maResa.acompte} CHF · solde : {s.maResa.total - s.maResa.acompte} CHF
                      </p>
                      <FilStatut statut={s.statut} />
                      <button onClick={() => annulerResa(s)}
                        className="mt-3 text-sm font-semibold underline" style={{ color: C.ardoise }}>
                        Annuler ma réservation (barème art. 8.2 CGC)
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}

            <h2 className="disp text-lg font-semibold mb-1">Trouver une sortie</h2>
            <p className="text-sm mb-3" style={{ color: C.ardoise }}>Places mises à jour en temps réel. Réservation confirmée dès le versement de l'acompte (30 %). Prix par personne, hors frais annexes (repas, refuges, remontées — art. 11.5 CGC).</p>

            {/* --- Filtres par activité --- */}
            <div className="flex flex-wrap gap-2 mb-4">
              {ACTIVITES.map(([tag, label, couleur]) => {
                const actif = filtres.includes(tag);
                return (
                  <button key={tag} onClick={() => toggleFiltre(tag)}
                    className="px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors flex items-center gap-1.5"
                    style={actif
                      ? { background: C.encre, color: C.ecume, borderColor: C.encre }
                      : { background: "#fff", color: C.encre, borderColor: C.glacier }}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: couleur }} />
                    {label}
                  </button>
                );
              })}
              {(filtres.length > 0 || jourSel !== null) && (
                <button onClick={() => { setFiltres([]); setJourSel(null); }}
                  className="px-3 py-1.5 rounded-full text-sm" style={{ color: C.corde }}>
                  Effacer ✕
                </button>
              )}
            </div>

            {/* --- Calendrier mensuel --- */}
            <div className="rounded-2xl bg-white border p-3 mb-3" style={{ borderColor: C.glacier }}>
              <div className="flex items-center justify-between mb-1 px-1">
                <button onClick={() => changerMois(-1)} disabled={memeMois(mois, MOIS_MIN)}
                  aria-label="Mois précédent"
                  className="w-8 h-8 rounded-lg text-lg font-bold disabled:opacity-25"
                  style={{ color: C.encre }}>‹</button>
                <div className="flex items-center gap-1.5">
                  <select value={mois.m} aria-label="Choisir le mois"
                    onChange={e => { setMois(prev => ({ ...prev, m: Number(e.target.value) })); setJourSel(null); }}
                    className="disp text-sm font-bold rounded-lg px-1.5 py-1 border"
                    style={{ borderColor: C.glacier, color: C.encre, background: "#fff" }}>
                    {Array.from({ length: 12 }, (_, m) => {
                      const horsLimites =
                        (mois.y === MOIS_MIN.y && m < MOIS_MIN.m) ||
                        (mois.y === MOIS_MAX.y && m > MOIS_MAX.m);
                      return (
                        <option key={m} value={m} disabled={horsLimites}>
                          {new Date(2026, m, 1).toLocaleDateString("fr-CH", { month: "long" })}
                        </option>
                      );
                    })}
                  </select>
                  <select value={mois.y} aria-label="Choisir l'année"
                    onChange={e => {
                      const y = Number(e.target.value);
                      setMois(prev => {
                        let m = prev.m;
                        if (y === MOIS_MIN.y && m < MOIS_MIN.m) m = MOIS_MIN.m;
                        if (y === MOIS_MAX.y && m > MOIS_MAX.m) m = MOIS_MAX.m;
                        return { y, m };
                      });
                      setJourSel(null);
                    }}
                    className="disp text-sm font-bold rounded-lg px-1.5 py-1 border"
                    style={{ borderColor: C.glacier, color: C.encre, background: "#fff" }}>
                    {Array.from({ length: MOIS_MAX.y - MOIS_MIN.y + 1 }, (_, i) => MOIS_MIN.y + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => changerMois(1)} disabled={memeMois(mois, MOIS_MAX)}
                  aria-label="Mois suivant"
                  className="w-8 h-8 rounded-lg text-lg font-bold disabled:opacity-25"
                  style={{ color: C.encre }}>›</button>
              </div>
              <p className="monotext-center mb-2" style={{ fontSize: "10px", color: C.ardoise }}>
                barres colorées = sorties, du départ au retour · jour vide = demande sur mesure possible
              </p>
              <div className="grid grid-cols-7 monotext-center mb-1" style={{ fontSize: "10px", color: C.ardoise }}>
                {["L", "M", "M", "J", "V", "S", "D"].map((l, i) => <span key={i}>{l}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-x-0 gap-y-1">
                {Array.from({ length: offsetDuMois(mois.y, mois.m) }).map((_, i) => <span key={"v" + i} />)}
                {Array.from({ length: nbJoursDuMois(mois.y, mois.m) }, (_, i) => i + 1).map(j => {
                  const iso = isoDe(mois.y, mois.m, j);
                  const tags = tagsDuJour(iso);
                  const sel = jourSel === iso;
                  return (
                    <button key={j} onClick={() => setJourSel(sel ? null : iso)}
                      className="flex flex-col items-center rounded-lg transition-colors"
                      style={{ paddingTop: "4px", paddingBottom: "4px", minHeight: `${34 + nbPistesMois * 6}px`,
                        ...(sel ? { background: C.encre, color: C.ecume } : {}) }}>
                      <span className="text-sm" style={{ fontWeight: tags.length ? 700 : 400 }}>{j}</span>
                      {/* Pistes compactes : une plage continue = une piste, barres accolées */}
                      <span className="block w-full"
                        style={{ position: "relative", height: `${nbPistesMois * 6 + 2}px`, marginTop: "3px" }}>
                        {(pistesClient.parJour[iso] ?? []).map(p => (
                          <span key={`${p.t}-${p.piste}`}
                            style={{
                              position: "absolute", left: 0, right: 0, top: `${p.piste * 6}px`,
                              height: "4px", background: COULEUR_TAG[p.t],
                              borderRadius: `${p.avant ? 0 : 3}px ${p.apres ? 0 : 3}px ${p.apres ? 0 : 3}px ${p.avant ? 0 : 3}px`,
                            }} />
                        ))}
                      </span>

                    </button>
                  );
                })}
              </div>
            </div>

            {/* --- Liste des sorties filtrées --- */}
            <p className="text-xs mb-3" style={{ color: C.ardoise }}>
              {sortiesFiltrees.length} sortie{sortiesFiltrees.length > 1 ? "s" : ""}
              {jourSel !== null ? ` le ${fmtDate(jourSel)}` : ` en ${fmtMois(mois.y, mois.m).toLowerCase()}`}
              {filtres.length > 0 ? ` · ${filtres.map(t => LABEL_TAG[t]).join(", ")}` : ""}
            </p>
            {sortiesFiltrees.length === 0 && jourSel !== null &&
              carteSurMesure(
                "Aucune sortie ce jour — demandez du sur-mesure",
                `Envoyez votre demande (${filtres.length > 0 ? filtres.map(t => LABEL_TAG[t]).join(", ") : "toutes activités"}) : le bureau vous propose une course adaptée à votre niveau et vos envies.`
              )}
            {sortiesFiltrees.length === 0 && jourSel === null && (
              <div className="rounded-2xl p-4 bg-white border text-sm" style={{ borderColor: C.glacier, color: C.ardoise }}>
                Aucune sortie programmée ce mois-ci pour ces filtres. Naviguez vers un autre mois, élargissez vos filtres — ou sélectionnez un jour dans le calendrier pour envoyer une demande sur mesure au bureau.
              </div>
            )}
            <div className="flex flex-col gap-4">
              {sortiesFiltrees.map(s => (
                <article key={s.id} onClick={() => setFiche(s)}
                  className="rounded-2xl p-4 bg-white shadow-sm border cursor-pointer" style={{ borderColor: C.glacier }}>
                  <div className="flex flex-wrap gap-2 mb-2 items-center">
                    {s.tags.map(t => <Chip key={t} t={t} />)}
                    {s.ratio && (
                      <span className="mono text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: C.encre, color: C.ecume }}>PRIVÉE {s.ratio}</span>
                    )}
                  </div>
                  <h3 className="disp text-base font-semibold leading-snug">{s.titre}</h3>
                  <p className="mono text-xs mt-1" style={{ color: C.ardoise }}>
                    {fmtDate(s.iso)}{s.heure !== "—" ? ` · ${s.heure}` : ""} · {s.duree} · niveau {s.niveau} · {s.paliers ? `1 guide / ${s.paliers.length > 1 ? "1 à " + s.paliers.length + " clients" : "1 client"}` : `${s.places} pers. max`}
                  </p>
                  <div className="flex items-end justify-between mt-3">
                    <div>
                      <p className="disp text-xl font-extrabold">{s.paliers ? s.paliers[0] : s.prix} CHF<span className="body text-xs font-normal" style={{ color: C.ardoise }}> / pers.</span></p>
                      {s.paliers && s.paliers.length > 1 && (
                        <p style={{ fontSize: "11px", color: C.ardoise }}>à 2 participants : {s.paliers[1]} CHF / pers.</p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: s.restantes <= 2 ? C.corde : C.ardoise }}>
                        {s.restantes > 0 ? `${s.restantes} place${s.restantes > 1 ? "s" : ""} restante${s.restantes > 1 ? "s" : ""}` : "Complet"}
                      </p>
                    </div>
                    {s.statut ? (
                      <span className="text-sm font-semibold" style={{ color: s.statut === "confirmée" ? C.vert : C.corde }}>
                        {s.statut === "confirmée" ? "Validée par le guide ✓" : "Réservée ✓"}
                      </span>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); reserver(s); }} disabled={s.restantes === 0}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                        style={{ background: C.corde }}>
                        Réserver
                      </button>
                    )}
                  </div>
                  {s.statut && <FilStatut statut={s.statut} />}
                </article>
              ))}
            </div>
            {jourSel !== null && sortiesFiltrees.length > 0 &&
              carteSurMesure(
                "Une autre envie ce jour-là ?",
                "Les sorties programmées ne vous correspondent pas ? Demandez une autre activité ou une course privée à cette date : le bureau vous répond avec une proposition adaptée."
              )}
          </>
        )}

        {/* ===================== VUE GUIDE ===================== */}
        {role === "guide" && (
          <>
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
              {GUIDES.map(g => (
                <button key={g} onClick={() => { setMoiGuide(g); setSelGuide(null); }}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap transition-colors"
                  style={MOI === g
                    ? { background: C.encre, color: C.ecume, borderColor: C.encre }
                    : { background: "#fff", color: C.encre, borderColor: C.glacier }}>
                  {g}
                </button>
              ))}
            </div>
            <h2 className="disp text-lg font-semibold mb-1">Mes disponibilités — {MOI}</h2>
            <p className="text-sm mb-3" style={{ color: C.ardoise }}>Un tap sur un jour pour basculer dispo / indispo. Visible du bureau et des clients en temps réel.</p>
            <div className="rounded-2xl bg-white border p-3 mb-6" style={{ borderColor: C.glacier }}>
              <div className="flex items-center justify-between mb-1 px-1">
                <button onClick={() => { setSelGuide(null); setMoisG(p => moisSuivant(p, -1)); }} disabled={memeMois(moisG, MOIS_MIN)}
                  aria-label="Mois précédent" className="w-8 h-8 rounded-lg text-lg font-bold disabled:opacity-25"
                  style={{ color: C.encre }}>‹</button>
                <p className="disp text-sm font-bold">{fmtMois(moisG.y, moisG.m)}</p>
                <button onClick={() => { setSelGuide(null); setMoisG(p => moisSuivant(p, 1)); }} disabled={memeMois(moisG, MOIS_MAX)}
                  aria-label="Mois suivant" className="w-8 h-8 rounded-lg text-lg font-bold disabled:opacity-25"
                  style={{ color: C.encre }}>›</button>
              </div>
              <p className="monotext-center mb-2" style={{ fontSize: "10px", color: C.ardoise }}>
clair = dispo · <span style={{ textDecoration: "line-through" }}>barré</span> = indispo · <span style={{ color: C.corde }}>▬</span> sortie attribuée (tap = détail)
              </p>
              <div className="grid grid-cols-7 monotext-center mb-1" style={{ fontSize: "10px", color: C.ardoise }}>
                {["L", "M", "M", "J", "V", "S", "D"].map((l, i) => <span key={i}>{l}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-x-0 gap-y-1">
                {Array.from({ length: offsetDuMois(moisG.y, moisG.m) }).map((_, i) => <span key={"v" + i} />)}
                {Array.from({ length: nbJoursDuMois(moisG.y, moisG.m) }, (_, i) => i + 1).map(j => {
                  const iso = isoDe(moisG.y, moisG.m, j);
                  const d = dispoDe(MOI, iso);
                  const maSortie = aSortieLe(MOI, iso);
                  const selJ = selGuide === iso;
                  return (
                    <button key={j}
                      onClick={() => maSortie
                        ? setSelGuide(selJ ? null : iso)
                        : (setSelGuide(null), toggleDispo(MOI, iso))}
                      className="rounded-lg py-1.5 flex flex-col items-center border transition-colors"
                      style={{
                        ...(d
                          ? { background: "#fff", color: C.encre, borderColor: C.glacier }
                          : { background: C.glacier, color: C.ardoise, borderColor: C.glacier,
                              boxShadow: "inset 0 2px 4px rgba(20,48,62,.25)" }),
                        ...(selJ ? { borderColor: C.corde, boxShadow: `0 0 0 2px ${C.corde}` } : {}),
                      }}>
                      <span className="text-xs font-bold"
                        style={d ? {} : { textDecoration: "line-through" }}>{j}</span>
                      <span
                        style={{
                          display: "block", height: "4px", width: "100%", marginTop: "3px",
                          background: maSortie ? C.corde : "transparent",
                          borderRadius: maSortie
                            ? `${aSortieLe(MOI, addJours(iso, -1)) ? 0 : 3}px ${aSortieLe(MOI, addJours(iso, 1)) ? 0 : 3}px ${aSortieLe(MOI, addJours(iso, 1)) ? 0 : 3}px ${aSortieLe(MOI, addJours(iso, -1)) ? 0 : 3}px`
                            : 0,
                        }} />
                    </button>
                  );
                })}
              </div>

              {/* --- Détail de la sortie attribuée le jour sélectionné --- */}
              {selGuide && (() => {
                const s = sorties.find(x => x.guide === MOI && couvre(x, selGuide));
                if (!s) return null;
                return (
                  <div className="mt-3 rounded-xl p-3 border-l-4 text-sm" style={{ background: C.ecume, borderLeftColor: C.corde }}>
                    <p className="mono text-xs font-bold" style={{ color: C.corde }}>MA SORTIE · {fmtDate(selGuide).toUpperCase()}</p>
                    <p className="font-semibold mt-1">{s.titre}</p>
                    <p className="mono text-xs mt-0.5" style={{ color: C.ardoise }}>
                      {fmtDate(s.iso)}{s.nbJours > 1 ? ` → ${fmtDate(finDe(s))}` : ""}{s.heure !== "—" ? ` · départ ${s.heure}` : ""} · {s.duree}
                    </p>
                    <p className="mono text-xs mt-0.5" style={{ color: C.ardoise }}>
                      {s.ratio ? `Cordée privée ${s.ratio}` : `${s.places - s.restantes}/${s.places} inscrit${s.places - s.restantes > 1 ? "s" : ""}`}
                      {" · "}{s.paliers ? s.paliers[0] : s.prix} CHF/pers. · niveau {s.niveau}
                      {s.statut === "attente" ? " · réservation à valider ⏱" : s.statut === "confirmée" ? " · validée ✓" : ""}
                    </p>
                    {demandesGuide.some(d => d.sortieId === s.id) ? (
                      <p className="mt-3 text-sm font-semibold" style={{ color: C.corde }}>
                        Demande d'annulation envoyée — en attente du bureau ⏱
                      </p>
                    ) : (
                      <div className="mt-3">
                        <p className="text-sm font-semibold" style={{ color: C.corde }}>Demander l'annulation au bureau — motif :</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {["Maladie / accident", "Raison familiale", "Autre motif"].map(m => (
                            <button key={m} onClick={() => demanderAnnulation(s, m)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                              style={{ borderColor: C.corde, color: C.corde }}>
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="mt-2" style={{ fontSize: "10px", color: C.ardoise }}>
                      La demande part immédiatement par SMS et notification aux administrateurs, qui décident de l'annulation ou de la réattribution.
                    </p>
                  </div>
                );
              })()}
            </div>

            {reponses.filter(r => r.g === MOI).length > 0 && (
              <>
                <h2 className="disp text-lg font-semibold mb-1">Réponses du bureau <span className="mono text-sm" style={{ color: C.vert }}>({reponses.filter(r => r.g === MOI).length})</span></h2>
                <div className="flex flex-col gap-3 mb-6">
                  {reponses.filter(r => r.g === MOI).map(r => (
                    <article key={r.id} className="rounded-2xl p-4 bg-white shadow-sm border-l-4 border" style={{ borderColor: C.glacier, borderLeftColor: C.vert }}>
                      <p className="mono text-xs font-bold" style={{ color: C.vert }}>RÉPONSE DU BUREAU · reçue aussi par SMS</p>
                      <p className="font-semibold mt-1">{r.titre}</p>
                      <p className="text-sm mt-1.5" style={{ color: C.ardoise }}>Votre question : « {r.question} »</p>
                      <p className="text-sm mt-1.5 rounded-lg p-2" style={{ background: C.ecume }}>« {r.reponse} »</p>
                      <button onClick={() => setReponses(x => x.filter(y => y.id !== r.id))}
                        className="mt-2.5 text-sm font-semibold underline" style={{ color: C.ardoise }}>
                        Vu — je valide ou décline la réservation ci-dessous
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}

            {propositions.filter(p => p.g === MOI).length > 0 && (
              <>
                <h2 className="disp text-lg font-semibold mb-1">Propositions du bureau <span className="mono text-sm" style={{ color: C.corde }}>({propositions.filter(p => p.g === MOI).length})</span></h2>
                <div className="flex flex-col gap-3 mb-6">
                  {propositions.filter(p => p.g === MOI).map(p => (
                    <article key={p.id} className="rounded-2xl p-4 bg-white shadow-sm border-l-4 border" style={{ borderColor: C.glacier, borderLeftColor: C.encre }}>
                      <p className="disp text-base font-semibold">{p.type}</p>
                      <p className="mono text-xs mt-1" style={{ color: C.ardoise }}>{fmtDate(p.iso)} · proposé par le bureau</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => { setPropositions(x => x.filter(y => y.id !== p.id)); setToast({ ok: true, txt: "Mission acceptée — le bureau est notifié" }); }}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.vert }}>
                          J'accepte ✓
                        </button>
                        <button onClick={() => { setPropositions(x => x.filter(y => y.id !== p.id)); setToast({ ok: false, txt: "Mission déclinée — le bureau est notifié" }); }}
                          className="px-4 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: C.ardoise, color: C.ardoise }}>
                          Je décline
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            <h2 className="disp text-lg font-semibold mb-1">À valider <span className="mono text-sm" style={{ color: C.corde }}>({resasEnAttente.length})</span></h2>
            {resasEnAttente.length === 0 ? (
              <p className="text-sm rounded-xl p-4 bg-white border" style={{ borderColor: C.glacier, color: C.ardoise }}>
                Aucune réservation en attente. Les nouvelles résa sur vos sorties apparaîtront ici — vous avez 48 h pour les valider.
              </p>
            ) : resasEnAttente.map(s => (
              <article key={s.id} className="rounded-2xl p-4 bg-white shadow-sm border-l-4 border" style={{ borderColor: C.glacier, borderLeftColor: C.corde }}>
                <h3 className="disp text-base font-semibold">{s.titre}</h3>
                <p className="mono text-xs mt-1" style={{ color: C.ardoise }}>
                  {fmtDate(s.iso)}{s.heure !== "—" ? ` · ${s.heure}` : ""} · {s.maResa ? `${s.maResa.nb} participant${s.maResa.nb > 1 ? "s" : ""}` : "1 nouveau client"}
                </p>
                {s.maResa?.client && (
                  <p className="text-sm mt-1.5">
                    <span className="font-semibold">{s.maResa.client.nom}</span>
                    <span style={{ color: C.ardoise }}> · {s.maResa.client.tel} · {s.maResa.client.email}</span>
                  </p>
                )}
                {s.maResa?.niveau && (
                  <div className="rounded-lg p-2 mt-2" style={{ background: C.ecume }}>
                    <p className="mono text-xs font-bold" style={{ color: C.encre }}>NIVEAU DÉCLARÉ : {s.maResa.niveau.choix.toUpperCase()}</p>
                    <p className="text-sm mt-0.5" style={{ color: C.ardoise }}>« {s.maResa.niveau.details} »</p>
                  </div>
                )}
                <p className="mono text-xs mt-2 font-bold" style={{ color: C.corde }}>⏱ 47 h 12 min pour valider</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => validerResa(s.id)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.vert }}>
                    Je confirme ✓
                  </button>
                  <button onClick={() => { setQOuverte(qOuverte === s.id ? null : s.id); setQTxt(""); }}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold border"
                    style={{ borderColor: C.encre, color: C.encre }}>
                    Question
                  </button>
                  <button className="px-3 py-2.5 rounded-xl text-sm font-semibold border"
                    style={{ borderColor: C.ardoise, color: C.ardoise }}
                    onClick={() => seDesister(s)}>
                    Indispo
                  </button>
                </div>
                {qOuverte === s.id && (
                  <div className="mt-3 rounded-xl p-3" style={{ background: C.ecume }}>
                    <p className="text-sm font-semibold">Question au bureau avant de valider</p>
                    <textarea value={qTxt} onChange={e => setQTxt(e.target.value)} rows={3}
                      placeholder={s.maResa?.niveau
                        ? `Ex. : le niveau déclaré (« ${s.maResa.niveau.details.slice(0, 60)}… ») vous paraît-il suffisant ? Faut-il rappeler le client ?`
                        : "Votre question au bureau — niveau du client, logistique, matériel…"}
                      className="w-full px-3 py-2 rounded-lg border text-sm mt-1.5 bg-white" style={{ borderColor: C.glacier }} />
                    <button onClick={() => poserQuestion(s)}
                      className="w-full mt-2 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: C.encre }}>
                      Envoyer au bureau
                    </button>
                    <p className="mt-1" style={{ fontSize: "10px", color: C.ardoise }}>
                      Le compte à rebours de 48 h continue — validez ou déclinez une fois la réponse reçue.
                    </p>
                  </div>
                )}
              </article>
            ))}
          </>
        )}

        {/* ===================== VUE BUREAU ===================== */}
        {role === "bureau" && (
          <>
            <h2 className="disp text-lg font-semibold mb-3">Alertes</h2>
            {alertes.length === 0 ? (
              <p className="text-sm rounded-xl p-4 bg-white border mb-6" style={{ borderColor: C.glacier, color: C.ardoise }}>
                Rien à signaler. Si une sortie est réservée sans guide interne disponible, l'alerte apparaît ici (guide externe à contacter).
              </p>
            ) : (
              <div className="flex flex-col gap-3 mb-6">
                {alertes.map(a => (
                  <div key={a.id} className="rounded-2xl p-4 text-sm border-l-4 bg-white border"
                    style={{ borderColor: C.glacier, borderLeftColor: C.corde }}>
                    <p className="mono text-xs font-bold mb-1" style={{ color: C.corde }}>⚠ GUIDE MANQUANT</p>
                    {a.txt}
                    <button className="mt-3 w-full py-2 rounded-xl text-sm font-semibold text-white" style={{ background: C.encre }}
                      onClick={() => { setAlertes(x => x.filter(y => y.id !== a.id)); setToast({ ok: true, txt: "Marquée traitée — guide externe contacté" }); }}>
                      Marquer traitée
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(() => {
              const toutes = sorties.filter(s => s.maResa);
              const resas = toutes.filter(s => !archivees.includes(s.id));
              const archives = toutes.filter(s => archivees.includes(s.id));
              return (
                <>
                  <div className="flex items-baseline justify-between mb-3">
                    <h2 className="disp text-lg font-semibold">Réservations <span className="mono text-sm" style={{ color: C.corde }}>({resas.length})</span></h2>
                    {archives.length > 0 && (
                      <button onClick={() => setVoirArchives(v => !v)}
                        className="text-sm font-semibold underline" style={{ color: C.ardoise }}>
                        {voirArchives ? "Masquer" : "Archives"} ({archives.length})
                      </button>
                    )}
                  </div>
                  {resas.length === 0 ? (
                    <p className="text-sm rounded-xl p-4 bg-white border mb-6" style={{ borderColor: C.glacier, color: C.ardoise }}>
                      Aucune réservation en cours. Chaque nouvelle réservation payée apparaît ici instantanément, avec les coordonnées du client et son statut de validation.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3 mb-6">
                      {resas.map(s => (
                        <div key={"rb" + s.id} className="rounded-2xl p-4 text-sm border-l-4 bg-white border"
                          style={{ borderColor: C.glacier, borderLeftColor: s.statut === "confirmée" ? C.vert : C.corde }}>
                          <p className="mono text-xs font-bold mb-1"
                            style={{ color: s.statut === "confirmée" ? C.vert : C.corde }}>
                            {s.statut === "confirmée" ? "VALIDÉE PAR LE GUIDE ✓" : s.statut === "alerte" ? "⚠ GUIDE MANQUANT — ENCAISSÉE" : "EN ATTENTE DU GUIDE (48 H)"}
                          </p>
                          <p className="font-semibold">{s.titre}</p>
                          <p className="mono text-xs" style={{ color: C.ardoise }}>
                            {fmtDate(s.iso)} · {s.guide ?? "aucun guide"} · {s.maResa.nb} participant{s.maResa.nb > 1 ? "s" : ""} · acompte encaissé {s.maResa.acompte} CHF · solde {s.maResa.total - s.maResa.acompte} CHF
                          </p>
                          {s.maResa.client && (
                            <p className="text-sm mt-1.5">
                              <span className="font-semibold">{s.maResa.client.nom}</span>
                              <span style={{ color: C.ardoise }}> · {s.maResa.client.tel} · {s.maResa.client.email}</span>
                            </p>
                          )}
                          {s.maResa.niveau && (
                            <p className="text-sm mt-1" style={{ color: C.ardoise }}>
                              <span className="font-semibold" style={{ color: C.encre }}>Niveau déclaré ({s.maResa.niveau.choix.toLowerCase()}) :</span> « {s.maResa.niveau.details} »
                            </p>
                          )}
                          <button onClick={() => setArchivees(a => [...a, s.id])}
                            className="mt-2.5 text-sm font-semibold underline" style={{ color: C.ardoise }}>
                            Archiver (traitée)
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {voirArchives && archives.length > 0 && (
                    <div className="flex flex-col gap-2 mb-6">
                      {archives.map(s => (
                        <div key={"ar" + s.id} className="rounded-xl p-3 text-sm border flex items-center justify-between"
                          style={{ borderColor: C.glacier, background: C.ecume, color: C.ardoise }}>
                          <span className="truncate pr-2">
                            <span className="font-semibold" style={{ color: C.encre }}>{s.titre}</span> · {fmtDate(s.iso)} · {s.maResa.client?.nom}
                          </span>
                          <button onClick={() => setArchivees(a => a.filter(id => id !== s.id))}
                            className="text-sm font-semibold underline shrink-0">Restaurer</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            <h2 className="disp text-lg font-semibold mb-3">Demandes sur mesure <span className="mono text-sm" style={{ color: C.corde }}>({demandes.length})</span></h2>
            {demandes.length === 0 ? (
              <p className="text-sm rounded-xl p-4 bg-white border mb-6" style={{ borderColor: C.glacier, color: C.ardoise }}>
                Aucune demande en attente. Quand un client sélectionne un jour sans sortie programmée, sa demande de course sur mesure arrive ici.
              </p>
            ) : (
              <div className="flex flex-col gap-3 mb-6">
                {demandes.map(d => (
                  <div key={d.id} className="rounded-2xl p-4 text-sm border-l-4 bg-white border"
                    style={{ borderColor: C.glacier, borderLeftColor: C.corde }}>
                    <p className="mono text-xs font-bold mb-1" style={{ color: C.corde }}>SUR MESURE</p>
                    <p className="font-semibold">{fmtDate(d.iso)}</p>
                    <p style={{ color: C.ardoise }}>Activités souhaitées : {d.activites} · guides libres ce jour : {guidesLibres(d.iso).map(g => g).join(", ") || "aucun"}</p>
                    <button className="mt-3 w-full py-2 rounded-xl text-sm font-semibold text-white" style={{ background: C.encre }}
                      onClick={() => { setDemandes(x => x.filter(y => y.id !== d.id)); setToast({ ok: true, txt: "Demande traitée — proposition envoyée au client" }); }}>
                      Proposer une course
                    </button>
                  </div>
                ))}
              </div>
            )}

            {questionsGuide.length > 0 && (
              <>
                <h2 className="disp text-lg font-semibold mb-3">Questions des guides <span className="mono text-sm" style={{ color: C.corde }}>({questionsGuide.length})</span></h2>
                <div className="flex flex-col gap-3 mb-6">
                  {questionsGuide.map(q => {
                    const s = sorties.find(x => x.id === q.sortieId);
                    return (
                      <div key={q.id} className="rounded-2xl p-4 text-sm border-l-4 bg-white border"
                        style={{ borderColor: C.glacier, borderLeftColor: C.encre }}>
                        <p className="mono text-xs font-bold mb-1" style={{ color: C.encre }}>? {q.g.toUpperCase()} · AVANT VALIDATION</p>
                        <p className="font-semibold">{q.titre}</p>
                        <p className="mono text-xs" style={{ color: C.ardoise }}>{fmtDate(q.iso)}{s?.maResa?.client ? ` · client : ${s.maResa.client.nom} (${s.maResa.client.tel})` : ""}</p>
                        <p className="mt-2 rounded-lg p-2" style={{ background: C.ecume }}>« {q.txt} »</p>
                        {s?.maResa?.niveau && (
                          <p className="mt-1.5" style={{ fontSize: "11px", color: C.ardoise }}>
                            Niveau déclaré par le client : « {s.maResa.niveau.details} »
                          </p>
                        )}
                        <textarea value={repTxt[q.id] ?? ""} onChange={e => setRepTxt(t => ({ ...t, [q.id]: e.target.value }))}
                          rows={2} placeholder={`Votre réponse à ${q.g} — envoyée sur son espace et par SMS…`}
                          className="w-full px-3 py-2 rounded-lg border text-sm mt-3" style={{ borderColor: C.glacier }} />
                        <button onClick={() => repondreQuestion(q)}
                          className="mt-2 w-full py-2 rounded-xl text-sm font-semibold text-white" style={{ background: C.encre }}>
                          Répondre (site + SMS)
                        </button>
                        <button onClick={() => { setQuestionsGuide(x => x.filter(y => y.id !== q.id)); setToast({ ok: true, txt: `Question close — réponse faite à ${q.g} par téléphone` }); }}
                          className="mt-1.5 w-full text-sm underline" style={{ color: C.ardoise }}>
                          Répondu par téléphone — clore sans message
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <h2 className="disp text-lg font-semibold mb-3">Demandes des guides <span className="mono text-sm" style={{ color: C.corde }}>({demandesGuide.length})</span></h2>
            {demandesGuide.length === 0 ? (
              <p className="text-sm rounded-xl p-4 bg-white border mb-6" style={{ borderColor: C.glacier, color: C.ardoise }}>
                Aucune demande en attente. Quand un guide demande l'annulation d'une sortie depuis son calendrier, elle arrive ici (doublée d'un SMS aux administrateurs).
              </p>
            ) : (
              <div className="flex flex-col gap-3 mb-6">
                {demandesGuide.map(d => (
                  <div key={d.id} className="rounded-2xl p-4 text-sm border-l-4 bg-white border"
                    style={{ borderColor: C.glacier, borderLeftColor: C.corde }}>
                    <p className="mono text-xs font-bold mb-1" style={{ color: C.corde }}>⚠ {d.g.toUpperCase()} DEMANDE UNE ANNULATION</p>
                    <p className="font-semibold">{d.titre}</p>
                    <p className="mono text-xs" style={{ color: C.ardoise }}>{fmtDate(d.iso)} · motif : {d.motif ?? "non précisé"} · reçue par SMS et notification</p>
                    <p className="mt-1" style={{ fontSize: "10px", color: C.ardoise }}>
                      {["Maladie / accident", "Raison familiale"].includes(d.motif)
                        ? "Sphère de risque personnelle du guide (art. 8.11 CGC) : aucune indemnité de part et d'autre — réattribuer ou annuler."
                        : "Motif à qualifier avec le guide avant décision."}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => annulerSortieBureau(d.sortieId)}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: C.corde }}>
                        Annuler la sortie
                      </button>
                      <button onClick={() => { setDemandesGuide(x => x.filter(y => y.id !== d.id)); setToast({ ok: false, txt: `Demande déclinée — ${d.g} est notifié, la sortie est maintenue` }); }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border" style={{ borderColor: C.ardoise, color: C.ardoise }}>
                        Maintenir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setNvOuvert(o => !o)}
              className="w-full mb-3 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.encre }}>
              {nvOuvert ? "Fermer" : "＋ Créer une sortie"}
            </button>
            {nvOuvert && (
              <div className="rounded-2xl bg-white border p-4 mb-6 text-sm" style={{ borderColor: C.glacier }}>
                <input value={nv.titre} onChange={e => setNv(v => ({ ...v, titre: e.target.value }))}
                  placeholder="Titre de la sortie"
                  className="w-full px-3 py-2 rounded-lg border mb-2" style={{ borderColor: C.glacier }} />
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ACTIVITES.map(([tag, label, coul]) => (
                    <button key={tag} onClick={() => setNv(v => ({ ...v, tag }))}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1"
                      style={nv.tag === tag ? { background: C.encre, color: C.ecume, borderColor: C.encre } : { borderColor: C.glacier }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: coul }} />{label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <label className="text-xs" style={{ color: C.ardoise }}>Date de départ
                    <input type="date" min="2026-08-03" value={nv.iso} onChange={e => setNv(v => ({ ...v, iso: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-lg border mt-0.5" style={{ borderColor: C.glacier }} />
                  </label>
                  <label className="text-xs" style={{ color: C.ardoise }}>Durée (jours)
                    <input type="number" min="1" max="42" value={nv.nbJours}
                      onChange={e => setNv(v => ({ ...v, nbJours: Math.max(1, Number(e.target.value) || 1) }))}
                      className="w-full px-2 py-1.5 rounded-lg border mt-0.5" style={{ borderColor: C.glacier }} />
                  </label>
                  <label className="text-xs" style={{ color: C.ardoise }}>Niveau
                    <select value={nv.niveau} onChange={e => setNv(v => ({ ...v, niveau: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-lg border mt-0.5 bg-white" style={{ borderColor: C.glacier }}>
                      {["Débutant", "Initié", "Confirmé", "Engagé"].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </label>
                  <label className="text-xs" style={{ color: C.ardoise }}>Prix (CHF / pers.)
                    <input type="number" min="0" value={nv.prix} onChange={e => setNv(v => ({ ...v, prix: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-lg border mt-0.5" style={{ borderColor: C.glacier }} />
                  </label>
                  <label className="text-xs" style={{ color: C.ardoise }}>Places
                    <input type="number" min="1" max="12" value={nv.places} onChange={e => setNv(v => ({ ...v, places: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-lg border mt-0.5" style={{ borderColor: C.glacier }} />
                  </label>
                </div>
                <p className="mono mb-2" style={{ fontSize: "10px", color: C.ardoise }}>
                  {nv.iso
                    ? (guidesLibresPeriode(nv.iso, nv.nbJours).length > 0
                      ? `Guides libres sur la période : ${guidesLibresPeriode(nv.iso, nv.nbJours).join(", ")} — attribution au premier`
                      : "⚠ Aucun guide libre sur cette période")
                    : "Choisissez une date pour voir les guides libres"}
                </p>
                <button onClick={creerSortie}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.corde }}>
                  Créer et attribuer
                </button>
              </div>
            )}

            <h2 className="disp text-lg font-semibold mb-3">Planning des guides</h2>
            <div className="rounded-2xl bg-white border p-3" style={{ borderColor: C.glacier }}>
              <div className="flex items-center justify-between mb-2 px-1">
                <button onClick={() => setMoisB(p => moisSuivant(p, -1))} disabled={memeMois(moisB, MOIS_MIN)}
                  aria-label="Mois précédent" className="w-8 h-8 rounded-lg text-lg font-bold disabled:opacity-25"
                  style={{ color: C.encre }}>‹</button>
                <p className="disp text-sm font-bold">{fmtMois(moisB.y, moisB.m)}</p>
                <button onClick={() => setMoisB(p => moisSuivant(p, 1))} disabled={memeMois(moisB, MOIS_MAX)}
                  aria-label="Mois suivant" className="w-8 h-8 rounded-lg text-lg font-bold disabled:opacity-25"
                  style={{ color: C.encre }}>›</button>
              </div>
              <p className="monomb-2 px-1" style={{ fontSize: "10px", color: C.ardoise }}>
                <span style={{ color: C.vert }}>■</span> dispo · <span style={{ color: C.corde }}>■</span> en sortie · faire défiler horizontalement →
              </p>
              <div className="overflow-x-auto">
                <table className="border-separate" style={{ borderSpacing: "2px" }}>
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-white z-10"></th>
                      {Array.from({ length: nbJoursDuMois(moisB.y, moisB.m) }, (_, i) => i + 1).map(j => (
                        <th key={j} className="mono font-normal text-center"
                          style={{ fontSize: "9px", minWidth: "16px",
                            color: [5, 6].includes(semaineDe(isoDe(moisB.y, moisB.m, j))) ? C.encre : C.ardoise }}>
                          {j}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GUIDES.map(g => (
                      <tr key={g}>
                        <td className="sticky left-0 bg-white z-10 text-xs font-semibold pr-2 whitespace-nowrap">{g}</td>
                        {Array.from({ length: nbJoursDuMois(moisB.y, moisB.m) }, (_, i) => i + 1).map(j => {
                          const iso = isoDe(moisB.y, moisB.m, j);
                          const enSortie = aSortieLe(g, iso);
                          return (
                            <td key={j}>
                              <button onClick={() => setSelBureau(sel => sel && sel.g === g && sel.iso === iso ? null : { g, iso })}
                                aria-label={`${g} — ${iso}`}
                                className="block rounded"
                                style={{
                                  width: "14px", height: "14px", padding: 0,
                                  background: enSortie ? C.corde : dispoDe(g, iso) ? C.vert : C.ecume,
                                  outline: selBureau && selBureau.g === g && selBureau.iso === iso ? `2px solid ${C.encre}` : "none",
                                  outlineOffset: "1px",
                                }} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* --- Détail de la cellule sélectionnée --- */}
              {selBureau && (() => {
                const { g, iso } = selBureau;
                const s = sorties.find(x => x.guide === g && couvre(x, iso));
                if (s) {
                  return (
                    <div className="mt-3 rounded-xl p-3 border-l-4 text-sm" style={{ background: C.ecume, borderLeftColor: C.corde }}>
                      <p className="mono text-xs font-bold" style={{ color: C.corde }}>{g} · EN SORTIE</p>
                      <p className="font-semibold mt-1">{s.titre}</p>
                      <p className="mono text-xs mt-0.5" style={{ color: C.ardoise }}>
                        {fmtDate(s.iso)}{s.nbJours > 1 ? ` → ${fmtDate(finDe(s))}` : ""} · {s.duree}
                        {s.ratio ? " · cordée privée 1:1" : ` · ${s.places - s.restantes}/${s.places} inscrits`}
                        {" · "}{s.prix} CHF/pers.
                      </p>
                      <button onClick={() => annulerSortieBureau(s.id)}
                        className="mt-3 w-full py-2 rounded-xl text-sm font-semibold text-white" style={{ background: C.corde }}>
                        Annuler cette sortie (décision bureau)
                      </button>
                      <p className="mt-1.5" style={{ fontSize: "10px", color: C.ardoise }}>
                        Annulation manuelle — pour acter une décision prise par téléphone ou de vive voix. Les clients inscrits sont notifiés et remboursés, le jour du guide est libéré.
                      </p>
                    </div>
                  );
                }
                if (dispoDe(g, iso)) {
                  return (
                    <div className="mt-3 rounded-xl p-3 border-l-4 text-sm" style={{ background: C.ecume, borderLeftColor: C.vert }}>
                      <p className="mono text-xs font-bold" style={{ color: C.vert }}>{g} · LIBRE LE {fmtDate(iso).toUpperCase()}</p>
                      <p className="mt-1" style={{ color: C.ardoise }}>Proposer une mission :</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["Course collective", "Course privée", "Renfort bateau"].map(type => (
                          <button key={type} onClick={() => proposerMission(g, iso, type)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background: C.encre }}>
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="mt-3 rounded-xl p-3 border-l-4 text-sm" style={{ background: C.ecume, borderLeftColor: C.ardoise }}>
                    <p className="mono text-xs font-bold" style={{ color: C.ardoise }}>{g} · JOUR FERMÉ</p>
                    <p className="mt-1" style={{ color: C.ardoise }}>{g} s'est déclaré indisponible le {fmtDate(iso)}. Contactez-le directement si la mission est urgente.</p>
                  </div>
                );
              })()}
            </div>

            <h2 className="disp text-lg font-semibold mt-6 mb-3">Sorties</h2>
            {sorties.map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-xl bg-white border p-3 mb-2 text-sm" style={{ borderColor: C.glacier }}>
                <div>
                  <p className="font-semibold leading-tight">{s.titre}</p>
                  <p className="mono text-xs" style={{ color: C.ardoise }}>
                    {fmtDate(s.iso)} · {s.places - s.restantes}/{s.places} inscrits · {s.guide ?? "aucun guide"}{s.maResa?.client ? ` · résa : ${s.maResa.client.nom} (${s.maResa.client.tel})` : ""}
                  </p>
                </div>
                <span className="mono text-xs font-bold" style={{ color: s.statut === "confirmée" ? C.vert : s.statut ? C.corde : C.ardoise }}>
                  {s.statut === "confirmée" ? "OK" : s.statut === "attente" ? "48h" : s.statut === "alerte" ? "⚠" : "—"}
                </span>
              </div>
            ))}
          </>
        )}
      </main>

      {/* ===== Fiche de sortie détaillée ===== */}
      {fiche && !modal && (
        <div className="fixed inset-0 overflow-y-auto" style={{ background: "rgba(20,48,62,.55)", zIndex: 40 }}
          onClick={() => setFiche(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg mx-auto mt-10 mb-0 sm:mb-10 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div className="flex flex-wrap gap-2 items-center">
                {fiche.tags.map(t => <Chip key={t} t={t} />)}
                {fiche.ratio && (
                  <span className="mono text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: C.encre, color: C.ecume }}>PRIVÉE {fiche.ratio}</span>
                )}
              </div>
              <button onClick={() => setFiche(null)} className="text-2xl leading-none px-2" style={{ color: C.ardoise }}>×</button>
            </div>
            <h3 className="disp text-xl font-bold leading-snug mt-2">{fiche.titre}</h3>
            <p className="mono text-xs mt-1" style={{ color: C.ardoise }}>
              {fmtDate(fiche.iso)}{fiche.nbJours > 1 ? ` → ${fmtDate(finDe(fiche))}` : ""}{fiche.heure !== "—" ? ` · départ ${fiche.heure}` : ""} · {fiche.duree} · niveau {fiche.niveau}
            </p>
            <p className="text-sm mt-3 leading-relaxed">{fiche.description}</p>

            {fiche.programme && (
              <div className="mt-4">
                <p className="disp text-sm font-bold mb-1">Programme</p>
                {fiche.programme.map((p, i) => (
                  <p key={i} className="text-sm py-1 border-b" style={{ borderColor: C.ecume, color: C.encre }}>{p}</p>
                ))}
                <p className="mt-1" style={{ fontSize: "10px", color: C.ardoise }}>Programme indicatif — adapté par le guide selon la météo et les conditions (art. 7 CGC).</p>
              </div>
            )}

            <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: C.ecume }}>
              <p><span className="font-bold">Prérequis · </span>{fiche.prerequis}</p>
              <p className="mt-2"><span className="font-bold">Matériel · </span>{fiche.materiel}</p>
              <p className="mt-2"><span className="font-bold">Le prix comprend · </span>{fiche.inclus}</p>
            </div>

            <div className="flex items-end justify-between mt-4">
              <div>
                <p className="disp text-2xl font-extrabold">{fiche.paliers ? fiche.paliers[0] : fiche.prix} CHF<span className="body text-xs font-normal" style={{ color: C.ardoise }}> / pers.</span></p>
                {fiche.paliers && fiche.paliers.length > 1 && (
                  <p style={{ fontSize: "11px", color: C.ardoise }}>à 2 participants : {fiche.paliers[1]} CHF / pers.</p>
                )}
                {!fiche.paliers && (
                  <p style={{ fontSize: "11px", color: fiche.restantes <= 2 ? C.corde : C.ardoise }}>
                    {fiche.restantes > 0 ? `${fiche.restantes} place${fiche.restantes > 1 ? "s" : ""} restante${fiche.restantes > 1 ? "s" : ""}` : "Complet"}
                  </p>
                )}
              </div>
              {fiche.statut ? (
                <span className="text-sm font-semibold" style={{ color: fiche.statut === "confirmée" ? C.vert : C.corde }}>
                  {fiche.statut === "confirmée" ? "Validée ✓" : "Réservée ✓"}
                </span>
              ) : (
                <button onClick={() => reserver(fiche)} disabled={fiche.restantes === 0}
                  className="px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: C.corde }}>
                  Réserver
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Modale acompte ===== */}
      {modal && (
        <div className="fixed inset-0 overflow-y-auto p-4" style={{ background: "rgba(20,48,62,.55)", zIndex: 50 }}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl mx-auto my-6">
            <h3 className="disp text-lg font-bold leading-snug">{modal.titre}</h3>
            <p className="mono text-xs mt-1" style={{ color: C.ardoise }}>{fmtDate(modal.iso)}{modal.heure !== "—" ? ` · ${modal.heure}` : ""}</p>

            {/* --- Sélecteur de participants --- */}
            {(() => {
              const nMax = modal.paliers ? modal.paliers.length : modal.restantes;
              return (
                <div className="flex items-center justify-between mt-4 rounded-xl border-2 px-3 py-2.5" style={{ borderColor: C.corde }}>
                  <span className="text-sm font-bold">Nombre de participants</span>
                  <span className="flex items-center gap-3">
                    <button onClick={() => setNbPart(n => Math.max(1, n - 1))} disabled={nbPart <= 1}
                      className="w-9 h-9 rounded-xl border text-lg font-bold disabled:opacity-30"
                      style={{ borderColor: C.glacier, color: C.encre }}>−</button>
                    <span className="disp text-lg font-bold" style={{ minWidth: "20px", textAlign: "center" }}>{nbPart}</span>
                    <button onClick={() => setNbPart(n => Math.min(nMax, n + 1))} disabled={nbPart >= nMax}
                      className="w-9 h-9 rounded-xl border text-lg font-bold disabled:opacity-30"
                      style={{ borderColor: C.glacier, color: C.encre }}>+</button>
                  </span>
                </div>
              );
            })()}
            {modal.paliers && modal.paliers.length > 1 && (
              <p className="mt-1" style={{ fontSize: "11px", color: C.ardoise }}>
                Tarif dégressif de cordée : {modal.paliers[0]} CHF seul avec le guide, {modal.paliers[1]} CHF par personne à deux.
              </p>
            )}
            {!modal.paliers && (
              <p className="mt-1" style={{ fontSize: "11px", color: C.ardoise }}>
                Prix fixe par personne · {modal.restantes} place{modal.restantes > 1 ? "s" : ""} restante{modal.restantes > 1 ? "s" : ""}
              </p>
            )}

            {/* --- Récapitulatif recalculé --- */}
            {(() => {
              const prixPers = modal.paliers ? modal.paliers[nbPart - 1] : modal.prix;
              const total = prixPers * nbPart;
              const ac = Math.round(total * 0.3);
              return (
                <div className="rounded-xl p-3 mt-3 text-sm" style={{ background: C.ecume }}>
                  <div className="flex justify-between">
                    <span>{nbPart} × {prixPers} CHF / pers.</span><span className="mono">{total} CHF</span>
                  </div>
                  <div className="flex justify-between font-bold mt-1" style={{ color: C.corde }}>
                    <span>Acompte à verser (30 %)</span><span className="mono">{ac} CHF</span>
                  </div>
                  <div className="flex justify-between mt-1" style={{ color: C.ardoise }}>
                    <span>Solde sur place</span><span className="mono">{total - ac} CHF</span>
                  </div>
                </div>
              );
            })()}
            <p className="text-xs mt-3" style={{ color: C.ardoise }}>
              Votre place est confirmée dès le paiement. Votre guide valide la sortie sous 48 h — en cas d'imprévu, le bureau vous attribue un autre guide.
            </p>

            {/* --- Coordonnées du client (transmises au bureau au paiement) --- */}
            <div className="mt-4">
              <p className="text-sm font-semibold">Vos coordonnées</p>
              <p style={{ fontSize: "10px", color: C.ardoise }}>Transmises au bureau avec votre paiement — nécessaires à la confirmation et au contrat (CGC ASGM).</p>
              <div className="flex flex-col gap-1.5 mt-2">
                <input value={coord.nom} onChange={e => setCoord(c => ({ ...c, nom: e.target.value }))}
                  placeholder="Nom et prénom *" autoComplete="name"
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: C.glacier }} />
                <div className="grid grid-cols-2 gap-1.5">
                  <input value={coord.email} onChange={e => setCoord(c => ({ ...c, email: e.target.value }))}
                    placeholder="E-mail *" type="email" autoComplete="email"
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: C.glacier }} />
                  <input value={coord.tel} onChange={e => setCoord(c => ({ ...c, tel: e.target.value }))}
                    placeholder="Mobile *" type="tel" autoComplete="tel"
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: C.glacier }} />
                </div>
                <input value={coord.adresse} onChange={e => setCoord(c => ({ ...c, adresse: e.target.value }))}
                  placeholder="Adresse (rue, NPA, localité) *" autoComplete="street-address"
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: C.glacier }} />
              </div>
            </div>

            {/* --- Auto-évaluation du niveau (courses Confirmé et Engagé) --- */}
            {["Confirmé", "Engagé"].includes(modal.niveau) && (
              <div className="rounded-xl border mt-4 p-3" style={{ borderColor: C.corde }}>
                <p className="text-sm font-bold">Votre niveau — obligatoire</p>
                <p className="mt-0.5" style={{ fontSize: "11px", color: C.ardoise }}>
                  Cette course exige le niveau {modal.niveau}. Prérequis : {modal.prerequis}
                </p>
                <div className="flex flex-col gap-1.5 mt-2">
                  {[["ok", "J'ai déjà réalisé des courses de ce niveau"],
                    ["proche", "Niveau approchant — je détaillerai mon expérience au guide"],
                    ["pas", "Je n'ai pas encore ce niveau"]].map(([v, l]) => (
                    <button key={v} onClick={() => setAutoEval(v)}
                      className="text-left px-3 py-2 rounded-lg text-sm border transition-colors"
                      style={autoEval === v
                        ? { background: C.encre, color: C.ecume, borderColor: C.encre }
                        : { background: "#fff", color: C.encre, borderColor: C.glacier }}>
                      {l}
                    </button>
                  ))}
                </div>
                {["ok", "proche"].includes(autoEval) && (
                  <div className="mt-2">
                    <textarea value={autoEvalTxt} onChange={e => setAutoEvalTxt(e.target.value)} rows={3}
                      placeholder={autoEval === "ok"
                        ? "Listez vos courses de référence * — sommet ou voie, cotation, année (ex. : Weissmies arête sud 2025, Cosmiques 2024…)"
                        : "Précisez votre expérience * — courses proches réalisées, pratique actuelle, points à discuter avec le guide"}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: C.glacier }} />
                    <p style={{ fontSize: "10px", color: C.ardoise }}>
                      Transmis avec votre réservation au bureau et au guide, qui s'appuie dessus pour valider la cordée.
                    </p>
                  </div>
                )}
                {autoEval === "pas" ? (
                  <p className="mt-2 text-sm font-semibold" style={{ color: C.corde }}>
                    La réservation directe n'est pas ouverte sans le niveau requis — c'est une question de sécurité. Utilisez la demande sur mesure : le bureau vous proposera une course de progression adaptée.
                  </p>
                ) : (
                  <p className="mt-2" style={{ fontSize: "10px", color: C.ardoise }}>
                    Votre auto-évaluation est transmise au guide, qui confirme la cordée pendant sa fenêtre de validation de 48 h (art. 5.3 CGC : le client renseigne le prestataire sur ses capacités).
                  </p>
                )}
              </div>
            )}

            {/* ===== CGV : lecture + barème d'annulation ===== */}
            <div className="rounded-xl border mt-4 overflow-hidden" style={{ borderColor: C.glacier }}>
              <button onClick={() => setCgvOuvertes(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold"
                style={{ background: C.ecume, color: C.encre }}>
                Conditions générales (CGC ASGM)
                <span className="mono text-xs" style={{ color: C.ardoise }}>{cgvOuvertes ? "▲ replier" : "▼ lire"}</span>
              </button>
              {cgvOuvertes && (
                <div className="px-3 py-3 text-xs leading-relaxed" style={{ color: C.encre }}>
                  <p className="font-bold mb-1">Annulation par le client (art. 8.2 CGC)</p>
                  <p className="mb-2" style={{ color: C.ardoise }}>Honoraires dus selon le délai avant le début de l'activité :</p>
                  <div className="mono">
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: C.ecume }}>
                      <span>60 à 31 jours</span><span className="font-bold">20 % des honoraires</span>
                    </div>
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: C.ecume }}>
                      <span>30 à 15 jours</span><span className="font-bold">50 % des honoraires</span>
                    </div>
                    <div className="flex justify-between py-1" style={{ color: C.corde }}>
                      <span>14 jours ou moins</span><span className="font-bold">100 % des honoraires</span>
                    </div>
                  </div>
                  <p className="mt-1.5" style={{ fontSize: "10px", color: C.ardoise }}>Dans tous les cas, les frais d'annulation effectivement occasionnés (bateau, transport, hébergement, etc.) restent intégralement à la charge du client.</p>
                  <p className="font-bold mt-3 mb-1">Changement de programme et annulation par le bureau (art. 7 et 8.1 CGC)</p>
                  <p style={{ color: C.ardoise }}>Si la sortie prévue est impossible (météo, conditions, mer formée), le bureau propose une course de remplacement ou un lieu alternatif pour la même période. Si le client refuse le remplacement proposé, 100 % des honoraires restent dus, ainsi que les frais d'annulation occasionnés. Si le bureau annule pour une raison relevant de sa propre sphère de risque (maladie du guide, etc.) sans pouvoir proposer de remplacement, aucune indemnité n'est due de part et d'autre.</p>
                  <p className="font-bold mt-3 mb-1">Assurances (art. 6 CGC)</p>
                  <p style={{ color: C.ardoise }}>Le client est responsable de disposer d'une assurance maladie et accident suffisante, couvrant les frais de recherche, de sauvetage et de rapatriement (affiliation REGA ou équivalent recommandée). Une assurance frais d'annulation et une RC privée couvrant les sports de montagne sont recommandées.</p>
                  <p className="mt-3" style={{ color: C.ardoise }}>Le droit suisse est applicable (art. 13). Version 2024 des CGC, approuvée le 22.01.2024 — <span className="underline">consulter le texte intégral (PDF)</span>.</p>
                  <p className="mt-2 mono" style={{ fontSize: "10px", color: C.ardoise }}>[Maquette — résumé non contractuel ; seules les CGC ASGM font foi]</p>
                </div>
              )}
            </div>

            <label className="flex items-start gap-2.5 mt-3 text-xs cursor-pointer select-none">
              <input type="checkbox" checked={cgvOk} onChange={e => setCgvOk(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0" style={{ accentColor: C.corde }} />
              <span style={{ color: C.encre }}>
                J'ai lu et j'accepte les Conditions générales du contrat (CGC ASGM, version 2024), notamment le <b>barème d'annulation de l'art. 8.2</b> et mon obligation d'assurance maladie/accident couvrant recherche, sauvetage et rapatriement (art. 6).
              </span>
            </label>

            <button onClick={payerArrhes}
              disabled={!coordOk || !cgvOk || (evalRequise(modal.niveau) && (autoEval === null || autoEval === "pas" || !evalOk(modal.niveau)))}
              className="w-full py-3 rounded-xl font-semibold text-white mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: C.corde }}>
              Verser {Math.round((modal.paliers ? modal.paliers[nbPart - 1] : modal.prix) * nbPart * 0.3)} CHF et réserver
            </button>
            {(!coordOk || !cgvOk || (evalRequise(modal.niveau) && !evalOk(modal.niveau))) && (
              <p className="text-center mt-1.5" style={{ fontSize: "11px", color: C.ardoise }}>
                {evalRequise(modal.niveau) && ["ok", "proche"].includes(autoEval) && !evalOk(modal.niveau)
                  ? "Détaillez vos courses ou votre expérience dans l'encart de niveau (transmis au guide)"
                  : !coordOk
                  ? "Renseignez vos coordonnées complètes (nom, e-mail, mobile, adresse)"
                  : ["Confirmé", "Engagé"].includes(modal.niveau) && autoEval === null
                    ? "Renseignez votre niveau puis acceptez les conditions générales"
                    : "Acceptez les conditions générales pour finaliser la réservation"}
              </p>
            )}
            <button onClick={() => setModal(null)} className="w-full py-2.5 text-sm mt-1" style={{ color: C.ardoise }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ===== Toast ===== */}
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg"
          style={{ background: toast.ok ? C.vert : C.encre }}>
          {toast.txt}
        </div>
      )}
    </div>
  );
}

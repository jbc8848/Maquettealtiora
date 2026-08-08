# Maquette — Altiora

Maquette interactive du système de réservation du bureau des guides **Altiora**
(expéditions guidées de la mer à la montagne).

**Version en ligne : https://VOTRE-COMPTE.github.io/maquette-altiora/**

Le numéro de version est affiché en haut de la page (badge orange) et suit celui
de la note de conception jointe dans `docs/`.

## Ce que contient la maquette

Trois espaces, accessibles par les onglets en haut de page :

- **Client** — catalogue filtrable par activité, calendrier multi-années, fiches
  détaillées, réservation avec acompte, coordonnées et déclaration de niveau,
  suivi et annulation au barème CGC, demandes sur mesure.
- **Guide** — calendrier de disponibilités, sorties attribuées, validation des
  réservations sous 48 h, questions au bureau, demandes d'annulation motivées.
  Un sélecteur permet de naviguer entre les guides (démonstration uniquement).
- **Bureau** — fil des réservations en temps réel avec archivage, planning croisé
  guides × jours, alertes, questions et demandes des guides, demandes sur mesure,
  création et annulation de sorties.

Les données sont fictives et réinitialisées à chaque rechargement de la page.

## Structure du dépôt

```
index.html              La maquette, autonome (aucune dépendance externe)
manifest.json           Icônes et nom de l'application
apple-touch-icon.png    Icône iOS (ajout à l'écran d'accueil)
icone-192.png           Icône Android / PWA
icone-512.png           Icône haute résolution
favicon-32.png          Favicon
docs/                   Note de conception fonctionnelle (Word)
source/                 Code source React et outils de compilation
```

## Publier ou mettre à jour

Le dépôt est publié via **GitHub Pages** (Settings → Pages → Branch: `main`,
dossier `/root`). Toute modification de `index.html` poussée sur `main` est en
ligne en une minute environ.

## Recompiler depuis les sources

Nécessite Node.js.

```bash
cd source
npm install esbuild tailwindcss@3.4 react react-dom
npx tailwindcss -c tailwind.config.js -i input.css -o tw.css --minify
npx esbuild mount.jsx --bundle --jsx=automatic --loader:.jsx=jsx \
  --minify --target=es2017 --outfile=app.min.js
```

Puis réinsérer `tw.css` et `app.min.js` dans les balises `<style>` et `<script>`
de `index.html`. La cible `es2017` assure la compatibilité avec les versions
anciennes de Safari.

---

Maquette de conception — ne constitue pas le site final.

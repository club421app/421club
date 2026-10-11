# Site 421 Club

Site vitrine statique (HTML, CSS, JS, sans build), basé sur la structure du template Onda.

## Voir le site en local

Les effets "points" lisent les images dans un canvas : il faut passer par un petit serveur
(en ouvrant `index.html` en double-clic, les images s'affichent normalement, sans l'effet).

```
cd "421 Club - Site web"
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000

## À remplacer avant la mise en ligne

Cherche `TODO` dans `index.html` :

- le lien App Store (bouton "Télécharger dans l'App Store") ;
- l'adresse e-mail `contact@421club.app` (provisoire, 2 endroits) ;
- les liens "Confidentialité" et "Mentions légales" du pied de page ;
- `og:image` : mettre une URL absolue une fois le domaine connu.

## Mise en ligne

Glisser le dossier complet sur Netlify Drop, Vercel, Cloudflare Pages ou GitHub Pages.

## Structure

- `index.html` : tout le contenu (sections Modes, Raymond, L'app, Rangs, Télécharger)
- `assets/css/style.css` : couleurs et typo en haut du fichier (`--accent`, polices)
- `assets/js/main.js` : animations et moteur de rendu en points
- `assets/img/` : visuels optimisés en WebP (les originaux restent dans "421 Club - Visuels")

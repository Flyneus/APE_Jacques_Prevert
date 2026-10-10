# Site de l'APE École Jacques Prévert (Quimper)

Site vitrine statique (HTML/CSS/JS vanilla, sans framework) de l'Association des Parents d'Élèves de l'école
Jacques Prévert. En ligne sur **https://ape-jacquesprevert.fr** (hébergé par GitHub Pages).

## Structure

```
index.html            Page unique : Accueil, Qui sommes-nous, Événements, Nos actions, Documents, Bureau, Contact
benevoles.html        Espace bénévoles (planning, comptes-rendus, contacts, liste des bénévoles)
mentions-legales.html Mentions légales et politique de confidentialité
photos.html           Albums photos des événements (générée par tools/build_photos.py, ne pas modifier à la main)
style.css             Styles du site (charte graphique ci-dessous, mobile-first)
benevoles.css         Styles propres à l'espace bénévoles
script.js             Menu mobile + envoi du formulaire de contact
benevoles.js          Filtre par code d'accès de l'espace bénévoles
images/               Logo et photos de la page d'accueil (visages d'enfants floutés)
photos/               Photos des albums (optimisées, sans métadonnées) et albums.json
tools/                Script Python pour ajouter un album
fonts/                Polices Quicksand et Nunito (woff2)
documents/            PDF publics (statuts, règlement intérieur)
CNAME                 Domaine personnalisé (ne pas supprimer)
sitemap.xml, robots.txt   Référencement
```

## Charte graphique

Variables `--color-*` en tête de `style.css` :

| Couleur | Code | Usage |
|---|---|---|
| Gris | `#C1C7C6` (fond de page éclairci : `#EBEEED`) | fond de page |
| Vert | `#14B88B` | bandeaux et encarts (texte taupe dessus) |
| Taupe foncé | `#2A201A` | titres et textes |
| Orange | `#DE6C1F` | actions : boutons, pastilles de date, icônes |
| Rouge | `#CC2D42` | accents : survols, liens, mise en avant |

Le texte sur fond vert est toujours en taupe (le blanc n'y est pas assez contrasté).

## Prévisualiser en local

```
python -m http.server 8000
```

Puis ouvrir http://localhost:8000. Toute modification poussée sur la branche `main` est publiée
automatiquement par GitHub Pages en 1 à 2 minutes.

## Mettre à jour le contenu

- **Événements** : section « Événements de l'année » de `index.html`. Pour chaque vente de gâteaux, la date
  apparaît à **quatre endroits à garder cohérents** : la pastille de date, le lien « Ajouter à mon agenda »
  (`DTSTART`/`DTEND` du fichier .ics intégré), le lien mailto « Disponible pour être bénévole » et le tableau
  du planning dans `benevoles.html`.
- **Prochain événement** : encart du bandeau d'accueil (haut de `index.html`).
- **Textes en breton** : sous-titres italiques `lang="br"` ; à faire relire par un locuteur.
- **Espace bénévoles** : 4 onglets (`#planning`, `#procedures`, `#documents`, `#kermesse`), chacun un `<div class="tab-panel">` de
  `benevoles.html`. Une procédure = une fiche `<details class="procedure">` dans l'onglet Procédures. Un lien vers
  `#id-d-un-élément` ouvre automatiquement le bon onglet.
- **Bureau et photos** : sections « Le bureau de l'APE » (`index.html`) et « Contacts du bureau » (`benevoles.html`).
- **Documents** : déposer le PDF dans `documents/` et ajouter le lien dans la section « Documents utiles ».
- **Bon de commande des sapins** : à ajouter quand il est prêt (voir le commentaire dans la carte « Vente de sapins »).

## Espace bénévoles

`benevoles.html` est masqué par un code d'accès vérifié dans le navigateur (`benevoles.js`, constante
`CODE_HASH`, qui contient l'empreinte SHA-256 du code, jamais le code en clair).

⚠️ **Ce n'est pas une vraie sécurité.** Tout le contenu de la page est téléchargé par le navigateur et le
dépôt est public : n'y mettez que des informations peu sensibles (prénoms, planning). Les documents
confidentiels (comptes-rendus avec noms complets, finances, signatures) ne doivent pas être déposés dans
`documents/`.

Changer le code : dans la console du navigateur (F12), calculer l'empreinte du nouveau code puis la coller
dans `CODE_HASH` :

```js
await crypto.subtle.digest('SHA-256', new TextEncoder().encode('NOUVEAU_CODE'))
  .then(buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''))
```

Puis communiquer le nouveau code aux bénévoles. L'accès est mémorisé dans le navigateur (`localStorage`).

## Nom de domaine et HTTPS

- Domaine `ape-jacquesprevert.fr` enregistré chez Infomaniak ; le site reste hébergé sur GitHub Pages.
- Zone DNS Infomaniak : quatre enregistrements **A** pour le domaine nu (`185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`) et un **CNAME** `www` vers `flyneus.github.io`.
- GitHub : Settings → Pages → Custom domain = `ape-jacquesprevert.fr`, **Enforce HTTPS** coché. Le certificat
  est gratuit et renouvelé automatiquement.
- ⚠️ Ne pas supprimer les enregistrements DNS ni le fichier `CNAME` : le certificat ne se renouvellerait plus
  et le site afficherait une alerte de sécurité.

## Formulaire de contact

Le formulaire envoie les messages via [Formspree](https://formspree.io) (`action="https://formspree.io/f/…"`
dans `index.html`) vers l'adresse e-mail liée au compte Formspree. Si le compte change, mettre à jour cette URL.

## Confidentialité

Pas de cookie ni de mesure d'audience. Les polices (Quicksand et Nunito, licence SIL OFL) sont hébergées dans
`fonts/` et déclarées en tête de `style.css` : aucun appel à Google.
Toute nouvelle donnée collectée ou nouveau service tiers doit être ajouté à la page de mentions légales.

## Photos des événements

Page `photos.html`, générée à partir de `photos/albums.json`. Pour ajouter un album : préparer un fichier `meta.json` (id, année scolaire, titre, date, dossier source, photo de couverture, description de chaque photo), puis lancer `python tools/build_photos.py add meta.json`. Les images sont redimensionnées et leurs métadonnées (dont la position GPS) supprimées. `python tools/build_photos.py build` régénère seulement la page.

⚠️ Le site est public : ne publier que des photos sans visage d'enfant identifiable (flouter sinon) et retirer rapidement toute photo sur demande.

## Onglet Tombola

La liste des commerçants est lue à l'ouverture de l'onglet depuis l'onglet « Liste » d'un Google Sheets (identifiants `SHEET_ID` et `SHEET_NAME` en tête de `tombola.js`). Les nouveaux commerçants arrivent par un Google Forms relié à la feuille, dont l'adresse se renseigne dans `FORM_URL`. Le classeur doit être partagé en **lecture** pour toute personne disposant du lien : ne jamais le laisser en édition publique. Aucune donnée personnelle dans la feuille.

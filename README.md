# Site de l'APE École [Nom de l'école]

Site vitrine statique (HTML/CSS/JS vanilla, sans framework ni dépendance) pour l'Association des Parents d'Élèves.

## Structure

```
index.html    → page unique avec sections ancrées (Accueil, Qui sommes-nous, Événements, Nos actions, Documents, Contact)
style.css     → styles (palette douce, mobile-first)
script.js     → menu mobile (ouverture/fermeture)
CNAME         → domaine personnalisé (vide par défaut, à remplir si besoin)
documents/    → dossier à créer, pour y déposer les PDF (statuts, règlement intérieur, comptes-rendus d'AG...)
```

## Avant publication : à personnaliser

Cherchez les commentaires `<!-- ⚠️ ... -->` dans `index.html` — ils indiquent tous les placeholders à remplacer :

- Nom de l'école (logo, titres, footer)
- Texte de présentation de l'APE et prochain événement (section Accueil)
- Mission, modalités d'adhésion et montant de la cotisation (section Qui sommes-nous)
- Calendrier réel des événements (section Événements)
- Actions réellement financées (section Nos actions)
- Fichiers PDF réels dans un dossier `documents/` (section Documents utiles)
- URL Formspree et adresse email de contact (section Contact)

## 1. Activer GitHub Pages

1. Poussez ce dossier dans un dépôt GitHub (voir commandes fournies par ailleurs).
2. Sur GitHub, allez dans **Settings** du dépôt → **Pages** (menu de gauche).
3. Sous **Build and deployment** → **Source**, choisissez **Deploy from a branch**.
4. Sous **Branch**, sélectionnez `main` et le dossier `/ (root)`, puis **Save**.
5. Au bout de 1 à 2 minutes, l'URL du site apparaît en haut de la page Pages
   (format `https://<votre-compte>.github.io/<nom-du-repo>/`).

## 2. Configurer un domaine personnalisé (optionnel)

1. Ouvrez le fichier `CNAME` à la racine du dépôt et écrivez-y votre domaine, par exemple :
   ```
   ape-ecole-xxx.fr
   ```
2. Chez votre registrar (OVH, Gandi, etc.), créez un enregistrement DNS :
   - Pour un sous-domaine (`www.ape-ecole-xxx.fr`) : un enregistrement **CNAME** pointant vers `<votre-compte>.github.io`.
   - Pour un domaine racine (`ape-ecole-xxx.fr`) : des enregistrements **A** pointant vers les IP GitHub Pages :
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
3. Dans **Settings → Pages** du dépôt GitHub, renseignez le même domaine dans le champ **Custom domain**, puis cochez
   **Enforce HTTPS** une fois le certificat généré (peut prendre jusqu'à 24h).

## Formulaire de contact

Le formulaire utilise [Formspree](https://formspree.io) (gratuit jusqu'à 50 soumissions/mois) pour recevoir les messages
sans backend. Créez un compte, créez un formulaire, puis remplacez `VOTRE_ID_FORMSPREE` dans `index.html`
(attribut `action` du `<form>`) par l'URL fournie par Formspree.

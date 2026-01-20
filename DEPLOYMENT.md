# Guide de déploiement - Partage du prototype

Ce guide vous explique comment déployer votre prototype et le partager via un lien public.

## Option 1 : Vercel (Recommandé - Le plus simple)

Vercel est la solution la plus simple pour déployer une application Vite/React.

### Étapes :

1. **Installer Vercel CLI** (optionnel, vous pouvez aussi utiliser l'interface web)
   ```bash
   npm i -g vercel
   ```

2. **Déployer depuis le terminal**
   ```bash
   vercel
   ```
   
   Ou utilisez l'interface web :
   - Allez sur [vercel.com](https://vercel.com)
   - Connectez votre compte GitHub/GitLab/Bitbucket
   - Importez ce projet
   - Vercel détectera automatiquement Vite et configurera le déploiement

3. **Configuration automatique**
   - Vercel détectera automatiquement que c'est un projet Vite
   - Le fichier `vercel.json` est déjà configuré
   - Votre site sera disponible à une URL comme : `https://votre-projet.vercel.app`

4. **Déploiements automatiques**
   - Chaque push sur `main` déclenchera un nouveau déploiement
   - Vous obtiendrez un lien de preview pour chaque Pull Request

### Avantages :
- ✅ Gratuit pour les projets open source
- ✅ Déploiement en quelques secondes
- ✅ HTTPS automatique
- ✅ CDN global
- ✅ Déploiements automatiques depuis Git

---

## Option 2 : Netlify

Netlify est une alternative populaire à Vercel.

### Étapes :

1. **Installer Netlify CLI** (optionnel)
   ```bash
   npm i -g netlify-cli
   ```

2. **Déployer depuis le terminal**
   ```bash
   netlify deploy --prod
   ```
   
   Ou utilisez l'interface web :
   - Allez sur [netlify.com](https://netlify.com)
   - Connectez votre compte Git
   - Importez ce projet
   - Netlify utilisera automatiquement `netlify.toml`

3. **Configuration**
   - Le fichier `netlify.toml` est déjà configuré
   - Build command : `npm run build`
   - Publish directory : `dist`

### Avantages :
- ✅ Gratuit pour les projets open source
- ✅ Déploiement rapide
- ✅ HTTPS automatique
- ✅ Formulaires et fonctions serverless disponibles

---

## Option 3 : GitHub Pages

Pour héberger gratuitement sur GitHub Pages.

### Étapes :

1. **Installer gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Ajouter un script dans package.json**
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. **Configurer vite.config.ts**
   ```typescript
   export default defineConfig({
     base: '/nom-de-votre-repo/', // Remplacez par le nom de votre repo GitHub
     // ... reste de la config
   })
   ```

4. **Déployer**
   ```bash
   npm run deploy
   ```

5. **Activer GitHub Pages**
   - Allez dans Settings > Pages de votre repo GitHub
   - Sélectionnez la branche `gh-pages`
   - Votre site sera disponible à : `https://votre-username.github.io/nom-de-votre-repo/`

---

## Option 4 : Déploiement manuel (Serveur web)

Si vous avez votre propre serveur :

1. **Build le projet**
   ```bash
   npm run build
   ```

2. **Uploader le dossier `dist`**
   - Uploader tout le contenu du dossier `dist` sur votre serveur web
   - Assurez-vous que votre serveur est configuré pour servir `index.html` pour toutes les routes (SPA routing)

3. **Configuration serveur (exemple pour Apache)**
   Créez un fichier `.htaccess` dans le dossier `dist` :
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

---

## Recommandation

**Pour un prototype rapide à partager :**
- Utilisez **Vercel** (Option 1) - C'est le plus simple et le plus rapide
- Vous obtiendrez un lien public en moins de 2 minutes
- Le lien sera du type : `https://votre-projet.vercel.app`

**Pour un déploiement permanent :**
- Utilisez **Netlify** ou **Vercel** avec un domaine personnalisé
- Configurez les déploiements automatiques depuis Git

---

## Partage du lien

Une fois déployé, vous pouvez :
- ✅ Partager le lien directement avec vos collaborateurs
- ✅ Le lien est accessible depuis n'importe où
- ✅ Les modifications sont automatiquement déployées (si configuré)
- ✅ HTTPS est inclus automatiquement

---

## Dépannage

### Erreur "404 Not Found" sur les routes
- Assurez-vous que votre plateforme de déploiement est configurée pour rediriger toutes les routes vers `index.html` (SPA routing)
- Les fichiers `vercel.json` et `netlify.toml` incluent déjà cette configuration

### Build échoue
- Vérifiez que toutes les dépendances sont installées : `npm install`
- Vérifiez les erreurs TypeScript : `npm run build`
- Assurez-vous d'utiliser Node.js 18+ 

### Assets ne se chargent pas
- Vérifiez que le `base` dans `vite.config.ts` correspond à votre chemin de déploiement
- Pour Vercel/Netlify, laissez `base` vide ou à `/`

---

## Support

Pour plus d'aide :
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Netlify](https://docs.netlify.com)
- [Documentation Vite](https://vitejs.dev/guide/static-deploy.html)

# Gestion du Cache - Guide

Ce document explique comment gérer le cache pour éviter les problèmes lors du développement.

## Problèmes de Cache Courants

1. **Cache du navigateur** : Le navigateur peut mettre en cache les fichiers JS/CSS
2. **Cache Vite** : Vite met en cache les dépendances optimisées dans `node_modules/.vite`
3. **Cache Service Worker** : Si un service worker est actif, il peut intercepter les requêtes

## Solutions Implémentées

### 1. Configuration Vite (`vite.config.ts`)

- **Headers de cache désactivés en développement** : Les headers HTTP empêchent le cache
- **HMR optimisé** : Hot Module Replacement avec overlay pour voir les erreurs
- **Fast Refresh activé** : React Fast Refresh explicitement activé pour un HMR instantané
- **Watch optimisé** : Configuration améliorée pour détecter tous les changements de fichiers
- **Dépendances pré-bundlées** : Plus de dépendances incluses pour un HMR plus rapide
- **Hash dans les noms de fichiers** : En production, les fichiers ont un hash pour le cache-busting

### 2. Meta Tags HTML (`index.html`)

- Ajout de meta tags pour empêcher le cache côté navigateur
- `Cache-Control: no-cache, no-store, must-revalidate`
- `Pragma: no-cache`
- `Expires: 0`

### 3. Scripts NPM

Nouveaux scripts disponibles :

```bash
# Développement normal
npm run dev

# Développement avec nettoyage du cache Vite
npm run dev:clean

# Développement avec nettoyage complet et force
npm run dev:force

# Build avec nettoyage
npm run build:clean

# Nettoyer uniquement les caches
npm run clean
```

## Comment Résoudre les Problèmes de Cache

### Si vous ne voyez pas vos changements :

1. **Nettoyer le cache Vite** :
   ```bash
   npm run dev:clean
   ```

2. **Nettoyer complètement et forcer** :
   ```bash
   npm run dev:force
   ```

3. **Dans le navigateur** :
   - **Chrome/Edge** : `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows/Linux)
   - **Firefox** : `Cmd+Shift+R` (Mac) ou `Ctrl+F5` (Windows/Linux)
   - **Safari** : `Cmd+Option+R`

4. **Désactiver le cache dans DevTools** :
   - Ouvrir DevTools (F12)
   - Aller dans l'onglet "Network"
   - Cocher "Disable cache"
   - Garder DevTools ouvert pendant le développement

5. **Navigation privée** :
   - Ouvrir le site en navigation privée pour tester sans cache

6. **Vider le cache du navigateur** :
   - Chrome : Paramètres > Confidentialité > Effacer les données de navigation
   - Firefox : Paramètres > Vie privée > Effacer les données
   - Safari : Développeur > Vider les caches

### Si le problème persiste :

1. **Arrêter le serveur** : `Ctrl+C` dans le terminal
2. **Nettoyer complètement** :
   ```bash
   npm run clean
   ```
3. **Redémarrer** :
   ```bash
   npm run dev
   ```

## Structure des Caches

```
node_modules/.vite/     # Cache Vite (dépendances optimisées)
dist/                   # Build de production
```

Ces dossiers sont dans `.gitignore` et peuvent être supprimés sans problème.

## Bonnes Pratiques

1. **En développement** : Utilisez `npm run dev:clean` si vous avez des problèmes
2. **Avant un commit** : Vérifiez que tout fonctionne avec un cache propre
3. **En production** : Les fichiers avec hash garantissent le cache-busting automatique
4. **DevTools** : Gardez "Disable cache" activé pendant le développement

## Notes Techniques

- Vite utilise le HMR (Hot Module Replacement) pour mettre à jour le code sans recharger
- Les headers HTTP `Cache-Control` empêchent le cache en développement
- En production, les fichiers avec hash permettent un cache efficace tout en garantissant les mises à jour


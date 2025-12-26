# Diagnostic : Modifications non visibles dans le navigateur

## Problème
Aucune modification n'est visible dans le navigateur malgré les changements dans le code.

## Causes possibles identifiées

### 1. Cache du navigateur très agressif
- Chrome peut cacher très agressivement les fichiers JS/CSS
- Les extensions de navigateur peuvent interférer

### 2. Service Worker
- Un service worker pourrait cacher les fichiers
- Vérifier dans DevTools > Application > Service Workers

### 3. Problème de HMR (Hot Module Replacement)
- La connexion WebSocket HMR pourrait être bloquée
- Le serveur Vite pourrait ne pas détecter les changements

### 4. Configuration Vite
- Le watch pourrait ne pas fonctionner correctement
- Les dépendances optimisées pourraient être en cache

### 5. Extensions de navigateur
- AdBlock, Privacy Badger, etc. peuvent bloquer les scripts
- Extensions de développement peuvent interférer

## Solutions à tester (dans l'ordre)

### Solution 1 : Vider complètement le cache et redémarrer
```bash
# Arrêter le serveur
pkill -f vite

# Nettoyer TOUS les caches
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist

# Redémarrer avec force
npm run dev:force
```

### Solution 2 : Désactiver le cache dans Chrome
1. Ouvrir DevTools (F12)
2. Aller dans Network
3. Cocher "Disable cache"
4. Garder DevTools ouvert pendant le développement
5. Faire Cmd+Shift+R pour hard refresh

### Solution 3 : Vérifier et désactiver les Service Workers
1. Ouvrir DevTools (F12)
2. Aller dans Application > Service Workers
3. Si un service worker est actif, cliquer sur "Unregister"
4. Vider le cache dans Application > Storage > Clear site data

### Solution 4 : Tester en navigation privée
- Ouvrir une fenêtre de navigation privée (Cmd+Shift+N)
- Aller sur http://localhost:5173
- Tester si les modifications sont visibles

### Solution 5 : Désactiver les extensions
1. Ouvrir Chrome en mode sans extensions
2. Ou désactiver toutes les extensions temporairement
3. Tester si les modifications sont visibles

### Solution 6 : Vérifier la connexion HMR
1. Ouvrir DevTools > Console
2. Chercher les messages de connexion WebSocket
3. Vérifier s'il y a des erreurs de connexion HMR

### Solution 7 : Forcer le polling dans Vite
Modifier `vite.config.ts` pour utiliser le polling :
```typescript
watch: {
  usePolling: true,
  interval: 1000,
}
```

### Solution 8 : Vérifier les permissions de fichiers
- S'assurer que les fichiers peuvent être lus/écrits
- Vérifier les permissions du dossier du projet

## Commandes de diagnostic

```bash
# Vérifier si le serveur tourne
lsof -i :5173

# Vérifier les processus Vite
ps aux | grep vite

# Vérifier les modifications récentes des fichiers
find src -name "*.tsx" -mmin -5

# Tester la compilation TypeScript
npm run build
```

## Vérifications dans le navigateur

1. **Console du navigateur** : Vérifier les erreurs JavaScript
2. **Network tab** : Vérifier si les fichiers sont bien chargés (statut 200)
3. **Sources tab** : Vérifier si le code source correspond aux modifications
4. **Application tab** : Vérifier le cache et les service workers

## Solution ultime : Rebuild complet

Si rien ne fonctionne :
```bash
# Arrêter tout
pkill -f vite
pkill -f node

# Nettoyer complètement
rm -rf node_modules
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist

# Réinstaller
npm install

# Redémarrer
npm run dev:force
```




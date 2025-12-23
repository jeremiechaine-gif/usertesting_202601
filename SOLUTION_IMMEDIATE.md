# Solution immédiate : Modifications non visibles

## Étapes à suivre MAINTENANT

### 1. Arrêter complètement le serveur
```bash
pkill -f vite
pkill -f node
```

### 2. Vider TOUS les caches
```bash
cd /Users/pelico/pelico-supply-prototype
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist
```

### 3. Dans Chrome DevTools
1. Ouvrir DevTools (F12)
2. Aller dans **Application** > **Storage**
3. Cliquer sur **"Clear site data"**
4. Aller dans **Application** > **Service Workers**
5. Si un service worker existe, cliquer sur **"Unregister"**
6. Aller dans **Network**
7. Cocher **"Disable cache"**
8. **Garder DevTools ouvert** pendant le développement

### 4. Redémarrer le serveur avec force
```bash
npm run dev:force
```

### 5. Ouvrir en navigation privée
- Cmd+Shift+N (Mac) ou Ctrl+Shift+N (Windows)
- Aller sur http://localhost:5173
- Tester les modifications

### 6. Si ça ne fonctionne toujours pas
```bash
# Rebuild complet
rm -rf node_modules
npm install
npm run dev:force
```

## Modifications apportées au code

1. **vite.config.ts** : 
   - `usePolling: true` activé pour détecter les changements de fichiers
   - `interval: 1000` augmenté pour plus de fiabilité
   - `force: true` dans `optimizeDeps` pour forcer la re-optimisation

## Vérifications

Après avoir redémarré, vérifier dans la console du navigateur :
- Messages de connexion WebSocket HMR
- Absence d'erreurs de chargement
- Les fichiers modifiés apparaissent dans Network avec un timestamp récent

## Si le problème persiste

1. Vérifier les extensions Chrome (désactiver temporairement)
2. Tester dans un autre navigateur (Firefox, Safari)
3. Vérifier les permissions du dossier du projet
4. Vérifier si un antivirus bloque les fichiers


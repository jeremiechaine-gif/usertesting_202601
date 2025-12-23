# Rebuild Complet - Instructions

## ⚠️ Problème de permissions détecté

Le rebuild complet nécessite des permissions système. Voici les étapes à suivre **manuellement** dans votre terminal :

## Étapes à exécuter dans votre terminal

### 1. Arrêter tous les processus
```bash
cd /Users/pelico/pelico-supply-prototype
pkill -f vite
pkill -f node
```

### 2. Supprimer tous les caches et dépendances
```bash
# Supprimer les caches Vite
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist

# Supprimer node_modules (si nécessaire)
rm -rf node_modules

# Nettoyer le cache npm
npm cache clean --force
```

### 3. Réinstaller les dépendances
```bash
npm install
```

### 4. Redémarrer le serveur avec force
```bash
npm run dev:force
```

## Alternative : Rebuild partiel (déjà fait)

Si vous ne pouvez pas supprimer `node_modules`, les caches ont été nettoyés et le serveur redémarré avec `npm run dev:force`.

## Vérifications après le rebuild

1. **Dans Chrome DevTools** :
   - Application > Storage > "Clear site data"
   - Application > Service Workers > "Unregister" si présent
   - Network > Cocher "Disable cache"
   - Garder DevTools ouvert

2. **Hard refresh** : Cmd+Shift+R

3. **Vérifier la console** :
   - Messages WebSocket HMR
   - Pas d'erreurs de chargement
   - Fichiers avec timestamp récent dans Network

## Si le problème persiste

1. Tester en navigation privée (Cmd+Shift+N)
2. Désactiver toutes les extensions Chrome
3. Tester dans un autre navigateur (Firefox, Safari)
4. Vérifier les permissions du dossier du projet


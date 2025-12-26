# Test Rapide du HMR - 2 Minutes

## 🚀 Démarrage Rapide

```bash
# 1. Nettoyer le cache
npm run clean

# 2. Démarrer avec cache propre
npm run dev:clean
```

## ✅ Test Immédiat

1. **Ouvrir** http://localhost:5173 dans Chrome
2. **Ouvrir DevTools** (F12)
3. **Network** > Cocher **"Disable cache"**
4. **Modifier** `src/components/HomePage.tsx` :
   - Ajouter un commentaire `// Test HMR` ou modifier un texte visible
5. **Observer** : Le changement doit apparaître **instantanément** sans rechargement

## 🎯 Résultat Attendu

✅ **Succès** : Le changement apparaît immédiatement  
❌ **Échec** : Le changement n'apparaît pas ou nécessite un rechargement manuel

## 🔧 Si Échec

```bash
# Forcer la re-optimisation
npm run dev:force
```

Puis répéter le test.




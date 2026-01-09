# Prompt d'Optimisation - Projet Pelico Supply Prototype

## Contexte du Projet

Ce projet est une application React 19.2.0 + TypeScript 5.9.3 utilisant Vite 7.2.4 comme bundler. L'application gère des scopes, routines, filtres complexes, et utilise TanStack React Table pour la gestion de tableaux de données.

**Stack technique principale :**
- React 19.2.0 + React DOM 19.2.0
- TypeScript 5.9.3
- Vite 7.2.4
- TanStack React Table 8.21.3
- Radix UI (composants UI)
- Tailwind CSS 3.4.1
- localStorage pour la persistance

## Problème Principal Identifié

**Symptôme :** Quand Cursor (ou l'IDE) fait une modification, les changements ne sont pas visibles immédiatement dans le navigateur. Il y a un problème de cache/HMR qui n'existait pas avant.

**Impact :**
- Développement ralenti
- Nécessité de recharger manuellement la page
- Perte de confiance dans le système de développement
- Risque de confusion entre ancien et nouveau code

## Objectifs de l'Optimisation

1. **HMR (Hot Module Replacement) fiable** : Les modifications doivent être visibles instantanément dans le navigateur
2. **Cache optimisé** : Pas de cache excessif en développement, mais efficace en production
3. **Zéro régression** : Toutes les fonctionnalités existantes doivent continuer à fonctionner
4. **Performance de développement** : Temps de compilation et rechargement optimaux

## Analyse de la Configuration Actuelle

### Configuration Vite (`vite.config.ts`)
- HMR activé avec overlay
- Headers de cache désactivés en développement
- Watch configuré mais peut être optimisé
- `optimizeDeps.force: false` peut causer des problèmes

### Structure du Projet
- Composants React avec lazy loading pour certains modaux
- Utilisation de Context API (ScopeContext)
- localStorage pour la persistance
- Code splitting manuel configuré

## Tâches d'Optimisation

### Phase 1 : Diagnostic et Correction du HMR

1. **Vérifier la configuration HMR**
   - S'assurer que `server.hmr` est correctement configuré
   - Vérifier que le port HMR n'est pas bloqué
   - Tester la connexion WebSocket HMR

2. **Optimiser le watch de Vite**
   - Configurer `server.watch` pour détecter tous les changements de fichiers
   - S'assurer que les fichiers TypeScript sont bien surveillés
   - Vérifier que les fichiers dans `src/` sont inclus dans le watch

3. **Corriger le cache des dépendances**
   - Ajuster `optimizeDeps` pour forcer la re-optimisation si nécessaire
   - Vérifier que les dépendances sont correctement incluses
   - Nettoyer le cache si nécessaire

### Phase 2 : Optimisation du Cache

1. **Cache en développement**
   - S'assurer que le cache est désactivé pour les fichiers source
   - Vérifier que les headers HTTP empêchent le cache navigateur
   - Tester avec différents navigateurs

2. **Cache en production**
   - S'assurer que les fichiers avec hash fonctionnent correctement
   - Vérifier que le cache-busting fonctionne
   - Optimiser les chunks pour le cache navigateur

### Phase 3 : Vérification et Tests

1. **Tests de non-régression**
   - Vérifier que toutes les fonctionnalités existantes fonctionnent
   - Tester le chargement des pages
   - Vérifier que les modaux s'ouvrent correctement
   - Tester les interactions utilisateur (filtres, tri, etc.)

2. **Tests de performance**
   - Mesurer le temps de compilation initial
   - Mesurer le temps de rechargement HMR
   - Vérifier que les performances ne sont pas dégradées

## Instructions Spécifiques

### 1. Configuration Vite à Optimiser

```typescript
// Optimisations à appliquer dans vite.config.ts :

server: {
  hmr: {
    overlay: true,
    // Ajouter configuration explicite du port si nécessaire
    // clientPort: 5173,
  },
  watch: {
    // Utiliser polling si nécessaire sur certains systèmes
    usePolling: false,
    // S'assurer que tous les fichiers sont surveillés
    ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    // Intervalle de polling si activé (en ms)
    interval: 100,
  },
  // Headers pour désactiver le cache
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
}

optimizeDeps: {
  // Forcer la re-optimisation si nécessaire
  force: false, // À tester : peut être mis à true temporairement pour diagnostiquer
  // Inclure toutes les dépendances importantes
  include: [
    'react',
    'react-dom',
    '@radix-ui/react-dialog',
    '@radix-ui/react-popover',
    '@tanstack/react-table',
    // Ajouter d'autres dépendances si nécessaire
  ],
  // Exclure les dépendances problématiques
  exclude: [],
}
```

### 2. Vérifications à Effectuer

1. **Vérifier que le serveur Vite démarre correctement**
   - Le serveur doit démarrer sur le port 5173
   - Les logs doivent indiquer que HMR est actif
   - Pas d'erreurs de connexion WebSocket

2. **Tester le HMR**
   - Modifier un fichier React simple
   - Vérifier que le changement apparaît immédiatement
   - Vérifier qu'il n'y a pas de rechargement complet de page

3. **Vérifier le cache**
   - Ouvrir DevTools > Network
   - Cocher "Disable cache"
   - Vérifier que les fichiers sont bien rechargés à chaque modification

### 3. Scripts NPM à Vérifier

Les scripts suivants doivent fonctionner correctement :
- `npm run dev` : Démarrage normal
- `npm run dev:clean` : Nettoyage du cache Vite avant démarrage
- `npm run dev:force` : Nettoyage complet et force re-optimisation

### 4. Fichiers à Vérifier

- `vite.config.ts` : Configuration principale
- `index.html` : Meta tags pour le cache
- `package.json` : Scripts et dépendances
- `.gitignore` : Exclusion des caches

## Contraintes et Exigences

### Contraintes Techniques
- **React 19.2.0** : Ne pas downgrader React
- **TypeScript 5.9.3** : Maintenir la version actuelle
- **Vite 7.2.4** : Utiliser la version actuelle de Vite
- **Compatibilité navigateur** : Chrome, Firefox, Safari récents

### Exigences Fonctionnelles
- **Zéro régression** : Toutes les fonctionnalités existantes doivent fonctionner
- **Performance** : Pas de dégradation des performances
- **Expérience développeur** : HMR doit être fiable et rapide

### Exigences de Qualité
- **Code propre** : Pas de code mort ou commenté
- **Documentation** : Mettre à jour la documentation si nécessaire
- **Tests** : Vérifier que les tests passent toujours

## Checklist de Validation

Avant de considérer l'optimisation terminée, vérifier :

- [ ] Le HMR fonctionne : les modifications sont visibles immédiatement
- [ ] Pas de rechargement complet de page lors des modifications
- [ ] Le cache navigateur ne bloque pas les changements
- [ ] Le cache Vite ne cause pas de problèmes
- [ ] Toutes les pages se chargent correctement
- [ ] Tous les modaux s'ouvrent correctement
- [ ] Les filtres et le tri fonctionnent
- [ ] La création/édition de scopes fonctionne
- [ ] La création/édition de routines fonctionne
- [ ] Le localStorage fonctionne correctement
- [ ] Les tests passent
- [ ] Pas d'erreurs dans la console
- [ ] Performance acceptable (temps de compilation < 3s)

## Notes Importantes

1. **Ne pas modifier la structure du projet** : Garder la même organisation de fichiers
2. **Ne pas changer les dépendances** : Utiliser les versions actuelles
3. **Tester après chaque modification** : Vérifier que tout fonctionne
4. **Documenter les changements** : Noter ce qui a été modifié et pourquoi

## Résultat Attendu

Après optimisation :
- ✅ Les modifications dans Cursor/IDE sont visibles **immédiatement** dans le navigateur
- ✅ Pas de problème de cache en développement
- ✅ HMR fonctionne de manière fiable
- ✅ Toutes les fonctionnalités existantes continuent de fonctionner
- ✅ Performance de développement optimale

## Commandes de Test

```bash
# 1. Nettoyer complètement
npm run clean

# 2. Redémarrer avec cache propre
npm run dev:clean

# 3. Dans le navigateur, ouvrir DevTools > Network
# 4. Cocher "Disable cache"
# 5. Modifier un fichier React
# 6. Vérifier que le changement apparaît immédiatement
```

## Support et Debugging

Si le problème persiste après optimisation :
1. Vérifier les logs du serveur Vite
2. Vérifier la console du navigateur
3. Vérifier la connexion WebSocket HMR dans DevTools > Network > WS
4. Tester avec un navigateur différent
5. Vérifier les permissions de fichiers

---

**Date de création :** $(date)
**Version du projet :** 0.0.0
**Dernière modification :** Après optimisation du cache/HMR




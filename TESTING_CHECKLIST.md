# Checklist de Test - Optimisations HMR/Cache

**Date :** $(date)

## ✅ Tests Automatiques (Effectués)

- [x] Configuration Vite compile sans erreur
- [x] Pas d'erreurs TypeScript dans vite.config.ts
- [x] Pas d'erreurs ESLint dans vite.config.ts
- [x] Structure du projet préservée
- [x] Dépendances non modifiées

## 🧪 Tests Manuels à Effectuer

### Test 1 : HMR (Hot Module Replacement) ⭐ PRIORITAIRE

**Objectif :** Vérifier que les modifications sont visibles immédiatement

**Étapes :**
1. [ ] Le serveur démarre sans erreur sur http://localhost:5173
2. [ ] Ouvrir le navigateur et aller sur http://localhost:5173
3. [ ] Ouvrir DevTools (F12) > Network
4. [ ] **Cocher "Disable cache"** (important !)
5. [ ] Modifier `src/components/HomePage.tsx` :
   - Ajouter un commentaire `// Test HMR` ou modifier un texte visible
6. [ ] Observer le navigateur :
   - [ ] Le changement apparaît **immédiatement** (sans rechargement complet)
   - [ ] Pas de rechargement de page complet
   - [ ] Message "HMR connected" dans la console (optionnel)

**Résultat attendu :** ✅ Changement visible instantanément

---

### Test 2 : Connexion WebSocket HMR

**Étapes :**
1. [ ] DevTools > Network > Filtrer par "WS" (WebSocket)
2. [ ] Vérifier qu'il y a une connexion WebSocket active vers `ws://localhost:5173`
3. [ ] Vérifier qu'il n'y a pas d'erreurs de connexion

**Résultat attendu :** ✅ Connexion WebSocket active sans erreurs

---

### Test 3 : Fonctionnalités Principales

#### Pages
- [ ] **Home Page** : Se charge correctement
- [ ] **Supply Page** : Se charge correctement
- [ ] **Scope & Routines Page** : Se charge correctement
- [ ] **Users Page** : Se charge correctement

#### Modaux
- [ ] **Scope Modal** (création depuis Home) : S'ouvre et fonctionne
- [ ] **Scope Modal** (édition) : S'ouvre et fonctionne
- [ ] **Routine Modal** (création) : S'ouvre et fonctionne
- [ ] **Routine Modal** (édition) : S'ouvre et fonctionne
- [ ] **Column Filter Modal** : S'ouvre et fonctionne
- [ ] **Sorting and Filters Modal** : S'ouvre et fonctionne

#### Fonctionnalités
- [ ] **Filtres dans la table Supply** : Fonctionnent correctement
- [ ] **Tri des colonnes** : Fonctionne correctement
- [ ] **Recherche globale** : Fonctionne correctement
- [ ] **Créer un scope** : Fonctionne et se sauvegarde
- [ ] **Éditer un scope** : Fonctionne et se sauvegarde
- [ ] **Créer une routine** : Fonctionne et se sauvegarde
- [ ] **Éditer une routine** : Fonctionne et se sauvegarde
- [ ] **localStorage** : Les données persistent après rechargement

---

### Test 4 : Performance

- [ ] Temps de démarrage initial < 5 secondes
- [ ] Temps de rechargement HMR < 500ms (mesurer en modifiant un fichier)
- [ ] Pas de dégradation visible des performances

---

### Test 5 : Console et Erreurs

- [ ] Ouvrir DevTools > Console
- [ ] Recharger la page
- [ ] Vérifier qu'il n'y a **pas d'erreurs** rouges
- [ ] Vérifier qu'il n'y a **pas d'avertissements** critiques

**Résultat attendu :** ✅ Pas d'erreurs dans la console

---

## 📊 Résultats

### Test HMR
- [ ] ✅ Fonctionne parfaitement
- [ ] ⚠️ Fonctionne mais avec des problèmes mineurs
- [ ] ❌ Ne fonctionne pas

### Fonctionnalités
- [ ] ✅ Toutes fonctionnent
- [ ] ⚠️ Quelques problèmes mineurs
- [ ] ❌ Problèmes majeurs

### Performance
- [ ] ✅ Excellente
- [ ] ⚠️ Acceptable
- [ ] ❌ Problèmes de performance

---

## 🔧 Si Problèmes

### HMR ne fonctionne pas
1. Vérifier la connexion WebSocket (Test 2)
2. Essayer `npm run dev:force`
3. Vérifier les logs du serveur
4. Tester avec un navigateur différent

### Erreurs dans la console
1. Noter les erreurs exactes
2. Vérifier si elles existaient avant les optimisations
3. Vérifier les logs du serveur

### Performance dégradée
1. Mesurer les temps exacts
2. Comparer avec avant les optimisations
3. Vérifier les logs du serveur

---

## 📝 Notes

- **Temps de test estimé :** 10-15 minutes
- **Priorité :** Test 1 (HMR) est le plus important
- **En cas de problème :** Voir `VALIDATION_GUIDE.md` pour plus de détails

---

**Status :** ⏳ En attente de tests manuels


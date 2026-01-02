# Implémentation : Sous-Étapes Étape 4 Routines

## ✅ Composants Créés

### 1. `Substep4_1_RecommendedRoutines.tsx`
**Fichier :** `src/components/SimpleOnboardingWizard/RoutineSelectionStep/Substep4_1_RecommendedRoutines.tsx`

**Fonctionnalités :**
- Affiche les routines recommandées pour une équipe
- Groupement par objectif (Anticipate, Monitor, Correct, etc.)
- Badge "Recommandé" avec icône Sparkles
- Bouton "Voir un aperçu" pour chaque routine
- Bouton "Ajouter toutes" pour ajouter toutes les routines suggérées d'un coup
- Bouton "Continuer" pour passer à la sélection finale

**Props :**
- `teamId`: ID de l'équipe
- `teamName`: Nom de l'équipe
- `teamPersona`: Persona de l'équipe (optionnel)
- `suggestedRoutineIds`: Liste des IDs de routines suggérées
- `onPreviewRoutine`: Callback pour ouvrir l'aperçu
- `onContinue`: Callback pour continuer vers la sélection
- `onAddAllSuggested`: Callback pour ajouter toutes les routines

---

### 2. `Substep4_2_RoutinePreview.tsx`
**Fichier :** `src/components/SimpleOnboardingWizard/RoutineSelectionStep/Substep4_2_RoutinePreview.tsx`

**Fonctionnalités :**
- Aperçu interactif de la routine avec données mockées
- Table TanStack avec filtres et tri appliqués
- Possibilité de modifier les filtres via `SortingAndFiltersPopover`
- Possibilité de modifier le tri
- Bouton "Ajouter cette routine" qui sauvegarde la configuration modifiée
- Affichage du nombre de lignes filtrées
- Message informatif sur les données d'exemple

**Props :**
- `routineId`: ID de la routine à prévisualiser
- `teamId`: ID de l'équipe
- `onBack`: Callback pour revenir en arrière
- `onAddRoutine`: Callback avec (filters, sorting) pour ajouter la routine

**Fonctionnalités techniques :**
- Conversion des filtres de `RoutineLibraryEntry` vers `ColumnFiltersState`
- Gestion des expressions de date (ex: "1 week ago")
- Pagination limitée à 10 lignes pour l'aperçu
- Lazy loading des modals lourds

---

## 🔄 Intégration dans RoutineSelectionStep

### Nouveaux Types de Sous-Étapes

```typescript
export type RoutineSelectionSubstep = 
  | 'team-selection'           // Sélection de l'équipe (début)
  | 'recommended-routines'     // Sous-étape 4.1 : Routines recommandées
  | 'routine-preview'          // Sous-étape 4.2 : Aperçu de routine
  | 'routine-selection';       // Sous-étape 4.4 : Sélection finale (actuelle)
```

### Flux Proposé

1. **Équipe par équipe** : Pour chaque équipe avec persona :
   - Sous-étape 4.1 : Afficher les routines recommandées
   - Option "Voir un aperçu" → Sous-étape 4.2
   - Option "Continuer" → Sous-étape 4.4 (sélection finale)
   
2. **Sous-étape 4.2** (Aperçu) :
   - Modifier filtres/tri si nécessaire
   - "Ajouter cette routine" → Retourne à 4.1 ou 4.4
   - "Retour" → Retourne à 4.1

3. **Sous-étape 4.4** (Sélection finale) :
   - Liste des routines sélectionnées
   - Possibilité d'ajouter d'autres routines
   - Possibilité de créer une nouvelle routine
   - "Continuer" → Passe à l'équipe suivante ou termine

### Modifications Nécessaires dans RoutineSelectionStep

1. **État pour gérer les sous-étapes** :
   ```typescript
   const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
   const [previewingRoutineId, setPreviewingRoutineId] = useState<string | null>(null);
   ```

2. **Logique de navigation** :
   - Si `currentSubstep === 'recommended-routines'` → Afficher `Substep4_1_RecommendedRoutines`
   - Si `currentSubstep === 'routine-preview'` → Afficher `Substep4_2_RoutinePreview`
   - Sinon → Afficher la vue actuelle (team-selection)

3. **Gestion équipe par équipe** :
   - Pour chaque équipe avec persona, commencer par 'recommended-routines'
   - Après validation d'une équipe, passer à la suivante
   - Toutes les équipes validées → Passer à l'étape suivante de l'onboarding

---

## 📝 Prochaines Étapes

### À Implémenter

1. **Intégration dans RoutineSelectionStep** :
   - [ ] Ajouter la logique de navigation entre sous-étapes
   - [ ] Gérer le flux équipe par équipe
   - [ ] Intégrer les callbacks pour ajouter les routines

2. **Sauvegarde temporaire** :
   - [ ] Stocker les routines modifiées dans l'état local (pas encore sauvegardées)
   - [ ] Sauvegarder seulement à la fin de l'onboarding
   - [ ] Gérer l'annulation (retour en arrière)

3. **Améliorations UX** :
   - [ ] Ajouter des animations de transition entre sous-étapes
   - [ ] Ajouter un indicateur de progression (équipe X sur Y)
   - [ ] Améliorer les messages d'aide contextuels

4. **Tests** :
   - [ ] Tester le flux complet équipe par équipe
   - [ ] Tester la modification des filtres dans l'aperçu
   - [ ] Tester l'ajout de routines depuis l'aperçu
   - [ ] Tester le retour en arrière

---

## 🎨 Design Notes

### Couleurs Utilisées
- **Recommandé** : `#31C7AD` (teal) avec opacité 10% pour le background
- **Vue Pelico** : `pink-500/10` avec `pink-600` pour le texte
- **Borders** : `border-[#31C7AD]/20` pour les éléments recommandés

### Composants UI Utilisés
- `Badge` pour les tags (fréquence, vue, objectif)
- `Button` avec variants (outline, ghost, default)
- `ScrollArea` pour le contenu scrollable
- `Separator` pour la séparation visuelle

### Responsive
- Grid responsive : `grid-cols-1 md:grid-cols-2` pour les routines
- Table avec scroll horizontal si nécessaire

---

## 🐛 Points d'Attention

1. **Conversion des filtres** : La fonction `convertRoutineFiltersToColumnFilters` doit gérer tous les cas (dates, conditions, valeurs simples)

2. **Lazy loading** : Les modals `SortingAndFiltersPopover` et `ColumnFilterModal` sont chargés en lazy pour optimiser le bundle

3. **État temporaire** : Les routines modifiées dans l'aperçu ne sont pas encore sauvegardées - elles doivent être stockées dans l'état local jusqu'à la fin de l'onboarding

4. **Gestion des équipes sans persona** : Pour les équipes sans persona, passer directement à la sélection manuelle (sous-étape 4.4)

---

## 📚 Références

- **Routine Library** : `src/lib/onboarding/routineLibrary.ts`
- **Filter Definitions** : `src/lib/filterDefinitions.ts`
- **Mock Data** : `src/lib/mockData.ts`
- **Columns** : `src/lib/columns.tsx`
- **Routine Utils** : `src/lib/routineLibraryUtils.ts`

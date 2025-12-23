# Confirmation du Comportement - Ajout de Filtres

## Modèle de Référence : Modal "Sorting and Filters"

Le comportement doit être **identique partout**, basé sur ce qui se passe dans la modal "Sorting and Filters".

---

## Comportement Standard (Modèle de Référence)

### 1. Clic sur "Add filter"
- **Action** : Ouvre la vue "Add filter" (`AddFilterView`)
- **État** : La vue principale reste accessible en arrière-plan
- **Navigation** : Bouton retour (←) pour revenir à la vue principale

### 2. Clic sur un filtre dans AddFilterView
- **Si le filtre mappe vers une colonne** :
  - Ouvre `ColumnFilterModal` pour configuration
  - **La vue AddFilterView reste accessible** (pas fermée)
  - Les valeurs existantes sont pré-remplies si le filtre existe déjà
  
- **Si le filtre ne mappe pas vers une colonne** :
  - Ajoute le filtre directement à la liste
  - Retour à la vue principale (ou reste dans AddFilterView selon le contexte)

### 3. Configuration dans ColumnFilterModal
- **Sélection de valeurs** : Multi-select avec recherche
- **Condition** : Sélection de la condition (equals, contains, etc.)
- **Apply** : 
  - Si valeurs vides → Annulation (pas d'ajout/modification)
  - Si valeurs sélectionnées → Ajoute/modifie le filtre
  - **Retour à AddFilterView** (pas à la vue principale)
  
- **Cancel** :
  - Annule les modifications
  - **Retour à AddFilterView** (pas à la vue principale)

### 4. Après configuration
- **État** : On reste dans AddFilterView
- **Possibilité** : Ajouter d'autres filtres ou revenir en arrière
- **Liste mise à jour** : Les filtres ajoutés apparaissent dans la liste principale

---

## Endroits où ce Comportement doit être Appliqué

### ✅ 1. Modal "Sorting and Filters" (`SortingAndFiltersPopover.tsx`)
**Statut** : ✅ Modèle de référence (comportement correct)

### ✅ 2. Modal "Create/Edit Scope" (`ScopeModal.tsx`)
**Statut** : ✅ Implémenté avec le même comportement

**Vérification** :
- ✅ Clic sur "Add Filter" → Ouvre AddFilterView
- ✅ Clic sur un filtre → Ouvre ColumnFilterModal (si mappe vers colonne)
- ✅ AddFilterView reste accessible pendant la configuration
- ✅ Après configuration → Retour à AddFilterView
- ✅ Possibilité d'ajouter d'autres filtres
- ✅ Bouton retour pour revenir à la vue principale

---

## Points Clés du Comportement

1. **AddFilterView reste ouvert** pendant la configuration d'un filtre
2. **Retour à AddFilterView** après configuration (pas à la vue principale)
3. **Valeurs vides = Annulation** (pas d'ajout/modification)
4. **Filtres existants** : Pré-remplissage des valeurs dans ColumnFilterModal
5. **Navigation fluide** : Possibilité de continuer à ajouter des filtres ou revenir en arrière

---

## Confirmation

✅ **Le comportement est identique partout**
✅ **Le modèle de référence est respecté**
✅ **ScopeModal suit exactement le même flux que SortingAndFiltersPopover**



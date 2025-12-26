# Liste des Endroits où on peut Ajouter des Filtres

## Exclusions
- ❌ **Headers de colonnes** (exclus comme demandé)

---

## 1. Modal "Sorting and Filters" (`SortingAndFiltersPopover.tsx`)

### 1.1 Section "Filters" - Bouton "Add filter"
**Fichier** : `src/components/sorting-filters/FiltersSection.tsx`

**Emplacement** : Dans la modal "Sorting and Filters", section "Filters"

**Comportement** :
- Si aucun filtre n'existe : Bouton "Add filter" avec icône `+`
- Si des filtres existent : Bouton "Add filter" en haut de la liste des filtres

**Code** :
```typescript
// Ligne 57-60 (état vide)
<Button variant="default" size="sm" onClick={onAddFilter} className="gap-2">
  <Plus className="h-4 w-4" />
  Add filter
</Button>

// Ligne 64-67 (avec filtres existants)
<Button variant="default" size="sm" onClick={onAddFilter} className="gap-2">
  <Plus className="h-4 w-4" />
  Add filter
</Button>
```

**Action** : Ouvre la vue "Add filter" (`setView('add-filter')`)

---

### 1.2 Vue "Add filter" (`AddFilterView`)
**Fichier** : `src/components/SortingAndFiltersPopover.tsx` (lignes 652-840)

**Emplacement** : Vue secondaire dans la modal "Sorting and Filters"

**Comportement** :
- Liste de tous les filtres disponibles organisés par catégories :
  - **FAVORITES** (avec étoile jaune)
  - **GENERAL**
  - **CONSUMED PARTS**
  - **PRODUCED PARTS**
- Recherche de filtres disponible
- Clic sur un filtre :
  - Si le filtre mappe vers une colonne → Ouvre `ColumnFilterModal`
  - Sinon → Ajoute le filtre directement à la liste

**Navigation** :
- Bouton retour (←) pour revenir à la vue principale
- Bouton fermer (X) pour fermer la modal complètement

---

## 2. Modal "Create/Edit Scope" (`ScopeModal.tsx`)

### 2.1 Section "Filters" - Bouton "Add Filter"
**Fichier** : `src/components/ScopeModal.tsx`

**Emplacement** : Dans la modal de création/édition de scope, section "Filters"

**Comportement** :
- Bouton "Add Filter" avec icône `+` (rotation 45°)
- Visible uniquement si `showAddFilter === false`

**Code** :
```typescript
// Ligne 355-363
{!showAddFilter && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowAddFilter(true)}
    className="shrink-0"
  >
    <X className="mr-2 h-4 w-4 rotate-45" />
    Add Filter
  </Button>
)}
```

**Action** : Affiche la vue "Add filter" (`setShowAddFilter(true)`)

---

### 2.2 État vide - Bouton "Add Your First Filter"
**Fichier** : `src/components/ScopeModal.tsx`

**Emplacement** : Dans la modal de création de scope (mode "guided"), si aucun filtre n'existe

**Comportement** :
- Message d'encouragement avec icône `Target`
- Bouton "Add Your First Filter" avec style primaire (vert)

**Code** :
```typescript
// Ligne 368-389
{isGuidedMode && filters.length === 0 && !showAddFilter && (
  <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center bg-muted/20">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#31C7AD]/10 mb-3">
      <Target className="h-6 w-6 text-[#31C7AD]" />
    </div>
    <p className="text-sm font-medium mb-1">No filters yet</p>
    <p className="text-xs text-muted-foreground mb-3">
      Start by adding filters to define your data perimeter
    </p>
    <Button
      variant="default"
      size="sm"
      onClick={() => setShowAddFilter(true)}
      className="bg-[#31C7AD] hover:bg-[#2ab89a]"
    >
      <X className="mr-2 h-4 w-4 rotate-45" />
      Add Your First Filter
    </Button>
  </div>
)}
```

**Action** : Affiche la vue "Add filter" (`setShowAddFilter(true)`)

---

### 2.3 Vue "Add filter" dans ScopeModal
**Fichier** : `src/components/ScopeModal.tsx`

**Emplacement** : Vue intégrée dans la modal de scope (pas une vue séparée comme dans SortingAndFiltersPopover)

**Comportement** :
- Utilise le même composant `AddFilterView` que `SortingAndFiltersPopover`
- Liste de tous les filtres disponibles avec recherche
- Clic sur un filtre :
  - Si le filtre mappe vers une colonne → Ouvre `ColumnFilterModal`
  - Sinon → Ajoute le filtre directement (avec valeurs vides)

**Code** :
```typescript
// Ligne 389-420
{showAddFilter ? (
  <div className="border rounded-lg p-4 bg-muted/50">
    <Suspense fallback={<div className="h-32 flex items-center justify-center">Loading...</div>}>
      <AddFilterView
        filterSearch={filterSearch}
        onFilterSearchChange={setFilterSearch}
        filteredFilterDefs={filteredFilterDefs}
        groupedFilters={groupedFilters}
        onSelectFilter={handleAddFilter}
        onToggleFavorite={...}
        onOpenFilterModal={handleOpenFilterModal}
        getColumnIdFromFilterId={getColumnIdFromFilterId}
        onBack={() => {
          setShowAddFilter(false);
          setFilterSearch('');
        }}
        onClose={() => {
          setShowAddFilter(false);
          setFilterSearch('');
        }}
      />
    </Suspense>
  </div>
) : (
  // Liste des filtres existants
)}
```

**Navigation** :
- Bouton retour (←) pour revenir à la vue principale de la modal
- Bouton fermer (X) pour fermer la vue "Add filter"

---

## Résumé des Endroits

| # | Emplacement | Composant | Fichier | Type d'Action |
|---|------------|-----------|---------|---------------|
| 1 | Modal "Sorting and Filters" → Section Filters → Bouton "Add filter" | `FiltersSection` | `sorting-filters/FiltersSection.tsx` | Ouvre vue "Add filter" |
| 2 | Modal "Sorting and Filters" → Vue "Add filter" | `AddFilterView` | `SortingAndFiltersPopover.tsx` | Liste de filtres avec recherche |
| 3 | Modal "Create/Edit Scope" → Section Filters → Bouton "Add Filter" | `ScopeModal` | `ScopeModal.tsx` | Affiche vue "Add filter" |
| 4 | Modal "Create/Edit Scope" → État vide → Bouton "Add Your First Filter" | `ScopeModal` | `ScopeModal.tsx` | Affiche vue "Add filter" (mode guided uniquement) |
| 5 | Modal "Create/Edit Scope" → Vue "Add filter" | `AddFilterView` | `ScopeModal.tsx` (utilise le composant) | Liste de filtres avec recherche |

---

## Flux Utilisateur

### Dans "Sorting and Filters" :
1. Ouvrir la modal "Sorting and Filters"
2. Aller dans la section "Filters"
3. Cliquer sur "Add filter"
4. Vue "Add filter" s'affiche avec liste de filtres
5. Cliquer sur un filtre → Ouvre `ColumnFilterModal` ou ajoute directement

### Dans "Create/Edit Scope" :
1. Ouvrir la modal "Create/Edit Scope"
2. Aller dans la section "Filters"
3. Cliquer sur "Add Filter" (ou "Add Your First Filter" si vide)
4. Vue "Add filter" s'affiche intégrée dans la modal
5. Cliquer sur un filtre → Ouvre `ColumnFilterModal` ou ajoute directement
6. Après configuration → Retour à la vue "Add filter" (peut ajouter d'autres filtres)

---

## Notes Importantes

1. **Composant Réutilisé** : `AddFilterView` est utilisé à la fois dans `SortingAndFiltersPopover` et `ScopeModal`
2. **Comportement Différent** : 
   - Dans `SortingAndFiltersPopover` : Vue séparée avec navigation complète
   - Dans `ScopeModal` : Vue intégrée dans la modal principale
3. **Mapping Colonne** : Les filtres qui mappent vers une colonne ouvrent `ColumnFilterModal` pour configuration
4. **Filtres sans Mapping** : Les filtres qui ne mappent pas vers une colonne sont ajoutés directement (avec valeurs vides, à configurer plus tard)





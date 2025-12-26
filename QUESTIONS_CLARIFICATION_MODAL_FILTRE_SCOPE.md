# Questions de Clarification - Modal de Configuration de Filtre dans ScopeModal

## Contexte
Actuellement, lorsqu'on clique sur un élément de la liste "Add filter" dans la modal "Create New Scope", le filtre est ajouté avec des valeurs vides (`values: []`). Vous souhaitez que la modal `ColumnFilterModal` s'ouvre immédiatement pour configurer le filtre avant de l'ajouter.

---

## Questions de Clarification

### 1. Comportement Général

#### 1.1 Tous les filtres doivent-ils ouvrir la modal ?
- **Question** : La modal `ColumnFilterModal` doit-elle s'ouvrir pour **tous les filtres** ou seulement certains ?
  - Option A : **Tous les filtres** ouvrent la modal (même ceux sans options comme "Quantity Comparison")
  - Option B : **Seulement les filtres qui mappent vers une colonne** (via `getColumnIdFromFilterId`)
  - Option C : **Seulement les filtres avec des options** (multi-select, select)
  - Option D : **Tous sauf les filtres de type "number" sans options** (comme "Quantity Comparison")

#### 1.2 Filtres sans options
- **Question** : Pour les filtres sans options prédéfinies (ex: "Quantity Comparison", "Date Comparison", "Quantity Range"), que doit-il se passer ?
  - Option A : Ouvrir la modal avec un champ de saisie libre (input number/date)
  - Option B : Ouvrir la modal avec un message "No options available" et permettre la saisie manuelle
  - Option C : Ne pas ouvrir la modal, ajouter directement le filtre avec possibilité de le configurer après (comportement actuel)
  - Option D : Créer une modal différente/spécialisée pour ces types de filtres

---

### 2. Flux Utilisateur

#### 2.1 Fermeture de la liste "Add filter"
- **Question** : Lorsqu'on clique sur un filtre dans la liste, faut-il :
  - Option A : **Fermer la liste "Add filter"** et ouvrir la modal de configuration
  - Option B : **Garder la liste ouverte** en arrière-plan (la modal s'affiche par-dessus)
  - Option C : **Fermer la liste et revenir à la vue principale** avec le filtre ajouté (même s'il n'a pas encore de valeurs)

#### 2.2 Après configuration dans la modal
- **Question** : Après avoir configuré le filtre dans `ColumnFilterModal` et cliqué sur "Apply", faut-il :
  - Option A : **Fermer la modal** et revenir à la vue principale de `ScopeModal` avec le filtre ajouté et configuré
  - Option B : **Revenir à la liste "Add filter"** pour permettre d'ajouter d'autres filtres
  - Option C : **Fermer complètement la section "Add filter"** et revenir à la vue principale

#### 2.3 Annulation dans la modal
- **Question** : Si l'utilisateur clique sur "Cancel" dans `ColumnFilterModal`, faut-il :
  - Option A : **Ne pas ajouter le filtre** (comme si le clic n'avait jamais eu lieu)
  - Option B : **Ajouter le filtre avec des valeurs vides** (comportement actuel)
  - Option C : **Revenir à la liste "Add filter"** sans ajouter le filtre

#### 2.4 Application avec valeurs vides
- **Question** : Si l'utilisateur clique sur "Apply" dans `ColumnFilterModal` sans sélectionner de valeurs, faut-il :
  - Option A : **Empêcher l'application** (bouton "Apply" désactivé si aucune valeur)
  - Option B : **Permettre l'application** et ajouter le filtre avec des valeurs vides (l'utilisateur pourra le configurer plus tard)
  - Option C : **Afficher un avertissement** mais permettre quand même l'application

---

### 3. Gestion des Filtres Existants

#### 3.1 Filtre déjà présent
- **Question** : Si un filtre avec le même `filterId` existe déjà dans la liste des filtres du scope, faut-il :
  - Option A : **Ouvrir la modal** avec les valeurs existantes pré-remplies (mode édition)
  - Option B : **Ne rien faire** (comportement actuel : le filtre n'est pas ajouté)
  - Option C : **Afficher un message** "This filter is already added" et ne pas ouvrir la modal

#### 3.2 Édition d'un filtre existant
- **Question** : Le comportement actuel permet d'éditer un filtre existant en cliquant sur le bouton "Edit" du chip. Ce comportement doit-il :
  - Option A : **Rester identique** (ouvrir la modal avec les valeurs existantes)
  - Option B : **Changer** pour être cohérent avec le nouveau flux d'ajout

---

### 4. Mapping Filtre → Colonne

#### 4.1 Filtres qui ne mappent pas vers une colonne
- **Question** : Pour les filtres qui ne mappent pas vers une colonne (via `getColumnIdFromFilterId` retourne `null`), faut-il :
  - Option A : **Ouvrir quand même `ColumnFilterModal`** avec les options du `filterDefinition`
  - Option B : **Créer une modal différente** adaptée aux filtres non-colonnes
  - Option C : **Ajouter directement le filtre** sans modal (comportement actuel)

#### 4.2 Utilisation de `getColumnIdFromFilterId`
- **Question** : Doit-on utiliser `getColumnIdFromFilterId` pour déterminer si on ouvre la modal ?
  - Option A : **Oui**, utiliser cette fonction pour mapper le filtre vers une colonne
  - Option B : **Non**, ouvrir la modal pour tous les filtres basés sur le type (`multi-select`, `select`, etc.)
  - Option C : **Oui, mais avec fallback** : si pas de mapping, utiliser les options du `filterDefinition`

---

### 5. Interface et UX

#### 5.1 Titre de la modal
- **Question** : Quel titre afficher dans `ColumnFilterModal` lorsqu'elle est ouverte depuis `ScopeModal` ?
  - Option A : **"[Nom du filtre]"** (ex: "Part Name")
  - Option B : **"Configure [Nom du filtre]"** (ex: "Configure Part Name")
  - Option C : **"Add filter: [Nom du filtre]"** (ex: "Add filter: Part Name")
  - Option D : **"[Nom du filtre] Filter"** (ex: "Part Name Filter")

#### 5.2 Contexte dans la modal
- **Question** : Faut-il afficher un contexte indiquant que le filtre est en cours d'ajout au scope ?
  - Option A : **Oui**, ajouter un sous-titre "Adding to scope: [Nom du scope]" ou "Configuring filter for scope"
  - Option B : **Non**, le titre du filtre est suffisant
  - Option C : **Oui**, mais seulement si on est en mode édition d'un scope existant

#### 5.3 Style visuel
- **Question** : La modal `ColumnFilterModal` doit-elle avoir un style différent lorsqu'elle est ouverte depuis `ScopeModal` ?
  - Option A : **Non**, garder le même style que lorsqu'elle est ouverte depuis les headers de colonnes
  - Option B : **Oui**, utiliser un style légèrement différent (ex: bordure bleue pour indiquer le contexte scope)
  - Option C : **Oui**, changer l'icône ou le header pour indiquer le contexte

---

### 6. Cas Spéciaux

#### 6.1 Filtres de type "number" sans options
- **Question** : Pour les filtres comme "Quantity Comparison" (type: `'number'`, pas d'options), comment gérer la configuration ?
  - Option A : Ouvrir la modal avec un champ de saisie numérique et une condition (equals, greaterThan, etc.)
  - Option B : Créer une interface spécialisée dans `ColumnFilterModal` pour les filtres numériques
  - Option C : Ne pas ouvrir la modal, ajouter le filtre et permettre la configuration via édition

#### 6.2 Filtres de type "date"
- **Question** : Pour les filtres de type "date" (ex: "Date Comparison"), faut-il :
  - Option A : Ouvrir la modal avec un sélecteur de date et des conditions (before, after, between)
  - Option B : Ouvrir la modal avec un champ de saisie texte pour la date
  - Option C : Comportement identique aux autres filtres

#### 6.3 Filtres avec beaucoup d'options
- **Question** : Pour les filtres avec beaucoup d'options (ex: "Supplier" avec potentiellement des centaines d'options), faut-il :
  - Option A : Ouvrir la modal avec recherche et pagination (comportement actuel de `ColumnFilterModal`)
  - Option B : Limiter le nombre d'options affichées initialement
  - Option C : Comportement identique, pas de changement nécessaire

---

## Recommandations (basées sur les meilleures pratiques UX)

### Flux Recommandé :
1. **Clic sur un filtre dans la liste** → Fermer la liste "Add filter" → Ouvrir `ColumnFilterModal`
2. **Configuration dans la modal** → Sélectionner les valeurs et condition → Cliquer "Apply"
3. **Après "Apply"** → Fermer la modal → Revenir à la vue principale avec le filtre ajouté et configuré
4. **Si "Cancel"** → Ne pas ajouter le filtre → Revenir à la vue principale (ou liste "Add filter" si on veut garder la possibilité d'ajouter d'autres filtres)

### Comportement Recommandé :
- **Tous les filtres** ouvrent la modal (même ceux sans options)
- **Filtres sans options** : Afficher un champ de saisie approprié selon le type (number, date, text)
- **Filtres existants** : Ouvrir la modal en mode édition avec les valeurs pré-remplies
- **Mapping colonne** : Utiliser `getColumnIdFromFilterId` si disponible, sinon utiliser les options du `filterDefinition`

### Titre Recommandé :
- **"Configure [Nom du filtre]"** pour être explicite sur l'action en cours

---

## Prochaines Étapes

Une fois ces questions clarifiées, je pourrai implémenter :
1. L'ouverture automatique de `ColumnFilterModal` lors du clic sur un filtre dans la liste
2. La gestion du flux utilisateur (fermeture de la liste, retour après configuration)
3. La gestion des cas spéciaux (filtres sans options, filtres existants, etc.)
4. L'intégration avec le système existant de `ScopeModal`





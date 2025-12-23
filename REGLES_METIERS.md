# Règles Métiers - Pelico Supply Prototype

## Table des matières
1. [Gestion des Scopes](#gestion-des-scopes)
2. [Gestion des Routines](#gestion-des-routines)
3. [Gestion des Filtres](#gestion-des-filtres)
4. [Gestion des Utilisateurs et Équipes](#gestion-des-utilisateurs-et-équipes)
5. [Onboarding et Scoring](#onboarding-et-scoring)
6. [Validation et Contraintes](#validation-et-contraintes)
7. [Persistance et État](#persistance-et-état)

---

## 1. Gestion des Scopes

### 1.1 Définition d'un Scope
- **Un Scope** est un périmètre de données personnel qui filtre ce que l'utilisateur voit par défaut
- Un Scope contient :
  - Un nom (obligatoire, max 100 caractères)
  - Une description (optionnelle, max 500 caractères)
  - Une liste de filtres (`ScopeFilter[]`)
  - Un flag `isDefault` (un seul scope peut être par défaut)
  - Un `userId` (propriétaire)
  - Un flag `isGlobal` (scope global vs personnel)
  - Des timestamps (`createdAt`, `updatedAt`)

### 1.2 Scope par défaut
- **Règle** : Un seul scope peut être marqué comme `isDefault = true`
- Lors de la définition d'un nouveau scope par défaut :
  - Tous les autres scopes perdent leur flag `isDefault`
  - Le nouveau scope devient le scope par défaut
- Si aucun scope n'est sauvegardé dans `localStorage`, le système essaie de charger le scope par défaut
- Si aucun scope par défaut n'existe, le système peut fonctionner sans scope actif (`currentScopeId = null`)

### 1.3 Scope actif (Current Scope)
- Le scope actif est stocké dans `localStorage` avec la clé `pelico-current-scope`
- Lors du chargement de l'application :
  - Le système vérifie si le scope sauvegardé existe toujours
  - Si le scope sauvegardé n'existe plus, il essaie de charger le scope par défaut
  - Si aucun scope par défaut n'existe, `currentScopeId = null`
- Le scope actif peut être changé via `setCurrentScopeId()`

### 1.4 Filtres de Scope
- **Règle obligatoire** : Un scope doit contenir **au moins un filtre** pour être valide
- Les filtres de scope sont automatiquement appliqués à la table
- **Format** : `ScopeFilter` contient :
  - `id` : Identifiant unique du filtre
  - `filterId` : ID du filtre défini dans `filterDefinitions`
  - `values` : Tableau de valeurs sélectionnées `(string | number)[]`
  - `condition` : Condition optionnelle (ex: "equals", "greaterThan", etc.)
- Les filtres de scope sont convertis en `ColumnFiltersState` pour TanStack Table via `getScopeFilters()`
- **Affichage** : Les filtres de scope sont visibles :
  - Dans les en-têtes de colonnes (niveau header) avec un indicateur visuel
  - Dans la modal "Sorting and Filters" avec une section dédiée "Scope Filters"
- **Règle** : Seuls les filtres avec au moins une valeur (`values.length > 0`) sont appliqués

### 1.5 Fusion des filtres Scope et Utilisateur
- **Priorité** : Les filtres utilisateur/routine **écrasent** les filtres de scope pour la même colonne
- Lors de la combinaison :
  1. On commence avec les filtres de scope
  2. On ajoute les filtres utilisateur qui n'existent pas déjà dans les filtres de scope
  3. Si un filtre utilisateur existe pour la même colonne qu'un filtre de scope, le filtre utilisateur remplace le filtre de scope

### 1.6 Opérations CRUD sur les Scopes
- **Création** : `createScope()` génère un ID unique avec timestamp et random
- **Lecture** : `getScopes()` retourne tous les scopes valides (validation avec `isValidScope`)
- **Mise à jour** : `updateScope()` met à jour et met à jour `updatedAt`
- **Suppression** : `deleteScope()` supprime et vérifie si le scope actif doit être réinitialisé
- **Duplication** : `duplicateScope()` crée une copie avec "(Copy)" dans le nom
- **Partage** : `shareScope()` génère un lien partageable (token encodé en base64)

---

## 2. Gestion des Routines

### 2.1 Définition d'une Routine
- **Une Routine** sauvegarde une configuration de vue (filtres, tri, groupement, etc.)
- Une Routine contient :
  - Un nom (obligatoire, max 100 caractères)
  - Une description (optionnelle, max 500 caractères)
  - `filters` : `ColumnFiltersState` (filtres utilisateur/routine uniquement, pas les filtres de scope)
  - `sorting` : `SortingState`
  - `columnVisibility` : Visibilité des colonnes (optionnel)
  - `columnOrder` : Ordre des colonnes (optionnel)
  - `groupBy` : Colonne de groupement (optionnel)
  - `pageSize` : Taille de page (optionnel, défaut: 100)
  - `scopeMode` : `'scope-aware'` ou `'scope-fixed'`
  - `linkedScopeId` : ID du scope lié (si `scopeMode === 'scope-fixed'`)
  - `createdBy` : ID de l'utilisateur créateur
  - `teamIds` : Tableau d'IDs d'équipes avec qui la routine est partagée
  - Des timestamps (`createdAt`, `updatedAt`)

### 2.2 Modes de Scope pour les Routines
- **`scope-aware`** (par défaut) :
  - La routine utilise le scope actif au moment de son chargement
  - Si le scope change, les filtres de la routine sont combinés avec les nouveaux filtres de scope
- **`scope-fixed`** :
  - La routine est liée à un scope spécifique (`linkedScopeId`)
  - Les filtres du scope lié sont toujours appliqués avec les filtres de la routine
  - Si le scope lié est supprimé, le comportement doit être géré (actuellement non implémenté)

### 2.3 Partage des Routines
- **Règle** : Une routine peut être partagée avec plusieurs équipes via `teamIds`
- Si `teamIds` est vide ou `undefined`, la routine est privée (visible uniquement par le créateur)
- **Migration** : Les anciennes routines avec `teamId` (singulier) sont migrées vers `teamIds` (pluriel)
- Les routines partagées sont accessibles via `getAccessibleRoutines(userId, userTeamId)`

### 2.4 Fusion des filtres Routine et Scope
- **Fonction** : `mergeFilters(routineFilters, scopeFilters)`
- **Priorité** : Les filtres de routine ont la priorité sur les filtres de scope pour la même colonne
- Logique :
  1. On commence avec les filtres de routine
  2. On ajoute les filtres de scope qui n'existent pas déjà dans les filtres de routine

### 2.5 Détection des changements non sauvegardés
- **Règle** : Une routine a des changements non sauvegardés si :
  - Aucune routine n'est sélectionnée ET il y a des sorts ou filtres actifs
  - OU une routine est sélectionnée ET l'état actuel (sorting, filters) diffère de l'état sauvegardé de la routine
- La comparaison se fait via `JSON.stringify()` après tri des tableaux par ID

### 2.6 Opérations CRUD sur les Routines
- **Création** : `createRoutine()` nécessite `createdBy` (ID utilisateur)
- **Lecture** : `getRoutines()` avec migration automatique `teamId` → `teamIds`
- **Mise à jour** : `updateRoutine()` met à jour et met à jour `updatedAt`
- **Suppression** : `deleteRoutine()` supprime la routine
- **Duplication** : `duplicateRoutine()` crée une copie privée (`teamIds = []`) par défaut
- **Partage** : `shareRoutine()` génère un lien partageable (token encodé en base64)
- **Filtrage** :
  - `getRoutinesByCreator(userId)` : Routines créées par un utilisateur
  - `getRoutinesByTeam(teamId)` : Routines partagées avec une équipe
  - `getAccessibleRoutines(userId, userTeamId)` : Routines accessibles (créées par l'utilisateur OU partagées avec son équipe)

---

## 3. Gestion des Filtres

### 3.1 Définitions de Filtres
- Les filtres sont définis dans `filterDefinitions` avec :
  - `id` : Identifiant unique
  - `label` : Libellé affiché
  - `category` : `'favorites' | 'general' | 'consumed-parts' | 'produced-parts'`
  - `type` : `'text' | 'number' | 'date' | 'select' | 'multi-select'`
  - `options` : Options disponibles (pour select/multi-select)
  - `isFavorite` : Flag pour les favoris (peut être modifié en session)

### 3.2 Filtres Favoris
- Les favoris sont gérés en session uniquement (pas persistés)
- Un filtre peut être ajouté/retiré des favoris via `sessionFavorites` (Set)
- Les favoris apparaissent dans la catégorie "FAVORITES" dans la modal de filtres

### 3.3 Mapping Filtre → Colonne
- **Fonction** : `getColumnIdFromFilterId(filterId)` mappe un ID de filtre vers un ID de colonne
- Si un filtre mappe vers une colonne, l'ajout du filtre ouvre la modal `ColumnFilterModal` pour cette colonne
- Sinon, le filtre est ajouté directement dans la liste des filtres

### 3.4 Conditions de Filtrage
- **Types de conditions** :
  - **Texte** : `'is'`, `'isNot'`, `'contains'`, `'doesNotContain'`
  - **Nombre** : `'equals'`, `'notEquals'`, `'greaterThan'`, `'lessThan'`, `'greaterThanOrEqual'`, `'lessThanOrEqual'`
  - **Date** : `'equals'`, `'before'`, `'after'`, `'between'`
- La condition par défaut est `'is'` pour les filtres texte, `'equals'` pour nombre/date

### 3.5 Affichage des Filtres
- **Dans les headers de colonnes** :
  - Seuls les filtres utilisateur/routine sont affichés (pas les filtres de scope)
  - Un indicateur visuel (badge avec point rouge) apparaît si un filtre utilisateur est actif
- **Dans la modal "Sorting and Filters"** :
  - Les filtres sont affichés avec des chips
  - Les filtres qui ne sont pas dans la routine sélectionnée sont surlignés en orange
  - Les filtres de scope ne sont pas affichés dans cette modal (mais sont appliqués à la table)

### 3.6 Validation des Filtres
- Un filtre doit avoir :
  - Un `filterId` valide (string non vide)
  - Au moins une valeur dans `values` (array non vide)
- Les filtres invalides sont filtrés lors du chargement depuis `localStorage`

---

## 4. Gestion des Utilisateurs et Équipes

### 4.1 Utilisateurs
- **Structure** :
  - `id` : Identifiant unique
  - `name` : Nom de l'utilisateur
  - `email` : Email
  - `role` : `'manager' | 'user'`
  - `teamId` : ID de l'équipe (optionnel, legacy)
  - `assignedScopeIds` : Scopes assignés individuellement (optionnel)
  - `assignedRoutineIds` : Routines assignées individuellement (optionnel)
  - Des timestamps (`createdAt`, `updatedAt`)

### 4.2 Utilisateur actuel
- L'utilisateur actuel est stocké dans `localStorage` avec la clé `pelico-current-user-id`
- Par défaut : `'user-admin-pelico'` (mock)
- Fonctions : `getCurrentUserId()`, `setCurrentUserId()`, `getCurrentUser()`

### 4.3 Équipes
- **Structure** :
  - `id` : Identifiant unique
  - `name` : Nom de l'équipe
  - `description` : Description (optionnelle)
  - `assignedScopeIds` : Scopes assignés à l'équipe (hérités par les membres)
  - `assignedRoutineIds` : Routines assignées à l'équipe (héritées par les membres)
  - Des timestamps (`createdAt`, `updatedAt`)

### 4.4 Création d'équipes
- **Règle** : Seuls les managers (`role === 'manager'`) peuvent créer de nouvelles équipes
- Lors de la création d'une routine, un manager peut créer une équipe directement depuis la modal
- Si une équipe existe déjà avec le même nom (insensible à la casse), elle est réutilisée

### 4.5 Partage avec les équipes
- Les routines peuvent être partagées avec plusieurs équipes via `teamIds`
- Les utilisateurs membres d'une équipe voient automatiquement les routines partagées avec leur équipe
- Les scopes peuvent être assignés à des équipes (héritage par les membres)

---

## 5. Onboarding et Scoring

### 5.1 Personas
- Les personas sont des rôles utilisateur (ex: `'Approvisionneur'`, `'Acheteur'`, `'Manager Appro'`, etc.)
- Un utilisateur peut sélectionner **plusieurs personas** lors de l'onboarding
- Chaque persona a un ensemble de routines par défaut (`PERSONA_DEFAULT_SETS`)

### 5.2 Scoring des Routines
- **Algorithme de scoring** :
  - **Match de persona** : +5 points par persona correspondante
  - **Match d'objectif** : +3 points par objectif correspondant (dérivé des intents)
  - **Match de zone d'impact** : +2 points par zone d'impact correspondante (dérivé des intents)
  - **Match de fréquence** : +1 point (optionnel, si `preferredFrequency` correspond)
- Les routines sont triées par score décroissant, puis par label alphabétique en cas d'égalité
- Par défaut, les 7 meilleures routines sont retournées (`maxResults = 7`)

### 5.3 Intents et Objectifs
- Les **intents** sont les objectifs sélectionnés par l'utilisateur (ex: `'Piloter'`, `'Corriger'`, `'Anticiper'`, etc.)
- Chaque intent mappe vers des **objectifs** et des **zones d'impact** via `INTENT_TO_OBJECTIVES` et `INTENT_TO_IMPACT_ZONES`
- Les routines sont marquées avec des `objectives` et `impactZones` qui sont comparés aux intents sélectionnés

### 5.4 Modes de sélection
- **Mode normal** : Sélection de personas et intents → scoring → affichage des routines recommandées
- **Mode "Skip to all routines"** : Affiche toutes les routines disponibles (pas de scoring)
- **Mode "I'm not sure of my role yet"** : Affiche toutes les routines sans filtrage par persona

### 5.5 Tâches d'Onboarding
- Les tâches d'onboarding sont persistées dans `localStorage` avec la clé `pelico-onboarding-tasks-status`
- Tâches disponibles :
  - `'define-scope'` : Définir un scope
  - `'create-routine'` : Créer une routine
- Le statut de complétion est sauvegardé et persiste après rechargement

---

## 6. Validation et Contraintes

### 6.1 Validation des Scopes
- **Nom** :
  - Obligatoire (non vide)
  - Max 100 caractères
  - Ne peut pas être uniquement des espaces
- **Description** :
  - Optionnelle
  - Max 500 caractères si fournie
- **Filtres** :
  - Doivent être un tableau
  - Chaque filtre doit avoir un `filterId` valide et au moins une valeur

### 6.2 Validation des Routines
- **Nom** :
  - Obligatoire (non vide)
  - Max 100 caractères
  - Ne peut pas être uniquement des espaces
- **Description** :
  - Optionnelle
  - Max 500 caractères si fournie
- **Scope Mode** :
  - Si `scopeMode === 'scope-fixed'`, `linkedScopeId` doit être fourni et non null

### 6.3 Validation des Données
- **Type Guards** :
  - `isValidScope()` : Vérifie la structure d'un scope
  - `isValidRoutine()` : Vérifie la structure d'une routine
  - `isValidFolder()` : Vérifie la structure d'un dossier de routines
- Les données invalides sont filtrées lors du chargement depuis `localStorage`
- Les données corrompues déclenchent une tentative de nettoyage (suppression de la clé `localStorage`)

---

## 7. Persistance et État

### 7.1 Clés de Stockage localStorage
- `pelico-scopes` : Liste des scopes
- `pelico-routines` : Liste des routines
- `pelico-routine-folders` : Structure de dossiers pour les routines
- `pelico-users` : Liste des utilisateurs
- `pelico-teams` : Liste des équipes
- `pelico-current-scope` : ID du scope actif
- `pelico-current-user-id` : ID de l'utilisateur actuel
- `pelico-onboarding-tasks-status` : Statut des tâches d'onboarding

### 7.2 Gestion des Erreurs
- Toutes les opérations `localStorage` sont wrappées dans des try/catch
- En cas d'erreur :
  - Les erreurs sont loggées dans la console
  - Les fonctions retournent des valeurs par défaut (tableaux vides, null, etc.)
  - Pour les données corrompues, une tentative de nettoyage est effectuée

### 7.3 Migration de Données
- **Migration `teamId` → `teamIds`** :
  - Lors du chargement des routines, si une routine a `teamId` mais pas `teamIds`, elle est migrée
  - `teamIds` est créé avec `[teamId]`
  - `teamId` est supprimé après migration
  - Les routines migrées sont sauvegardées automatiquement

### 7.4 Réinitialisation des Données
- La fonction `resetScopesAndRoutines()` supprime :
  - Les scopes (`pelico-scopes`)
  - Les routines (`pelico-routines`)
  - Les dossiers de routines (`pelico-routine-folders`)
  - Le statut d'onboarding (`pelico-onboarding-tasks-status`)
- **Conserve** : Utilisateurs et équipes
- Après réinitialisation, la page est rechargée automatiquement

### 7.5 État de la Table
- L'état de la table (sorting, filters, pagination) est géré par TanStack Table
- Les filtres sont séparés en :
  - **Scope filters** : Appliqués automatiquement, non modifiables par l'utilisateur dans la modal
  - **User/Routine filters** : Modifiables par l'utilisateur, affichés dans la modal et les headers
- Les deux types sont combinés pour le filtrage effectif de la table

---

## 8. Règles d'Affichage et UX

### 8.1 Indicateurs Visuels
- **Filtres actifs** :
  - Badge vert (`#ADE9DE`) avec point rouge dans les headers de colonnes
  - Badge avec compteur dans le bouton "Sorting and filters"
  - Point rouge sur le bouton si changements non sauvegardés
- **Tri actif** :
  - Badge vert avec numéro de priorité et flèche (↑/↓) dans les headers
- **Routines** :
  - Chip orange pour les filtres/tri non sauvegardés dans la routine sélectionnée

### 8.2 Comportement des Modals
- **Modal "Sorting and Filters"** :
  - État draft séparé de l'état de la table
  - Les changements ne sont appliqués qu'au clic sur "Apply"
  - "Clear all" réinitialise tous les filtres et tris (scope + user)
- **Modal "Column Filter"** :
  - Recherche debounced (300ms)
  - Affichage limité à 50 résultats par défaut
  - Option "Display selected only" pour filtrer les options affichées

### 8.3 Navigation et Routines
- Les routines sont accessibles via la sidebar dans "MY ROUTINES" et "SHARED ROUTINES"
- Limite d'affichage : 5 routines avant le bouton "View all"
- Tri : Par nom (alphabétique)
- Drag & Drop : Réorganisation des routines dans les dossiers
- Clic sur une routine : Navigation vers la vue avec les paramètres de la routine

---

## 9. Règles Spécifiques aux Composants

### 9.1 PurchaseOrderBookPage
- Combine les filtres de scope et utilisateur pour le filtrage de la table
- Détecte les changements non sauvegardés en comparant l'état actuel avec la routine sélectionnée
- Gère la sauvegarde/mise à jour des routines avec l'état actuel de la table

### 9.2 SortingAndFiltersPopover
- Gère un état draft séparé pour éviter les modifications accidentelles
- Synchronise l'état draft avec l'état de la table lors de l'ouverture/fermeture
- Affiche les différences entre l'état draft et la routine sélectionnée

### 9.3 ColumnHeader
- Affiche uniquement les filtres utilisateur (pas les filtres de scope)
- Le clic sur le header toggle le tri : none → asc → desc → none
- Le menu contextuel permet d'accéder au filtre, au tri, et à la gestion des colonnes

---

## Notes Importantes

1. **Séparation Scope/User Filters** : Les filtres de scope sont appliqués automatiquement mais ne sont pas modifiables par l'utilisateur dans la modal de filtres. Seuls les filtres utilisateur/routine sont affichés et modifiables.

2. **Priorité des Filtres** : User/Routine filters > Scope filters pour la même colonne.

3. **Migration Legacy** : Le système gère la migration automatique de `teamId` vers `teamIds` pour la compatibilité avec les anciennes données.

4. **Validation Robuste** : Toutes les données chargées depuis `localStorage` sont validées avec des type guards pour éviter les erreurs de runtime.

5. **État Draft** : La modal "Sorting and Filters" utilise un état draft pour permettre à l'utilisateur de faire des modifications sans les appliquer immédiatement.



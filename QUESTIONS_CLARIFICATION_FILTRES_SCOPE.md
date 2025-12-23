# Questions de Clarification - Affichage des Filtres de Scope

## Contexte
Vous souhaitez que lorsque vous créez un scope, les filtres de ce scope apparaissent :
1. **Sur les headers des colonnes** (actuellement, seuls les filtres utilisateur/routine sont affichés)
2. **Dans la modal "Sorting and Filters"** avec une section plié/déplié

---

## Questions de Clarification

### 1. Headers des Colonnes

#### 1.1 Indicateur visuel
- **Question** : Comment distinguer visuellement les filtres de scope des filtres utilisateur/routine dans les headers ?
  - Option A : Badge différent (ex: badge bleu pour scope, badge vert pour user)
  - Option B : Icône différente (ex: icône "Target" pour scope, icône "Filter" pour user)
  - Option C : Les deux (badge + icône)
  - Option D : Autre suggestion ?

#### 1.2 Interaction
- **Question** : Les filtres de scope doivent-ils être modifiables depuis les headers ?
  - Option A : Non, affichage uniquement (read-only)
  - Option B : Oui, mais avec confirmation (ex: "Ce filtre vient du scope X, voulez-vous le modifier ?")
  - Option C : Oui, directement modifiables (mais cela modifierait le scope lui-même)

#### 1.3 Menu contextuel
- **Question** : Dans le menu contextuel du header, faut-il ajouter une option pour voir/modifier les filtres de scope ?
  - Option A : Oui, ajouter "View scope filters" qui ouvre la modal d'édition du scope
  - Option B : Non, les filtres de scope sont visibles mais non modifiables depuis les headers
  - Option C : Oui, mais seulement si l'utilisateur est propriétaire du scope

---

### 2. Modal "Sorting and Filters"

#### 2.1 Position de la section Scope Filters
- **Question** : Où placer la section "Scope Filters" dans la modal ?
  - Option A : En haut, avant la section "Sorting"
  - Option B : Entre "Sorting" et "Filters" (user/routine filters)
  - Option C : En bas, après tous les autres filtres
  - Option D : Dans un onglet séparé

#### 2.2 État par défaut (plié/déplié)
- **Question** : La section "Scope Filters" doit-elle être :
  - Option A : **Pliée par défaut** (collapsed)
  - Option B : **Dépliée par défaut** (expanded)
  - Option C : **Dépliée si des filtres de scope existent**, pliée sinon

#### 2.3 Titre et description
- **Question** : Quel titre et description pour la section ?
  - Option A : **"Scope Filters"** avec sous-titre "Filters from scope: [Nom du scope]"
  - Option B : **"Active Scope Filters"** avec sous-titre "These filters are automatically applied from your current scope"
  - Option C : **"[Nom du scope] Filters"** directement
  - Option D : Autre suggestion ?

#### 2.4 Affichage des filtres
- **Question** : Comment afficher les filtres de scope dans la section ?
  - Option A : Chips similaires aux filtres utilisateur, mais avec un style différent (ex: bordure bleue)
  - Option B : Liste simple avec icône "Target" ou "Scope"
  - Option C : Chips avec badge "SCOPE" ou icône distinctive
  - Option D : Autre suggestion ?

#### 2.5 Interaction dans la modal
- **Question** : Les filtres de scope doivent-ils être modifiables depuis la modal ?
  - Option A : **Non, affichage uniquement** (read-only) avec un lien "Edit scope" qui ouvre la modal d'édition du scope
  - Option B : **Oui, modifiables** mais avec un avertissement que cela modifiera le scope lui-même
  - Option C : **Oui, mais seulement si l'utilisateur est propriétaire du scope**

#### 2.6 Gestion des conflits
- **Question** : Si un filtre de scope et un filtre utilisateur existent pour la même colonne, comment les afficher ?
  - Option A : Afficher les deux avec un indicateur que le filtre utilisateur écrase le filtre de scope
  - Option B : Afficher uniquement le filtre utilisateur avec un badge "Overrides scope filter"
  - Option C : Afficher le filtre de scope en grisé/strikethrough et le filtre utilisateur en normal

#### 2.7 Compteur de filtres
- **Question** : Le badge de compteur sur le bouton "Sorting and filters" doit-il inclure les filtres de scope ?
  - Option A : **Oui**, inclure tous les filtres (scope + user) dans le compteur
  - Option B : **Non**, compter uniquement les filtres utilisateur/routine (comportement actuel)
  - Option C : **Oui**, mais avec un indicateur séparé (ex: "5 (3 scope + 2 user)")

---

### 3. Comportement Général

#### 3.1 Scope sans filtres
- **Question** : Si le scope actif n'a pas de filtres, faut-il afficher la section "Scope Filters" (vide) dans la modal ?
  - Option A : **Oui**, afficher la section avec un message "No scope filters"
  - Option B : **Non**, masquer complètement la section si aucun filtre

#### 3.2 Changement de scope
- **Question** : Lors du changement de scope, faut-il :
  - Option A : **Recharger automatiquement** les filtres de scope dans les headers et la modal
  - Option B : **Afficher un message** demandant confirmation avant d'appliquer les nouveaux filtres
  - Option C : **Appliquer immédiatement** sans confirmation (comportement actuel)

#### 3.3 Scope non défini
- **Question** : Si aucun scope n'est actif (`currentScopeId === null`), faut-il :
  - Option A : **Masquer complètement** la section "Scope Filters"
  - Option B : **Afficher la section** avec un message "No active scope" et un bouton "Create scope"

---

### 4. Design et UX

#### 4.1 Style visuel
- **Question** : Quel style visuel pour distinguer les filtres de scope ?
  - Option A : **Couleur bleue** pour les filtres de scope (cohérent avec le thème scope)
  - Option B : **Couleur grise** pour indiquer qu'ils sont en lecture seule
  - Option C : **Bordure pointillée** pour les filtres de scope
  - Option D : Autre suggestion ?

#### 4.2 Icônes
- **Question** : Quelle icône utiliser pour les filtres de scope ?
  - Option A : **Target** (cible) - déjà utilisée dans ScopeModal
  - Option B : **Filter** avec un badge "S"
  - Option C : **Layers** ou **Folder** pour indiquer un niveau hiérarchique
  - Option D : Autre suggestion ?

#### 4.3 Tooltip/Info
- **Question** : Faut-il ajouter un tooltip ou une info-bulle expliquant ce que sont les filtres de scope ?
  - Option A : **Oui**, tooltip au survol du titre de la section
  - Option B : **Oui**, icône d'info à côté du titre avec explication au clic
  - Option C : **Non**, le titre est suffisamment explicite

---

## Recommandations (basées sur les meilleures pratiques UX)

### Pour les Headers :
1. **Indicateur visuel distinct** : Badge bleu avec icône "Target" pour les filtres de scope
2. **Read-only** : Affichage uniquement, pas de modification directe depuis les headers
3. **Menu contextuel** : Option "View scope filters" qui ouvre la modal d'édition du scope (si propriétaire)

### Pour la Modal :
1. **Position** : En haut, avant "Sorting" (les filtres de scope sont la base, les filtres utilisateur sont des surcouches)
2. **État par défaut** : Déplié si des filtres existent, plié sinon
3. **Titre** : "Scope Filters" avec sous-titre "[Nom du scope]"
4. **Style** : Chips avec bordure bleue et icône "Target"
5. **Interaction** : Read-only avec lien "Edit scope" si propriétaire
6. **Conflits** : Afficher le filtre utilisateur avec badge "Overrides scope filter"

---

## Prochaines Étapes

Une fois ces questions clarifiées, je pourrai implémenter :
1. L'affichage des filtres de scope dans les headers de colonnes
2. La section plié/déplié dans la modal "Sorting and Filters"
3. La gestion des interactions (read-only vs modifiable)
4. Le style visuel approprié pour distinguer les filtres de scope



# Prompt d'implémentation : Wizard "Manage Team"

## Contexte
Créer un wizard "Manage Team" similaire au wizard "Create Routine" (même structure, style et UX). Le wizard permet de configurer les équipes, assigner des membres, des routines et des scopes.

## Structure du wizard

### Nombre d'étapes : 4 étapes (décision UX optimale)
1. **Step 0: Configuration Type Selection** - Choisir comment créer les équipes
2. **Step 1: Teams Setup** - Créer/configurer les équipes
3. **Step 2: Members & Routines Assignment** - Assigner membres et routines aux équipes
4. **Step 3: Scopes Assignment & Review** - Assigner scopes et réviser/modifier toute la configuration

### Étape 0 : Configuration Type Selection
- **Style** : Identique à `SearchTypeSelectionStep` du wizard "Create Routine"
- **Options** :
  - **"Create teams from personas"** : Utilise les personas sélectionnés dans "Create Routine" pour créer automatiquement des équipes
    - Icône : `Users`
    - Description : "Automatically create teams based on roles selected in routine creation"
  - **"Manual setup"** : Création manuelle des équipes sans base persona
    - Icône : `Settings` ou `Edit`
    - Description : "Create and configure teams manually with full control"
- **Comportement** : Navigation vers Step 1 avec le type sélectionné

### Étape 1 : Teams Setup
- **Si "Create teams from personas"** :
  - Récupérer les personas depuis les routines créées dans "Create Routine"
  - Créer automatiquement une équipe par persona (ex: "Supply Planner Team", "Buyer Team")
  - Afficher les équipes créées avec possibilité de :
    - Modifier le nom (inline editing ou modal)
    - Supprimer une équipe
    - Ajouter une nouvelle équipe manuellement
  - Si une équipe avec le même nom existe déjà : demander confirmation (modal) :
    - Option A : Utiliser l'équipe existante
    - Option B : Créer une nouvelle équipe avec un nom modifié
    - Option C : Annuler
- **Si "Manual setup"** :
  - Liste vide avec bouton "Add Team"
  - Formulaire pour créer une équipe : nom (requis), description (optionnel)
  - Liste des équipes créées avec possibilité de modifier/supprimer
- **Affichage** : Cartes avec informations (nom, nombre de membres: 0, routines assignées: 0)
- **Validation** : Au moins une équipe doit être créée pour continuer

### Étape 2 : Members & Routines Assignment
- **Section Membres** :
  - Afficher toutes les équipes créées à l'étape 1
  - Pour chaque équipe :
    - Liste des membres assignés (vide initialement)
    - Bouton "Add Members" ou zone de sélection
    - **Interface d'assignation** : **Vue en grille recommandée** (équipes en colonnes, membres disponibles en lignes) avec checkboxes pour assignation multiple
    - Afficher : Nom et prénom des membres
    - Un membre peut être assigné à plusieurs équipes (checkboxes multiples)
    - Indicateur visuel si un membre est déjà dans une autre équipe (badge ou icône)
  - **Source des membres** : Liste mock de 5 personnes par équipe (créer des utilisateurs mock si nécessaire)
  - **Feedback** : Indicateur de progression "X/Y membres assignés" par équipe
  
- **Section Routines** :
  - **Routines disponibles** : Uniquement les routines créées dans "Create Routine"
  - Pour chaque équipe :
    - Liste des routines assignées (vide initialement)
    - **Suggestion automatique** : Basée sur le persona de l'équipe (si créée depuis un persona)
      - Si équipe "Supply Planner Team" → suggérer routines avec persona "Supply Planner"
    - Bouton "Assign Routines" ou zone de sélection
    - **Interface** : Vue par équipe - pour chaque équipe, afficher une liste de routines avec checkboxes
    - Afficher pour chaque routine : nom, description, persona associé (badge)
    - Une routine peut être assignée à plusieurs équipes (checkboxes multiples)
  - **Feedback** : Indicateur "X/Y routines assignées" par équipe

- **Layout** : Deux colonnes ou sections scrollables séparées (Membres à gauche, Routines à droite)

### Étape 3 : Scopes Assignment & Review
- **Section Scopes** :
  - **Scopes disponibles** : Scopes globaux (`isGlobal: true`) + scopes de l'utilisateur actuel (`userId === currentUserId`)
  - **Vue combinée** : Afficher les équipes avec leurs membres et leurs scopes
  - **Niveau d'assignation** :
    - **Scopes d'équipe** : Assignés à l'équipe (hérités par tous les membres)
    - **Scopes individuels** : Assignés directement à un membre (prioritaires)
  - **Logique de combinaison** : Union des filtres (Option B)
    - Si équipe a Scope A et membre a Scope B → membre voit union de A et B
  - **Scope par défaut** : Chaque membre peut avoir un scope "par défaut" principal (premier dans la liste ou marqué explicitement)
  - **Interface** :
    - Vue hiérarchique : Équipe → Membres → Scopes
    - Pour chaque équipe : Section "Team Scopes" avec checkboxes
    - Pour chaque membre : Section "Individual Scopes" avec checkboxes + option "Set as default"
    - Afficher pour chaque scope : nom, description, filtres (tooltip ou expandable)
  - **Création de scopes** : Si aucun scope n'existe, bouton "Create Scope" qui ouvre `ScopeModal`

- **Section Review** :
  - Vue d'ensemble de toute la configuration :
    - Liste des équipes avec :
      - Nombre de membres
      - Routines assignées (liste ou count)
      - Scopes d'équipe
    - Possibilité de modifier chaque section :
      - Bouton "Edit Teams" → retour Step 1
      - Bouton "Edit Members & Routines" → retour Step 2
      - Bouton "Edit Scopes" → reste sur Step 3, scroll vers section scopes
  - **Feedback visuel** :
    - Badges de statut : "Complete" (vert) / "Incomplete" (orange) pour chaque équipe
    - Indicateurs de progression : "3/5 membres assignés", "2/3 routines assignées"

## Structure technique

### Composants à créer
1. `OnboardingTeamBuilder.tsx` - Composant principal (similaire à `OnboardingRoutineBuilder.tsx`)
2. `TeamConfigurationTypeStep.tsx` - Step 0 (similaire à `SearchTypeSelectionStep.tsx`)
3. `TeamSetupStep.tsx` - Step 1
4. `MembersAndRoutinesStep.tsx` - Step 2
5. `ScopesAndReviewStep.tsx` - Step 3

### État et persistance
- **Storage Key** : `'pelico-onboarding-team-state'`
- **État à sauvegarder** :
  ```typescript
  interface TeamOnboardingState {
    configurationType: 'personas' | 'manual' | null;
    teams: Array<{
      id?: string; // Si équipe existante
      name: string;
      description?: string;
      persona?: Persona; // Si créée depuis persona
      memberIds: string[];
      routineIds: string[];
      scopeIds: string[];
    }>;
    currentStep: number;
  }
  ```

### Récupération des données
- **Personas** : Depuis les routines créées dans "Create Routine"
  - Fonction : `getPersonasFromCreatedRoutines()` → extraire les personas uniques des routines créées
- **Routines** : Depuis `getRoutines()` filtrées par `createdBy === currentUserId` et créées récemment (ou marquées comme "onboarding")
- **Utilisateurs** : Liste mock de 5 personnes par équipe
  - Créer des utilisateurs mock si nécessaire : `createMockUsersForTeams(teamIds: string[])`
- **Scopes** : `getScopes()` filtrés par `isGlobal === true || userId === currentUserId`

## Logique métier

### Création des équipes depuis personas
1. Récupérer les personas depuis les routines créées
2. Pour chaque persona unique :
   - Vérifier si équipe avec nom `"{Persona} Team"` existe déjà
   - Si oui : Modal de confirmation
   - Si non : Créer équipe avec `createTeam()`
3. Stocker le mapping persona → équipe pour suggestions de routines

### Assignation des routines
- **Suggestion automatique** :
  - Pour chaque équipe créée depuis un persona :
    - Filtrer les routines qui ont ce persona dans `routine.personas[]`
    - Pré-sélectionner ces routines
- **Assignation** : Mettre à jour `Routine.teamIds[]` avec les IDs des équipes

### Assignation des scopes
- **Scopes d'équipe** : Stocker dans `Team.assignedScopeIds[]`
- **Scopes individuels** : Stocker dans `User.assignedScopeIds[]`
- **Logique d'union** : Lors de l'affichage des données pour un membre :
  - Récupérer scopes de l'équipe (`Team.assignedScopeIds[]`)
  - Récupérer scopes individuels (`User.assignedScopeIds[]`)
  - Combiner les filtres (union)

### Scope par défaut
- Ajouter champ `defaultScopeId?: string` à `User`
- Dans l'interface : Radio button ou dropdown pour sélectionner le scope par défaut

## Accessibilité et validation

### Conditions d'accès
- Le wizard n'est accessible qu'après avoir complété "Create Routine"
- Vérifier : `getRoutines().length > 0` et au moins une routine créée par l'utilisateur actuel

### Cas limites
- **Aucun persona sélectionné** :
  - Afficher message dans Step 0 : "No personas found from routines. You can still create teams manually."
  - Option "Manual setup" toujours disponible
- **Aucune routine créée** : Ne devrait pas arriver (wizard inaccessible)
- **Aucun utilisateur** : Créer liste mock de 5 utilisateurs par équipe
- **Aucun scope** : Bouton "Create Scope" dans Step 3 qui ouvre `ScopeModal`

### Validation
- **Step 1** : Au moins une équipe créée
- **Step 2** : Pas de validation obligatoire (peut continuer sans assigner)
- **Step 3** : Pas de validation obligatoire (peut continuer sans assigner scopes)
- **Final** : Validation uniquement à la dernière étape (Step 3)

## Style et UX

### Style visuel
- **Identique à "Create Routine"** :
  - Header avec gradient (`from-[#31C7AD]/10 via-[#2063F0]/5`)
  - Indicateur de progression (4 cercles : 0, 1, 2, 3)
  - Même structure de footer (Back / Continue)
  - Bannière d'information en haut de chaque étape
  - Tooltips sur les éléments interactifs

### Feedback visuel
- **Indicateurs de progression** : "X/Y membres assignés", "X/Y routines assignées"
- **Badges de statut** : "Complete" (vert), "Incomplete" (orange)
- **Cartes d'équipes** : Nom, nombre de membres, routines assignées, scopes

### Messages d'aide
- Bannière d'information en haut de chaque étape (comme "Create Routine")
- Tooltips sur :
  - Icônes d'information
  - Boutons d'action
  - Badges de statut
  - Scopes (afficher filtres au hover)

## Actions finales

### Après "Complete Setup"
1. Créer/sauvegarder toutes les équipes configurées
2. Assigner les membres aux équipes (`User.teamId` ou système multi-équipes si nécessaire)
3. Assigner les routines aux équipes (`Routine.teamIds[]`)
4. Assigner les scopes aux équipes (`Team.assignedScopeIds[]`)
5. Assigner les scopes aux membres (`User.assignedScopeIds[]` et `User.defaultScopeId`)
6. Marquer la tâche "Manage team" comme complétée (`updateTaskStatus('manage-team', true)`)
7. Fermer le wizard
8. Rester sur la page Home
9. Nettoyer l'état d'onboarding (`localStorage.removeItem('pelico-onboarding-team-state')`)

### Modification après complétion
- Possibilité de rouvrir le wizard pour modifier
- Charger l'état actuel (équipes, membres, routines, scopes) dans le wizard
- Permettre de modifier chaque section

## Décisions d'architecture

### T2 : Stockage des routines
- **Décision** : Les routines créées dans "Create Routine" sont stockées avec `teamIds: []` (privées) par défaut
- Lors de l'assignation dans "Manage Team", mettre à jour `Routine.teamIds[]` avec les IDs des équipes
- Cela permet de partager une routine entre plusieurs équipes

### T3 : Stockage des scopes
- **Décision** : Stockage hybride
  - **Scopes d'équipe** : `Team.assignedScopeIds[]` (hérités par les membres)
  - **Scopes individuels** : `User.assignedScopeIds[]` (prioritaires)
  - **Scope par défaut** : `User.defaultScopeId` (string | null)
- **Logique d'union** : Lors de l'affichage des données pour un membre :
  ```typescript
  const getMemberScopes = (userId: string, teamId: string | null) => {
    const user = getUser(userId);
    const teamScopes = teamId ? getTeam(teamId)?.assignedScopeIds || [] : [];
    const userScopes = user?.assignedScopeIds || [];
    return [...teamScopes, ...userScopes]; // Union (dédupliquer si nécessaire)
  };
  ```

## Mock data

### Utilisateurs mock
Créer 5 utilisateurs mock par équipe avec :
- Nom et prénom réalistes
- Email généré
- Rôle : 'user' (sauf admin)
- `teamId: null` initialement

Exemple :
```typescript
const MOCK_USERS_PER_TEAM = [
  { name: 'John', surname: 'Doe', email: 'john.doe@company.com' },
  { name: 'Jane', surname: 'Smith', email: 'jane.smith@company.com' },
  // ... 3 autres
];
```

## Checklist d'implémentation

- [ ] Créer `OnboardingTeamBuilder.tsx` avec structure de base
- [ ] Créer `TeamConfigurationTypeStep.tsx` (Step 0)
- [ ] Créer `TeamSetupStep.tsx` (Step 1)
- [ ] Créer `MembersAndRoutinesStep.tsx` (Step 2)
- [ ] Créer `ScopesAndReviewStep.tsx` (Step 3)
- [ ] Implémenter la logique de récupération des personas depuis les routines
- [ ] Implémenter la création automatique d'équipes depuis personas
- [ ] Implémenter la gestion des équipes existantes (confirmation)
- [ ] Créer la liste mock d'utilisateurs
- [ ] Implémenter l'assignation de membres aux équipes (multi-équipes)
- [ ] Implémenter la suggestion automatique de routines par persona
- [ ] Implémenter l'assignation de routines aux équipes
- [ ] Implémenter l'assignation de scopes aux équipes
- [ ] Implémenter l'assignation de scopes aux membres
- [ ] Implémenter le scope par défaut
- [ ] Implémenter la logique d'union des scopes
- [ ] Implémenter la création de scopes depuis le wizard
- [ ] Implémenter la section Review avec possibilité de modification
- [ ] Implémenter la persistance dans localStorage
- [ ] Implémenter la récupération d'état
- [ ] Implémenter la validation et les messages d'erreur
- [ ] Implémenter les indicateurs de progression et badges de statut
- [ ] Implémenter les tooltips et messages d'aide
- [ ] Intégrer le wizard dans `HomePage.tsx`
- [ ] Mettre à jour la tâche "Manage team" après complétion
- [ ] Tester tous les cas limites

## Notes supplémentaires

- Le wizard doit être cohérent avec "Create Routine" en termes de style et d'UX
- Privilégier la simplicité et la clarté dans l'interface
- Permettre à l'utilisateur de revenir en arrière et modifier à tout moment
- Fournir des feedbacks visuels clairs sur l'état de la configuration
- Gérer gracieusement les cas limites et erreurs




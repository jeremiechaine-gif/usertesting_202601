# Debug Step 4 - Problème d'affichage

## Problème
L'utilisateur ne voit aucun changement à l'étape 4 du SimpleOnboardingWizard.

## Vérifications à faire

1. **Vérifier que le `useEffect` se déclenche** :
   - Ouvrir la console du navigateur
   - Aller à l'étape 4
   - Chercher le log : `[RoutineSelectionStep] Auto-navigating to recommended-routines for team:`

2. **Vérifier le `currentSubstep`** :
   - Dans la console, vérifier la valeur de `currentSubstep.step3`
   - Elle devrait être `'recommended-routines'` si le `useEffect` a fonctionné

3. **Vérifier les équipes avec persona** :
   - Vérifier que `teamsWithPersona.length > 0`
   - Vérifier que la première équipe n'a pas de routines assignées

4. **Vérifier le rendu conditionnel** :
   - Le code vérifie `if (currentSubstep === 'recommended-routines' && currentTeamForSubstep)`
   - Si `currentTeamForSubstep` est `null`, rien ne s'affiche

## Solution temporaire pour tester

Pour forcer l'affichage de la sous-étape 4.1, vous pouvez temporairement modifier le code dans `RoutineSelectionStep.tsx` :

```typescript
// Ligne ~417, remplacer :
if (currentSubstep === 'recommended-routines' && currentTeamForSubstep) {

// Par :
if (currentSubstep === 'recommended-routines') {
  console.log('[DEBUG] currentSubstep:', currentSubstep);
  console.log('[DEBUG] currentTeamForSubstep:', currentTeamForSubstep);
  console.log('[DEBUG] teamsWithPersona:', teamsWithPersona);
  
  if (!currentTeamForSubstep && teamsWithPersona.length > 0) {
    // Fallback: utiliser la première équipe
    const fallbackTeam = teamsWithPersona[0];
    // ... utiliser fallbackTeam au lieu de currentTeamForSubstep
  }
```

## Points à vérifier dans le code

1. **SimpleOnboardingWizard.tsx ligne 534** :
   ```typescript
   currentSubstep={currentSubstep.step3 || 'team-selection'}
   ```
   - Vérifier que `currentSubstep.step3` est bien mis à jour

2. **RoutineSelectionStep.tsx ligne 333-341** :
   - Le `useEffect` devrait se déclencher quand `teamsWithPersona` change
   - Vérifier que `onSubstepChange` est bien appelé

3. **RoutineSelectionStep.tsx ligne 325-330** :
   - `currentTeamForSubstep` dépend de `currentSubstep`, `teamsWithPersona`, et `currentTeamIndex`
   - Si `currentSubstep` n'est pas `'recommended-routines'` ou `'routine-preview'`, il retourne `null`

## Test manuel

Pour tester rapidement, vous pouvez ajouter un bouton temporaire dans la vue `team-selection` qui force la navigation :

```typescript
<Button onClick={() => {
  if (onSubstepChange && teamsWithPersona.length > 0) {
    onSubstepChange('recommended-routines');
  }
}}>
  Test: Go to Recommended Routines
</Button>
```

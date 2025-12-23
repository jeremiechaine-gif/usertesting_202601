# Questions de clarification pour le Layer 3

## Contexte
Le Layer 3 doit afficher le contenu de configuration d'un filtre directement dans la modal principale (pas de modal séparée). Le contenu doit pouvoir s'afficher dans différents contextes (liste de filtres possibles, détail d'un filtre).

## Questions

### 1. Structure du Layer 3
**Q1.1** : Le Layer 3 doit-il remplacer complètement le contenu de la modal, ou doit-il s'afficher dans une section spécifique ?
- Option A : Le Layer 3 remplace tout le contenu scrollable (comme le Layer 2)
- Option B : Le Layer 3 s'affiche dans une section dédiée avec un header spécifique

**Q1.2** : Le header principal de la modal doit-il changer quand on est au Layer 3 ?
- Le titre "Configure [Nom du filtre]" est déjà géré dans le header principal
- Faut-il garder le même style de header (gradient, icône Target) ou un style différent ?

### 2. Contenu du Layer 3
**Q2.1** : Le Layer 3 doit-il afficher :
- Option A : Uniquement le formulaire de configuration du filtre (condition, recherche, liste des valeurs, sélection)
- Option B : Le formulaire + des informations supplémentaires (description du filtre, catégorie, etc.)

**Q2.2** : Pour les filtres avec options prédéfinies (ex: Buyer Codes), le Layer 3 doit-il afficher :
- La même interface que `ColumnFilterModal` (recherche, checkboxes, "Display Selected only", etc.) ?
- Ou une interface simplifiée ?

**Q2.3** : Pour les filtres sans options prédéfinies (ex: nombre, date, texte), comment gérer l'input ?
- Option A : Champs de saisie simples (input number, date picker, text input)
- Option B : Interface plus complexe avec conditions avancées

### 3. Navigation et actions
**Q3.1** : Le bouton "Back" dans le header doit-il :
- Retourner au Layer 2 (liste des filtres) ?
- Ou retourner directement au Layer 1 (formulaire principal) ?

**Q3.2** : Faut-il un footer avec des boutons d'action dans le Layer 3 ?
- Option A : Oui, avec "Cancel" et "Apply" (comme dans `ColumnFilterModal`)
- Option B : Non, les actions sont intégrées dans le contenu (ex: bouton "Apply" en bas de la liste)

**Q3.3** : Après validation dans le Layer 3 :
- Retour automatique au Layer 1 (comme actuellement) ?
- Ou retour au Layer 2 pour ajouter d'autres filtres ?

### 4. Réutilisation du code existant
**Q4.1** : Dois-je créer un composant partagé pour le contenu de `ColumnFilterModal` (sans le Dialog wrapper) ?
- Option A : Oui, créer `ColumnFilterContent` et l'utiliser dans `ColumnFilterModal` ET dans le Layer 3
- Option B : Non, dupliquer le code pour le Layer 3

**Q4.2** : Le Layer 3 doit-il avoir exactement le même comportement que `ColumnFilterModal` ?
- Même recherche, même affichage des options, mêmes interactions ?
- Ou peut-on simplifier pour le contexte du scope ?

### 5. États et transitions
**Q5.1** : Quand on clique sur un filtre dans le Layer 2, doit-on :
- Option A : Naviguer immédiatement au Layer 3 avec le contenu chargé
- Option B : Afficher un loader pendant le chargement des options, puis afficher le Layer 3

**Q5.2** : Si un filtre a déjà des valeurs sélectionnées (édition), doit-on :
- Pré-sélectionner ces valeurs dans le Layer 3 ?
- Afficher un indicateur visuel que c'est une édition ?

## Recommandations
En attendant vos réponses, je recommande :
1. **Structure** : Layer 3 remplace le contenu scrollable (comme Layer 2)
2. **Contenu** : Réutiliser la logique de `ColumnFilterModal` mais sans le Dialog wrapper
3. **Navigation** : Back → Layer 2, Apply → Layer 1 avec toast de succès
4. **Footer** : Pas de footer séparé, intégrer les actions dans le contenu


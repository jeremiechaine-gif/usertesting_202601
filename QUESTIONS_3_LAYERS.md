# Questions de clarification : 3 Layers dans la modal "Define your scope"

## Structure confirmée

1. **Layer 1 (par défaut)** : Formulaire "Define your scope" (nom, description, liste des filtres ajoutés)
2. **Layer 2** : Liste des filtres disponibles (quand on clique sur "Add filter")
3. **Layer 3** : Détail d'un filtre spécifique (quand on clique sur un filtre dans la liste)

## Questions de clarification

### 1. Navigation et boutons

**Question 1.1 : Bouton "Back" dans Layer 3**
- Le bouton "Back" dans le Layer 3 (détail du filtre) doit-il :
  - Retourner au Layer 2 (liste des filtres) ?
  - Ou retourner directement au Layer 1 (formulaire principal) ?

**Question 1.2 : Bouton "Back" dans Layer 2**
- Dans le Layer 2 (liste des filtres), faut-il un bouton "Back" pour retourner au Layer 1 ?
- Ou le bouton "X" de la modal suffit-il pour fermer complètement ?

**Question 1.3 : Position du bouton "Back"**
- Où placer le bouton "Back" dans le Layer 3 ?
  - En haut à gauche du contenu (à côté du titre) ?
  - Dans le header de la modal (à côté du titre principal) ?
  - Autre position ?

### 2. Titre de la modal

**Question 2.1 : Titre dynamique**
- Le titre de la modal doit-il changer selon le layer ?
  - Layer 1 : "Define Your Scope" (ou titre personnalisé)
  - Layer 2 : "Add Filter" ?
  - Layer 3 : "Configure [Nom du filtre]" ?
- Ou garder le même titre et afficher le contexte ailleurs (breadcrumb, sous-titre) ?

**Question 2.2 : Breadcrumb ou indicateur**
- Faut-il un indicateur visuel montrant où on se trouve ?
  - Breadcrumb : "Define Your Scope > Add Filter > Buyer Code" ?
  - Indicateur de pas : "Step 1/3", "Step 2/3", "Step 3/3" ?
  - Pas d'indicateur ?

### 3. Validation et application du filtre

**Question 3.1 : Après validation dans Layer 3**
- Quand on valide un filtre dans le Layer 3, que se passe-t-il ?
  - Option A : Retour automatique au Layer 2 (liste des filtres) avec message de succès ?
  - Option B : Retour automatique au Layer 1 (formulaire principal) avec le filtre ajouté ?
  - Option C : Reste sur le Layer 3 pour permettre d'ajouter d'autres valeurs ?

**Question 3.2 : Message de succès**
- Après validation d'un filtre, faut-il afficher un message de succès ?
  - Toast/snackbar en bas de l'écran ?
  - Message dans la modal elle-même ?
  - Pas de message, juste retour au layer précédent ?

**Question 3.3 : Filtre ajouté**
- Après validation, le filtre doit-il apparaître immédiatement dans le Layer 1 ?
  - Oui, retour au Layer 1 avec le filtre visible dans la liste
  - Non, reste sur Layer 2 pour ajouter d'autres filtres

### 4. Annulation et fermeture

**Question 4.1 : Bouton "Cancel" dans Layer 3**
- Faut-il un bouton "Cancel" dans le Layer 3 en plus du bouton "Back" ?
  - "Back" = retour au Layer 2
  - "Cancel" = retour au Layer 1 (annule les modifications du filtre) ?

**Question 4.2 : Fermeture de la modal**
- Quand on ferme la modal (bouton X ou clic extérieur) depuis le Layer 2 ou 3 :
  - Ferme directement la modal (perd les modifications non sauvegardées) ?
  - Retourne d'abord au Layer précédent (puis ferme si on clique à nouveau) ?

**Question 4.3 : Modifications non sauvegardées**
- Si on modifie un filtre dans le Layer 3 puis qu'on clique sur "Back", que se passe-t-il ?
  - Les modifications sont perdues ?
  - Un message de confirmation s'affiche ?
  - Les modifications sont sauvegardées automatiquement ?

### 5. Filtres existants

**Question 5.1 : Édition d'un filtre existant**
- Si un filtre existe déjà dans le scope (Layer 1), que se passe-t-il quand on clique dessus pour l'éditer ?
  - Va directement au Layer 3 avec les valeurs pré-remplies (mode édition) ?
  - Ou passe par le Layer 2 d'abord ?

**Question 5.2 : Distinction visuelle**
- Dans le Layer 2 (liste des filtres), comment distinguer un filtre déjà ajouté ?
  - Badge "Added" ?
  - Icône de check ?
  - Style différent (grisé, bordure) ?
  - Pas de distinction ?

### 6. Design et animation

**Question 6.1 : Animation de transition**
- Faut-il une animation lors du passage entre les layers ?
  - Slide horizontal (glissement) ?
  - Fade (fondu) ?
  - Pas d'animation ?

**Question 6.2 : Hauteur de la modal**
- La hauteur de la modal doit-elle être fixe ou s'adapter au contenu ?
  - Hauteur fixe avec scroll interne ?
  - Hauteur adaptative selon le layer ?

### 7. Comportement spécifique

**Question 7.1 : Recherche dans Layer 2**
- La barre de recherche dans le Layer 2 doit-elle rester visible dans le Layer 3 ?
  - Oui, pour permettre de rechercher d'autres filtres
  - Non, masquée dans le Layer 3

**Question 7.2 : Filtres sans options prédéfinies**
- Pour les filtres sans options prédéfinies (texte, nombre, date), le Layer 3 affiche-t-il :
  - Un formulaire simple avec champs de saisie ?
  - La même structure que ColumnFilterModal mais adaptée ?
  - Autre approche ?

---

## Recommandations suggérées (à valider)

1. **Navigation** :
   - Layer 3 → Layer 2 : Bouton "Back"
   - Layer 2 → Layer 1 : Bouton "Back" ou "X" pour fermer
   - Layer 3 → Layer 1 : Bouton "Cancel" (annule les modifications)

2. **Titre** : Change dynamiquement selon le layer

3. **Validation** : Retour automatique au Layer 1 avec toast de succès

4. **Animation** : Slide horizontal pour les transitions

5. **Breadcrumb** : Afficher le chemin de navigation

Merci de confirmer vos préférences !




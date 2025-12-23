# Questions de clarification : Modal "Define your scope" - Navigation filtre

## Contexte
Dans la modal "Define your scope", quand on clique sur "Add filter", une liste de filtres s'affiche. Actuellement, cliquer sur un filtre ouvre une deuxième modal (ColumnFilterModal) par-dessus. Vous voulez éviter cette superposition et avoir une navigation dans la même modal.

## Questions de clarification

### 1. Navigation et structure de la modal

**Question 1.1 : Structure de navigation**
- Option A : La modal affiche soit la liste des filtres, soit le détail d'un filtre (un seul écran à la fois) ?
- Option B : La modal affiche toujours la liste à gauche et le détail à droite (vue split) ?
- Option C : Autre approche ?

**Question 1.2 : Bouton "Back"**
- Où placer le bouton "Back" ?
  - En haut à gauche du contenu de la modal (à côté du titre) ?
  - Dans le header de la modal (à côté du titre principal) ?
  - Autre position ?
- Quel style pour le bouton "Back" ?
  - Icône flèche seule ?
  - Icône + texte "Back" ?
  - Bouton texte "← Back" ?

**Question 1.3 : Titre de la modal**
- Le titre de la modal doit-il changer selon l'écran affiché ?
  - Liste des filtres : "Define Your Scope" (ou "Add Filter") ?
  - Détail d'un filtre : "Configure [Nom du filtre]" ?
- Ou garder le même titre et afficher le contexte ailleurs ?

### 2. Gestion de l'état et des filtres

**Question 2.1 : Filtre sélectionné**
- Quand on clique sur un filtre dans la liste, comment identifier quel filtre est en cours de configuration ?
  - Afficher le nom du filtre quelque part dans la vue détail ?
  - Le titre de la modal contient le nom du filtre ?

**Question 2.2 : Filtres existants vs nouveaux filtres**
- Si un filtre existe déjà dans le scope, que se passe-t-il quand on clique dessus ?
  - On affiche le détail avec les valeurs déjà sélectionnées (mode édition) ?
  - Même comportement que pour un nouveau filtre (mode création) ?
- Comment distinguer visuellement un filtre déjà ajouté dans la liste "Add filter" ?

**Question 2.3 : Annulation**
- Quand on est dans la vue détail d'un filtre, que fait le bouton "Cancel" ou "X" de la modal ?
  - Retourne à la liste des filtres ?
  - Ferme complètement la modal "Define your scope" ?
- Faut-il un bouton "Cancel" spécifique dans la vue détail en plus du bouton "Back" ?

### 3. Validation et application du filtre

**Question 3.1 : Après validation d'un filtre**
- Quand on valide un filtre dans la vue détail, que se passe-t-il ?
  - Option A : Retour automatique à la liste des filtres (avec message de succès) ?
  - Option B : Reste sur la vue détail pour permettre d'ajouter d'autres valeurs ?
  - Option C : Ferme la modal complètement ?

**Question 3.2 : Message de succès**
- Après validation, faut-il afficher un message de succès ?
  - Toast/snackbar en bas de l'écran ?
  - Message dans la modal elle-même ?
  - Pas de message, juste retour à la liste ?

**Question 3.3 : Mise à jour de la liste**
- Après validation, la liste des filtres doit-elle être mise à jour ?
  - Le filtre validé apparaît dans la liste des filtres ajoutés au scope ?
  - La liste "Add filter" reste ouverte pour ajouter d'autres filtres ?

### 4. Comportement de la modal principale

**Question 4.1 : Fermeture de la modal**
- Quand on ferme la modal "Define your scope" (bouton X ou clic extérieur) depuis la vue détail d'un filtre, que se passe-t-il ?
  - Ferme directement la modal principale (perd les modifications non sauvegardées du filtre) ?
  - Retourne d'abord à la liste des filtres (puis ferme si on clique à nouveau) ?

**Question 4.2 : Scroll et hauteur**
- La modal doit-elle avoir une hauteur fixe avec scroll interne ?
- Ou la hauteur s'adapte-t-elle au contenu (liste vs détail) ?

### 5. Filtres sans options prédéfinies

**Question 5.1 : Filtres texte/nombre/date**
- Pour les filtres sans options prédéfinies (champs texte, nombre, date), comment afficher la vue détail ?
  - Même structure que ColumnFilterModal mais adaptée ?
  - Formulaire simple avec champs de saisie ?
  - Comment gérer les différents types de filtres (texte, nombre, date, etc.) ?

### 6. Design et UX

**Question 6.1 : Animation de transition**
- Faut-il une animation lors du passage de la liste au détail ?
  - Slide (glissement horizontal) ?
  - Fade (fondu) ?
  - Pas d'animation ?

**Question 6.2 : Indicateur de navigation**
- Faut-il un indicateur visuel montrant où on se trouve ?
  - Breadcrumb : "Define Your Scope > Add Filter > [Nom du filtre]" ?
  - Indicateur de pas (1/2, 2/2) ?
  - Pas d'indicateur ?

---

## Recommandations suggérées (à valider)

1. **Structure** : Option A - Un seul écran à la fois (liste OU détail)
2. **Bouton Back** : En haut à gauche du contenu, icône flèche + texte "Back"
3. **Titre** : Change dynamiquement ("Add Filter" → "Configure [Nom]")
4. **Validation** : Retour automatique à la liste avec toast de succès
5. **Annulation** : Bouton Back retourne à la liste, X ferme la modal principale
6. **Animation** : Slide horizontal pour la transition

Merci de confirmer vos préférences pour chaque point !


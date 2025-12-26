# Questions de clarification pour le header de la modal ScopeModal

## Contexte
Modification du header de la modal pour :
1. Ajouter une icône d'information à gauche du titre
2. Déplacer la description dans un tooltip
3. Ajouter sous le header : flèche de retour + titre de l'étape

## Questions

### 1. Icône d'information
**Q1.1** : Quel type d'icône d'information souhaitez-vous ?
- Option A : `Info` (icône "i" dans un cercle)
- Option B : `HelpCircle` (point d'interrogation dans un cercle)
- Option C : `InfoIcon` (autre style)
- Option D : Autre (précisez)

**Q1.2** : Le tooltip doit-il s'afficher :
- Option A : Au survol de l'icône (hover)
- Option B : Au clic sur l'icône
- Option C : Les deux (hover + clic pour garder ouvert)

**Q1.3** : Style de l'icône :
- Couleur : Même couleur que le texte du titre ou couleur spécifique (ex: bleu/vert) ?
- Taille : Même taille que le titre ou plus petite ?

### 2. Tooltip
**Q2.1** : Le contenu du tooltip doit-il être :
- Le même texte que la description actuelle ("A scope is your personal data perimeter...") ?
- Ou un texte différent, plus court/long ?

**Q2.2** : Position du tooltip :
- Option A : En dessous de l'icône
- Option B : À droite de l'icône
- Option C : Au-dessus de l'icône
- Option D : Position automatique selon l'espace disponible

**Q2.3** : Style du tooltip :
- Fond blanc avec bordure ?
- Fond coloré (ex: bleu/vert) ?
- Largeur maximale ?

### 3. Header avec flèche de retour et titre de l'étape
**Q3.1** : La flèche de retour et le titre de l'étape doivent-ils apparaître :
- Option A : Sur tous les layers (Layer 1, 2, 3)
- Option B : Uniquement sur Layer 2 et Layer 3 (pas sur Layer 1)
- Option C : Uniquement sur Layer 3

**Q3.2** : Pour chaque layer, quel est le titre exact à afficher sous le header principal ?
- **Layer 1** : 
  - Option A : "Define Your Scope" (même que le titre principal)
  - Option B : "Scope Details" ou "Scope Information"
  - Option C : Rien (pas de titre sous le header)
  - Option D : Autre (précisez)

- **Layer 2** :
  - Option A : "Add Filter"
  - Option B : "Select Filter"
  - Option C : Autre (précisez)

- **Layer 3** :
  - Option A : "Configure [Nom du filtre]" (ex: "Configure Buyer Codes")
  - Option B : "Filter Configuration"
  - Option C : Autre (précisez)

**Q3.3** : Style de la section sous le header :
- Option A : Ligne simple avec flèche + titre, style discret
- Option B : Section avec fond légèrement coloré/bordure
- Option C : Style similaire au header principal mais plus petit

**Q3.4** : Comportement de la flèche de retour :
- Layer 2 : Retourne au Layer 1 ?
- Layer 3 : Retourne au Layer 2 ?
- Layer 1 : Ne s'affiche pas ou désactivée ?

### 4. Structure visuelle
**Q4.1** : Ordre des éléments dans le header principal (de gauche à droite) :
- Option A : [Icône Target] [Icône Info] [Titre "Define Your Scope"] [X]
- Option B : [Icône Target] [Titre "Define Your Scope"] [Icône Info] [X]
- Option C : Autre arrangement

**Q4.2** : La section avec flèche de retour + titre de l'étape doit-elle :
- Option A : Être directement sous le header principal (même conteneur)
- Option B : Être dans une section séparée avec un espacement
- Option C : Remplacer le header principal quand on est sur Layer 2 ou 3

### 5. Comportement général
**Q5.1** : Le titre principal "Define Your Scope" doit-il :
- Rester identique sur tous les layers ?
- Ou changer selon le layer (ex: "Define Your Scope" → "Add Filter" → "Configure Filter") ?

**Q5.2** : La description actuelle sous le titre doit-elle :
- Être complètement supprimée de l'affichage direct ?
- Ou être remplacée par quelque chose d'autre ?

## Recommandations
En attendant vos réponses, je recommande :
1. **Icône** : `Info` avec tooltip au survol
2. **Titre de l'étape** : Afficher uniquement sur Layer 2 ("Add Filter") et Layer 3 ("Configure [Nom]")
3. **Flèche de retour** : Afficher uniquement sur Layer 2 et Layer 3
4. **Titre principal** : Garder "Define Your Scope" sur tous les layers




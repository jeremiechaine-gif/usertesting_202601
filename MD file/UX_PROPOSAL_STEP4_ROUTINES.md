# Proposition UX/UI : Étape 4 Routines (Mode Persona)

## 🎯 Contexte Actuel

**Problème identifié :**
L'étape 4 affiche directement les résultats par équipe avec des routines suggérées basées sur le persona. L'utilisateur peut ajouter toutes les routines d'un coup ou manuellement, mais :
- ❌ Pas de guidage progressif pour comprendre les routines
- ❌ Pas de possibilité de voir la routine en action (vue + filtres)
- ❌ Pas de questions pour affiner les besoins
- ❌ Surcharge cognitive : trop d'informations d'un coup

## 💡 Vision UX Proposée

### Principe : **"Guided Discovery"** plutôt que **"Dump & Choose"**

Transformer l'étape 4 en un parcours guidé avec sous-étapes qui :
1. **Éduque** l'utilisateur sur les routines disponibles
2. **Personnalise** les recommandations via des questions
3. **Montre** la routine en action avant de l'assigner
4. **Valide** les choix avant de continuer

---

## 📋 Structure Proposée : Sous-Étapes

### **Sous-Étape 4.1 : Comprendre les Routines Recommandées**
**Objectif :** Présenter les routines suggérées avec contexte

**Contenu :**
- **Titre :** "Voici les routines recommandées pour [Nom Équipe]"
- **Explication :** "Basées sur le rôle [Persona], ces routines vous aideront à..."
- **Affichage :** Liste des routines suggérées avec :
  - Nom + Description courte
  - Badge "Recommandé" avec raison (ex: "Recommandé car rôle Approvisionneur")
  - Objectif principal (Monitor, Correct, Anticipate, etc.)
  - Fréquence (Daily, Weekly, Monthly)
  - Vue Pelico associée (Supply, Production Control, etc.)
- **Actions :**
  - Bouton "Voir un aperçu" sur chaque routine (ouvre sous-étape 4.2)
  - Bouton "Continuer" pour passer à la sélection

**Design :**
- Cards avec gradient subtil pour les routines recommandées
- Icône "Sparkles" pour indiquer la recommandation
- Badge avec score de pertinence (optionnel)

---

### **Sous-Étape 4.2 : Aperçu de la Routine**
**Objectif :** Montrer la routine en action (vue + filtres)

**Contenu :**
- **Titre :** "Aperçu : [Nom Routine]"
- **Vue simulée :**
  - Afficher la vue Pelico associée (ex: Purchase Order Book)
  - Appliquer les filtres de la routine
  - Montrer les colonnes requises
  - Afficher un message : "Voici ce que vous verrez avec cette routine"
- **Détails de la routine :**
  - Filtres appliqués (chips avec valeurs)
  - Tri configuré
  - Colonnes visibles
  - Fréquence recommandée
- **Actions :**
  - Bouton "Ajouter cette routine" → assigne à l'équipe
  - Bouton "Personnaliser" → ouvre sous-étape 4.3
  - Bouton "Retour" → retourne à 4.1

**Design :**
- Modal plein écran ou split-screen
- Vue table simulée (avec données mock ou réelles si disponibles)
- Section "Configuration" à droite avec les détails

---

### **Sous-Étape 4.3 : Questions de Personnalisation**
**Objectif :** Affiner les routines via des questions contextuelles

**Questions proposées :**

#### **Question 1 : Fréquence d'utilisation**
- "À quelle fréquence souhaitez-vous utiliser cette routine ?"
- Options : Daily, Weekly, Monthly
- Impact : Peut filtrer les routines par fréquence

#### **Question 2 : Objectifs prioritaires**
- "Quels sont vos objectifs principaux pour cette équipe ?"
- Options : Anticipate, Monitor, Correct, Prioritize, Report
- Impact : Réordonne les routines par pertinence

#### **Question 3 : Zones d'impact**
- "Sur quelles zones souhaitez-vous vous concentrer ?"
- Options : Supplier, Production, Customer, Business
- Impact : Filtre les routines par zone d'impact

#### **Question 4 : Vues Pelico préférées**
- "Quelles vues Pelico votre équipe utilise-t-elle le plus ?"
- Options : Supply, Production Control, Escalation Room, etc.
- Impact : Priorise les routines pour ces vues

**Design :**
- Questions une par une (progressive disclosure)
- Cards interactives avec sélection multiple
- Barre de progression en haut
- Bouton "Suivant" pour chaque question

---

### **Sous-Étape 4.4 : Sélection Finale**
**Objectif :** Valider et ajuster les routines sélectionnées

**Contenu :**
- **Résumé :** "Voici les routines sélectionnées pour [Nom Équipe]"
- **Affichage :**
  - Liste des routines sélectionnées (groupées par objectif)
  - Possibilité de retirer une routine
  - Possibilité d'ajouter d'autres routines (bouton "Parcourir toutes les routines")
- **Actions :**
  - Bouton "Ajouter une routine" → ouvre modal de recherche
  - Bouton "Créer une routine" → ouvre wizard de création
  - Bouton "Continuer" → passe à l'équipe suivante ou termine

**Design :**
- Liste similaire à l'actuelle mais avec plus de contexte
- Badge "Recommandé" pour les routines suggérées
- Section "Routines suggérées non sélectionnées" (optionnel)

---

## 🎨 Principes de Design

### 1. **Progressive Disclosure**
- Ne montrer qu'une information à la fois
- Guider l'utilisateur étape par étape
- Éviter la surcharge cognitive

### 2. **Visual Feedback**
- Montrer la routine en action avant de l'assigner
- Utiliser des previews/interactions pour comprendre l'impact
- Feedback immédiat sur les sélections

### 3. **Contextual Help**
- Explications courtes et claires à chaque étape
- Tooltips pour les concepts complexes
- Exemples concrets quand possible

### 4. **Flexibilité**
- Toujours permettre de "Skip" ou "Voir toutes les routines"
- Ne pas forcer l'utilisateur à répondre à toutes les questions
- Permettre de revenir en arrière

---

## ❓ Questions de Clarification

### **1. Flux et Navigation**
- **Q1.1 :** L'utilisateur doit-il passer par toutes les sous-étapes pour chaque équipe, ou peut-il "skip" certaines étapes ?
- **Q1.2 :** Doit-on permettre de revenir en arrière pour modifier les sélections d'une équipe précédente ?
- **Q1.3 :** Faut-il un mode "rapide" qui permet d'ajouter toutes les routines suggérées d'un coup (comme actuellement) ?

### **2. Aperçu de la Routine**
- **Q2.1 :** L'aperçu doit-il être une vraie vue interactive ou une capture/visualisation statique ?
- **Q2.2 :** Doit-on permettre de modifier les filtres dans l'aperçu avant d'ajouter la routine ?
- **Q2.3 :** Faut-il montrer les données réelles ou des données mockées pour l'aperçu ?

### **3. Questions de Personnalisation**
- **Q3.1 :** Toutes les questions sont-elles obligatoires ou certaines sont-elles optionnelles ?
- **Q3.2 :** Les réponses doivent-elles être sauvegardées pour améliorer les recommandations futures ?
- **Q3.3 :** Faut-il adapter les questions selon le persona sélectionné (ex: questions différentes pour Approvisionneur vs Manager) ?

### **4. Routines Recommandées**
- **Q4.1 :** Combien de routines recommandées maximum afficher par équipe (actuellement toutes celles qui matchent le persona) ?
- **Q4.2 :** Faut-il afficher un score de pertinence pour chaque routine recommandée ?
- **Q4.3 :** Doit-on expliquer pourquoi chaque routine est recommandée (ex: "Recommandée car vous êtes Approvisionneur et cette routine aide à Monitor") ?

### **5. Intégration avec le Système Actuel**
- **Q5.1 :** Les routines créées dans l'aperçu doivent-elles être sauvegardées immédiatement ou seulement à la fin de l'onboarding ?
- **Q5.2 :** Faut-il permettre de créer plusieurs routines depuis l'aperçu avant de continuer ?
- **Q5.3 :** Les routines assignées doivent-elles être visibles dans la sidebar immédiatement ou seulement après la fin de l'onboarding ?

### **6. Expérience Utilisateur**
- **Q6.1 :** Pour une équipe sans persona, faut-il proposer un flux différent (plus simple) ?
- **Q6.2 :** Faut-il un résumé final avant de terminer l'onboarding montrant toutes les routines assignées à toutes les équipes ?
- **Q6.3 :** Doit-on permettre de dupliquer les routines d'une équipe à une autre ?

---

## 🚀 Plan d'Implémentation Suggéré

### **Phase 1 : Fondations (MVP)**
1. Créer les sous-étapes 4.1 et 4.4 (comprendre + sélection finale)
2. Améliorer l'affichage des routines recommandées avec contexte
3. Ajouter la possibilité de voir un aperçu (sous-étape 4.2 simplifiée)

### **Phase 2 : Personnalisation**
1. Implémenter les questions de personnalisation (sous-étape 4.3)
2. Adapter le scoring des routines basé sur les réponses
3. Améliorer l'aperçu avec vraie vue interactive

### **Phase 3 : Optimisations**
1. Ajouter le mode "rapide" pour les utilisateurs expérimentés
2. Améliorer les explications et tooltips
3. Ajouter animations et transitions fluides

---

## 📊 Métriques de Succès

- **Taux de complétion :** % d'utilisateurs qui complètent l'étape 4
- **Temps moyen :** Temps passé sur l'étape 4
- **Taux d'utilisation des routines :** % de routines assignées qui sont réellement utilisées
- **Satisfaction :** Feedback utilisateur sur la clarté du processus

---

## 🎯 Recommandations Finales

### **Priorité Haute :**
1. ✅ **Aperçu de la routine** : Essentiel pour comprendre ce qu'on assigne
2. ✅ **Questions de personnalisation** : Améliore la pertinence des recommandations
3. ✅ **Progressive disclosure** : Réduit la surcharge cognitive

### **Priorité Moyenne :**
1. ⚠️ **Mode rapide** : Pour les utilisateurs qui veulent aller vite
2. ⚠️ **Explications contextuelles** : Améliore la compréhension

### **Priorité Basse :**
1. 📌 **Score de pertinence** : Nice to have mais pas essentiel
2. 📌 **Duplication entre équipes** : Cas d'usage moins fréquent

---

**Prêt à discuter et affiner cette proposition selon vos besoins !** 🎨✨

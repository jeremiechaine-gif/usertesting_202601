# 🚀 Guide de Démarrage Rapide

## Installation Automatique (Recommandée)

### Sur macOS/Linux :

```bash
# Téléchargez le script setup.sh depuis le dépôt, puis :
chmod +x setup.sh
./setup.sh
```

Le script va :
1. ✅ Vérifier les prérequis (Node.js, npm, Git)
2. ✅ Cloner le dépôt Git
3. ✅ Installer toutes les dépendances
4. ✅ Optionnellement lancer le serveur de développement

### Démarrage Rapide (si déjà installé) :

```bash
chmod +x quick-start.sh
./quick-start.sh
```

## Installation Manuelle

### Option 1 : Cloner le dépôt (3 commandes)

```bash
git clone https://pelilab.pelico.tech/jeremie.chaine/filters-december2025.git pelico-supply-prototype
cd pelico-supply-prototype
npm install && npm run dev
```

### Option 2 : Suivre le guide complet

Consultez `REPRODUCTION_GUIDE.md` pour toutes les instructions détaillées.

## Commandes Utiles

```bash
# Développement
npm run dev          # Lance le serveur de développement

# Build
npm run build        # Compile le projet pour la production

# Preview
npm run preview      # Prévisualise le build de production

# Linting
npm run lint         # Vérifie le code avec ESLint
```

## Structure du Projet

```
pelico-supply-prototype/
├── setup.sh              # Script d'installation automatique
├── quick-start.sh         # Script de démarrage rapide
├── REPRODUCTION_GUIDE.md  # Guide complet de reproduction
├── README_SETUP.md        # Ce fichier
├── public/
│   └── images/           # Images statiques (logos Pelico)
├── src/
│   ├── components/       # Composants React
│   ├── lib/             # Utilitaires et données mockées
│   └── styles/          # Styles et tokens
└── ...
```

## Prérequis

- **Node.js** 18+ ([Télécharger](https://nodejs.org/))
- **npm** (inclus avec Node.js)
- **Git** (optionnel, pour cloner le dépôt)

## Dépannage

### Le script ne s'exécute pas
```bash
chmod +x setup.sh
./setup.sh
```

### Erreur "command not found"
Assurez-vous que Node.js et npm sont installés :
```bash
node --version
npm --version
```

### Erreur lors du clonage Git
Vérifiez votre connexion internet et les permissions d'accès au dépôt GitLab.

### Erreur lors de l'installation des dépendances
```bash
rm -rf node_modules package-lock.json
npm install
```

## Support

Pour plus d'informations, consultez :
- `REPRODUCTION_GUIDE.md` - Guide complet de reproduction
- `README_IMAGES.md` - Guide d'utilisation des images

---

**Développé avec ❤️ pour Pelico**






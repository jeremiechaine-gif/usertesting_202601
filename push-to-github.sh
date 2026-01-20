#!/bin/bash

# Script pour pousser le projet vers GitHub
# Usage: ./push-to-github.sh [VOTRE_TOKEN_GITHUB]

set -e

REPO_URL="https://github.com/jeremiechaine-gif/usertesting_202601.git"
REMOTE_NAME="origin"

echo "🚀 Préparation du push vers GitHub..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Vérifier l'état git
echo "📊 Vérification de l'état Git..."
git status --short

# Si un token est fourni en argument, l'utiliser
if [ -n "$1" ]; then
    echo "🔐 Utilisation du token fourni..."
    git remote set-url $REMOTE_NAME "https://$1@github.com/jeremiechaine-gif/usertesting_202601.git"
    git push -u $REMOTE_NAME main
    echo "✅ Push réussi !"
    echo "🌐 Votre projet est disponible sur: https://github.com/jeremiechaine-gif/usertesting_202601"
else
    echo ""
    echo "📝 Pour pousser le projet, vous avez 3 options:"
    echo ""
    echo "Option 1: Avec un token (recommandé)"
    echo "  1. Créez un token sur: https://github.com/settings/tokens"
    echo "  2. Exécutez: ./push-to-github.sh VOTRE_TOKEN"
    echo ""
    echo "Option 2: Push manuel"
    echo "  git push -u origin main"
    echo "  (Vous serez invité à entrer vos identifiants)"
    echo ""
    echo "Option 3: Via l'interface web GitHub"
    echo "  1. Allez sur: https://github.com/jeremiechaine-gif/usertesting_202601"
    echo "  2. Cliquez sur 'uploading an existing file'"
    echo "  3. Glissez-déposez tous les fichiers"
    echo ""
    echo "💡 Le projet est prêt avec tous les commits locaux !"
fi

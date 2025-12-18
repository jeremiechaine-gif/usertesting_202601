#!/bin/bash

# Script de démarrage rapide
# Lance simplement le serveur de développement si le projet est déjà installé

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Vérifier si on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    if [ -d "pelico-supply-prototype" ]; then
        print_info "Changement vers le répertoire pelico-supply-prototype..."
        cd pelico-supply-prototype
    else
        print_error "Répertoire du projet introuvable."
        print_info "Exécutez d'abord: ./setup.sh"
        exit 1
    fi
fi

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    print_info "Installation des dépendances..."
    npm install
fi

print_success "Lancement du serveur de développement..."
npm run dev


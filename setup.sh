#!/bin/bash

# Script d'installation automatique du prototype Pelico Supply
# Ce script clone le dépôt, installe les dépendances et lance le serveur de développement

set -e  # Arrêter le script en cas d'erreur

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Vérifier les prérequis
print_info "Vérification des prérequis..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ est requis. Version actuelle: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) détecté"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé."
    exit 1
fi
print_success "npm $(npm -v) détecté"

# Vérifier Git
if ! command -v git &> /dev/null; then
    print_warning "Git n'est pas installé. Le script utilisera la méthode manuelle."
    USE_GIT=false
else
    print_success "Git $(git --version | cut -d' ' -f3) détecté"
    USE_GIT=true
fi

echo ""
print_info "Démarrage de l'installation..."
echo ""

# Déterminer le répertoire de travail
if [ -d "pelico-supply-prototype" ]; then
    print_warning "Le dossier 'pelico-supply-prototype' existe déjà."
    read -p "Voulez-vous le supprimer et recommencer? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Suppression du dossier existant..."
        rm -rf pelico-supply-prototype
    else
        print_info "Utilisation du dossier existant..."
        cd pelico-supply-prototype
        if [ -d "node_modules" ]; then
            print_info "Les dépendances semblent déjà installées."
            read -p "Voulez-vous réinstaller les dépendances? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_info "Réinstallation des dépendances..."
                npm install
            fi
        else
            print_info "Installation des dépendances..."
            npm install
        fi
        print_success "Installation terminée!"
        echo ""
        print_info "Pour lancer le serveur de développement, exécutez:"
        echo -e "${GREEN}  cd pelico-supply-prototype && npm run dev${NC}"
        exit 0
    fi
fi

# Méthode 1: Cloner depuis Git (recommandée)
if [ "$USE_GIT" = true ]; then
    print_info "Clonage du dépôt Git..."
    git clone https://pelilab.pelico.tech/jeremie.chaine/filters-december2025.git pelico-supply-prototype
    
    if [ $? -eq 0 ]; then
        print_success "Dépôt cloné avec succès"
        cd pelico-supply-prototype
        
        print_info "Installation des dépendances (cela peut prendre quelques minutes)..."
        npm install
        
        if [ $? -eq 0 ]; then
            print_success "Dépendances installées avec succès!"
            echo ""
            print_success "Installation terminée!"
            echo ""
            print_info "Pour lancer le serveur de développement, exécutez:"
            echo -e "${GREEN}  cd pelico-supply-prototype && npm run dev${NC}"
            echo ""
            read -p "Voulez-vous lancer le serveur de développement maintenant? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_info "Lancement du serveur de développement..."
                npm run dev
            fi
        else
            print_error "Erreur lors de l'installation des dépendances"
            exit 1
        fi
    else
        print_error "Erreur lors du clonage du dépôt"
        exit 1
    fi
else
    # Méthode 2: Installation manuelle (si Git n'est pas disponible)
    print_warning "Git n'est pas disponible. Utilisation de la méthode manuelle."
    print_info "Veuillez suivre les instructions dans REPRODUCTION_GUIDE.md"
    print_info "Ou installez Git et réexécutez ce script."
    exit 1
fi


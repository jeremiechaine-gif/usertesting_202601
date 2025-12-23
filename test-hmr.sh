#!/bin/bash

# Script de test pour vérifier le HMR
# Usage: ./test-hmr.sh

echo "🧪 Test du HMR (Hot Module Replacement)"
echo "========================================"
echo ""

# Couleurs pour l'output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que le serveur est en cours d'exécution
echo "1. Vérification du serveur Vite..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Serveur Vite actif sur http://localhost:5173${NC}"
else
    echo -e "${RED}❌ Serveur Vite non disponible. Démarrez-le avec 'npm run dev'${NC}"
    exit 1
fi

echo ""
echo "2. Vérification de la configuration HMR..."
if grep -q "hmr:" vite.config.ts; then
    echo -e "${GREEN}✅ Configuration HMR trouvée dans vite.config.ts${NC}"
else
    echo -e "${YELLOW}⚠️  Configuration HMR non trouvée${NC}"
fi

echo ""
echo "3. Vérification des headers de cache..."
if grep -q "Cache-Control.*no-store" vite.config.ts; then
    echo -e "${GREEN}✅ Headers de cache désactivés en développement${NC}"
else
    echo -e "${YELLOW}⚠️  Headers de cache non trouvés${NC}"
fi

echo ""
echo "4. Vérification du cache Vite..."
if [ -d "node_modules/.vite" ]; then
    echo -e "${YELLOW}⚠️  Cache Vite présent (normal en développement)${NC}"
    echo "   Pour nettoyer: npm run clean"
else
    echo -e "${GREEN}✅ Pas de cache Vite${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ Tests de configuration terminés${NC}"
echo ""
echo "📝 Instructions pour tester le HMR:"
echo "   1. Ouvrez http://localhost:5173 dans votre navigateur"
echo "   2. Ouvrez DevTools (F12) > Network"
echo "   3. Cochez 'Disable cache'"
echo "   4. Modifiez un fichier dans src/components/"
echo "   5. Vérifiez que le changement apparaît immédiatement"
echo ""
echo "🔧 Si le HMR ne fonctionne pas:"
echo "   1. Arrêtez le serveur (Ctrl+C)"
echo "   2. Exécutez: npm run dev:clean"
echo "   3. Redémarrez: npm run dev"
echo ""


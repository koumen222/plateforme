#!/bin/bash

# Script de build pour le déploiement
echo "🚀 Début du build de Safitech E-Commerce..."

# Vérifier si nous sommes dans le bon dossier
if [ ! -d "frontend" ]; then
    echo "❌ Erreur: Dossier frontend non trouvé"
    exit 1
fi

# Aller dans le dossier frontend
cd frontend

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Build du frontend
echo "🔨 Build du frontend..."
npm run build

# Vérifier si le build a réussi
if [ -d "dist" ]; then
    echo "✅ Build réussi!"
    echo "📁 Les fichiers sont dans: frontend/dist/"
    
    # Copier les fichiers build à la racine pour certains hébergeurs
    echo "📋 Copie des fichiers à la racine..."
    cp -r dist/* ../
    
    # Copier aussi les fichiers PWA importants
    cp -r public/icons/* ../icons/ 2>/dev/null || true
    cp public/manifest.json ../ 2>/dev/null || true
    cp public/sw.js ../ 2>/dev/null || true
    cp public/browserconfig.xml ../ 2>/dev/null || true
    
    echo "🎯 Fichiers PWA copiés à la racine"
    echo "📁 Structure finale:"
    ls -la ../ | grep -E "(index\.html|assets|icons|manifest|sw\.js)"
else
    echo "❌ Erreur: Le build a échoué"
    exit 1
fi

echo "🎉 Build terminé!"

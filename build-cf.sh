#!/bin/bash

# Script de build pour Cloudflare Pages
set -e

echo "🚀 Build Cloudflare Pages - Safitech E-Commerce"

# Aller dans le dossier frontend
cd frontend

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install --progress=false

# Build du projet
echo "🔨 Build du frontend..."
npm run build

# Vérifier si le build a réussi
if [ -d "dist" ]; then
    echo "✅ Build réussi!"
    
    # Copier tous les fichiers à la racine pour Cloudflare Pages
    echo "📋 Copie des fichiers pour Cloudflare Pages..."
    cp -r dist/* ../
    
    # Copier les fichiers PWA importants
    if [ -d "public/icons" ]; then
        mkdir -p ../icons
        cp -r public/icons/* ../icons/ 2>/dev/null || true
    fi
    
    if [ -f "public/manifest.json" ]; then
        cp public/manifest.json ../
    fi
    
    if [ -f "public/sw.js" ]; then
        cp public/sw.js ../
    fi
    
    if [ -f "public/browserconfig.xml" ]; then
        cp public/browserconfig.xml ../
    fi
    
    echo "🎯 Structure finale:"
    echo "   - index.html ✓"
    echo "   - assets/ ✓"
    echo "   - icons/ ✓"
    echo "   - manifest.json ✓"
    echo "   - sw.js ✓"
    
    # Vérifier les fichiers à la racine
    if [ -f "../index.html" ]; then
        echo "✅ Fichiers prêts pour Cloudflare Pages!"
        echo "📁 Fichiers dans la racine:"
        ls -la ../ | grep -E "(index\.html|assets|icons|manifest|sw\.js)" | head -10
    else
        echo "❌ Erreur: index.html non trouvé à la racine"
        exit 1
    fi
else
    echo "❌ Erreur: Le build a échoué - dossier dist non trouvé"
    exit 1
fi

echo "🎉 Build terminé avec succès!"

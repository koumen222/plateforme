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
    cp -r dist/* ../
    echo "📋 Fichiers copiés à la racine"
else
    echo "❌ Erreur: Le build a échoué"
    exit 1
fi

echo "🎉 Build terminé!"

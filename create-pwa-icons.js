const fs = require('fs');
const path = require('path');

// Script pour copier le logo comme icône PWA temporaire
// En production, utilisez sharp pour redimensionner

const sourceImage = path.join(__dirname, 'assets', 'ChatGPT_Image_15_févr._2026__22_02_01-removebg-preview.png');
const iconsDir = path.join(__dirname, 'frontend', 'public', 'icons');

// Vérifier si l'image source existe
if (!fs.existsSync(sourceImage)) {
  console.error('❌ Image source non trouvée:', sourceImage);
  process.exit(1);
}

// Créer le dossier icons s'il n'existe pas
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Tailles requises pour PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Copier l'image comme placeholder pour chaque taille
// Note: En production, utilisez sharp pour redimensionner
iconSizes.forEach(size => {
  const targetPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  // Copier l'image originale (temporairement)
  fs.copyFileSync(sourceImage, targetPath);
  console.log(`✅ Icône ${size}x${size} créée: ${targetPath}`);
});

// Créer un README avec instructions
const readme = `# Icônes PWA - Safitech

Ce dossier contient les icônes pour la PWA (Progressive Web App).

## Source
Image originale: ChatGPT_Image_15_févr._2026__22_02_01-removebg-preview.png

## Tailles générées:
${iconSizes.map(size => `- ${size}x${size}px - icon-${size}x${size}.png`).join('\n')}

## Pour un rendu parfait:

### Option 1: Utiliser Sharp (Node.js)
\`\`\`bash
npm install sharp
node resize-icons.js
\`\`\`

### Option 2: Outils en ligne
1. Allez sur https://www.pwabuilder.com/imageGenerator
2. Uploadez votre logo original
3. Téléchargez le pack complet
4. Remplacez les fichiers dans ce dossier

### Option 3: Photoshop/GIMP
1. Ouvrez l'image originale
2. Redimensionnez aux tailles requises
3. Assurez-vous que le logo reste visible
4. Exportez en PNG avec fond transparent

## Installation:
Les icônes sont automatiquement détectées par:
- manifest.json
- Service Worker
- Navigateurs mobiles

## Test:
1. Ouvrez le site sur mobile
2. Vous devriez voir "Ajouter à l'écran d'accueil"
3. L'icône apparaîtra sur votre téléphone comme une vraie app
`;

fs.writeFileSync(path.join(iconsDir, 'README.md'), readme);

console.log('\n🎉 Icônes PWA générées avec succès!');
console.log('📱 Votre site peut maintenant être installé comme une application!');
console.log('\n💡 Prochaine étape: Ajoutez les meta tags dans index.html');

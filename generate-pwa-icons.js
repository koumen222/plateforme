const fs = require('fs');
const path = require('path');

// Script pour créer des icônes PWA basiques
// Note: Pour un vrai projet, utilisez sharp ou jimp pour redimensionner les images

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'frontend', 'public', 'icons');

// Créer le dossier icons s'il n'existe pas
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Créer des fichiers placeholder pour les icônes
// En production, vous devriez redimensionner votre logo réel
iconSizes.forEach(size => {
  const placeholder = `// Placeholder pour l'icône ${size}x${size}
// Remplacez ce fichier par votre logo redimensionné
// Taille: ${size}x${size} pixels
// Format: PNG
// Usage: PWA icons
  
// Pour générer les vraies icônes:
// 1. Utilisez votre logo ecom-logo.png
// 2. Redimensionnez-le aux tailles: ${iconSizes.join(', ')}
// 3. Sauvegardez-les dans /icons/
// 4. Ou utilisez un service comme: https://www.pwabuilder.com/imageGenerator`;

  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), placeholder);
});

console.log('📱 Fichiers d\'icônes PWA créés dans /icons/');
console.log('🔥 Remplacez-les par vos vraies icônes redimensionnées!');

// Créer aussi un README pour les icônes
const readme = `# Icônes PWA

Ce dossier contient les icônes pour la PWA (Progressive Web App).

## Tailles requises:

- 72x72px - icon-72x72.png
- 96x96px - icon-96x96.png  
- 128x128px - icon-128x128.png
- 144x144px - icon-144x144.png
- 152x152px - icon-152x152.png
- 192x192px - icon-192x192.png
- 384x384px - icon-384x384.png
- 512x512px - icon-512x512.png

## Comment générer les icônes:

### Option 1: PWA Builder (Recommandé)
1. Allez sur https://www.pwabuilder.com/imageGenerator
2. Uploadez votre logo (format carré, minimum 512x512px)
3. Téléchargez le pack d'icônes
4. Copiez les fichiers dans ce dossier

### Option 2: Outils en ligne
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/

### Option 3: Photoshop/GIMP
1. Créez un carré de 512x512px
2. Ajoutez votre logo
3. Redimensionnez aux différentes tailles
4. Exportez en PNG

## Important:
- Utilisez un fond transparent si possible
- Assurez-vous que le logo est visible même à petite taille
- Testez sur différents appareils
`;

fs.writeFileSync(path.join(iconsDir, 'README.md'), readme);

console.log('📄 README.md créé dans /icons/');

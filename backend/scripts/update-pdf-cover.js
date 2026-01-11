import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RessourcePdf from '../models/RessourcePdf.js';

// Charger les variables d'environnement
dotenv.config();

/**
 * Script pour mettre à jour l'image de couverture d'une ressource PDF
 * 
 * Usage: node backend/scripts/update-pdf-cover.js <slug> <coverImageUrl>
 * Exemple: node backend/scripts/update-pdf-cover.js guide-ecom-afrique https://drive.google.com/...
 */

const updatePdfCover = async () => {
  try {
    // Connexion à MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/plateforme-formation';
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    // Récupérer les arguments de la ligne de commande
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.error('❌ Usage: node update-pdf-cover.js <slug> <coverImageUrl>');
      console.error('   Exemple: node update-pdf-cover.js guide-ecom-afrique https://drive.google.com/file/d/...');
      process.exit(1);
    }

    const slug = args[0];
    const coverImageUrl = args[1];

    // Vérifier que l'URL est valide
    if (!coverImageUrl.startsWith('http://') && !coverImageUrl.startsWith('https://')) {
      console.error('❌ L\'URL de l\'image doit commencer par http:// ou https://');
      process.exit(1);
    }

    // Trouver la ressource PDF par slug
    const ressourcePdf = await RessourcePdf.findOne({ slug });
    
    if (!ressourcePdf) {
      console.error(`❌ Ressource PDF avec le slug "${slug}" non trouvée`);
      console.log('\n📋 Ressources PDF disponibles:');
      const allRessources = await RessourcePdf.find({}).select('slug title');
      allRessources.forEach(r => {
        console.log(`   - ${r.slug} : ${r.title}`);
      });
      process.exit(1);
    }

    console.log(`📄 Ressource trouvée: ${ressourcePdf.title}`);
    console.log(`   Slug: ${ressourcePdf.slug}`);
    console.log(`   Ancienne image: ${ressourcePdf.coverImage}`);

    // Mettre à jour l'image de couverture
    ressourcePdf.coverImage = coverImageUrl;
    await ressourcePdf.save();

    console.log(`\n✅ Image de couverture mise à jour avec succès !`);
    console.log(`   Nouvelle image: ${ressourcePdf.coverImage}`);

    // Fermer la connexion
    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Exécuter le script
updatePdfCover();


import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RessourcePdf from '../models/RessourcePdf.js';
import { connectDB } from '../config/database.js';

dotenv.config();

async function updateLivrerCommandesCover() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await connectDB();
    console.log('✅ Connecté à MongoDB');

    // Chercher la ressource PDF par titre partiel
    const searchTerms = [
      'livrer 99',
      'livrer 99.9',
      'livrer commandes',
      '99.9%',
      'commandes boutique afrique',
      'livrer boutique afrique'
    ];

    let ressourcePdf = null;
    
    for (const term of searchTerms) {
      console.log(`\n🔍 Recherche avec le terme: "${term}"`);
      const regex = new RegExp(term, 'i');
      ressourcePdf = await RessourcePdf.findOne({ title: regex });
      
      if (ressourcePdf) {
        console.log(`✅ Ressource PDF trouvée: "${ressourcePdf.title}"`);
        console.log(`   Slug: ${ressourcePdf.slug}`);
        break;
      }
    }

    if (!ressourcePdf) {
      console.error('\n❌ Ressource PDF non trouvée');
      console.log('\n📋 Ressources PDF disponibles:');
      const allRessources = await RessourcePdf.find({}).select('slug title');
      allRessources.forEach(r => {
        console.log(`   - ${r.slug} : ${r.title}`);
      });
      process.exit(1);
    }

    // Mettre à jour l'image de couverture
    const coverImageUrl = '/assets/livrer-commandes-cover.jpg';
    console.log(`\n🔄 Mise à jour de l'image de couverture vers: "${coverImageUrl}"`);
    console.log(`   Ancienne image: ${ressourcePdf.coverImage || '(aucune)'}`);

    ressourcePdf.coverImage = coverImageUrl;
    await ressourcePdf.save();

    console.log('\n🎉 Image de couverture mise à jour avec succès !');
    console.log(`   Titre: ${ressourcePdf.title}`);
    console.log(`   Slug: ${ressourcePdf.slug}`);
    console.log(`   Nouvelle image: ${ressourcePdf.coverImage}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la mise à jour de l\'image de couverture:', error);
    process.exit(1);
  }
}

updateLivrerCommandesCover();


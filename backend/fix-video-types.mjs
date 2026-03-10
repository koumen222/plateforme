import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme');
  console.log('✅ Connecté à MongoDB');
} catch (err) {
  console.error('❌ Erreur de connexion MongoDB:', err);
  process.exit(1);
}

// Define Lesson Schema
const lessonSchema = new mongoose.Schema({
  moduleId: mongoose.Schema.Types.ObjectId,
  title: String,
  videoId: String,
  videoType: String,
  order: Number,
  locked: Boolean,
  isCoaching: Boolean,
  summary: {
    text: String,
    points: [String]
  },
  resources: [mongoose.Schema.Types.Mixed]
}, { timestamps: true });

const Lesson = mongoose.model('Lesson', lessonSchema);

async function fixVideoTypes() {
  try {
    console.log('🔍 Recherche des leçons avec des incohérences de type vidéo...');
    
    // Trouver toutes les leçons
    const lessons = await Lesson.find({});
    console.log(`📚 ${lessons.length} leçons trouvées`);
    
    let fixedCount = 0;
    
    for (const lesson of lessons) {
      const videoId = lesson.videoId?.toString().trim();
      if (!videoId) continue;
      
      // Détecter automatiquement le type de vidéo
      let detectedType = 'vimeo'; // par défaut
      
      // Patterns YouTube
      if (videoId.length === 11 && /^[a-zA-Z0-9_-]+$/.test(videoId)) {
        detectedType = 'youtube';
      } else if (videoId.includes('youtube.com/watch?v=')) {
        detectedType = 'youtube';
      } else if (videoId.includes('youtu.be/')) {
        detectedType = 'youtube';
      } else if (videoId.includes('youtube.com/embed/')) {
        detectedType = 'youtube';
      }
      
      // Patterns Vimeo (IDs numériques)
      if (/^\d+$/.test(videoId)) {
        detectedType = 'vimeo';
      }
      
      // Corriger si le type est incorrect
      if (lesson.videoType !== detectedType) {
        console.log(`🔧 Correction: "${lesson.title}"`);
        console.log(`   Ancien: ${lesson.videoType} (${lesson.videoId})`);
        console.log(`   Nouveau: ${detectedType} (${videoId})`);
        
        lesson.videoType = detectedType;
        await lesson.save();
        fixedCount++;
      }
    }
    
    console.log(`\n✅ ${fixedCount} leçons corrigées sur ${lessons.length} total`);
    
    // Afficher le résumé final
    const summary = await Lesson.aggregate([
      { $group: { _id: '$videoType', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📊 Résumé des types de vidéos:');
    summary.forEach(item => {
      console.log(`   ${item._id}: ${item.count} leçons`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixVideoTypes();

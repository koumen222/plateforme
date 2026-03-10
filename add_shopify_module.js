const mongoose = require('mongoose');
const Course = require('./backend/models/Course');
const Module = require('./backend/models/Module');
const Lesson = require('./backend/models/Lesson');

require('./backend/config/database');

async function addShopifyModule() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme');
    console.log('✅ Connecté à MongoDB');

    // 1. Trouver le cours ecom-starter-20
    const course = await Course.findOne({ slug: 'ecom-starter-20' });
    if (!course) {
      console.error('❌ Cours ecom-starter-20 non trouvé');
      return;
    }
    console.log(`✅ Cours trouvé: ${course.title}`);

    // 2. Vérifier si le module Shopify existe déjà
    const existingModule = await Module.findOne({ courseId: course._id, title: /shopify/i });
    if (existingModule) {
      console.log('⚠️ Module Shopify existe déjà');
      return;
    }

    // 3. Compter les modules existants pour déterminer l'ordre
    const moduleCount = await Module.countDocuments({ courseId: course._id });
    const newOrder = moduleCount + 1;

    // 4. Créer le nouveau module Shopify
    const shopifyModule = new Module({
      courseId: course._id,
      title: '🛍️ Formation Shopify Complète',
      order: newOrder
    });

    await shopifyModule.save();
    console.log(`✅ Module Shopify créé avec l'ID: ${shopifyModule._id}`);

    // 5. Créer une leçon de redirection vers la formation Shopify
    const shopifyLesson = new Lesson({
      moduleId: shopifyModule._id,
      title: '🚀 Accéder à la Formation Shopify 2026',
      videoId: 'redirect-to-shopify-course',
      videoType: 'vimeo',
      order: 1,
      locked: false,
      isCoaching: false,
      summary: {
        text: 'Cette leçon vous redirige vers notre formation Shopify complète 2026. Vous y apprendrez tout sur la création et la gestion de votre boutique Shopify.',
        points: [
          'Création de boutique Shopify étape par étape',
          'Configuration des produits et collections',
          'Marketing et optimisation des conversions',
          'Gestion des commandes et expéditions'
        ]
      },
      resources: [
        {
          icon: '🎯',
          title: 'Formation Shopify 2026',
          type: 'course',
          link: '/course/formation-shopify-2026',
          download: false
        }
      ]
    });

    await shopifyLesson.save();
    console.log(`✅ Leçon de redirection créée avec l'ID: ${shopifyLesson._id}`);

    // 6. Mettre à jour le module avec la leçon
    const moduleWithLesson = await Module.findById(shopifyModule._id).populate('lessons');
    console.log('✅ Module Shopify final:', {
      title: moduleWithLesson.title,
      order: moduleWithLesson.order,
      lessonCount: moduleWithLesson.lessons.length
    });

    console.log('\n🎉 Module Shopify ajouté avec succès au cours ecom-starter-20 !');
    console.log('📝 Leçon de redirection vers /course/formation-shopify-2026 créée');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

addShopifyModule();

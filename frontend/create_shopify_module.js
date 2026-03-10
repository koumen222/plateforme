import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function createShopifyModule() {
  try {
    // 1. Trouver le cours ecom-starter-20
    const courseResponse = await axios.get(`${API_URL}/courses/slug/ecom-starter-20`);
    if (!courseResponse.data.success) {
      console.error('❌ Cours ecom-starter-20 non trouvé');
      return;
    }
    
    const course = courseResponse.data.course;
    console.log(`✅ Cours trouvé: ${course.title}`);

    // 2. Créer le module Shopify via admin route
    const moduleData = {
      title: '🛍️ Formation Shopify Complète',
      order: course.modules ? course.modules.length + 1 : 1
    };

    const moduleResponse = await axios.post(`${API_URL}/admin/courses/${course._id}/modules`, moduleData);
    if (!moduleResponse.data.success) {
      console.error('❌ Erreur création module:', moduleResponse.data.error);
      return;
    }

    const shopifyModule = moduleResponse.data.module;
    console.log(`✅ Module Shopify créé: ${shopifyModule.title}`);

    // 3. Créer la leçon de redirection via admin route
    const lessonData = {
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
    };

    const lessonResponse = await axios.post(`${API_URL}/admin/modules/${shopifyModule._id}/lessons`, lessonData);
    if (!lessonResponse.data.success) {
      console.error('❌ Erreur création leçon:', lessonResponse.data.error);
      return;
    }

    const shopifyLesson = lessonResponse.data.lesson;
    console.log(`✅ Leçon de redirection créée: ${shopifyLesson.title}`);

    console.log('\n🎉 Module Shopify ajouté avec succès !');
    console.log('📝 Leçon avec lien vers /course/formation-shopify-2026 créée');

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

createShopifyModule();

import express from 'express';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import { authenticate, checkAccountStatus } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/courses
 * Récupère tous les cours (uniquement Facebook Ads pour le moment)
 */
router.get('/', async (req, res) => {
  try {
    // Récupérer uniquement les cours "activés/publies"
    const courses = await Course.find({ isPublished: true }).sort({ createdAt: 1 });
    
    // Fonction pour obtenir la priorité d'un cours
    const getCoursePriority = (course) => {
      const slug = (course.slug || '').toLowerCase().trim();
      const title = (course.title || '').toLowerCase().trim();
      
      // Priorité 1: Facebook Ads (vérifier slug exact ou contenu)
      if (slug === 'facebook-ads' || slug === 'facebookads' || 
          slug.includes('facebook') || title.includes('facebook')) {
        return 1;
      }
      // Priorité 2: TikTok Ads (vérifier slug exact ou contenu)
      if (slug === 'tiktok-ads' || slug === 'tiktokads' || 
          slug.includes('tiktok') || title.includes('tiktok')) {
        return 2;
      }
      // Priorité 3: Autres cours (garder l'ordre de création)
      return 3;
    };
    
    // Trier les cours : Facebook Ads et TikTok Ads en premier
    const sortedCourses = [...courses].sort((a, b) => {
      const priorityA = getCoursePriority(a);
      const priorityB = getCoursePriority(b);
      
      // Comparer les priorités
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Si même priorité, garder l'ordre de création (plus anciens en premier)
      return 0;
    });
    
    console.log('📚 Cours triés:', sortedCourses.map(c => ({ 
      title: c.title, 
      slug: c.slug, 
      priority: getCoursePriority(c) 
    })));

    const modules = await Module.find(
      { courseId: { $in: sortedCourses.map(course => course._id) } },
      { _id: 1, courseId: 1 }
    );
    const moduleIdsByCourse = new Map();
    modules.forEach((moduleDoc) => {
      const courseId = moduleDoc.courseId.toString();
      if (!moduleIdsByCourse.has(courseId)) {
        moduleIdsByCourse.set(courseId, []);
      }
      moduleIdsByCourse.get(courseId).push(moduleDoc._id);
    });

    const coursesWithLessonCounts = await Promise.all(
      sortedCourses.map(async (course) => {
        const moduleIds = moduleIdsByCourse.get(course._id.toString()) || [];
        const lessonsCount = moduleIds.length > 0
          ? await Lesson.countDocuments({ moduleId: { $in: moduleIds } })
          : 0;
        return {
          ...course.toObject(),
          lessonsCount
        };
      })
    );

    res.json({
      success: true,
      courses: coursesWithLessonCounts
    });
  } catch (error) {
    console.error('Erreur récupération cours:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des cours' });
  }
});

/**
 * GET /api/courses/slug/:slug
 * Récupère un cours par son slug avec ses modules et leçons
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const course = await Course.findOne({ slug });
    if (!course) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }
    
    // Récupérer les modules du cours
    const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });
    
    // Récupérer les leçons pour chaque module
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await Lesson.find({ moduleId: module._id }).sort({ order: 1 });
        return {
          ...module.toObject(),
          lessons: lessons
        };
      })
    );

    res.json({
      success: true,
      course: {
        ...course.toObject(),
        modules: modulesWithLessons
      }
    });
  } catch (error) {
    console.error('Erreur récupération cours:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du cours' });
  }
});

/**
 * GET /api/courses/default/course
 * Récupère le cours par défaut
 */
router.get('/default/course', async (req, res) => {
  try {
    const defaultCourse = await Course.findOne({ isDefault: true });
    
    const courseToUse = defaultCourse || await Course.findOne().sort({ createdAt: 1 });
    if (!courseToUse) {
      return res.status(404).json({ error: 'Aucun cours trouvé' });
    }

    const modules = await Module.find({ courseId: courseToUse._id }).sort({ order: 1 });
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await Lesson.find({ moduleId: module._id }).sort({ order: 1 });
        return { ...module.toObject(), lessons };
      })
    );

    res.json({
      success: true,
      course: {
        ...courseToUse.toObject(),
        modules: modulesWithLessons
      }
    });
  } catch (error) {
    console.error('Erreur récupération cours par défaut:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du cours par défaut' });
  }
});

/**
 * GET /api/courses/:id
 * Récupère un cours avec ses modules et leçons
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    // Récupérer les modules du cours
    const modules = await Module.find({ courseId: id }).sort({ order: 1 });
    
    // Récupérer les leçons pour chaque module
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await Lesson.find({ moduleId: module._id }).sort({ order: 1 });
        return {
          ...module.toObject(),
          lessons: lessons
        };
      })
    );
    
    res.json({
      success: true,
      course: {
        ...course.toObject(),
        modules: modulesWithLessons
      }
    });
  } catch (error) {
    console.error('Erreur récupération cours:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du cours' });
  }
});

/**
 * POST /api/courses/init-facebook-ads
 * Initialise le cours Facebook Ads avec toutes les leçons
 */
router.post('/init-facebook-ads', async (req, res) => {
  try {
    // Vérifier si le cours existe déjà
    let course = await Course.findOne({ slug: 'facebook-ads' });
    
    if (!course) {
      // Créer le cours Facebook Ads
      course = new Course({
        title: 'Facebook Ads',
        description: 'Apprendre à vendre avec Facebook Ads - Méthode Andromeda',
        coverImage: '/img/fbads.png',
        slug: 'facebook-ads',
        isDefault: true
      });
      await course.save();
      console.log('✅ Cours Facebook Ads créé');
    } else {
      console.log('ℹ️ Cours Facebook Ads existe déjà');
    }

    // Vérifier si le Module 1 existe
    let module1 = await Module.findOne({ courseId: course._id, order: 1 });
    
    if (!module1) {
      module1 = new Module({
        courseId: course._id,
        title: 'Module 1 - Formation Andromeda',
        order: 1
      });
      await module1.save();
      console.log('✅ Module 1 créé');
    }

    // Données des leçons depuis lessons.js
    const lessonsData = [
      {
        title: 'JOUR 1 - Introduction',
        videoId: '_FEzE2vdu_k',
        videoType: 'youtube',
        order: 1,
        summary: {
          text: `Bienvenue dans la formation Andromeda ! Cette méthode révolutionnaire vous permettra de créer des campagnes Facebook Ads performantes qui génèrent des ventes. Dans ce premier jour, vous découvrirez les fondamentaux de la méthode et comment structurer votre approche pour maximiser vos résultats.`,
          points: [
            'Découvrir la méthode Andromeda',
            'Comprendre la structure d\'une campagne performante',
            'Préparer votre stratégie de lancement',
            'Apprendre les bases du système de test',
            'Maîtriser l\'approche progressive de scaling'
          ]
        },
        resources: [
          {
            icon: '📄',
            title: 'Andromeda - Jour des créas',
            type: 'PDF',
            link: '/assets/docs/andromeda-jour-des-creas.pdf',
            download: true
          }
        ]
      },
      {
        title: 'JOUR 2 - La structure d\'une campagne qui nourrit Andromeda',
        videoId: '1151322854',
        videoType: 'youtube',
        order: 2,
        summary: {
          text: `Aujourd'hui, vous allez découvrir la structure complète d'une campagne Andromeda. Cette méthode révolutionnaire vous permettra de créer des campagnes qui génèrent des ventes de manière prévisible et scalable.`,
          points: [
            'Comprendre les principes fondamentaux de la méthode Andromeda',
            'Découvrir la structure d\'une campagne qui convertit',
            'Apprendre comment nourrir l\'algorithme Facebook efficacement',
            'Maîtriser les éléments clés d\'une campagne performante',
            'Préparer votre stratégie de test et d\'optimisation'
          ]
        },
        resources: [
          {
            icon: '🎓',
            title: 'Formation Comote Sora 2',
            type: 'Lien vers la formation',
            link: '#',
            download: false
          }
        ]
      },
      {
        title: 'JOUR 3 - Créer la créative Andromeda',
        videoId: 'gdG0xjuF7SQ',
        videoType: 'youtube',
        order: 3,
        summary: {
          text: `Aujourd'hui, vous allez créer la créative Andromeda, le cœur de votre campagne. Cette vidéo verticale doit captiver votre audience dès les premières secondes et suivre une structure précise pour maximiser les conversions.`,
          points: [
            '🎬 Vidéo verticale 9:16 – Durée : 20 à 30 secondes',
            '🎣 Hook fort dans les 2 premières secondes pour captiver immédiatement',
            '📐 Structure : Problème → Révélation → Preuve → Promesse → CTA',
            '✨ Optimiser chaque élément pour maximiser l\'engagement',
            '🎯 Créer une vidéo qui convertit efficacement'
          ]
        },
        resources: [
          {
            icon: '📄',
            title: 'Guide de création de campagne',
            type: 'PDF • 4.2 MB',
            link: '/assets/docs/guide-creation-campagne.pdf',
            download: true
          },
          {
            icon: '📝',
            title: 'Formules de copywriting',
            type: 'PDF • 1.8 MB',
            link: '/assets/docs/formules-copywriting.pdf',
            download: true
          }
        ]
      },
      {
        title: 'JOUR 4 - Paramétrer le compte publicitaire',
        videoId: '1151323764',
        videoType: 'youtube',
        order: 4,
      
        summary: {
          text: `Aujourd'hui, vous allez paramétrer correctement votre compte publicitaire Facebook. Cette configuration est essentielle pour que vos campagnes fonctionnent de manière optimale et que vous puissiez suivre précisément vos conversions.`,
          points: [
            '💰 Devise : HKD – Dollar Hong Kong',
            '💳 Ajouter la carte bancaire au compte',
            '💵 Créditer 25 $ (budget pour 5 jours à 5$/jour)',
            '📊 Installer le Pixel Meta sur votre site web',
            '🎯 Configurer l\'événement Purchase (achat) dans le Pixel',
            '✅ Vérifier que le tracking fonctionne correctement'
          ]
        },
        resources: [
          {
            icon: '📄',
            title: 'Dictionnaire des métriques',
            type: 'PDF • 2.8 MB',
            link: '/assets/docs/dictionnaire-metriques.pdf',
            download: true
          },
          {
            icon: '📊',
            title: 'Template de reporting',
            type: 'XLSX • 1.5 MB',
            link: '/assets/docs/template-reporting.xlsx',
            download: true
          }
        ]
      },
      {
        title: 'JOUR 5 - Lancement',
        videoId: '1151379720',
        videoType: 'youtube',
        order: 5,
      
        summary: {
          text: `Le moment est venu ! Aujourd'hui, vous allez lancer votre campagne Andromeda. Cette étape est simple mais cruciale : vous devez activer la campagne et laisser l'algorithme faire son travail sans intervention.`,
          points: [
            '🚀 Activer la campagne préparée hier',
            '⚠️ Ne rien modifier - Laisser l\'algorithme apprendre',
            '👀 Observer uniquement les ventes générées',
            '📊 Noter les premiers résultats sans intervenir',
            '⏳ Laisser tourner au moins 24h sans modification'
          ]
        },
        resources: [
          {
            icon: '📄',
            title: 'Guide de démarrage',
            type: 'PDF • 2.5 MB',
            link: '/assets/docs/guide-demarrage.pdf',
            download: true
          },
          {
            icon: '📊',
            title: 'Checklist de campagne',
            type: 'PDF • 1.2 MB',
            link: '/assets/docs/checklist-campagne.pdf',
            download: true
          }
        ]
      },
      {
        title: 'JOUR 6 - Analyse et optimisation',
        videoId: '148751763',
        videoType: 'youtube',
        order: 6,
        summary: {
          text: `Après 2 jours de lancement, il est temps d'analyser les premiers résultats. Cette phase d'apprentissage est cruciale : vous allez observer ce qui fonctionne et ce qui ne fonctionne pas, sans pour autant intervenir prématurément.`,
          points: [
            '⚠️ Ne couper aucune publicité à ce stade',
            '📝 Noter : Les adsets qui génèrent des achats',
            '📝 Noter : Les adsets complètement ignorés (0 engagement)',
            '📊 Analyser les métriques sans modifier',
            '⏳ Laisser l\'algorithme continuer son apprentissage',
            '📈 Observer les tendances émergentes'
          ]
        },
        resources: [
          {
            icon: '📄',
            title: 'Livre blanc stratégies avancées',
            type: 'PDF • 5.2 MB',
            link: '/assets/docs/livre-blanc-strategies.pdf',
            download: true
          },
          {
            icon: '📊',
            title: 'Exemples de funnel complets',
            type: 'PDF • 3.8 MB',
            link: '/assets/docs/exemples-funnel.pdf',
            download: true
          }
        ]
      },
      {
        title: 'JOUR 7 - Mini Scaling',
        videoId: '148751763',
        videoType: 'youtube',
        order: 7,
        summary: {
          text: `Après 3 jours d'observation, il est temps de faire votre première optimisation. Cette étape de mini scaling vous permettra d'éliminer les adsets morts et d'augmenter progressivement le budget de votre campagne performante.`,
          points: [
            '✂️ Couper uniquement les adsets totalement morts (0 engagement, 0 résultat)',
            '📈 Augmenter le budget de la campagne de +20 % maximum',
            '⚠️ Ne pas modifier les adsets qui génèrent des résultats',
            '💰 Maintenir un budget raisonnable pour continuer l\'apprentissage',
            '📊 Observer l\'impact de ces modifications sur les performances',
            '⏳ Laisser tourner 24h avant toute nouvelle modification'
          ]
        },
        resources: [
          {
            icon: '📄',
            title: 'Guide de scaling progressif',
            type: 'PDF • 2.8 MB',
            link: '/assets/docs/guide-scaling.pdf',
            download: true
          },
          {
            icon: '📊',
            title: 'Template d\'optimisation',
            type: 'XLSX • 1.2 MB',
            link: '/assets/docs/template-optimisation.xlsx',
            download: true
          }
        ]
      },
      {
        title: 'JOUR 8 - Réservation Coaching',
        videoId: '148751763',
        videoType: 'youtube',
        order: 8,
        isCoaching: true,
        summary: {
          text: `Félicitations ! Vous avez terminé la formation Andromeda. Il est maintenant temps de réserver votre session de coaching personnalisée pour approfondir vos connaissances et optimiser vos campagnes.`,
          points: []
        },
        resources: []
      }
    ];

    // Créer ou mettre à jour les leçons
    for (const lessonData of lessonsData) {
      const existingLesson = await Lesson.findOne({ 
        moduleId: module1._id, 
        order: lessonData.order 
      });

      if (!existingLesson) {
        const lesson = new Lesson({
          moduleId: module1._id,
          title: lessonData.title,
          videoId: lessonData.videoId,
          order: lessonData.order,
          locked: false,
          summary: lessonData.summary || {},
          resources: lessonData.resources || []
        });
        await lesson.save();
        console.log(`✅ Leçon ${lessonData.order} créée: ${lessonData.title}`);
    } else {
        // Mettre à jour la leçon existante
        existingLesson.title = lessonData.title;
        existingLesson.videoId = lessonData.videoId;
        if (lessonData.summary) existingLesson.summary = lessonData.summary;
        if (lessonData.resources) existingLesson.resources = lessonData.resources;
        await existingLesson.save();
        console.log(`✅ Leçon ${lessonData.order} mise à jour: ${lessonData.title}`);
      }
    }

    // Récupérer le cours complet avec modules et leçons
    const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await Lesson.find({ moduleId: module._id }).sort({ order: 1 });
        return {
          ...module.toObject(),
          lessons: lessons
        };
      })
    );

    res.json({
      success: true,
      message: 'Cours Facebook Ads initialisé avec succès',
      course: {
        ...course.toObject(),
        modules: modulesWithLessons
      }
    });
  } catch (error) {
    console.error('Erreur initialisation cours Facebook Ads:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'initialisation du cours',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/courses/init-tiktok-ads
 * Initialise le cours TikTok Ads avec modules et leçons
 */
router.post('/init-tiktok-ads', async (req, res) => {
  try {
    let course = await Course.findOne({ slug: 'tiktok-ads' });
    
    if (!course) {
      course = new Course({
        title: 'TikTok Ads',
        description: 'Maîtrisez les campagnes publicitaires TikTok pour le marché africain',
        coverImage: '/img/tiktok-ads-2026.png',
        slug: 'tiktok-ads',
        isPublished: true
      });
      await course.save();
    }

    let module1 = await Module.findOne({ courseId: course._id, order: 1 });
    if (!module1) {
      module1 = new Module({
        courseId: course._id,
        title: 'Module 1 - Maîtrise TikTok Ads',
        order: 1
      });
      await module1.save();
    }

    const lessonsData = [
      {
        title: 'JOUR 1 - Introduction à TikTok Ads',
        videoId: '847328491',
        videoType: 'vimeo',
        order: 1,
        summary: {
          text: 'Découvrez TikTok Ads et son potentiel pour le marché africain. Apprenez les fondamentaux de la plateforme publicitaire TikTok.',
          points: ['Comprendre TikTok Ads', 'Le potentiel du marché africain', 'Les différences avec Facebook Ads', 'Structure d\'une campagne TikTok']
        },
        resources: []
      },
      {
        title: 'JOUR 2 - Configuration du compte TikTok Ads',
        videoId: '912456723',
        videoType: 'vimeo',
        order: 2,
        summary: {
          text: 'Configurez votre compte TikTok Ads Manager étape par étape.',
          points: ['Créer un compte TikTok Ads', 'Configurer la devise et le paiement', 'Comprendre l\'interface', 'Paramètres de base']
        },
        resources: []
      },
      {
        title: 'JOUR 3 - Création de vidéos TikTok performantes',
        videoId: '765234189',
        videoType: 'vimeo',
        order: 3,
        summary: {
          text: 'Apprenez à créer des vidéos TikTok qui convertissent pour vos campagnes publicitaires.',
          points: ['Format vidéo TikTok optimal', 'Hook dans les 3 premières secondes', 'Musique et tendances', 'Call-to-action efficace']
        },
        resources: []
      },
      {
        title: 'JOUR 4 - Lancement de votre première campagne',
        videoId: '623891456',
        videoType: 'vimeo',
        order: 4,
        summary: {
          text: 'Lancez votre première campagne TikTok Ads avec les meilleures pratiques.',
          points: ['Créer une campagne', 'Définir le budget', 'Cibler votre audience', 'Lancer et monitorer']
        },
        resources: []
      },
      {
        title: 'JOUR 5 - Optimisation et scaling',
        videoId: '489567123',
        videoType: 'vimeo',
        order: 5,
        summary: {
          text: 'Optimisez vos campagnes TikTok et augmentez vos résultats.',
          points: ['Analyser les performances', 'Optimiser les créatives', 'Scaling progressif', 'ROI et rentabilité']
        },
        resources: []
      }
    ];

    for (const lessonData of lessonsData) {
      const existingLesson = await Lesson.findOne({ moduleId: module1._id, order: lessonData.order });
      if (!existingLesson) {
        const lesson = new Lesson({
          moduleId: module1._id,
          ...lessonData,
          locked: false
        });
        await lesson.save();
      }
    }

    res.json({ success: true, message: 'Cours TikTok Ads initialisé' });
  } catch (error) {
    console.error('Erreur initialisation TikTok Ads:', error);
    res.status(500).json({ error: 'Erreur lors de l\'initialisation' });
  }
});

/**
 * POST /api/courses/init-shopify
 * Initialise le cours Shopify avec modules et leçons
 */
router.post('/init-shopify', async (req, res) => {
  try {
    let course = await Course.findOne({ slug: 'shopify' });
    
    if (!course) {
      course = new Course({
        title: 'Shopify',
        description: 'Créez et gérez votre boutique Shopify de A à Z',
        coverImage: '/img/shopify-2026.png',
        slug: 'shopify',
        isPublished: true
      });
      await course.save();
    }

    let module1 = await Module.findOne({ courseId: course._id, order: 1 });
    if (!module1) {
      module1 = new Module({
        courseId: course._id,
        title: 'Module 1 - Création boutique Shopify',
        order: 1
      });
      await module1.save();
    }

    const lessonsData = [
      {
        title: 'JOUR 1 - Introduction à Shopify',
        videoId: '856234791',
        videoType: 'vimeo',
        order: 1,
        summary: {
          text: 'Découvrez Shopify et apprenez pourquoi c\'est la meilleure plateforme e-commerce pour l\'Afrique.',
          points: ['Qu\'est-ce que Shopify', 'Avantages pour le marché africain', 'Tarifs et plans', 'Préparer votre projet']
        },
        resources: []
      },
      {
        title: 'JOUR 2 - Configuration de votre boutique',
        videoId: '723456891',
        videoType: 'vimeo',
        order: 2,
        summary: {
          text: 'Configurez votre boutique Shopify étape par étape.',
          points: ['Créer votre compte', 'Choisir un thème', 'Configurer les paramètres', 'Personnaliser le design']
        },
        resources: []
      },
      {
        title: 'JOUR 3 - Ajouter vos produits',
        videoId: '634789123',
        videoType: 'vimeo',
        order: 3,
        summary: {
          text: 'Apprenez à ajouter et gérer vos produits sur Shopify.',
          points: ['Créer un produit', 'Photos et descriptions', 'Variantes et prix', 'Gestion des stocks']
        },
        resources: []
      },
      {
        title: 'JOUR 4 - Configuration des paiements et livraisons',
        videoId: '567891234',
        videoType: 'vimeo',
        order: 4,
        summary: {
          text: 'Configurez les méthodes de paiement et de livraison pour l\'Afrique.',
          points: ['Méthodes de paiement africaines', 'Zones de livraison', 'Tarifs de livraison', 'Gestion des commandes']
        },
        resources: []
      },
      {
        title: 'JOUR 5 - Marketing et vente',
        videoId: '456123789',
        videoType: 'vimeo',
        order: 5,
        summary: {
          text: 'Apprenez à promouvoir et vendre sur votre boutique Shopify.',
          points: ['SEO et référencement', 'Réseaux sociaux', 'Email marketing', 'Analytics et performance']
        },
        resources: []
      }
    ];

    for (const lessonData of lessonsData) {
      const existingLesson = await Lesson.findOne({ moduleId: module1._id, order: lessonData.order });
      if (!existingLesson) {
        const lesson = new Lesson({
          moduleId: module1._id,
          ...lessonData,
          locked: false
        });
        await lesson.save();
      }
    }

    res.json({ success: true, message: 'Cours Shopify initialisé' });
  } catch (error) {
    console.error('Erreur initialisation Shopify:', error);
    res.status(500).json({ error: 'Erreur lors de l\'initialisation' });
  }
});

/**
 * POST /api/courses/init-creatives-sora
 * Initialise le cours Créatives avec Sora 2
 */
router.post('/init-creatives-sora', async (req, res) => {
  try {
    let course = await Course.findOne({ slug: 'creatives-sora' });
    
    if (!course) {
      course = new Course({
        title: 'Créatives avec Sora 2',
        description: 'Créez des vidéos publicitaires percutantes avec Sora 2',
        coverImage: '/img/creatives-2026.png',
        slug: 'creatives-sora',
        isPublished: true
      });
      await course.save();
    }

    let module1 = await Module.findOne({ courseId: course._id, order: 1 });
    if (!module1) {
      module1 = new Module({
        courseId: course._id,
        title: 'Module 1 - Maîtrise Sora 2',
        order: 1
      });
      await module1.save();
    }

    const lessonsData = [
      {
        title: 'JOUR 1 - Introduction à Sora 2',
        videoId: '891234567',
        videoType: 'vimeo',
        order: 1,
        summary: {
          text: 'Découvrez Sora 2, l\'outil révolutionnaire de génération vidéo IA.',
          points: ['Qu\'est-ce que Sora 2', 'Capacités et limites', 'Cas d\'usage publicitaires', 'Préparer vos prompts']
        },
        resources: []
      },
      {
        title: 'JOUR 2 - Créer vos premières vidéos',
        videoId: '789123456',
        videoType: 'vimeo',
        order: 2,
        summary: {
          text: 'Apprenez à créer vos premières vidéos avec Sora 2.',
          points: ['Interface Sora 2', 'Rédiger des prompts efficaces', 'Générer des vidéos', 'Premiers résultats']
        },
        resources: []
      },
      {
        title: 'JOUR 3 - Optimisation des créatives',
        videoId: '678912345',
        videoType: 'vimeo',
        order: 3,
        summary: {
          text: 'Optimisez vos vidéos générées pour maximiser les conversions.',
          points: ['Édition et post-production', 'Ajouter du texte et CTA', 'Musique et voix off', 'Format pour réseaux sociaux']
        },
        resources: []
      },
      {
        title: 'JOUR 4 - Intégration dans vos campagnes',
        videoId: '567891234',
        videoType: 'vimeo',
        order: 4,
        summary: {
          text: 'Intégrez vos créatives Sora 2 dans vos campagnes publicitaires.',
          points: ['Exporter vos vidéos', 'Formats optimaux', 'A/B testing', 'Performance et ROI']
        },
        resources: []
      }
    ];

    for (const lessonData of lessonsData) {
      const existingLesson = await Lesson.findOne({ moduleId: module1._id, order: lessonData.order });
      if (!existingLesson) {
        const lesson = new Lesson({
          moduleId: module1._id,
          ...lessonData,
          locked: false
        });
        await lesson.save();
      }
    }

    res.json({ success: true, message: 'Cours Créatives Sora initialisé' });
  } catch (error) {
    console.error('Erreur initialisation Créatives Sora:', error);
    res.status(500).json({ error: 'Erreur lors de l\'initialisation' });
  }
});

/**
 * POST /api/courses/init-alibaba
 * Initialise le cours Achat sur Alibaba
 */
router.post('/init-alibaba', async (req, res) => {
  try {
    let course = await Course.findOne({ slug: 'alibaba' });
    
    if (!course) {
      course = new Course({
        title: 'Achat sur Alibaba',
        description: 'Apprenez à acheter en gros sur Alibaba pour votre business e-commerce',
        coverImage: '/img/alibaba-2026.png',
        slug: 'alibaba',
        isPublished: true
      });
      await course.save();
    }

    let module1 = await Module.findOne({ courseId: course._id, order: 1 });
    if (!module1) {
      module1 = new Module({
        courseId: course._id,
        title: 'Module 1 - Maîtrise Alibaba',
        order: 1
      });
      await module1.save();
    }

    const lessonsData = [
      {
        title: 'JOUR 1 - Introduction à Alibaba',
        videoId: '345678912',
        videoType: 'vimeo',
        order: 1,
        summary: {
          text: 'Découvrez Alibaba et apprenez à naviguer sur la plateforme.',
          points: ['Qu\'est-ce qu\'Alibaba', 'Types de fournisseurs', 'Navigation sur le site', 'Recherche de produits']
        },
        resources: []
      },
      {
        title: 'JOUR 2 - Trouver les bons fournisseurs',
        videoId: '234567891',
        videoType: 'vimeo',
        order: 2,
        summary: {
          text: 'Apprenez à identifier et choisir les meilleurs fournisseurs sur Alibaba.',
          points: ['Critères de sélection', 'Vérifier la fiabilité', 'Négocier les prix', 'Échantillons et commandes test']
        },
        resources: []
      },
      {
        title: 'JOUR 3 - Négociation et commande',
        videoId: '123456789',
        videoType: 'vimeo',
        order: 3,
        summary: {
          text: 'Maîtrisez l\'art de la négociation et passez vos premières commandes.',
          points: ['Techniques de négociation', 'MOQ et prix', 'Paiement sécurisé', 'Suivi de commande']
        },
        resources: []
      },
      {
        title: 'JOUR 4 - Logistique et importation',
        videoId: '912345678',
        videoType: 'vimeo',
        order: 4,
        summary: {
          text: 'Gérez la logistique et l\'importation vers l\'Afrique.',
          points: ['Transport et shipping', 'Douanes et taxes', 'Documentation nécessaire', 'Réception et contrôle qualité']
        },
        resources: []
      }
    ];

    for (const lessonData of lessonsData) {
      const existingLesson = await Lesson.findOne({ moduleId: module1._id, order: lessonData.order });
      if (!existingLesson) {
        const lesson = new Lesson({
          moduleId: module1._id,
          ...lessonData,
          locked: false
        });
        await lesson.save();
      }
    }

    res.json({ success: true, message: 'Cours Alibaba initialisé' });
  } catch (error) {
    console.error('Erreur initialisation Alibaba:', error);
    res.status(500).json({ error: 'Erreur lors de l\'initialisation' });
  }
});

/**
 * POST /api/courses/init-recherche-produit
 * Initialise le cours Recherche de produits
 */
router.post('/init-recherche-produit', async (req, res) => {
  try {
    let course = await Course.findOne({ slug: 'recherche-produit' });
    
    if (!course) {
      course = new Course({
        title: 'Recherche de Produits',
        description: 'Trouvez les produits gagnants pour votre business e-commerce',
        coverImage: '/img/produits-gagnants-2026.png',
        slug: 'recherche-produit',
        isPublished: true
      });
      await course.save();
    }

    let module1 = await Module.findOne({ courseId: course._id, order: 1 });
    if (!module1) {
      module1 = new Module({
        courseId: course._id,
        title: 'Module 1 - Trouver des produits gagnants',
        order: 1
      });
      await module1.save();
    }

    const lessonsData = [
      {
        title: 'JOUR 1 - Introduction à la recherche de produits',
        videoId: '456789123',
        videoType: 'vimeo',
        order: 1,
        summary: {
          text: 'Apprenez les fondamentaux de la recherche de produits gagnants.',
          points: ['Qu\'est-ce qu\'un produit gagnant', 'Critères de sélection', 'Marchés porteurs en Afrique', 'Outils de recherche']
        },
        resources: []
      },
      {
        title: 'JOUR 2 - Analyser la demande et la concurrence',
        videoId: '567891234',
        videoType: 'vimeo',
        order: 2,
        summary: {
          text: 'Analysez la demande et la concurrence pour vos produits.',
          points: ['Étude de marché', 'Analyse concurrentielle', 'Tendances et saisonnalité', 'Niche vs marché large']
        },
        resources: []
      },
      {
        title: 'JOUR 3 - Valider votre produit',
        videoId: '678912345',
        videoType: 'vimeo',
        order: 3,
        summary: {
          text: 'Validez votre choix de produit avant d\'investir.',
          points: ['Tests de marché', 'Échantillons et prototypes', 'Feedback clients', 'Calcul de rentabilité']
        },
        resources: []
      },
      {
        title: 'JOUR 4 - Sourcing et approvisionnement',
        videoId: '789123456',
        videoType: 'vimeo',
        order: 4,
        summary: {
          text: 'Trouvez les meilleurs fournisseurs pour vos produits.',
          points: ['Sourcing sur Alibaba', 'Alternatives de sourcing', 'Négociation des prix', 'Gestion des stocks']
        },
        resources: []
      }
    ];

    for (const lessonData of lessonsData) {
      const existingLesson = await Lesson.findOne({ moduleId: module1._id, order: lessonData.order });
      if (!existingLesson) {
        const lesson = new Lesson({
          moduleId: module1._id,
          ...lessonData,
          locked: false
        });
        await lesson.save();
      }
    }

    res.json({ success: true, message: 'Cours Recherche Produit initialisé' });
  } catch (error) {
    console.error('Erreur initialisation Recherche Produit:', error);
    res.status(500).json({ error: 'Erreur lors de l\'initialisation' });
  }
});

/**
 * POST /api/courses/:courseId/lessons/:lessonId/complete
 * Marquer une leçon comme terminée
 */
router.post('/:courseId/lessons/:lessonId/complete', authenticate, checkAccountStatus, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier que la leçon existe
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Leçon non trouvée' });
    }

    // Vérifier si la progression existe déjà
    const existingProgress = user.lessonProgress.find(
      p => p.lessonId.toString() === lessonId && p.courseId.toString() === courseId
    );

    if (existingProgress) {
      // Mettre à jour la progression existante
      existingProgress.completed = true;
      existingProgress.completedAt = new Date();
      existingProgress.lastAccessedAt = new Date();
    } else {
      // Créer une nouvelle progression
      user.lessonProgress.push({
        lessonId,
        courseId,
        completed: true,
        completedAt: new Date(),
        lastAccessedAt: new Date()
      });
    }

    await user.save();

    // Calculer la progression du cours
    const modules = await Module.find({ courseId });
    const moduleIds = modules.map(m => m._id);
    const allLessons = await Lesson.find({ moduleId: { $in: moduleIds } });
    const completedLessons = user.lessonProgress.filter(
      p => p.courseId.toString() === courseId && p.completed
    ).length;

    const progressPercentage = allLessons.length > 0 
      ? Math.round((completedLessons / allLessons.length) * 100) 
      : 0;

    res.json({
      success: true,
      progress: {
        lessonId,
        completed: true,
        completedLessons,
        totalLessons: allLessons.length,
        progressPercentage
      }
    });
  } catch (error) {
    console.error('Erreur marquage leçon complétée:', error);
    res.status(500).json({ error: 'Erreur lors du marquage de la leçon' });
  }
});

/**
 * GET /api/courses/:courseId/progress
 * Récupérer la progression d'un cours
 */
router.get('/:courseId/progress', authenticate, checkAccountStatus, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Récupérer toutes les leçons du cours
    const modules = await Module.find({ courseId }).sort({ order: 1 });
    const moduleIds = modules.map(m => m._id);
    const allLessons = await Lesson.find({ moduleId: { $in: moduleIds } }).sort({ order: 1 });

    // Calculer la progression
    const completedLessonIds = user.lessonProgress
      .filter(p => p.courseId.toString() === courseId && p.completed)
      .map(p => p.lessonId.toString());

    const lessonsWithProgress = allLessons.map(lesson => ({
      _id: lesson._id,
      title: lesson.title,
      completed: completedLessonIds.includes(lesson._id.toString())
    }));

    const progressPercentage = allLessons.length > 0 
      ? Math.round((completedLessonIds.length / allLessons.length) * 100) 
      : 0;

    res.json({
      success: true,
      progress: {
        completedLessons: completedLessonIds.length,
        totalLessons: allLessons.length,
        progressPercentage,
        lessons: lessonsWithProgress
      }
    });
  } catch (error) {
    console.error('Erreur récupération progression cours:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la progression' });
  }
});

export default router;

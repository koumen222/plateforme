import express from 'express';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';

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
        videoType: 'vimeo',
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
        videoType: 'vimeo',
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
        videoType: 'vimeo',
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
        videoType: 'vimeo',
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
        videoType: 'vimeo',
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
        videoType: 'vimeo',
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
 * POST /api/courses/init-scalor
 * Initialise la formation "Prise en main de Scalor"
 */
router.post('/init-scalor', async (req, res) => {
  try {
    let course = await Course.findOne({ slug: 'prise-en-main-scalor' });

    if (!course) {
      course = new Course({
        title: 'Prise en main de Scalor',
        description: 'Maîtrisez Scalor de A à Z : la solution clé en main pour automatiser et scaler votre business e-commerce en Afrique.',
        coverImage: '/img/scalor-2026.png',
        slug: 'prise-en-main-scalor',
        isPublished: true
      });
      await course.save();
      console.log('✅ Cours Scalor créé');
    }

    // ─── MODULE 1 — Découverte de Scalor ───────────────────────────────────
    let module1 = await Module.findOne({ courseId: course._id, order: 1 });
    if (!module1) {
      module1 = new Module({ courseId: course._id, title: 'Module 1 – Découverte de Scalor', order: 1 });
      await module1.save();
    }

    const module1Lessons = [
      {
        title: 'Leçon 1 – Qu\'est-ce que Scalor ?',
        videoId: '',
        videoType: 'text',
        order: 1,
        locked: false,
        content: `<h2>Bienvenue dans la formation Prise en main de Scalor</h2>
<p>Scalor est la solution tout-en-un conçue pour les e-commerçants africains. Elle regroupe en un seul endroit tous les outils dont vous avez besoin pour gérer, automatiser et faire scaler votre business.</p>
<h3>Ce que Scalor résout pour vous</h3>
<ul>
  <li>Fini jongler entre 5 outils différents</li>
  <li>Gestion centralisée des commandes, produits et clients</li>
  <li>Automatisation des tâches répétitives</li>
  <li>Tableaux de bord adaptés au marché africain (Mobile Money, COD…)</li>
</ul>
<h3>Pour qui est Scalor ?</h3>
<p>Scalor est fait pour vous si vous vendez en ligne en Afrique et que vous voulez arrêter de perdre du temps sur l'opérationnel pour vous concentrer sur la croissance.</p>`,
        summary: {
          text: 'Découvrez ce qu\'est Scalor, pourquoi il a été créé et comment il va transformer votre façon de gérer votre business e-commerce.',
          points: [
            'Comprendre la vision et la mission de Scalor',
            'Identifier les problèmes que Scalor résout',
            'Découvrir les fonctionnalités clés de la plateforme',
            'Savoir si Scalor correspond à votre situation'
          ]
        },
        resources: [
          { icon: '🌐', title: 'Site officiel Scalor', type: 'Lien', link: 'https://scalor.net', download: false }
        ]
      },
      {
        title: 'Leçon 2 – Créer et configurer votre compte',
        videoId: '',
        videoType: 'text',
        order: 2,
        locked: false,
        content: `<h2>Créer votre compte Scalor en 5 minutes</h2>
<p>Rendez-vous sur <strong>scalor.net</strong> et cliquez sur « Essai gratuit ».</p>
<h3>Étapes de création du compte</h3>
<ol>
  <li>Renseigner votre email et créer un mot de passe sécurisé</li>
  <li>Confirmer votre adresse email</li>
  <li>Choisir votre pays (Cameroun, Côte d'Ivoire, Sénégal, etc.)</li>
  <li>Sélectionner votre devise locale</li>
  <li>Nommer votre boutique</li>
</ol>
<h3>Paramètres essentiels à configurer dès le départ</h3>
<ul>
  <li><strong>Informations boutique</strong> : nom, logo, description</li>
  <li><strong>Devise & fiscalité</strong> : FCFA, USD ou autre</li>
  <li><strong>Fuseau horaire</strong> : choisir votre pays pour que les stats soient correctes</li>
  <li><strong>Email de notification</strong> : celui qui reçoit les alertes commandes</li>
</ul>`,
        summary: {
          text: 'Créez votre compte Scalor et configurez les paramètres de base pour démarrer dans les meilleures conditions.',
          points: [
            'Créer un compte en moins de 5 minutes',
            'Configurer les informations de votre boutique',
            'Choisir la bonne devise et le bon fuseau horaire',
            'Activer les notifications de commandes'
          ]
        },
        resources: [
          { icon: '🌐', title: 'Créer mon compte Scalor', type: 'Lien', link: 'https://scalor.net', download: false }
        ]
      },
      {
        title: 'Leçon 3 – Tour complet du tableau de bord',
        videoId: '',
        videoType: 'text',
        order: 3,
        locked: false,
        content: `<h2>Le tableau de bord Scalor : votre cockpit business</h2>
<p>Le dashboard Scalor affiche en temps réel toutes les métriques importantes de votre activité.</p>
<h3>Les sections principales</h3>
<ul>
  <li><strong>Chiffre d'affaires du jour / semaine / mois</strong> : avec comparaison à la période précédente</li>
  <li><strong>Nombre de commandes</strong> : en cours, livrées, annulées</li>
  <li><strong>Produits top performers</strong> : ce qui se vend le mieux</li>
  <li><strong>Clients récents</strong> : nouveaux vs clients fidèles</li>
  <li><strong>Alertes opérationnelles</strong> : stock faible, paiements en attente…</li>
</ul>
<h3>Personnaliser votre vue</h3>
<p>Vous pouvez réorganiser les widgets selon vos priorités. Commencez par afficher les métriques qui comptent le plus pour votre business.</p>`,
        summary: {
          text: 'Apprenez à lire et interpréter le tableau de bord Scalor pour piloter votre business avec les bons chiffres.',
          points: [
            'Identifier les métriques clés sur le dashboard',
            'Comprendre le chiffre d\'affaires en temps réel',
            'Lire les statuts de commandes',
            'Personnaliser la vue selon vos besoins'
          ]
        },
        resources: []
      }
    ];

    for (const l of module1Lessons) {
      const existing = await Lesson.findOne({ moduleId: module1._id, order: l.order });
      if (!existing) {
        await new Lesson({ moduleId: module1._id, ...l }).save();
        console.log(`✅ Module 1 — Leçon ${l.order} créée`);
      } else {
        Object.assign(existing, l);
        await existing.save();
        console.log(`✅ Module 1 — Leçon ${l.order} mise à jour`);
      }
    }

    // ─── MODULE 2 — Gérer ses produits et commandes ────────────────────────
    let module2 = await Module.findOne({ courseId: course._id, order: 2 });
    if (!module2) {
      module2 = new Module({ courseId: course._id, title: 'Module 2 – Produits, commandes & clients', order: 2 });
      await module2.save();
    }

    const module2Lessons = [
      {
        title: 'Leçon 1 – Ajouter et gérer vos produits',
        videoId: '',
        videoType: 'text',
        order: 1,
        locked: false,
        content: `<h2>Gérer votre catalogue produits sur Scalor</h2>
<p>Un catalogue bien structuré = plus de conversions. Voici comment ajouter vos produits de façon professionnelle.</p>
<h3>Ajouter un produit</h3>
<ol>
  <li>Aller dans <strong>Produits → Ajouter un produit</strong></li>
  <li>Renseigner le titre (clair et accrocheur)</li>
  <li>Ajouter des photos de qualité (fond blanc ou lifestyle)</li>
  <li>Rédiger une description orientée bénéfices</li>
  <li>Définir le prix de vente et le coût d'achat</li>
  <li>Configurer le stock et les variantes (taille, couleur…)</li>
</ol>
<h3>Bonnes pratiques</h3>
<ul>
  <li>Toujours renseigner le poids pour le calcul des frais de livraison</li>
  <li>Utiliser des tags pour organiser et filtrer vos produits</li>
  <li>Mettre un prix barré si vous faites une promo</li>
</ul>`,
        summary: {
          text: 'Construisez un catalogue produits professionnel qui donne confiance à vos clients et facilite vos ventes.',
          points: [
            'Ajouter un produit avec toutes les informations nécessaires',
            'Optimiser les photos et descriptions pour convertir',
            'Configurer prix, stock et variantes',
            'Organiser le catalogue avec des catégories et tags'
          ]
        },
        resources: []
      },
      {
        title: 'Leçon 2 – Traiter et suivre les commandes',
        videoId: '',
        videoType: 'text',
        order: 2,
        locked: false,
        content: `<h2>Le traitement des commandes sur Scalor</h2>
<p>Chaque commande passe par plusieurs statuts. Maîtriser ce flux vous permet de livrer vite et de satisfaire vos clients.</p>
<h3>Les statuts d'une commande</h3>
<ul>
  <li><strong>Nouvelle</strong> : commande reçue, à traiter</li>
  <li><strong>Confirmée</strong> : client appelé et confirmé (surtout en COD)</li>
  <li><strong>En préparation</strong> : produit packagé</li>
  <li><strong>Expédiée</strong> : remise au livreur avec numéro de suivi</li>
  <li><strong>Livrée</strong> : client a reçu sa commande</li>
  <li><strong>Annulée / Retournée</strong> : à gérer séparément</li>
</ul>
<h3>Traitement efficace des commandes COD</h3>
<p>En Afrique, le Cash on Delivery (paiement à la livraison) représente souvent 70-80% des ventes. Scalor vous permet de gérer ce flux avec des notes clients, rappels et confirmations automatiques.</p>`,
        summary: {
          text: 'Traitez vos commandes rapidement et efficacement pour maximiser le taux de livraison et minimiser les retours.',
          points: [
            'Comprendre les statuts de commandes',
            'Confirmer et traiter une commande COD',
            'Gérer les expéditions et numéros de suivi',
            'Réduire les annulations et retours'
          ]
        },
        resources: []
      },
      {
        title: 'Leçon 3 – Gérer vos clients et fidélisation',
        videoId: '',
        videoType: 'text',
        order: 3,
        locked: false,
        content: `<h2>La base clients : votre actif le plus précieux</h2>
<p>Un client qui rachète coûte 5x moins cher à convaincre qu'un nouveau client. Scalor vous donne les outils pour entretenir cette relation.</p>
<h3>La fiche client sur Scalor</h3>
<ul>
  <li>Historique complet des commandes</li>
  <li>Coordonnées et localisation</li>
  <li>Tags personnalisés (VIP, problème de livraison, etc.)</li>
  <li>Notes internes pour l'équipe</li>
</ul>
<h3>Segmenter votre base pour relancer efficacement</h3>
<ul>
  <li>Clients qui n'ont pas commandé depuis 30 jours</li>
  <li>Clients ayant dépensé plus de X FCFA</li>
  <li>Clients ayant commandé un produit spécifique</li>
</ul>
<p>Ces segments vous permettent d'envoyer des messages WhatsApp ou email ultra-ciblés.</p>`,
        summary: {
          text: 'Exploitez votre base clients pour générer plus de ventes sans augmenter votre budget pub.',
          points: [
            'Lire et enrichir la fiche d\'un client',
            'Taguer et segmenter vos clients',
            'Identifier les clients à relancer en priorité',
            'Préparer des campagnes de fidélisation'
          ]
        },
        resources: []
      }
    ];

    for (const l of module2Lessons) {
      const existing = await Lesson.findOne({ moduleId: module2._id, order: l.order });
      if (!existing) {
        await new Lesson({ moduleId: module2._id, ...l }).save();
        console.log(`✅ Module 2 — Leçon ${l.order} créée`);
      } else {
        Object.assign(existing, l);
        await existing.save();
        console.log(`✅ Module 2 — Leçon ${l.order} mise à jour`);
      }
    }

    // ─── MODULE 3 — Paiements & livraison ─────────────────────────────────
    let module3 = await Module.findOne({ courseId: course._id, order: 3 });
    if (!module3) {
      module3 = new Module({ courseId: course._id, title: 'Module 3 – Paiements & livraison en Afrique', order: 3 });
      await module3.save();
    }

    const module3Lessons = [
      {
        title: 'Leçon 1 – Configurer les moyens de paiement',
        videoId: '',
        videoType: 'text',
        order: 1,
        locked: false,
        content: `<h2>Accepter les paiements sur Scalor</h2>
<p>Scalor prend en charge les méthodes de paiement utilisées en Afrique pour que vous ne perdiez aucune vente.</p>
<h3>Méthodes de paiement disponibles</h3>
<ul>
  <li><strong>Cash on Delivery (COD)</strong> : paiement à la livraison — le plus utilisé</li>
  <li><strong>Mobile Money</strong> : Orange Money, MTN MoMo, Wave, etc.</li>
  <li><strong>Virement bancaire</strong></li>
  <li><strong>Carte bancaire</strong> via Stripe ou Flutterwave</li>
</ul>
<h3>Activer le COD</h3>
<p>Dans <strong>Paramètres → Paiements</strong>, activez le mode COD et définissez les zones de livraison où il est disponible. Vous pouvez aussi ajouter des frais supplémentaires pour le COD si vous le souhaitez.</p>
<h3>Connecter Mobile Money</h3>
<p>Scalor s'intègre directement avec les APIs Mobile Money des principaux opérateurs. Suivez le guide d'intégration dans les paramètres pour activer cette option en moins de 10 minutes.</p>`,
        summary: {
          text: 'Configurez les bons moyens de paiement pour votre marché et ne perdez plus de ventes faute de solution adaptée.',
          points: [
            'Activer le Cash on Delivery (COD)',
            'Connecter Mobile Money (Orange, MTN, Wave…)',
            'Configurer les frais selon le mode de paiement',
            'Tester le flux de paiement avant de lancer'
          ]
        },
        resources: []
      },
      {
        title: 'Leçon 2 – Gérer la livraison et les expéditions',
        videoId: '',
        videoType: 'text',
        order: 2,
        locked: false,
        content: `<h2>La livraison : là où se gagne ou se perd la fidélité client</h2>
<p>Une livraison rapide et bien communiquée = client satisfait qui revient. Voici comment configurer ce flux sur Scalor.</p>
<h3>Configurer les zones de livraison</h3>
<ol>
  <li>Aller dans <strong>Paramètres → Livraison</strong></li>
  <li>Créer des zones géographiques (ex : Douala ville, Douala périphérie, Yaoundé…)</li>
  <li>Définir un tarif fixe ou calculé selon le poids</li>
  <li>Activer ou désactiver la livraison gratuite à partir d'un certain montant</li>
</ol>
<h3>Connecter votre livreur</h3>
<p>Si vous travaillez avec un livreur ou un service de coursiers, vous pouvez créer un compte livreur dans Scalor. Il recevra les détails de commande directement sur son interface mobile.</p>
<h3>Tracking des expéditions</h3>
<p>Renseignez le numéro de suivi dans la commande. Le client reçoit automatiquement un SMS ou WhatsApp avec le lien de tracking.</p>`,
        summary: {
          text: 'Mettez en place un système de livraison professionnel qui réduit les retours et augmente la satisfaction client.',
          points: [
            'Créer des zones de livraison avec les bons tarifs',
            'Connecter votre livreur ou coursier',
            'Ajouter un numéro de suivi et notifier le client',
            'Gérer les livraisons échouées et les retours'
          ]
        },
        resources: []
      }
    ];

    for (const l of module3Lessons) {
      const existing = await Lesson.findOne({ moduleId: module3._id, order: l.order });
      if (!existing) {
        await new Lesson({ moduleId: module3._id, ...l }).save();
        console.log(`✅ Module 3 — Leçon ${l.order} créée`);
      } else {
        Object.assign(existing, l);
        await existing.save();
        console.log(`✅ Module 3 — Leçon ${l.order} mise à jour`);
      }
    }

    // ─── MODULE 4 — Automatisation & Scaling ──────────────────────────────
    let module4 = await Module.findOne({ courseId: course._id, order: 4 });
    if (!module4) {
      module4 = new Module({ courseId: course._id, title: 'Module 4 – Automatisation & Scaling', order: 4 });
      await module4.save();
    }

    const module4Lessons = [
      {
        title: 'Leçon 1 – Automatiser les notifications et relances',
        videoId: '',
        videoType: 'text',
        order: 1,
        locked: false,
        content: `<h2>L'automatisation : faire plus sans travailler plus</h2>
<p>Scalor vous permet d'automatiser les communications avec vos clients à chaque étape du parcours d'achat.</p>
<h3>Automatisations disponibles</h3>
<ul>
  <li><strong>Confirmation de commande</strong> : SMS ou WhatsApp automatique dès la commande reçue</li>
  <li><strong>Rappel de paiement</strong> : relance automatique si le paiement n'est pas finalisé</li>
  <li><strong>Notification d'expédition</strong> : message au client quand la commande est expédiée</li>
  <li><strong>Relance panier abandonné</strong> : message 1h et 24h après l'abandon</li>
  <li><strong>Demande d'avis</strong> : message automatique 3 jours après la livraison</li>
</ul>
<h3>Configurer vos automatisations</h3>
<p>Dans <strong>Marketing → Automatisations</strong>, activez chaque scénario et personnalisez le message avec les variables disponibles ({{nom_client}}, {{produit}}, {{numéro_commande}}, etc.).</p>`,
        summary: {
          text: 'Mettez en place des automatisations qui travaillent pour vous 24h/24 et augmentent vos ventes sans effort supplémentaire.',
          points: [
            'Activer les notifications automatiques de commande',
            'Configurer les relances de panier abandonné',
            'Automatiser les demandes d\'avis clients',
            'Personnaliser les messages avec les bonnes variables'
          ]
        },
        resources: []
      },
      {
        title: 'Leçon 2 – Analytics et pilotage de la croissance',
        videoId: '',
        videoType: 'text',
        order: 2,
        locked: false,
        content: `<h2>Piloter votre croissance avec les données Scalor</h2>
<p>Ce qui ne se mesure pas ne se gère pas. Scalor vous donne accès à des analytics claires pour prendre de meilleures décisions.</p>
<h3>KPIs à suivre chaque semaine</h3>
<ul>
  <li><strong>Taux de conversion</strong> : visiteurs qui achètent (objectif : >2%)</li>
  <li><strong>Panier moyen</strong> : à augmenter via les upsells</li>
  <li><strong>Taux de livraison</strong> : commandes livrées / commandes expédiées (objectif : >75%)</li>
  <li><strong>Taux de retour</strong> : à maintenir sous 15%</li>
  <li><strong>LTV (Lifetime Value)</strong> : valeur totale d'un client sur le long terme</li>
</ul>
<h3>Rapport hebdomadaire automatique</h3>
<p>Activez le rapport hebdomadaire par email dans <strong>Paramètres → Rapports</strong>. Chaque lundi matin, vous recevrez un résumé complet de la semaine passée.</p>`,
        summary: {
          text: 'Utilisez les données Scalor pour prendre de meilleures décisions et accélérer la croissance de votre business.',
          points: [
            'Identifier les KPIs les plus importants pour votre activité',
            'Lire et interpréter les rapports Scalor',
            'Repérer les points de friction dans le parcours client',
            'Prendre des décisions basées sur les données, pas sur le feeling'
          ]
        },
        resources: []
      },
      {
        title: 'Leçon 3 – Stratégies de scaling avec Scalor',
        videoId: '',
        videoType: 'text',
        order: 3,
        locked: false,
        content: `<h2>Scaler votre business avec Scalor</h2>
<p>Une fois les bases en place, Scalor vous donne les leviers pour multiplier votre chiffre d'affaires sans multiplier votre charge de travail.</p>
<h3>Levier 1 — Upsell et cross-sell</h3>
<p>Proposez des produits complémentaires sur la page produit et dans la confirmation de commande. Un upsell bien placé peut augmenter le panier moyen de 20 à 40%.</p>
<h3>Levier 2 — Programme de fidélité</h3>
<p>Récompensez vos meilleurs clients avec des points ou des remises exclusives. Scalor gère ce programme automatiquement.</p>
<h3>Levier 3 — Référence et parrainage</h3>
<p>Créez un programme de parrainage où chaque client satisfait vous ramène de nouveaux clients en échange d'une récompense. Le meilleur canal d'acquisition au coût le plus bas.</p>
<h3>Levier 4 — Équipe et délégation</h3>
<p>Scalor vous permet d'inviter des collaborateurs (gestionnaire de commandes, SAV, livreur) avec des droits d'accès limités. Déléguer sans perdre le contrôle.</p>`,
        summary: {
          text: 'Appliquez les stratégies de scaling pour multiplier votre chiffre d\'affaires en utilisant pleinement les capacités de Scalor.',
          points: [
            'Configurer les upsells et cross-sells',
            'Mettre en place un programme de fidélité',
            'Lancer un système de parrainage',
            'Inviter et gérer votre équipe sur Scalor'
          ]
        },
        resources: [
          { icon: '🌐', title: 'Tester Scalor gratuitement', type: 'Lien', link: 'https://scalor.net', download: false }
        ]
      }
    ];

    for (const l of module4Lessons) {
      const existing = await Lesson.findOne({ moduleId: module4._id, order: l.order });
      if (!existing) {
        await new Lesson({ moduleId: module4._id, ...l }).save();
        console.log(`✅ Module 4 — Leçon ${l.order} créée`);
      } else {
        Object.assign(existing, l);
        await existing.save();
        console.log(`✅ Module 4 — Leçon ${l.order} mise à jour`);
      }
    }

    // Retourner le cours complet
    const allModules = await Module.find({ courseId: course._id }).sort({ order: 1 });
    const modulesWithLessons = await Promise.all(
      allModules.map(async (mod) => {
        const lessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 });
        return { ...mod.toObject(), lessons };
      })
    );

    res.json({
      success: true,
      message: 'Formation Prise en main de Scalor initialisée avec succès',
      course: { ...course.toObject(), modules: modulesWithLessons }
    });
  } catch (error) {
    console.error('Erreur initialisation Scalor:', error);
    res.status(500).json({ error: 'Erreur lors de l\'initialisation', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

export default router;

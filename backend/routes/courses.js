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
    // Récupérer uniquement les cours "activés/publies" (par défaut en premier)
    const courses = await Course.find({ isPublished: true }).sort({ isDefault: -1, createdAt: -1 });
    
    res.json({
      success: true,
      courses: courses
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

export default router;

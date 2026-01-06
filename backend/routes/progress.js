import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import { authenticate, checkAccountStatus } from '../middleware/auth.js';

const router = express.Router();

// Appliquer les middlewares à toutes les routes
router.use(authenticate);
router.use(checkAccountStatus);

// GET /api/progress - Récupérer la progression de l'utilisateur
router.get('/', async (req, res) => {
  try {
    // Vérifier que l'utilisateur est actif
    // 🔥 Les utilisateurs Google sont toujours autorisés
    if (req.user.authProvider !== 'google' && req.user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Compte en attente de validation',
        status: req.user.status
      });
    }

    const user = await User.findById(req.user._id).populate('progress.courseId');
    const courses = await Course.find({}).sort({ module: 1, order: 1 });

    console.log(`📊 Récupération progression pour ${user.email}`);
    console.log(`   Progression en DB:`, user.progress.map(p => ({
      courseId: p.courseId?._id || p.courseId,
      completed: p.completed
    })));

    // Calculer les statistiques de progression basées sur le nombre de leçons (8 leçons au total)
    // Les leçons sont définies statiquement dans le frontend (JOUR 1 à JOUR 8)
    const TOTAL_LESSONS = 8; // Nombre total de leçons dans la formation
    const completedCourses = user.progress.filter(p => p.completed && p.courseId).length;
    
    // Limiter le nombre de cours complétés au nombre total de leçons
    const completedLessons = Math.min(completedCourses, TOTAL_LESSONS);
    const progressPercentage = TOTAL_LESSONS > 0 ? Math.round((completedLessons / TOTAL_LESSONS) * 100) : 0;

    console.log(`   Total leçons: ${TOTAL_LESSONS}, Complétées: ${completedLessons}, Pourcentage: ${progressPercentage}%`);

    // Mapper les cours avec leur statut de progression
    const coursesWithProgress = courses.map(course => {
      const progressItem = user.progress.find(p => 
        p.courseId && p.courseId.toString() === course._id.toString()
      );
      
      const isCompleted = progressItem ? progressItem.completed : false;
      
      return {
        ...course.toObject(),
        completed: isCompleted
      };
    });

    console.log(`   Cours avec progression:`, coursesWithProgress.map(c => ({
      title: c.title,
      completed: c.completed
    })));

    res.json({
      success: true,
      progress: {
        totalLessons: TOTAL_LESSONS,
        totalCourses: courses.length, // Garder pour compatibilité
        completedLessons: completedLessons,
        completedCourses: completedCourses, // Garder pour compatibilité
        progressPercentage,
        courses: coursesWithProgress
      }
    });
  } catch (error) {
    console.error('Erreur récupération progression:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la progression' });
  }
});

export default router;


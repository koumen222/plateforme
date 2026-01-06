import express from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/courses - Liste des cours sans vidéo (public)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ module: 1, order: 1 }).select('-videoId');
    
    res.json({
      success: true,
      courses,
      count: courses.length
    });
  } catch (error) {
    console.error('Erreur récupération cours:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des cours' });
  }
});

// GET /api/secure/courses - Liste des cours avec vidéo (protégé, JWT + status active)
router.get('/secure/courses', authenticate, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est actif
    // 🔥 Les utilisateurs Google sont toujours autorisés
    if (req.user.authProvider !== 'google' && req.user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Compte en attente de validation par l\'administrateur',
        status: req.user.status
      });
    }

    const courses = await Course.find({}).sort({ module: 1, order: 1 });
    
    // Récupérer la progression de l'utilisateur
    const user = await User.findById(req.user._id).populate('progress.courseId');
    
    // Ajouter l'état de complétion à chaque cours
    const coursesWithProgress = courses.map(course => {
      const progressItem = user.progress.find(p => 
        p.courseId && p.courseId.toString() === course._id.toString()
      );
      
      return {
        ...course.toObject(),
        completed: progressItem ? progressItem.completed : false
      };
    });

    res.json({
      success: true,
      courses: coursesWithProgress,
      count: coursesWithProgress.length
    });
  } catch (error) {
    console.error('Erreur récupération cours sécurisés:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des cours' });
  }
});

// POST /api/progress/:courseId - Marquer un cours comme terminé
router.post('/progress/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { completed } = req.body;

    // Vérifier que le cours existe
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    // Vérifier que l'utilisateur est actif
    // 🔥 Les utilisateurs Google sont toujours autorisés
    if (req.user.authProvider !== 'google' && req.user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Compte en attente de validation',
        status: req.user.status
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Trouver ou créer l'entrée de progression
    const progressIndex = user.progress.findIndex(p => 
      p.courseId && p.courseId.toString() === courseId
    );

    const isCompleted = completed !== undefined ? completed : true;
    const completedAt = isCompleted ? new Date() : null;

    if (progressIndex >= 0) {
      // Mettre à jour la progression existante
      user.progress[progressIndex].completed = isCompleted;
      user.progress[progressIndex].completedAt = isCompleted ? (user.progress[progressIndex].completedAt || new Date()) : null;
      console.log(`✅ Progression mise à jour pour le cours ${courseId} - Utilisateur: ${user.email}`);
    } else {
      // Créer une nouvelle entrée de progression
      user.progress.push({
        courseId: courseId,
        completed: isCompleted,
        completedAt: completedAt
      });
      console.log(`✅ Nouvelle progression créée pour le cours ${courseId} - Utilisateur: ${user.email}`);
    }

    // Sauvegarder dans la base de données
    const savedUser = await user.save();
    console.log(`💾 Progression sauvegardée en base de données pour ${user.email}`);
    console.log(`📊 Total de cours complétés: ${savedUser.progress.filter(p => p.completed && p.courseId).length}`);
    
    // Vérifier que la sauvegarde a bien fonctionné en rechargant depuis la DB
    const verifiedUser = await User.findById(req.user._id);
    const verifiedProgress = verifiedUser.progress.find(p => 
      p.courseId && p.courseId.toString() === courseId
    );
    if (verifiedProgress) {
      console.log(`🔍 Vérification DB: Cours ${courseId} complété = ${verifiedProgress.completed}`);
    } else {
      console.log(`⚠️  Vérification DB: Progression non trouvée pour le cours ${courseId}`);
    }

    res.json({
      success: true,
      message: 'Progression mise à jour',
      progress: user.progress.find(p => 
        p.courseId && p.courseId.toString() === courseId
      )
    });
  } catch (error) {
    console.error('Erreur mise à jour progression:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la progression' });
  }
});

export default router;


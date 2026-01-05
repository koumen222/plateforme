import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Comment from '../models/Comment.js';

const router = express.Router();

// Toutes les routes admin nécessitent une authentification ET un rôle admin/superadmin
router.use(authenticate);
router.use(requireAdmin);

// POST /api/admin/validate/:id - Valider un utilisateur (mettre status: "active")
router.post('/validate/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.status = 'active';
    await user.save();

    res.json({
      success: true,
      message: 'Utilisateur validé avec succès',
      user: {
        id: user._id,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur validation utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la validation de l\'utilisateur' });
  }
});

// POST /api/admin/course - Créer un nouveau cours
router.post('/course', async (req, res) => {
  try {
    const { title, description, videoId, module, order } = req.body;

    // Validation
    if (!title || !videoId) {
      return res.status(400).json({ error: 'Titre et ID vidéo requis' });
    }

    const course = new Course({
      title,
      description: description || '',
      videoId,
      module: module || 1,
      order: order || 0
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Cours créé avec succès',
      course
    });
  } catch (error) {
    console.error('Erreur création cours:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors de la création du cours' });
  }
});

// GET /api/admin/courses - Liste tous les cours
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ module: 1, order: 1 });
    
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

// GET /api/admin/users - Avec progression des étudiants
router.get('/users', async (req, res) => {
  try {
    console.log('📋 Requête GET /api/admin/users');
    console.log('👤 Utilisateur authentifié:', req.user?.email);
    
    const users = await User.find({})
      .select('-password')
      .populate('progress.courseId')
      .sort({ createdAt: -1 });
    
    // Calculer les statistiques de progression basées sur le nombre de leçons (8 leçons au total)
    const TOTAL_LESSONS = 8; // Nombre total de leçons dans la formation
    
    // Ajouter les statistiques de progression à chaque utilisateur
    const usersWithProgress = users.map(user => {
      const completedCourses = user.progress.filter(p => p.completed && p.courseId).length;
      const completedLessons = Math.min(completedCourses, TOTAL_LESSONS);
      const progressPercentage = TOTAL_LESSONS > 0 ? Math.round((completedLessons / TOTAL_LESSONS) * 100) : 0;
      
      const userObject = user.toObject();
      
      // S'assurer que le nom est bien présent
      if (!userObject.name) {
        console.warn(`⚠️ Utilisateur ${userObject.email} n'a pas de nom`);
      }
      
      return {
        ...userObject,
        name: userObject.name || 'Non renseigné', // Fallback si pas de nom
        phoneNumber: userObject.phoneNumber || 'Non renseigné', // Fallback si pas de téléphone
        progressStats: {
          totalLessons: TOTAL_LESSONS,
          totalCourses: completedCourses, // Garder pour compatibilité
          completedLessons: completedLessons,
          completedCourses: completedCourses, // Garder pour compatibilité
          progressPercentage
        }
      };
    });
    
    console.log(`✅ ${users.length} utilisateurs trouvés`);
    console.log(`   Exemple utilisateur:`, usersWithProgress[0] ? {
      name: usersWithProgress[0].name,
      email: usersWithProgress[0].email,
      phoneNumber: usersWithProgress[0].phoneNumber
    } : 'Aucun utilisateur');
    
    res.json({
      success: true,
      users: usersWithProgress,
      count: usersWithProgress.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des utilisateurs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/admin/users/:id/reset-progress - Réinitialiser la progression d'un utilisateur
// Cette route doit être définie AVANT /users/:id pour éviter les conflits
router.post('/users/:id/reset-progress', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔄 Tentative de réinitialisation progression pour utilisateur: ${id}`);

    const user = await User.findById(id);
    if (!user) {
      console.error(`❌ Utilisateur non trouvé: ${id}`);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Réinitialiser la progression (vider le tableau progress)
    user.progress = [];
    await user.save();

    console.log(`✅ Progression réinitialisée pour ${user.email}`);

    res.json({
      success: true,
      message: 'Progression réinitialisée avec succès',
      user: {
        id: user._id,
        email: user.email,
        progress: user.progress
      }
    });
  } catch (error) {
    console.error('❌ Erreur réinitialisation progression:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erreur lors de la réinitialisation de la progression',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/admin/users/:id/status - Changer le statut d'un utilisateur
// Cette route doit être définie AVANT /users/:id pour éviter les conflits
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.status = status;
    await user.save();

    res.json({
      success: true,
      message: `Statut mis à jour: ${status}`,
      user: {
        id: user._id,
        email: user.email,
        status: user.status,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur changement statut:', error);
    res.status(500).json({ error: 'Erreur lors du changement de statut' });
  }
});

// PUT /api/admin/users/:id - Mettre à jour un utilisateur
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phoneNumber, status, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Ne pas permettre de modifier son propre rôle
    if (role && req.user.userId === id && role !== user.role) {
      return res.status(403).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
    }

    if (name) user.name = name.trim();
    if (email) {
      // Vérifier si l'email n'est pas déjà utilisé par un autre utilisateur
      const existingUserByEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (existingUserByEmail) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
      user.email = email.toLowerCase();
    }
    if (phoneNumber) {
      // Vérifier si le téléphone n'est pas déjà utilisé par un autre utilisateur
      const existingUserByPhone = await User.findOne({ phoneNumber: phoneNumber.trim(), _id: { $ne: id } });
      if (existingUserByPhone) {
        return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
      }
      user.phoneNumber = phoneNumber.trim();
    }
    if (status) user.status = status;
    if (role && ['student', 'superadmin'].includes(role)) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// DELETE /api/admin/users/:id - Supprimer un utilisateur
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Ne pas permettre de supprimer son propre compte
    if (req.user.userId === id) {
      return res.status(403).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Ne pas permettre de supprimer un autre superadmin
    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Impossible de supprimer un autre administrateur' });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});


// POST /api/admin/reset-all-progress - Réinitialiser la progression de tous les utilisateurs
router.post('/reset-all-progress', async (req, res) => {
  try {
    // Réinitialiser la progression de tous les utilisateurs étudiants
    const result = await User.updateMany(
      { role: 'student' },
      { $set: { progress: [] } }
    );

    console.log(`🔄 Progression réinitialisée pour ${result.modifiedCount} utilisateurs`);

    res.json({
      success: true,
      message: `Progression réinitialisée pour ${result.modifiedCount} utilisateurs`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Erreur réinitialisation progression globale:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation de la progression' });
  }
});

// GET /api/admin/comments - Récupérer tous les commentaires depuis la DB
router.get('/comments', async (req, res) => {
  try {
    const { status } = req.query;
    
    console.log(`📋 Récupération commentaires admin - Filtre: ${status || 'all'}`);
    
    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    // Récupérer tous les commentaires depuis la base de données
    const comments = await Comment.find(filter)
      .populate('userId', 'email role status')
      .sort({ createdAt: -1 });

    console.log(`✅ ${comments.length} commentaires récupérés depuis la DB`);

    res.json({
      success: true,
      comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Erreur récupération commentaires:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commentaires' });
  }
});

// PUT /api/admin/comments/:id/status - Modifier le statut d'un commentaire
router.put('/comments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    console.log(`🔄 Modification statut commentaire ${id} -> ${status}`);

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    comment.status = status;
    if (adminResponse) {
      comment.adminResponse = adminResponse.trim();
    }
    
    // Sauvegarder dans la base de données
    await comment.save();
    
    console.log(`✅ Commentaire ${id} mis à jour en DB - Statut: ${status}`);

    res.json({
      success: true,
      message: `Statut du commentaire mis à jour: ${status}`,
      comment
    });
  } catch (error) {
    console.error('Erreur mise à jour statut commentaire:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

// DELETE /api/admin/comments/:id - Supprimer un commentaire
router.delete('/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Suppression commentaire ${id}`);

    const comment = await Comment.findByIdAndDelete(id);
    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    console.log(`✅ Commentaire ${id} supprimé de la DB`);

    res.json({
      success: true,
      message: 'Commentaire supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression commentaire:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du commentaire' });
  }
});

export default router;


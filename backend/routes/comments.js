import express from 'express';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/comments - Créer un nouveau commentaire (utilisateur authentifié)
router.post('/', authenticate, async (req, res) => {
  try {
    const { content, lessonId, lessonTitle } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Le contenu du commentaire est requis' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Le commentaire ne peut pas dépasser 2000 caractères' });
    }

    // Vérifier que l'utilisateur est actif
    if (req.user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Votre compte doit être actif pour laisser un commentaire',
        status: req.user.status
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const comment = new Comment({
      userId: req.user._id,
      userEmail: user.email,
      content: content.trim(),
      lessonId: lessonId || null,
      lessonTitle: lessonTitle || null,
      status: 'pending'
    });

    // Sauvegarder dans la base de données
    const savedComment = await comment.save();
    
    console.log(`💬 Nouveau commentaire créé par ${user.email}`);
    console.log(`   ID: ${savedComment._id}`);
    console.log(`   Leçon: ${savedComment.lessonTitle || 'Aucune'}`);
    console.log(`   Statut: ${savedComment.status}`);
    console.log(`   Contenu: ${savedComment.content.substring(0, 50)}...`);
    
    // Vérifier que la sauvegarde a bien fonctionné
    const verifiedComment = await Comment.findById(savedComment._id);
    if (verifiedComment) {
      console.log(`✅ Commentaire sauvegardé en DB: ${verifiedComment._id}`);
    } else {
      console.error(`❌ Erreur: Commentaire non trouvé après sauvegarde`);
    }

    res.status(201).json({
      success: true,
      message: 'Commentaire envoyé avec succès',
      comment: savedComment
    });
  } catch (error) {
    console.error('Erreur création commentaire:', error);
    res.status(500).json({ error: 'Erreur lors de la création du commentaire' });
  }
});

// GET /api/comments - Récupérer les commentaires de l'utilisateur connecté
router.get('/', authenticate, async (req, res) => {
  try {
    console.log(`📋 Récupération commentaires pour ${req.user.email}`);
    
    const comments = await Comment.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    console.log(`✅ ${comments.length} commentaires trouvés pour ${req.user.email}`);

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

// GET /api/comments/lesson/:lessonId - Récupérer tous les commentaires d'une leçon spécifique
router.get('/lesson/:lessonId', authenticate, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lessonIdNum = parseInt(lessonId);

    console.log(`📚 Récupération commentaires pour la leçon ${lessonIdNum}`);

    // Récupérer tous les commentaires approuvés pour cette leçon depuis la DB
    const comments = await Comment.find({ 
      lessonId: lessonIdNum,
      status: 'approved' // Seulement les commentaires approuvés
    })
      .sort({ createdAt: -1 });

    console.log(`✅ ${comments.length} commentaires approuvés trouvés pour la leçon ${lessonIdNum}`);

    res.json({
      success: true,
      comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Erreur récupération commentaires leçon:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commentaires' });
  }
});

export default router;


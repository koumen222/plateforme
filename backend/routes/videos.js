import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Route protégée : GET /api/secure/videos
router.get('/secure/videos', authenticate, (req, res) => {
  try {
    // Vérifier que l'utilisateur est actif
    // 🔥 Les utilisateurs Google sont toujours autorisés
    if (req.user.authProvider !== 'google' && req.user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Votre compte doit être actif pour accéder aux vidéos',
        status: req.user.status
      });
    }

    // Liste des vidéos (normalement récupérées depuis la base de données)
    // Pour l'instant, on retourne une liste statique
    const videos = [
      {
        id: 1,
        title: 'JOUR 1 - Introduction',
        url: 'https://www.youtube.com/embed/_FEzE2vdu_k?rel=0&modestbranding=1&playsinline=1',
        type: 'youtube'
      },
      {
        id: 2,
        title: 'JOUR 2 - Structure de campagne',
        url: 'https://player.vimeo.com/video/1151322854?h=6c8b3c8c5d&title=0&byline=0&portrait=0',
        type: 'vimeo'
      },
      {
        id: 3,
        title: 'JOUR 3 - Créative Andromeda',
        url: 'https://www.youtube.com/embed/gdG0xjuF7SQ?rel=0&modestbranding=1&playsinline=1',
        type: 'youtube'
      }
    ];

    res.json({
      success: true,
      videos,
      message: 'Vidéos récupérées avec succès'
    });
  } catch (error) {
    console.error('Erreur récupération vidéos:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des vidéos' });
  }
});

export default router;


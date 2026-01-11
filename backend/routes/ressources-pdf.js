import express from 'express';
import RessourcePdf from '../models/RessourcePdf.js';

const router = express.Router();

/**
 * GET /api/ressources-pdf
 * Récupère toutes les ressources PDF publiées
 */
router.get('/', async (req, res) => {
  try {
    const ressourcesPdf = await RessourcePdf.find({ isPublished: true })
      .sort({ createdAt: -1 }); // Plus récents en premier
    
    res.json({
      success: true,
      ressourcesPdf
    });
  } catch (error) {
    console.error('Erreur récupération ressources PDF:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des ressources PDF' 
    });
  }
});

/**
 * GET /api/ressources-pdf/:slug
 * Récupère une ressource PDF par son slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const ressourcePdf = await RessourcePdf.findOne({ 
      slug: req.params.slug,
      isPublished: true 
    });
    
    if (!ressourcePdf) {
      return res.status(404).json({ 
        success: false,
        error: 'Ressource PDF non trouvée' 
      });
    }
    
    res.json({
      success: true,
      ressourcePdf
    });
  } catch (error) {
    console.error('Erreur récupération ressource PDF:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération de la ressource PDF' 
    });
  }
});

/**
 * POST /api/ressources-pdf
 * Crée une nouvelle ressource PDF (admin seulement - à protéger avec middleware auth)
 * Accepte uniquement des URLs (Google Drive, etc.)
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      category,
      author,
      pages,
      price,
      isFree,
      isPublished,
      pdfUrl,
      coverImage
    } = req.body;

    // Vérifier que pdfUrl est fourni et est une URL valide
    if (!pdfUrl || (!pdfUrl.startsWith('http://') && !pdfUrl.startsWith('https://'))) {
      return res.status(400).json({
        success: false,
        error: 'L\'URL du PDF est requise et doit être une URL valide (ex: Google Drive)'
      });
    }

    // Vérifier si une ressource PDF avec ce slug existe déjà
    const existingRessourcePdf = await RessourcePdf.findOne({ slug });
    if (existingRessourcePdf) {
      return res.status(400).json({
        success: false,
        error: 'Une ressource PDF avec ce slug existe déjà'
      });
    }

    const ressourcePdf = new RessourcePdf({
      title,
      description,
      coverImage: coverImage || '/img/ressource-pdf-default.png',
      pdfUrl,
      slug,
      category: category || 'Général',
      author: author || 'Ecom Starter',
      pages: pages || 0,
      price: price || 0,
      isFree: isFree !== undefined ? isFree : (price === 0 || !price),
      isPublished: isPublished !== undefined ? isPublished : false
    });

    await ressourcePdf.save();

    res.status(201).json({
      success: true,
      ressourcePdf
    });
  } catch (error) {
    console.error('Erreur création ressource PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la ressource PDF',
      details: error.message
    });
  }
});

/**
 * PUT /api/ressources-pdf/:id
 * Met à jour une ressource PDF (admin seulement - à protéger avec middleware auth)
 * Accepte uniquement des URLs (Google Drive, etc.)
 */
router.put('/:id', async (req, res) => {
  try {
    const ressourcePdf = await RessourcePdf.findById(req.params.id);
    
    if (!ressourcePdf) {
      return res.status(404).json({
        success: false,
        error: 'Ressource PDF non trouvée'
      });
    }

    const {
      title,
      description,
      slug,
      category,
      author,
      pages,
      price,
      isFree,
      isPublished,
      pdfUrl,
      coverImage
    } = req.body;

    // Vérifier que pdfUrl est une URL valide si fournie
    if (pdfUrl && (!pdfUrl.startsWith('http://') && !pdfUrl.startsWith('https://'))) {
      return res.status(400).json({
        success: false,
        error: 'L\'URL du PDF doit être une URL valide (ex: Google Drive)'
      });
    }

    // Mettre à jour les champs
    if (title) ressourcePdf.title = title;
    if (description !== undefined) ressourcePdf.description = description;
    if (slug) ressourcePdf.slug = slug;
    if (category) ressourcePdf.category = category;
    if (author) ressourcePdf.author = author;
    if (pages !== undefined) ressourcePdf.pages = pages;
    if (price !== undefined) ressourcePdf.price = price;
    if (isFree !== undefined) ressourcePdf.isFree = isFree;
    if (isPublished !== undefined) ressourcePdf.isPublished = isPublished;
    if (pdfUrl) ressourcePdf.pdfUrl = pdfUrl;
    if (coverImage) ressourcePdf.coverImage = coverImage;

    await ressourcePdf.save();

    res.json({
      success: true,
      ressourcePdf
    });
  } catch (error) {
    console.error('Erreur mise à jour ressource PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de la ressource PDF',
      details: error.message
    });
  }
});

/**
 * DELETE /api/ressources-pdf/:id
 * Supprime une ressource PDF (admin seulement - à protéger avec middleware auth)
 */
router.delete('/:id', async (req, res) => {
  try {
    const ressourcePdf = await RessourcePdf.findByIdAndDelete(req.params.id);
    
    if (!ressourcePdf) {
      return res.status(404).json({
        success: false,
        error: 'Ressource PDF non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Ressource PDF supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression ressource PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de la ressource PDF',
      details: error.message
    });
  }
});

/**
 * GET /api/ressources-pdf/:id/file
 * Route pour rediriger vers l'URL du PDF (Google Drive, etc.)
 * Vérifie si l'utilisateur peut télécharger (PDF gratuit ou utilisateur abonné)
 */
router.get('/:id/file', async (req, res) => {
  try {
    const ressourcePdf = await RessourcePdf.findById(req.params.id);
    
    if (!ressourcePdf) {
      return res.status(404).json({
        success: false,
        error: 'Ressource PDF non trouvée'
      });
    }

    // Vérifier que pdfUrl existe
    if (!ressourcePdf.pdfUrl) {
      return res.status(404).json({
        success: false,
        error: 'URL du PDF non trouvée'
      });
    }

    // Vérifier si le PDF est payant (non gratuit)
    const isPayant = !ressourcePdf.isFree;
    
    // Si le PDF est payant, vérifier l'authentification et le statut
    if (isPayant) {
      let user = null;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const jwt = (await import('jsonwebtoken')).default;
          const User = (await import('../models/User.js')).default;
          const token = req.headers.authorization.substring(7);
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
          user = await User.findById(decoded.userId).select('-password');
        } catch (error) {
          // Token invalide ou expiré
        }
      }

      if (!user || user.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: 'Cette ressource PDF est réservée aux abonnés',
          requiresSubscription: true,
          message: 'Vous devez être abonné pour télécharger cette ressource PDF.'
        });
      }
    }

    // Incrémenter le compteur
    ressourcePdf.downloadCount = (ressourcePdf.downloadCount || 0) + 1;
    await ressourcePdf.save();

    // Rediriger vers l'URL externe (Google Drive, etc.)
    if (ressourcePdf.pdfUrl.startsWith('http://') || ressourcePdf.pdfUrl.startsWith('https://')) {
      console.log('✅ Redirection vers URL externe:', ressourcePdf.pdfUrl);
      // Pour les requêtes fetch avec Authorization, retourner JSON avec l'URL
      if (req.headers.authorization || req.headers['user-agent']?.includes('fetch')) {
        return res.json({
          success: true,
          pdfUrl: ressourcePdf.pdfUrl,
          redirect: true
        });
      } else {
        // Redirection directe pour les navigateurs
        return res.redirect(302, ressourcePdf.pdfUrl);
      }
    }

    // Si ce n'est pas une URL valide
    return res.status(400).json({
      success: false,
      error: 'URL du PDF invalide. L\'URL doit commencer par http:// ou https://',
      pdfUrl: ressourcePdf.pdfUrl
    });
  } catch (error) {
    console.error('Erreur téléchargement fichier PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du téléchargement du fichier',
      details: error.message
    });
  }
});

/**
 * POST /api/ressources-pdf/:id/download
 * Incrémente le compteur de téléchargements
 * Vérifie si l'utilisateur peut télécharger (PDF gratuit ou utilisateur abonné)
 */
router.post('/:id/download', async (req, res) => {
  try {
    const ressourcePdf = await RessourcePdf.findById(req.params.id);
    
    if (!ressourcePdf) {
      return res.status(404).json({
        success: false,
        error: 'Ressource PDF non trouvée'
      });
    }

    // Vérifier si le PDF est payant (non gratuit)
    const isPayant = !ressourcePdf.isFree;
    
    // Si le PDF est payant, vérifier l'authentification et le statut
    if (isPayant) {
      // Vérifier le token (optionnel pour les PDF gratuits)
      let user = null;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const jwt = (await import('jsonwebtoken')).default;
          const User = (await import('../models/User.js')).default;
          const token = req.headers.authorization.substring(7);
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
          user = await User.findById(decoded.userId).select('-password');
        } catch (error) {
          // Token invalide ou expiré
        }
      }

      // Si pas d'utilisateur ou utilisateur non abonné
      if (!user || user.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: 'Cette ressource PDF est réservée aux abonnés',
          requiresSubscription: true,
          message: 'Vous devez être abonné pour télécharger cette ressource PDF. Veuillez payer votre abonnement.'
        });
      }
    }

    // Incrémenter le compteur de téléchargements
    ressourcePdf.downloadCount = (ressourcePdf.downloadCount || 0) + 1;
    await ressourcePdf.save();

    // Retourner l'URL du PDF
    const pdfUrl = ressourcePdf.pdfUrl;

    console.log('✅ Téléchargement autorisé pour:', ressourcePdf.title);
    console.log('   - PDF URL:', pdfUrl);
    console.log('   - Download count:', ressourcePdf.downloadCount);

    res.json({
      success: true,
      downloadCount: ressourcePdf.downloadCount,
      pdfUrl: pdfUrl
    });
  } catch (error) {
    console.error('Erreur incrémentation téléchargements:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'incrémentation du compteur'
    });
  }
});

// Routes admin (alias pour compatibilité avec le frontend)
router.get('/admin/ressources-pdf', async (req, res) => {
  try {
    // Récupérer toutes les ressources PDF (pas seulement publiées pour l'admin)
    const ressourcesPdf = await RessourcePdf.find({})
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      ressourcesPdf
    });
  } catch (error) {
    console.error('Erreur récupération ressources PDF admin:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des ressources PDF' 
    });
  }
});

// Route DELETE admin (alias)
router.delete('/admin/ressources-pdf/:id', async (req, res) => {
  try {
    const ressourcePdf = await RessourcePdf.findByIdAndDelete(req.params.id);
    
    if (!ressourcePdf) {
      return res.status(404).json({
        success: false,
        error: 'Ressource PDF non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Ressource PDF supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression ressource PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de la ressource PDF',
      details: error.message
    });
  }
});

export default router;

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import RessourcePdf from '../models/RessourcePdf.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      coverImage,
      pdfUrl,
      slug,
      category,
      author,
      pages,
      price,
      isFree,
      isPublished
    } = req.body;

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

    // Mettre à jour les champs fournis
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        ressourcePdf[key] = req.body[key];
      }
    });

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
 * Route pour télécharger directement le fichier PDF avec les bons headers
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

    // Construire le chemin du fichier
    let filePath = ressourcePdf.pdfUrl;
    
    // Si c'est une URL externe, rediriger
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return res.redirect(filePath);
    }
    
    // Nettoyer le chemin - retirer /uploads/ si présent
    if (filePath.startsWith('/uploads/')) {
      filePath = filePath.replace('/uploads/', '');
    } else if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
    
    const fs = (await import('fs')).default;
    
    // Utiliser le même chemin que celui utilisé pour servir les fichiers statiques
    // Dans server.js, uploadsPath = path.join(__dirname, 'uploads')
    // Donc depuis routes/, c'est path.join(__dirname, '..', 'uploads')
    const uploadsBasePath = path.join(__dirname, '..', 'uploads');
    
    // Construire le chemin complet
    const fullPath = path.join(uploadsBasePath, filePath);
    
    console.log('🔍 Recherche fichier PDF:');
    console.log('   - pdfUrl original:', ressourcePdf.pdfUrl);
    console.log('   - filePath nettoyé:', filePath);
    console.log('   - uploadsBasePath:', uploadsBasePath);
    console.log('   - fullPath:', fullPath);
    console.log('   - __dirname:', __dirname);
    console.log('   - process.cwd():', process.cwd());
    
    // Vérifier que le dossier uploads existe
    if (!fs.existsSync(uploadsBasePath)) {
      console.error('❌ Dossier uploads n\'existe pas:', uploadsBasePath);
      return res.status(500).json({
        success: false,
        error: 'Dossier uploads non configuré sur le serveur',
        uploadsPath: uploadsBasePath
      });
    }
    
    // Lister les fichiers dans uploads/pdf pour debug
    const pdfDir = path.join(uploadsBasePath, 'pdf');
    if (fs.existsSync(pdfDir)) {
      try {
        const files = fs.readdirSync(pdfDir);
        console.log('📁 Fichiers dans uploads/pdf:', files.slice(0, 5), files.length > 5 ? '...' : '');
      } catch (err) {
        console.warn('⚠️ Impossible de lister uploads/pdf:', err.message);
      }
    }
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(fullPath)) {
      console.warn('⚠️ Fichier non trouvé localement:', fullPath);
      console.warn('   - Tentative de servir via express.static...');
      
      // Si le fichier n'existe pas localement, essayer de le servir via express.static
      // Cela peut fonctionner si le fichier est servi depuis un autre emplacement
      // ou si express.static peut le trouver
      const staticUrl = ressourcePdf.pdfUrl.startsWith('/') 
        ? ressourcePdf.pdfUrl 
        : '/' + ressourcePdf.pdfUrl;
      
      // Construire l'URL complète pour redirection
      const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
      const redirectUrl = `${baseUrl}${staticUrl}`;
      
      console.log('   - Redirection vers:', redirectUrl);
      
      // Rediriger vers l'URL statique - express.static devrait pouvoir la servir
      // Si express.static ne peut pas la servir non plus, il retournera 404
      return res.redirect(302, staticUrl);
    }
    
    console.log('✅ Fichier trouvé localement:', fullPath);

    // Définir les headers pour forcer le téléchargement
    const filename = ressourcePdf.slug ? `${ressourcePdf.slug}.pdf` : path.basename(filePath);
    const encodedFilename = encodeURIComponent(filename);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Envoyer le fichier
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Erreur téléchargement fichier PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du téléchargement du fichier'
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

    // Construire l'URL complète du PDF
    let pdfUrl = ressourcePdf.pdfUrl;
    if (pdfUrl && !pdfUrl.startsWith('http://') && !pdfUrl.startsWith('https://')) {
      // Si c'est un chemin relatif, construire l'URL complète
      const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
      pdfUrl = `${baseUrl}${pdfUrl.startsWith('/') ? pdfUrl : '/' + pdfUrl}`;
    }

    console.log('✅ Téléchargement autorisé pour:', ressourcePdf.title);
    console.log('   - PDF URL:', pdfUrl);
    console.log('   - Download count:', ressourcePdf.downloadCount);

    res.json({
      success: true,
      downloadCount: ressourcePdf.downloadCount,
      pdfUrl: pdfUrl || ressourcePdf.pdfUrl
    });
  } catch (error) {
    console.error('Erreur incrémentation téléchargements:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'incrémentation du compteur'
    });
  }
});

export default router;


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
 * POST /api/ressources-pdf/:id/download
 * Incrémente le compteur de téléchargements
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

    ressourcePdf.downloadCount = (ressourcePdf.downloadCount || 0) + 1;
    await ressourcePdf.save();

    res.json({
      success: true,
      downloadCount: ressourcePdf.downloadCount
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


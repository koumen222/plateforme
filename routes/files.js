import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { uploadToR2, handleUploadError } from '../middleware/r2Upload.js';
import File from '../models/File.js';
import { getR2PublicUrl } from '../config/r2.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, R2_CONFIG } from '../config/r2.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * POST /api/files/upload
 * Upload un ou plusieurs fichiers vers R2
 * Body: multipart/form-data avec champ 'files' (peut être multiple)
 */
router.post('/upload', uploadToR2.array('files', 10), handleUploadError, async (req, res) => {
  try {
    // Les fichiers sont dans req.files (multer standard) et req.uploadedFiles (notre storage custom)
    const multerFiles = req.files || [];
    const uploadedFilesData = req.uploadedFiles || [];
    
    if (multerFiles.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const userId = req.user._id;
    const folder = req.body.folder || '/';
    const uploadedFiles = [];

    // Traiter chaque fichier uploadé
    for (let i = 0; i < multerFiles.length; i++) {
      const multerFile = multerFiles[i];
      const uploadedData = uploadedFilesData[i] || {};
      
      // Utiliser les données de notre storage custom si disponibles, sinon multer standard
      const r2Key = multerFile.key || uploadedData.key;
      const publicUrl = multerFile.location || uploadedData.location || getR2PublicUrl(r2Key);
      const originalName = multerFile.originalname || uploadedData.originalname;
      const mimeType = multerFile.mimetype || uploadedData.mimetype || 'application/octet-stream';
      const fileSize = multerFile.size || uploadedData.size || 0;

      if (!publicUrl || !r2Key) {
        console.error('❌ Impossible de générer l\'URL publique pour:', r2Key);
        console.error('   multerFile:', multerFile);
        console.error('   uploadedData:', uploadedData);
        continue;
      }

      // Créer l'entrée dans la base de données
      const fileDoc = new File({
        originalName: originalName,
        name: originalName,
        mimeType: mimeType,
        size: fileSize,
        r2Key: r2Key,
        url: publicUrl,
        user: userId,
        folder: folder
      });

      await fileDoc.save();
      uploadedFiles.push(fileDoc.toPublicJSON());
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({ error: 'Aucun fichier n\'a pu être enregistré' });
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('❌ Erreur upload fichiers:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'upload des fichiers',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/files
 * Récupérer tous les fichiers de l'utilisateur connecté
 * Query params: folder (optionnel), page (optionnel), limit (optionnel)
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const folder = req.query.folder || '/';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Construire la requête
    const query = { user: userId };
    if (folder && folder !== '/') {
      query.folder = folder;
    }

    // Récupérer les fichiers avec pagination
    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-r2Key'); // Ne pas exposer la clé R2

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      files: files.map(f => f.toPublicJSON()),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération fichiers:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des fichiers',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/files/:id
 * Récupérer un fichier spécifique par son ID
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const fileId = req.params.id;

    const file = await File.findOne({ _id: fileId, user: userId });

    if (!file) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    res.json({
      success: true,
      file: file.toPublicJSON()
    });

  } catch (error) {
    console.error('❌ Erreur récupération fichier:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID de fichier invalide' });
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du fichier',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/files/:id
 * Supprimer un fichier (supprime de R2 et de la base de données)
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const fileId = req.params.id;

    // Récupérer le fichier
    const file = await File.findOne({ _id: fileId, user: userId });

    if (!file) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Supprimer le fichier de R2
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: R2_CONFIG.bucket,
        Key: file.r2Key
      });
      
      await s3Client.send(deleteCommand);
      console.log(`✅ Fichier supprimé de R2: ${file.r2Key}`);
    } catch (r2Error) {
      console.error('❌ Erreur suppression R2:', r2Error);
      // Continuer même si la suppression R2 échoue (le fichier peut déjà être supprimé)
    }

    // Supprimer l'entrée de la base de données
    await File.findByIdAndDelete(fileId);

    res.json({
      success: true,
      message: 'Fichier supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression fichier:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID de fichier invalide' });
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du fichier',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;


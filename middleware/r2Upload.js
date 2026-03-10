import multer from 'multer';
import { Upload } from '@aws-sdk/lib-storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, R2_CONFIG, getR2PublicUrl } from '../config/r2.js';
import { randomUUID } from 'crypto';
import path from 'path';
import { Readable } from 'stream';

// Limite de taille : 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB en bytes

/**
 * Storage personnalisé pour multer avec AWS SDK v3
 * Compatible avec Cloudflare R2
 */
const r2Storage = {
  _handleFile: async function (req, file, cb) {
    try {
      const userId = req.user?._id?.toString() || 'unknown';
      const fileExtension = path.extname(file.originalname);
      const fileName = `${randomUUID()}${fileExtension}`;
      const r2Key = `users/${userId}/${fileName}`;

      // Convertir le stream en buffer pour l'upload
      const chunks = [];
      file.stream.on('data', (chunk) => chunks.push(chunk));
      file.stream.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          
          // Upload vers R2 avec AWS SDK v3
          const upload = new Upload({
            client: s3Client,
            params: {
              Bucket: R2_CONFIG.bucket,
              Key: r2Key,
              Body: buffer,
              ContentType: file.mimetype || 'application/octet-stream',
              Metadata: {
                originalName: file.originalname,
                uploadedBy: userId,
                uploadedAt: new Date().toISOString()
              },
              ACL: 'public-read' // Rendre le fichier public
            }
          });

          await upload.done();
          
          const publicUrl = getR2PublicUrl(r2Key);
          
          // Stocker les informations du fichier dans req pour la route
          if (!req.uploadedFiles) {
            req.uploadedFiles = [];
          }
          
          const fileData = {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: buffer.length,
            key: r2Key,
            location: publicUrl,
            bucket: R2_CONFIG.bucket
          };
          
          req.uploadedFiles.push(fileData);

          // Retourner au format multer standard
          cb(null, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            size: buffer.length,
            bucket: R2_CONFIG.bucket,
            key: r2Key,
            acl: 'public-read',
            contentType: file.mimetype,
            metadata: {
              originalName: file.originalname,
              uploadedBy: userId,
              uploadedAt: new Date().toISOString()
            },
            location: publicUrl,
            etag: null
          });
        } catch (error) {
          cb(error);
        }
      });
      
      file.stream.on('error', (error) => {
        cb(error);
      });
    } catch (error) {
      cb(error);
    }
  },
  
  _removeFile: function (req, file, cb) {
    // Pas besoin de supprimer ici, la suppression se fait via l'API DELETE
    cb(null);
  }
};

/**
 * Configuration multer pour upload vers Cloudflare R2
 * Stocke les fichiers dans users/{userId}/
 */
export const uploadToR2 = multer({
  storage: r2Storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // Maximum 10 fichiers par requête
  },
  fileFilter: function (req, file, cb) {
    // Accepter tous les types de fichiers (vous pouvez ajouter des filtres si nécessaire)
    cb(null, true);
  }
});

/**
 * Middleware pour gérer les erreurs d'upload
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'Fichier trop volumineux. Taille maximale: 50MB' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Trop de fichiers. Maximum: 10 fichiers par requête' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Champ de fichier inattendu' 
      });
    }
    return res.status(400).json({ 
      error: `Erreur d'upload: ${err.message}` 
    });
  }
  
  if (err) {
    console.error('Erreur upload R2:', err);
    return res.status(500).json({ 
      error: 'Erreur lors de l\'upload du fichier',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  next();
};


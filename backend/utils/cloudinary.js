import { Readable } from 'stream';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Variable pour stocker l'instance Cloudinary
let cloudinary = null;
let cloudinaryInitialized = false;

/**
 * Nettoie le nom de fichier pour créer un public_id valide pour Cloudinary
 * @param {string} filename - Le nom de fichier original
 * @returns {string} - Le public_id nettoyé
 */
function cleanPublicId(filename) {
  if (!filename) return 'file';
  
  return filename
    .toLowerCase()
    .trim()                     // supprime espaces avant/après
    .replace(/\s+/g, "_")       // espaces internes → _
    .replace(/[^\w\-_.]/g, "")  // enlève caractères bizarres
    .replace(/_+/g, "_")        // évite ____
    .replace(/_$/, "")          // supprime _ final
    .replace(/^_/, "");         // supprime _ initial
}

/**
 * Initialise Cloudinary de manière asynchrone
 */
const initCloudinary = async () => {
  if (cloudinaryInitialized) {
    return cloudinary;
  }
  
  cloudinaryInitialized = true;
  
  try {
    const cloudinaryModule = await import('cloudinary');
    cloudinary = cloudinaryModule.v2;
    
    // Configuration Cloudinary depuis les variables d'environnement
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      console.log('✅ Cloudinary configuré avec succès');
      console.log('   - Cloud Name:', cloudName);
      console.log('   - API Key:', apiKey ? `${apiKey.substring(0, 4)}...` : 'non défini');
    } else {
      console.warn('⚠️ Cloudinary non configuré - les variables d\'environnement sont manquantes');
      console.warn('   - CLOUDINARY_CLOUD_NAME:', cloudName ? '✅' : '❌');
      console.warn('   - CLOUDINARY_API_KEY:', apiKey ? '✅' : '❌');
      console.warn('   - CLOUDINARY_API_SECRET:', apiSecret ? '✅' : '❌');
      cloudinary = null;
    }
  } catch (error) {
    console.warn('⚠️ Cloudinary non disponible:', error.message);
    cloudinary = null;
  }
  
  return cloudinary;
};

/**
 * Upload un fichier PDF vers Cloudinary
 * @param {Buffer} fileBuffer - Le buffer du fichier
 * @param {string} filename - Le nom du fichier
 * @param {string} folder - Le dossier dans Cloudinary (défaut: 'pdf')
 * @returns {Promise<{url: string, public_id: string}>}
 */
export const uploadPdfToCloudinary = async (fileBuffer, filename, folder = 'pdf') => {
  // Initialiser Cloudinary si nécessaire
  const cloudinaryInstance = await initCloudinary();
  
  if (!cloudinaryInstance) {
    throw new Error('Cloudinary n\'est pas configuré. Veuillez configurer les variables d\'environnement CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.');
  }
  
  // Nettoyer le nom de fichier pour créer un public_id valide
  const rawName = filename.replace(/\.pdf$/i, ''); // Retirer l'extension
  const publicId = cleanPublicId(rawName);
  
  // Logs de vérification
  console.log('📄 Nom de fichier original:', `"${filename}"`);
  console.log('🧹 Nom après retrait extension:', `"${rawName}"`);
  console.log('✨ public_id nettoyé:', `"${publicId}"`);
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryInstance.uploader.upload_stream(
      {
        resource_type: 'raw', // Pour les PDF
        folder: `plateforme/${folder}`,
        public_id: publicId, // Utiliser le public_id nettoyé
        format: 'pdf',
        use_filename: false, // Ne pas utiliser le nom de fichier original
        unique_filename: true, // Ajouter un suffixe unique si nécessaire
      },
      (error, result) => {
        if (error) {
          console.error('❌ Erreur upload Cloudinary:', error);
          reject(error);
        } else {
          console.log('✅ Fichier uploadé vers Cloudinary:', result.secure_url);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        }
      }
    );

    // Convertir le buffer en stream
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Upload une image vers Cloudinary
 * @param {Buffer} fileBuffer - Le buffer du fichier
 * @param {string} filename - Le nom du fichier
 * @param {string} folder - Le dossier dans Cloudinary (défaut: 'images')
 * @returns {Promise<{url: string, public_id: string}>}
 */
export const uploadImageToCloudinary = async (fileBuffer, filename, folder = 'images') => {
  // Initialiser Cloudinary si nécessaire
  const cloudinaryInstance = await initCloudinary();
  
  if (!cloudinaryInstance) {
    throw new Error('Cloudinary n\'est pas configuré. Veuillez configurer les variables d\'environnement CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.');
  }
  
  // Nettoyer le nom de fichier pour créer un public_id valide
  const rawName = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, ''); // Retirer l'extension
  const publicId = cleanPublicId(rawName);
  
  // Logs de vérification
  console.log('🖼️ Nom de fichier original:', `"${filename}"`);
  console.log('🧹 Nom après retrait extension:', `"${rawName}"`);
  console.log('✨ public_id nettoyé:', `"${publicId}"`);
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryInstance.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: `plateforme/${folder}`,
        public_id: publicId, // Utiliser le public_id nettoyé
        use_filename: false, // Ne pas utiliser le nom de fichier original
        unique_filename: true, // Ajouter un suffixe unique si nécessaire
      },
      (error, result) => {
        if (error) {
          console.error('❌ Erreur upload image Cloudinary:', error);
          reject(error);
        } else {
          console.log('✅ Image uploadée vers Cloudinary:', result.secure_url);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        }
      }
    );

    // Convertir le buffer en stream
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Supprimer un fichier de Cloudinary
 * @param {string} publicId - L'ID public du fichier
 * @param {string} resourceType - Le type de ressource ('raw' pour PDF, 'image' pour images)
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
  // Initialiser Cloudinary si nécessaire
  const cloudinaryInstance = await initCloudinary();
  
  if (!cloudinaryInstance) {
    throw new Error('Cloudinary n\'est pas configuré.');
  }
  
  try {
    const result = await cloudinaryInstance.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log('✅ Fichier supprimé de Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('❌ Erreur suppression Cloudinary:', error);
    throw error;
  }
};

export default initCloudinary;


import { Readable } from 'stream';

// Variable pour stocker l'instance Cloudinary
let cloudinary = null;
let cloudinaryInitialized = false;

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
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      console.log('✅ Cloudinary configuré');
    } else {
      console.warn('⚠️ Cloudinary non configuré - les variables d\'environnement sont manquantes');
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
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw', // Pour les PDF
        folder: `plateforme/${folder}`,
        public_id: filename.replace(/\.pdf$/i, ''), // Retirer l'extension
        format: 'pdf',
        use_filename: true,
        unique_filename: true,
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
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryInstance.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: `plateforme/${folder}`,
        public_id: filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, ''),
        use_filename: true,
        unique_filename: true,
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


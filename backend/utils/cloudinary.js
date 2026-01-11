import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configuration Cloudinary depuis les variables d'environnement
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload un fichier PDF vers Cloudinary
 * @param {Buffer} fileBuffer - Le buffer du fichier
 * @param {string} filename - Le nom du fichier
 * @param {string} folder - Le dossier dans Cloudinary (défaut: 'pdf')
 * @returns {Promise<{url: string, public_id: string}>}
 */
export const uploadPdfToCloudinary = async (fileBuffer, filename, folder = 'pdf') => {
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
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
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
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log('✅ Fichier supprimé de Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('❌ Erreur suppression Cloudinary:', error);
    throw error;
  }
};

export default cloudinary;


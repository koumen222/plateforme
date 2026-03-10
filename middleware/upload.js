import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer les dossiers uploads s'ils n'existent pas
const uploadsDir = path.join(__dirname, '..', 'uploads', 'courses');
const partenairesUploadsDir = path.join(__dirname, '..', 'uploads', 'partenaires');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Dossier uploads créé:', uploadsDir);
} else {
  console.log('📁 Dossier uploads existe déjà:', uploadsDir);
}
if (!fs.existsSync(partenairesUploadsDir)) {
  fs.mkdirSync(partenairesUploadsDir, { recursive: true });
  console.log('📁 Dossier uploads/partenaires créé:', partenairesUploadsDir);
} else {
  console.log('📁 Dossier uploads/partenaires existe déjà:', partenairesUploadsDir);
}

// Configuration du stockage (cours)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `course-${uniqueSuffix}${ext}`);
  }
});

// Configuration du stockage (partenaires)
const partenaireStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, partenairesUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `partenaire-${uniqueSuffix}${ext}`);
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seules les images (jpeg, jpg, png, gif, webp) sont autorisées'));
  }
};

// Configuration multer
export const uploadCourseImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

// Fonction pour obtenir le chemin public de l'image
export const getImagePublicPath = (filename) => {
  return `/uploads/courses/${filename}`;
};

// Upload des photos de galerie partenaires
export const uploadPartenaireGallery = multer({
  storage: partenaireStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

export const uploadPartenaireLogo = multer({
  storage: partenaireStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

export const getPartenaireImagePublicPath = (filename) => {
  return `/uploads/partenaires/${filename}`;
};

// Créer le dossier uploads/pdf s'il n'existe pas
const pdfUploadsDir = path.join(__dirname, '..', 'uploads', 'pdf');
if (!fs.existsSync(pdfUploadsDir)) {
  fs.mkdirSync(pdfUploadsDir, { recursive: true });
  console.log('📁 Dossier uploads/pdf créé:', pdfUploadsDir);
} else {
  console.log('📁 Dossier uploads/pdf existe déjà:', pdfUploadsDir);
}

// Configuration du stockage pour les PDF
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pdfUploadsDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    // Nettoyer le nom du fichier (supprimer les espaces et caractères spéciaux)
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `pdf-${uniqueSuffix}-${cleanName}`);
  }
});

// Filtre pour n'accepter que les PDF
const pdfFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === 'application/pdf';

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers PDF sont autorisés'));
  }
};

// Configuration multer pour les PDF
export const uploadPdf = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max pour les PDF
  },
  fileFilter: pdfFileFilter
});

// Fonction pour obtenir le chemin public du PDF
export const getPdfPublicPath = (filename) => {
  return `/uploads/pdf/${filename}`;
};


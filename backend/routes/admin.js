import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import {
  uploadCourseImage,
  getImagePublicPath,
  uploadPdf,
  getPdfPublicPath,
  uploadPartenaireGallery,
  uploadPartenaireLogo,
  getPartenaireImagePublicPath
} from '../middleware/upload.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Comment from '../models/Comment.js';
import CoachingReservation from '../models/CoachingReservation.js';
import RessourcePdf from '../models/RessourcePdf.js';
import Partenaire from '../models/Partenaire.js';
import PartenaireAvis from '../models/PartenaireAvis.js';
import PartenaireContact from '../models/PartenaireContact.js';

const router = express.Router();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeToken = (value) => {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/é/g, 'e')
    .replace(/\s+/g, '_');
};

const normalizeType = (value) => {
  if (!value) return 'autre';
  const normalized = normalizeToken(value);
  if (normalized === 'agence_de_livraison' || normalized === 'agence_livraison') {
    return 'agence_livraison';
  }
  if (normalized === 'closeur') return 'closeur';
  if (normalized === 'transitaire') return 'transitaire';
  return 'autre';
};

const normalizeDomaine = (value) => {
  if (!value) return 'autre';
  const normalized = normalizeToken(value);
  if (normalized === 'societe_de_livraison' || normalized === 'societe_livraison') {
    return 'agence_livraison';
  }
  return normalized || 'autre';
};

const parseListParam = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseListParam(item));
  }
  return value
    .toString()
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const shapePartenaire = (partenaire) => {
  const domaines = Array.isArray(partenaire.domaines_activite) && partenaire.domaines_activite.length
    ? partenaire.domaines_activite
    : partenaire.domaine
      ? [partenaire.domaine]
      : [];
  const statut = partenaire.statut === 'refuse' ? 'suspendu' : partenaire.statut;
  return {
    ...partenaire,
    statut,
    domaines_activite: domaines,
    type_partenaire: partenaire.type_partenaire || normalizeType(partenaire.domaine)
  };
};

const recomputePartenaireRating = async (partenaireId) => {
  const stats = await PartenaireAvis.aggregate([
    { $match: { partenaire_id: partenaireId, statut: 'approuve' } },
    {
      $group: {
        _id: '$partenaire_id',
        rating_avg: { $avg: '$note' },
        rating_count: { $sum: 1 }
      }
    }
  ]);
  const rating_avg = stats[0]?.rating_avg ? Number(stats[0].rating_avg.toFixed(2)) : 0;
  const rating_count = stats[0]?.rating_count || 0;
  await Partenaire.updateOne(
    { _id: partenaireId },
    {
      $set: {
        'stats.rating_avg': rating_avg,
        'stats.rating_count': rating_count
      }
    }
  );
};

// Toutes les routes admin nécessitent une authentification ET un rôle admin/superadmin
router.use(authenticate);
router.use(requireAdmin);

// Middleware de logging pour déboguer
router.use((req, res, next) => {
  console.log(`🔍 Route admin appelée: ${req.method} ${req.path}`);
  console.log(`   Full URL: ${req.originalUrl}`);
  next();
});

// POST /api/admin/validate/:id - Valider un utilisateur (mettre status: "active")
router.post('/validate/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.status = 'active';
    await user.save();

    res.json({
      success: true,
      message: 'Utilisateur validé avec succès',
      user: {
        id: user._id,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur validation utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la validation de l\'utilisateur' });
  }
});

// Note: Les uploads de fichiers sont désormais gérés via des URLs externes (Google Drive, etc.)
// Les routes d'upload Cloudinary ont été supprimées

// POST /api/admin/course - Créer un nouveau cours avec Module 1 automatique
router.post('/course', async (req, res) => {
  try {
    const { title, description, coverImage, slug, isDefault, isPublished, isFree } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({ error: 'Titre du cours requis' });
    }

    if (!slug) {
      return res.status(400).json({ error: 'Slug du cours requis' });
    }

    // Vérifier que le slug est unique
    const existingCourse = await Course.findOne({ slug: slug.toLowerCase() });
    if (existingCourse) {
      return res.status(400).json({ error: 'Ce slug est déjà utilisé' });
    }

    // Si on définit un nouveau cours par défaut, retirer le statut par défaut des autres
    if (isDefault) {
      await Course.updateMany({ isDefault: true }, { isDefault: false });
    }

    const course = new Course({
      title: title.trim(),
      description: description?.trim() || '',
      coverImage: coverImage?.trim() || '/img/fbads.png',
      slug: slug.toLowerCase().trim(),
      isDefault: isDefault || false,
      isPublished: !!isPublished,
      isFree: !!isFree
    });

    await course.save();

    // Créer automatiquement le Module 1
    const module1 = new Module({
      courseId: course._id,
      title: 'Module 1 - Bases',
      order: 1
    });

    await module1.save();

    console.log('✅ Cours créé avec Module 1:', {
      courseId: course._id,
      courseTitle: course.title,
      moduleId: module1._id
    });

    res.status(201).json({
      success: true,
      message: 'Cours créé avec succès (Module 1 créé automatiquement)',
      course: {
        ...course.toObject(),
        module: module1
      }
    });
  } catch (error) {
    console.error('Erreur création cours:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors de la création du cours' });
  }
});

// PUT /api/admin/course/:courseId - Modifier un cours (titre/slug/description/image/default/actif)
router.put('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, coverImage, slug, isDefault, isPublished, isFree } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Cours non trouvé' });

    if (slug && slug.toLowerCase().trim() !== course.slug) {
      const existing = await Course.findOne({ slug: slug.toLowerCase().trim() });
      if (existing) return res.status(400).json({ error: 'Ce slug est déjà utilisé' });
      course.slug = slug.toLowerCase().trim();
    }

    if (typeof title === 'string') course.title = title.trim();
    if (typeof description === 'string') course.description = description.trim();
    if (typeof coverImage === 'string') course.coverImage = coverImage.trim();

    if (typeof isPublished === 'boolean') course.isPublished = isPublished;
    if (typeof isFree === 'boolean') course.isFree = isFree;

    if (typeof isDefault === 'boolean') {
      if (isDefault) {
        await Course.updateMany({ isDefault: true }, { isDefault: false });
      }
      course.isDefault = isDefault;
    }

    await course.save();

    res.json({ success: true, course: course.toObject() });
  } catch (error) {
    console.error('Erreur modification cours:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du cours' });
  }
});

// DELETE /api/admin/course/:courseId - Supprimer un cours (cascade modules/leçons)
router.delete('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Cours non trouvé' });

    const modules = await Module.find({ courseId: course._id });
    for (const m of modules) {
      await Lesson.deleteMany({ moduleId: m._id });
    }
    await Module.deleteMany({ courseId: course._id });
    await Course.deleteOne({ _id: course._id });

    res.json({ success: true, message: 'Cours supprimé' });
  } catch (error) {
    console.error('Erreur suppression cours:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du cours' });
  }
});

// GET /api/admin/courses - Liste tous les cours avec leurs modules
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });
    
    // Récupérer les modules pour chaque cours
    const coursesWithModules = await Promise.all(
      courses.map(async (course) => {
        const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });
        return {
          ...course.toObject(),
          modulesCount: modules.length
        };
      })
    );
    
    res.json({
      success: true,
      courses: coursesWithModules,
      count: courses.length
    });
  } catch (error) {
    console.error('Erreur récupération cours:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des cours' });
  }
});

// GET /api/admin/courses/:courseId - Détails d'un cours (modules + leçons)
router.get('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });
    const modulesWithLessons = await Promise.all(
      modules.map(async (m) => {
        const lessons = await Lesson.find({ moduleId: m._id }).sort({ order: 1 });
        return { ...m.toObject(), lessons };
      })
    );

    res.json({
      success: true,
      course: {
        ...course.toObject(),
        modules: modulesWithLessons
      }
    });
  } catch (error) {
    console.error('Erreur détails cours admin:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du cours' });
  }
});

// POST /api/admin/courses/:courseId/modules - Ajouter un module à un cours
router.post('/courses/:courseId/modules', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, order } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Titre du module requis' });
    }

    // Si order non fourni, on met à la fin
    let finalOrder = Number.isFinite(Number(order)) ? Number(order) : null;
    if (!finalOrder) {
      const last = await Module.findOne({ courseId: course._id }).sort({ order: -1 });
      finalOrder = (last?.order || 0) + 1;
    }

    // Empêcher doublon d'ordre dans le même cours
    const existing = await Module.findOne({ courseId: course._id, order: finalOrder });
    if (existing) {
      return res.status(400).json({ error: `Un module existe déjà avec l'ordre ${finalOrder}` });
    }

    const module = new Module({
      courseId: course._id,
      title: String(title).trim(),
      order: finalOrder
    });
    await module.save();

    res.status(201).json({
      success: true,
      message: 'Module créé avec succès',
      module
    });
  } catch (error) {
    console.error('Erreur création module:', error);
    res.status(500).json({ error: 'Erreur lors de la création du module' });
  }
});

// PUT /api/admin/modules/:moduleId - Modifier un module
router.put('/modules/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, order } = req.body;

    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ error: 'Module non trouvé' });

    if (typeof title === 'string' && title.trim()) module.title = title.trim();
    if (Number.isFinite(Number(order))) module.order = Number(order);

    // Empêcher doublon d'ordre dans le même cours
    const conflict = await Module.findOne({ courseId: module.courseId, order: module.order, _id: { $ne: module._id } });
    if (conflict) return res.status(400).json({ error: `Un module existe déjà avec l'ordre ${module.order}` });

    await module.save();
    res.json({ success: true, module: module.toObject() });
  } catch (error) {
    console.error('Erreur modification module:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du module' });
  }
});

// DELETE /api/admin/modules/:moduleId - Supprimer un module (cascade leçons)
router.delete('/modules/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ error: 'Module non trouvé' });

    await Lesson.deleteMany({ moduleId: module._id });
    await Module.deleteOne({ _id: module._id });

    res.json({ success: true, message: 'Module supprimé' });
  } catch (error) {
    console.error('Erreur suppression module:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du module' });
  }
});

// POST /api/admin/modules/:moduleId/lessons - Ajouter une leçon (chapitre) à un module
router.post('/modules/:moduleId/lessons', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, videoId, order, locked, summary, resources, isCoaching, videoType } = req.body;

    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Titre de la leçon requis' });
    }
    if (!videoId || !String(videoId).trim()) {
      return res.status(400).json({ error: 'videoId requis' });
    }

    // Si order non fourni, on met à la fin
    let finalOrder = Number.isFinite(Number(order)) ? Number(order) : null;
    if (!finalOrder) {
      const last = await Lesson.findOne({ moduleId: module._id }).sort({ order: -1 });
      finalOrder = (last?.order || 0) + 1;
    }

    // Empêcher doublon d'ordre dans le même module
    const existing = await Lesson.findOne({ moduleId: module._id, order: finalOrder });
    if (existing) {
      return res.status(400).json({ error: `Une leçon existe déjà avec l'ordre ${finalOrder}` });
    }

    const lesson = new Lesson({
      moduleId: module._id,
      title: String(title).trim(),
      videoId: String(videoId).trim(),
      order: finalOrder,
      locked: typeof locked === 'boolean' ? locked : false,
      summary: summary && typeof summary === 'object' ? summary : { text: '', points: [] },
      resources: Array.isArray(resources) ? resources : [],
      isCoaching: !!isCoaching,
      videoType: videoType || undefined
    });

    await lesson.save();

    res.status(201).json({
      success: true,
      message: 'Leçon créée avec succès',
      lesson
    });
  } catch (error) {
    console.error('Erreur création leçon:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors de la création de la leçon' });
  }
});

// PUT /api/admin/lessons/:lessonId - Modifier une leçon
router.put('/lessons/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, videoId, order, locked, summary, resources, isCoaching, videoType } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Leçon non trouvée' });

    if (typeof title === 'string' && title.trim()) lesson.title = title.trim();
    if (typeof videoId === 'string' && videoId.trim()) lesson.videoId = videoId.trim();
    if (Number.isFinite(Number(order))) lesson.order = Number(order);
    if (typeof locked === 'boolean') lesson.locked = locked;
    if (typeof isCoaching === 'boolean') lesson.isCoaching = isCoaching;
    if (typeof videoType === 'string') lesson.videoType = videoType;
    if (summary && typeof summary === 'object') lesson.summary = summary;
    if (Array.isArray(resources)) lesson.resources = resources;

    // Empêcher doublon d'ordre dans le même module
    const conflict = await Lesson.findOne({ moduleId: lesson.moduleId, order: lesson.order, _id: { $ne: lesson._id } });
    if (conflict) return res.status(400).json({ error: `Une leçon existe déjà avec l'ordre ${lesson.order}` });

    await lesson.save();
    res.json({ success: true, lesson: lesson.toObject() });
  } catch (error) {
    console.error('Erreur modification leçon:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la leçon' });
  }
});

// DELETE /api/admin/lessons/:lessonId - Supprimer une leçon
router.delete('/lessons/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Leçon non trouvée' });

    await Lesson.deleteOne({ _id: lesson._id });
    res.json({ success: true, message: 'Leçon supprimée' });
  } catch (error) {
    console.error('Erreur suppression leçon:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la leçon' });
  }
});

// GET /api/admin/users - Avec progression des étudiants
router.get('/users', async (req, res) => {
  try {
    console.log('📋 Requête GET /api/admin/users');
    console.log('👤 Utilisateur authentifié:', req.user?.email);
    
    const users = await User.find({})
      .select('-password')
      .populate('progress.courseId')
      .sort({ createdAt: -1 });
    
    // Calculer les statistiques de progression basées sur le nombre de leçons (8 leçons au total)
    const TOTAL_LESSONS = 8; // Nombre total de leçons dans la formation
    
    // Ajouter les statistiques de progression à chaque utilisateur
    const usersWithProgress = users.map(user => {
      const completedCourses = user.progress.filter(p => p.completed && p.courseId).length;
      const completedLessons = Math.min(completedCourses, TOTAL_LESSONS);
      const progressPercentage = TOTAL_LESSONS > 0 ? Math.round((completedLessons / TOTAL_LESSONS) * 100) : 0;
      
      const userObject = user.toObject();
      
      // S'assurer que le nom est bien présent
      if (!userObject.name) {
        console.warn(`⚠️ Utilisateur ${userObject.email} n'a pas de nom`);
      }
      
      return {
        ...userObject,
        name: userObject.name || 'Non renseigné', // Fallback si pas de nom
        phoneNumber: userObject.phoneNumber || 'Non renseigné', // Fallback si pas de téléphone
        progressStats: {
          totalLessons: TOTAL_LESSONS,
          totalCourses: completedCourses, // Garder pour compatibilité
          completedLessons: completedLessons,
          completedCourses: completedCourses, // Garder pour compatibilité
          progressPercentage
        }
      };
    });
    
    console.log(`✅ ${users.length} utilisateurs trouvés`);
    console.log(`   Exemple utilisateur:`, usersWithProgress[0] ? {
      name: usersWithProgress[0].name,
      email: usersWithProgress[0].email,
      phoneNumber: usersWithProgress[0].phoneNumber
    } : 'Aucun utilisateur');
    
    res.json({
      success: true,
      users: usersWithProgress,
      count: usersWithProgress.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des utilisateurs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/admin/users/:id/reset-progress - Réinitialiser la progression d'un utilisateur
// Cette route doit être définie AVANT /users/:id pour éviter les conflits
router.post('/users/:id/reset-progress', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔄 Tentative de réinitialisation progression pour utilisateur: ${id}`);

    const user = await User.findById(id);
    if (!user) {
      console.error(`❌ Utilisateur non trouvé: ${id}`);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Réinitialiser la progression (vider le tableau progress)
    user.progress = [];
    await user.save();

    console.log(`✅ Progression réinitialisée pour ${user.email}`);

    res.json({
      success: true,
      message: 'Progression réinitialisée avec succès',
      user: {
        id: user._id,
        email: user.email,
        progress: user.progress
      }
    });
  } catch (error) {
    console.error('❌ Erreur réinitialisation progression:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erreur lors de la réinitialisation de la progression',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/admin/users/:id/status - Changer le statut d'un utilisateur
// Cette route doit être définie AVANT /users/:id pour éviter les conflits
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.status = status;
    await user.save();

    res.json({
      success: true,
      message: `Statut mis à jour: ${status}`,
      user: {
        id: user._id,
        email: user.email,
        status: user.status,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur changement statut:', error);
    res.status(500).json({ error: 'Erreur lors du changement de statut' });
  }
});

// PUT /api/admin/users/:id - Mettre à jour un utilisateur
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phoneNumber, status, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Ne pas permettre de modifier son propre rôle
    if (role && req.user.userId === id && role !== user.role) {
      return res.status(403).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
    }

    if (name) user.name = name.trim();
    if (email) {
      // Vérifier si l'email n'est pas déjà utilisé par un autre utilisateur
      const existingUserByEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (existingUserByEmail) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
      user.email = email.toLowerCase();
    }
    if (phoneNumber) {
      // Vérifier si le téléphone n'est pas déjà utilisé par un autre utilisateur
      const existingUserByPhone = await User.findOne({ phoneNumber: phoneNumber.trim(), _id: { $ne: id } });
      if (existingUserByPhone) {
        return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
      }
      user.phoneNumber = phoneNumber.trim();
    }
    if (status) user.status = status;
    if (role && ['student', 'superadmin'].includes(role)) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// DELETE /api/admin/users/:id - Supprimer un utilisateur
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Ne pas permettre de supprimer son propre compte
    if (req.user.userId === id) {
      return res.status(403).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Ne pas permettre de supprimer un autre superadmin
    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Impossible de supprimer un autre administrateur' });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});


// POST /api/admin/reset-all-progress - Réinitialiser la progression de tous les utilisateurs
router.post('/reset-all-progress', async (req, res) => {
  try {
    // Réinitialiser la progression de tous les utilisateurs étudiants
    const result = await User.updateMany(
      { role: 'student' },
      { $set: { progress: [] } }
    );

    console.log(`🔄 Progression réinitialisée pour ${result.modifiedCount} utilisateurs`);

    res.json({
      success: true,
      message: `Progression réinitialisée pour ${result.modifiedCount} utilisateurs`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Erreur réinitialisation progression globale:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation de la progression' });
  }
});

// GET /api/admin/comments - Récupérer tous les commentaires depuis la DB
router.get('/comments', async (req, res) => {
  try {
    const { status } = req.query;
    
    console.log(`📋 Récupération commentaires admin - Filtre: ${status || 'all'}`);
    
    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    // Récupérer tous les commentaires depuis la base de données
    const comments = await Comment.find(filter)
      .populate('userId', 'email role status')
      .sort({ createdAt: -1 });

    console.log(`✅ ${comments.length} commentaires récupérés depuis la DB`);

    res.json({
      success: true,
      comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Erreur récupération commentaires:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commentaires' });
  }
});

// PUT /api/admin/comments/:id/status - Modifier le statut d'un commentaire
router.put('/comments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    console.log(`🔄 Modification statut commentaire ${id} -> ${status}`);

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    comment.status = status;
    if (adminResponse) {
      comment.adminResponse = adminResponse.trim();
    }
    
    // Sauvegarder dans la base de données
    await comment.save();
    
    console.log(`✅ Commentaire ${id} mis à jour en DB - Statut: ${status}`);

    res.json({
      success: true,
      message: `Statut du commentaire mis à jour: ${status}`,
      comment
    });
  } catch (error) {
    console.error('Erreur mise à jour statut commentaire:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

// DELETE /api/admin/comments/:id - Supprimer un commentaire
router.delete('/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Suppression commentaire ${id}`);

    const comment = await Comment.findByIdAndDelete(id);
    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    console.log(`✅ Commentaire ${id} supprimé de la DB`);

    res.json({
      success: true,
      message: 'Commentaire supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression commentaire:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du commentaire' });
  }
});

// GET /api/admin/coaching-reservations - Récupérer les réservations de coaching
router.get('/coaching-reservations', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};

    const reservations = await CoachingReservation.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      reservations,
      count: reservations.length
    });
  } catch (error) {
    console.error('Erreur récupération réservations coaching:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
});

// PUT /api/admin/coaching-reservations/:id/status - Modifier le statut d'une réservation
router.put('/coaching-reservations/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const reservation = await CoachingReservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    reservation.status = status;
    await reservation.save();

    res.json({ success: true, reservation: reservation.toObject() });
  } catch (error) {
    console.error('Erreur mise à jour réservation coaching:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// DELETE /api/admin/coaching-reservations/:id - Supprimer une réservation
router.delete('/coaching-reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await CoachingReservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    await CoachingReservation.deleteOne({ _id: id });
    res.json({ success: true, message: 'Réservation supprimée' });
  } catch (error) {
    console.error('Erreur suppression réservation coaching:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ============================================
// Routes partenaires
// ============================================

// POST /api/admin/partenaires - Créer un partenaire (admin)
router.post('/partenaires', async (req, res) => {
  try {
    const payload = req.body || {};
    const domaines = parseListParam(payload.domaines_activite || payload.domaines || payload.domaine)
      .map(normalizeDomaine);
    const typePartenaire = normalizeType(payload.type_partenaire || payload.type || payload.domaine);

    if (!payload.nom || !payload.nom.toString().trim()) {
      return res.status(400).json({ error: 'Nom requis' });
    }
    if (!domaines.length) {
      return res.status(400).json({ error: 'Domaine requis' });
    }

    const statut = ['en_attente', 'approuve', 'suspendu'].includes(payload.statut)
      ? payload.statut
      : 'en_attente';
    const autorisationAffichage = payload.autorisation_affichage !== undefined
      ? Boolean(payload.autorisation_affichage)
      : statut === 'approuve';
    const isSponsored = payload.is_sponsored !== undefined ? Boolean(payload.is_sponsored) : false;

    const partenaire = new Partenaire({
      nom: payload.nom.toString().trim(),
      type_partenaire: typePartenaire,
      domaine: domaines[0],
      domaines_activite: domaines,
      description_courte: payload.description_courte ? payload.description_courte.toString().trim() : '',
      pays: payload.pays ? payload.pays.toString().trim() : '',
      ville: payload.ville ? payload.ville.toString().trim() : '',
      telephone: payload.telephone ? payload.telephone.toString().trim() : '',
      whatsapp: payload.whatsapp ? payload.whatsapp.toString().trim() : '',
      email: payload.email ? payload.email.toString().trim() : '',
      lien_contact: payload.lien_contact ? payload.lien_contact.toString().trim() : '',
      disponibilite: payload.disponibilite ? normalizeToken(payload.disponibilite) : 'disponible',
      autorisation_affichage: autorisationAffichage,
      statut,
      approved_at: statut === 'approuve' ? new Date() : null,
      annees_experience: Number.isFinite(Number(payload.annees_experience))
        ? Number(payload.annees_experience)
        : null,
      zones_couvertes: parseListParam(payload.zones_couvertes),
      delais_moyens: payload.delais_moyens ? payload.delais_moyens.toString().trim() : '',
      methodes_paiement: parseListParam(payload.methodes_paiement),
      langues_parlees: parseListParam(payload.langues_parlees),
      logo_url: payload.logo_url ? payload.logo_url.toString().trim() : '',
      is_sponsored: isSponsored
    });

    await partenaire.save();
    res.status(201).json({ success: true, partenaire: shapePartenaire(partenaire.toObject()) });
  } catch (error) {
    console.error('Erreur création partenaire:', error);
    res.status(500).json({ error: 'Erreur lors de la création du partenaire' });
  }
});

// GET /api/admin/partenaires - Liste + filtres
router.get('/partenaires', async (req, res) => {
  try {
    const { statut, pays, domaine, type, disponibilite } = req.query;
    const filter = {};

    if (statut && statut !== 'all') {
      filter.statut = statut;
    }

    if (domaine && domaine !== 'all') {
      filter.$or = [
        { domaines_activite: normalizeDomaine(domaine) },
        { domaine: normalizeDomaine(domaine) }
      ];
    }

    if (type && type !== 'all') {
      filter.type_partenaire = normalizeType(type);
    }

    if (disponibilite && disponibilite !== 'all') {
      filter.disponibilite = normalizeToken(disponibilite);
    }

    if (pays && pays.trim()) {
      filter.pays = new RegExp(escapeRegExp(pays.trim()), 'i');
    }

    const partenaires = await Partenaire.find(filter)
      .sort({ created_at: -1 })
      .lean();

    res.json({
      success: true,
      partenaires: partenaires.map(shapePartenaire),
      count: partenaires.length
    });
  } catch (error) {
    console.error('Erreur récupération partenaires:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des partenaires' });
  }
});

// PUT /api/admin/partenaires/:id - Mettre à jour un partenaire (admin)
router.put('/partenaires/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const partenaire = await Partenaire.findById(id);
    if (!partenaire) {
      return res.status(404).json({ error: 'Partenaire non trouvé' });
    }

    const payload = req.body || {};
    const domaines = parseListParam(payload.domaines_activite || payload.domaines || payload.domaine)
      .map(normalizeDomaine);

    if (payload.nom) partenaire.nom = payload.nom.toString().trim();
    if (payload.type_partenaire || payload.type) {
      partenaire.type_partenaire = normalizeType(payload.type_partenaire || payload.type);
    }
    if (domaines.length) {
      partenaire.domaines_activite = domaines;
      partenaire.domaine = domaines[0];
    }
    if (payload.description_courte !== undefined) {
      partenaire.description_courte = payload.description_courte.toString().trim();
    }
    if (payload.pays) partenaire.pays = payload.pays.toString().trim();
    if (payload.ville) partenaire.ville = payload.ville.toString().trim();
    if (payload.telephone !== undefined) {
      partenaire.telephone = payload.telephone.toString().trim();
    }
    if (payload.whatsapp !== undefined) {
      partenaire.whatsapp = payload.whatsapp.toString().trim();
    }
    if (payload.email !== undefined) {
      partenaire.email = payload.email.toString().trim();
    }
    if (payload.lien_contact !== undefined) {
      partenaire.lien_contact = payload.lien_contact.toString().trim();
    }
    if (payload.disponibilite) {
      partenaire.disponibilite = normalizeToken(payload.disponibilite);
    }
    if (payload.autorisation_affichage !== undefined) {
      partenaire.autorisation_affichage = Boolean(payload.autorisation_affichage);
    }
    if (payload.statut) {
      partenaire.statut = payload.statut === 'refuse' ? 'suspendu' : payload.statut;
    }
    if (payload.annees_experience !== undefined) {
      const value = Number(payload.annees_experience);
      partenaire.annees_experience = Number.isFinite(value) ? value : null;
    }
    if (payload.zones_couvertes !== undefined) {
      partenaire.zones_couvertes = parseListParam(payload.zones_couvertes);
    }
    if (payload.delais_moyens !== undefined) {
      partenaire.delais_moyens = payload.delais_moyens.toString().trim();
    }
    if (payload.methodes_paiement !== undefined) {
      partenaire.methodes_paiement = parseListParam(payload.methodes_paiement);
    }
    if (payload.langues_parlees !== undefined) {
      partenaire.langues_parlees = parseListParam(payload.langues_parlees);
    }
    if (payload.logo_url !== undefined) {
      partenaire.logo_url = payload.logo_url.toString().trim();
    }
    if (payload.is_sponsored !== undefined) {
      partenaire.is_sponsored = Boolean(payload.is_sponsored);
    }
    if (payload.plan !== undefined) {
      partenaire.monetisation = partenaire.monetisation || {};
      partenaire.monetisation.plan = payload.plan === 'premium' ? 'premium' : 'free';
    }
    if (payload.subscription_expires_at !== undefined) {
      const date = payload.subscription_expires_at ? new Date(payload.subscription_expires_at) : null;
      partenaire.monetisation = partenaire.monetisation || {};
      partenaire.monetisation.subscription_expires_at = date && !Number.isNaN(date.getTime()) ? date : null;
    }
    if (payload.boost_until !== undefined) {
      const date = payload.boost_until ? new Date(payload.boost_until) : null;
      partenaire.monetisation = partenaire.monetisation || {};
      partenaire.monetisation.boost_until = date && !Number.isNaN(date.getTime()) ? date : null;
    }
    if (payload.leads_paid_count !== undefined) {
      const value = Number(payload.leads_paid_count);
      partenaire.monetisation = partenaire.monetisation || {};
      partenaire.monetisation.leads_paid_count = Number.isFinite(value) ? value : 0;
    }

    await partenaire.save();
    res.json({ success: true, partenaire: shapePartenaire(partenaire.toObject()) });
  } catch (error) {
    console.error('Erreur mise à jour partenaire:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du partenaire' });
  }
});

// PUT /api/admin/partenaires/:id/approve - Approuver
router.put('/partenaires/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const partenaire = await Partenaire.findById(id);
    if (!partenaire) {
      return res.status(404).json({ error: 'Partenaire non trouvé' });
    }
    partenaire.statut = 'approuve';
    partenaire.autorisation_affichage = true;
    partenaire.approved_at = new Date();
    await partenaire.save();
    res.json({ success: true, partenaire: shapePartenaire(partenaire.toObject()) });
  } catch (error) {
    console.error('Erreur approbation partenaire:', error);
    res.status(500).json({ error: 'Erreur lors de l\'approbation' });
  }
});

// PUT /api/admin/partenaires/:id/suspend - Suspendre
router.put('/partenaires/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const partenaire = await Partenaire.findById(id);
    if (!partenaire) {
      return res.status(404).json({ error: 'Partenaire non trouvé' });
    }
    partenaire.statut = 'suspendu';
    partenaire.autorisation_affichage = false;
    partenaire.approved_at = null;
    await partenaire.save();
    res.json({ success: true, partenaire: shapePartenaire(partenaire.toObject()) });
  } catch (error) {
    console.error('Erreur suspension partenaire:', error);
    res.status(500).json({ error: 'Erreur lors de la suspension' });
  }
});

// PUT /api/admin/partenaires/:id/refuse - Alias suspend
router.put('/partenaires/:id/refuse', async (req, res) => {
  try {
    const { id } = req.params;
    const partenaire = await Partenaire.findById(id);
    if (!partenaire) {
      return res.status(404).json({ error: 'Partenaire non trouvé' });
    }
    partenaire.statut = 'suspendu';
    partenaire.autorisation_affichage = false;
    partenaire.approved_at = null;
    await partenaire.save();
    res.json({ success: true, partenaire: shapePartenaire(partenaire.toObject()) });
  } catch (error) {
    console.error('Erreur suspension partenaire:', error);
    res.status(500).json({ error: 'Erreur lors de la suspension' });
  }
});

// POST /api/admin/partenaires/:id/gallery - Upload photos galerie partenaire
router.post('/partenaires/:id/gallery', uploadPartenaireGallery.array('photos', 8), async (req, res) => {
  try {
    const { id } = req.params;
    const partenaire = await Partenaire.findById(id);
    if (!partenaire) {
      return res.status(404).json({ error: 'Partenaire non trouvé' });
    }

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ error: 'Aucune image envoyée' });
    }

    const photoPaths = files.map((file) => getPartenaireImagePublicPath(file.filename));
    partenaire.galerie_photos = [...(partenaire.galerie_photos || []), ...photoPaths];
    await partenaire.save();

    res.json({
      success: true,
      galerie_photos: partenaire.galerie_photos
    });
  } catch (error) {
    console.error('Erreur upload galerie partenaire:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload des photos' });
  }
});

// DELETE /api/admin/partenaires/:id/gallery - Supprimer une photo de galerie
router.delete('/partenaires/:id/gallery', async (req, res) => {
  try {
    const { id } = req.params;
    const { photo } = req.body || {};
    if (!photo) {
      return res.status(400).json({ error: 'Photo manquante' });
    }
    const partenaire = await Partenaire.findById(id);
    if (!partenaire) {
      return res.status(404).json({ error: 'Partenaire non trouvé' });
    }

    const gallery = Array.isArray(partenaire.galerie_photos) ? partenaire.galerie_photos : [];
    partenaire.galerie_photos = gallery.filter((item) => item !== photo);
    await partenaire.save();

    res.json({ success: true, galerie_photos: partenaire.galerie_photos });
  } catch (error) {
    console.error('Erreur suppression photo galerie:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// POST /api/admin/partenaires/:id/logo - Upload logo partenaire
router.post('/partenaires/:id/logo', uploadPartenaireLogo.single('logo'), async (req, res) => {
  try {
    const { id } = req.params;
    const partenaire = await Partenaire.findById(id);
    if (!partenaire) {
      return res.status(404).json({ error: 'Partenaire non trouvé' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier envoyé' });
    }

    const logoPath = getPartenaireImagePublicPath(req.file.filename);
    partenaire.logo_url = logoPath;
    await partenaire.save();

    res.json({
      success: true,
      logo_url: partenaire.logo_url
    });
  } catch (error) {
    console.error('Erreur upload logo partenaire:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload du logo' });
  }
});

// GET /api/admin/partenaires/stats - Stats partenaires
router.get('/partenaires/stats', async (req, res) => {
  try {
    const total = await Partenaire.countDocuments();
    const approuves = await Partenaire.countDocuments({ statut: 'approuve' });
    const enAttente = await Partenaire.countDocuments({ statut: 'en_attente' });
    const suspendus = await Partenaire.countDocuments({ statut: 'suspendu' });

    const byPays = await Partenaire.aggregate([
      { $match: { pays: { $ne: '' } } },
      { $group: { _id: '$pays', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        approuves,
        en_attente: enAttente,
        suspendus,
        by_pays: byPays
      }
    });
  } catch (error) {
    console.error('Erreur stats partenaires:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des stats' });
  }
});

// GET /api/admin/partenaires/avis - Liste avis + filtres
router.get('/partenaires/avis', async (req, res) => {
  try {
    const { statut } = req.query;
    const filter = {};
    if (statut && statut !== 'all') {
      filter.statut = statut;
    }

    const avis = await PartenaireAvis.find(filter)
      .populate('partenaire_id', 'nom')
      .sort({ created_at: -1 })
      .lean();

    res.json({ success: true, avis, count: avis.length });
  } catch (error) {
    console.error('Erreur récupération avis partenaires:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des avis' });
  }
});

// PUT /api/admin/partenaires/avis/:id/approve - Approuver avis
router.put('/partenaires/avis/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const avis = await PartenaireAvis.findById(id);
    if (!avis) {
      return res.status(404).json({ error: 'Avis non trouvé' });
    }
    avis.statut = 'approuve';
    await avis.save();
    await recomputePartenaireRating(avis.partenaire_id);
    res.json({ success: true, avis: avis.toObject() });
  } catch (error) {
    console.error('Erreur approbation avis:', error);
    res.status(500).json({ error: 'Erreur lors de l\'approbation de l\'avis' });
  }
});

// PUT /api/admin/partenaires/avis/:id/refuse - Refuser avis
router.put('/partenaires/avis/:id/refuse', async (req, res) => {
  try {
    const { id } = req.params;
    const avis = await PartenaireAvis.findById(id);
    if (!avis) {
      return res.status(404).json({ error: 'Avis non trouvé' });
    }
    avis.statut = 'refuse';
    await avis.save();
    await recomputePartenaireRating(avis.partenaire_id);
    res.json({ success: true, avis: avis.toObject() });
  } catch (error) {
    console.error('Erreur refus avis:', error);
    res.status(500).json({ error: 'Erreur lors du refus de l\'avis' });
  }
});

// GET /api/admin/partenaires/contacts - Liste des contacts
router.get('/partenaires/contacts', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type && type !== 'all') {
      filter.type = type;
    }

    const contacts = await PartenaireContact.find(filter)
      .populate('partenaire_id', 'nom')
      .sort({ created_at: -1 })
      .lean();

    res.json({ success: true, contacts, count: contacts.length });
  } catch (error) {
    console.error('Erreur récupération contacts partenaires:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des contacts' });
  }
});

// DELETE /api/admin/partenaires/:id - Supprimer
router.delete('/partenaires/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const partenaire = await Partenaire.findById(id);
    if (!partenaire) {
      return res.status(404).json({ error: 'Partenaire non trouvé' });
    }
    await Partenaire.deleteOne({ _id: id });
    res.json({ success: true, message: 'Partenaire supprimé' });
  } catch (error) {
    console.error('Erreur suppression partenaire:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ============================================
// Routes pour les Ressources PDF
// ============================================

// IMPORTANT: Les routes GET doivent être définies AVANT les routes POST avec upload
// GET /api/admin/ressources-pdf - Récupérer toutes les ressources PDF
router.get('/ressources-pdf', async (req, res) => {
  try {
    console.log('📥 GET /api/admin/ressources-pdf appelé');
    console.log('   - User:', req.user?.email);
    console.log('   - Role:', req.user?.role);
    
    // Vérifier que le modèle RessourcePdf est bien disponible
    if (!RessourcePdf) {
      console.error('❌ Modèle RessourcePdf non disponible');
      return res.status(500).json({ 
        success: false,
        error: 'Modèle RessourcePdf non disponible' 
      });
    }
    
    const ressourcesPdf = await RessourcePdf.find().sort({ createdAt: -1 });
    console.log(`✅ ${ressourcesPdf.length} ressources PDF trouvées`);
    res.json({
      success: true,
      ressourcesPdf
    });
  } catch (error) {
    console.error('❌ Erreur récupération ressources PDF:', error);
    console.error('   - Stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des ressources PDF',
      details: error.message 
    });
  }
});

// Note: Les uploads de fichiers PDF sont désormais gérés via des URLs externes (Google Drive, etc.)
// Les routes d'upload Cloudinary ont été supprimées

// PUT /api/admin/ressources-pdf/:slug/cover - Mettre à jour l'image de couverture d'une ressource PDF
router.put('/ressources-pdf/:slug/cover', async (req, res) => {
  try {
    const { slug } = req.params;
    const { coverImage } = req.body;

    if (!coverImage) {
      return res.status(400).json({ error: 'URL de l\'image de couverture requise' });
    }

    // Vérifier que l'URL est valide
    if (!coverImage.startsWith('http://') && !coverImage.startsWith('https://')) {
      return res.status(400).json({ error: 'L\'URL de l\'image doit commencer par http:// ou https://' });
    }

    const ressourcePdf = await RessourcePdf.findOne({ slug });
    if (!ressourcePdf) {
      return res.status(404).json({ error: 'Ressource PDF non trouvée' });
    }

    ressourcePdf.coverImage = coverImage;
    await ressourcePdf.save();

    res.json({
      success: true,
      message: 'Image de couverture mise à jour avec succès',
      ressourcePdf
    });
  } catch (error) {
    console.error('Erreur mise à jour image de couverture:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'image de couverture', details: error.message });
  }
});

// POST /api/admin/ressources-pdf - Créer une nouvelle ressource PDF
router.post('/ressources-pdf', async (req, res) => {
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

    // Validation
    if (!title) {
      return res.status(400).json({ error: 'Titre de la ressource PDF requis' });
    }

    if (!slug) {
      return res.status(400).json({ error: 'Slug de la ressource PDF requis' });
    }

    if (!pdfUrl) {
      return res.status(400).json({ error: 'URL du PDF requise' });
    }

    // Vérifier que le slug est unique
    const existingRessourcePdf = await RessourcePdf.findOne({ slug: slug.toLowerCase() });
    if (existingRessourcePdf) {
      return res.status(400).json({ error: 'Ce slug est déjà utilisé' });
    }

    const ressourcePdf = new RessourcePdf({
      title: title.trim(),
      description: description?.trim() || '',
      coverImage: coverImage?.trim() || '/img/ressource-pdf-default.png',
      pdfUrl: pdfUrl.trim(),
      slug: slug.toLowerCase().trim(),
      category: category?.trim() || 'Général',
      author: author?.trim() || 'Ecom Starter',
      pages: pages || 0,
      price: price || 0,
      isFree: isFree !== undefined ? isFree : (price === 0 || !price),
      isPublished: isPublished !== undefined ? isPublished : false
    });

    await ressourcePdf.save();

    res.json({
      success: true,
      message: 'Ressource PDF créée avec succès',
      ressourcePdf
    });
  } catch (error) {
    console.error('Erreur création ressource PDF:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la ressource PDF', details: error.message });
  }
});

// PUT /api/admin/ressources-pdf/:id - Mettre à jour une ressource PDF
router.put('/ressources-pdf/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const ressourcePdf = await RessourcePdf.findById(id);
    if (!ressourcePdf) {
      return res.status(404).json({ error: 'Ressource PDF non trouvée' });
    }

    // Mettre à jour les champs fournis
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'slug') {
          ressourcePdf[key] = updateData[key].toLowerCase().trim();
        } else if (key === 'title' || key === 'description' || key === 'category' || key === 'author') {
          ressourcePdf[key] = updateData[key].trim();
        } else {
          ressourcePdf[key] = updateData[key];
        }
      }
    });

    await ressourcePdf.save();

    res.json({
      success: true,
      message: 'Ressource PDF mise à jour avec succès',
      ressourcePdf
    });
  } catch (error) {
    console.error('Erreur mise à jour ressource PDF:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la ressource PDF', details: error.message });
  }
});

// DELETE /api/admin/ressources-pdf/:id - Supprimer une ressource PDF
router.delete('/ressources-pdf/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const ressourcePdf = await RessourcePdf.findByIdAndDelete(id);
    if (!ressourcePdf) {
      return res.status(404).json({ error: 'Ressource PDF non trouvée' });
    }

    res.json({
      success: true,
      message: 'Ressource PDF supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression ressource PDF:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la ressource PDF' });
  }
});

export default router;

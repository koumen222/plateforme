// Gestion des erreurs non capturées (doit être en premier)
process.on("uncaughtException", err => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
  console.error("Stack:", err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED PROMISE REJECTION:", reason);
  console.error("Promise:", promise);
  if (reason && reason.stack) {
    console.error("Stack:", reason.stack);
  }
});

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/database.js";
import { configurePassport } from "./config/passport.js";
import { configureWebPush } from "./config/push.js";
import { authenticate, checkAccountStatus } from "./middleware/auth.js";
import { referralCapture } from "./middleware/referralCapture.js";
import User from "./models/User.js";
import jwt from "jsonwebtoken";
import { buildAccessFlags, ensureReferralCodeForUser, maybeValidateReferralForUser } from "./services/referralService.js";

// Charger les variables d'environnement depuis .env (doit être en premier)
dotenv.config();
// Variables pour les modules chargés dynamiquement (évite les crashes si fichiers absents)
let authRoutes = null;
let videoRoutes = null;
let adminRoutes = null;
let coursesRoutes = null;
let coachingRoutes = null;
let progressRoutes = null;
let commentsRoutes = null;
let paymentRoutes = null;
let successRadarRoutes = null;
let diagnosticRoutes = null;
let ressourcesPdfRoutes = null;
let filesRoutes = null;
let aiAnalyzerRoutes = null;
let metaRoutes = null;
let facebookAuthRoutes = null;
let recrutementRoutes = null;
let partenairesRoutes = null;
let referralsRoutes = null;
let pushRoutes = null;
let notificationsRoutes = null;
let coachingApplicationsRoutes = null;
let ebooksRoutes = null;
let paymentsRoutes = null;
let facebookTokens = new Map(); // Fallback en mémoire si Redis indisponible
let startSuccessRadarCron = null;
let runSuccessRadarOnce = null;
import Course from "./models/Course.js";
import Module from "./models/Module.js";
import Lesson from "./models/Lesson.js";
import RessourcePdf from "./models/RessourcePdf.js";
import Partenaire from "./models/Partenaire.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration des secrets et URLs
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SESSION_SECRET = process.env.SESSION_SECRET || JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.safitech.shop';

const app = express();

// Configuration CORS dynamique pour autoriser les sous-domaines safitech.shop
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (ex: Postman, curl)
    if (!origin) {
      console.log('✅ CORS: Requête sans origine autorisée');
      return callback(null, true);
    }
    
    // Liste des origines autorisées
    const allowedOrigins = [
      "https://safitech.shop",
      "https://www.safitech.shop",
      "https://api.safitech.shop",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000"
    ];
    
    // Normaliser l'origine (enlever le slash final si présent)
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    // Vérifier si l'origine exacte est dans la liste autorisée
    if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Origine autorisée: ${origin}`);
      callback(null, true);
      return;
    }
    
    // Vérifier si c'est un sous-domaine de safitech.shop
    if (normalizedOrigin.includes('safitech.shop') || origin.includes('safitech.shop')) {
      console.log(`✅ CORS: Sous-domaine safitech.shop autorisé: ${origin}`);
      callback(null, true);
      return;
    }
    
    // Si aucune correspondance, bloquer
    console.log(`❌ CORS bloqué pour l'origine: ${origin}`);
    console.log(`   Origines autorisées:`, allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS","PATCH"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With","X-Referral-Code"],
  exposedHeaders: ["Content-Type","Authorization"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Middleware pour logger les requêtes CORS (debug)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && req.method === 'OPTIONS') {
    console.log(`🔍 CORS Preflight: ${req.method} ${req.path} depuis ${origin}`);
  }
  next();
});

// Log de la configuration CORS au démarrage
console.log('🔒 Configuration CORS activée');
console.log('   - Origines autorisées: safitech.shop et sous-domaines');
console.log('   - Credentials: activé');

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Pour les requêtes POST avec application/x-www-form-urlencoded
app.use(cookieParser());
app.use(referralCapture);

// Corriger les fautes fréquentes dans les routes (fallback)
app.use((req, res, next) => {
  if (req.url.startsWith('/api/adminn/')) {
    req.url = req.url.replace('/api/adminn/', '/api/admin/');
  }
  if (req.url.startsWith('/api/coacching-reservations')) {
    req.url = req.url.replace('/api/coacching-reservations', '/api/coaching-reservations');
  }
  next();
});

// Servir les fichiers statiques (images uploadées et PDF)
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  dotfiles: 'ignore',
  etag: true,
  extensions: ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'svg'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: (res, filePath) => {
    // Définir les headers CORS pour les fichiers statiques
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    
    // Pour les fichiers PDF, optimiser les headers pour mobile
    if (filePath.endsWith('.pdf')) {
      const filename = path.basename(filePath);
      // Encoder le nom de fichier pour éviter les problèmes avec les caractères spéciaux
      const encodedFilename = encodeURIComponent(filename);
      res.set('Content-Type', 'application/pdf');
      // Utiliser à la fois filename et filename* pour meilleure compatibilité
      res.set('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
      res.set('Content-Transfer-Encoding', 'binary');
      res.set('Accept-Ranges', 'bytes');
      // Permettre le cache pour améliorer les performances
      res.set('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Middleware pour gérer les fichiers statiques non trouvés
app.use('/uploads', (req, res, next) => {
  // Si on arrive ici, c'est que express.static n'a pas trouvé le fichier
  // Vérifier si c'est vraiment une requête vers /uploads
  if (req.originalUrl.startsWith('/uploads/')) {
    console.log(`⚠️ Fichier statique non trouvé: ${req.originalUrl}`);
    console.log(`   - Chemin uploads configuré: ${uploadsPath}`);
    res.status(404).json({
      error: 'Fichier non trouvé',
      path: req.originalUrl,
      uploadsPath: uploadsPath
    });
    return;
  }
  next();
});

console.log('📁 Dossier uploads configuré: /uploads');
console.log('📁 Chemin absolu uploads:', uploadsPath);
console.log('📁 Dossier uploads/pdf configuré: /uploads/pdf');

// Configuration pour Render (trust proxy - OBLIGATOIRE et doit être AVANT session)
app.set("trust proxy", 1);
console.log('🔒 Trust proxy activé (nécessaire pour Render)');

// Configuration de la session pour Passport (OBLIGATOIRE pour Render)
app.use(session({
  name: "safitech.sid", // Nom du cookie de session
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS uniquement (OBLIGATOIRE pour Render)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    sameSite: "none" // OBLIGATOIRE pour OAuth cross-domain sur Render
  }
}));

// Initialiser Passport
app.use(passport.initialize());
app.use(passport.session());

// Configurer la stratégie Google OAuth (définie dans config/passport.js)
configurePassport();

// Log de confirmation des routes OAuth
console.log('🔐 Routes OAuth Google configurées:');
console.log('   - GET /auth/google');
console.log('   - GET /auth/google/callback');

// Middleware de logging pour debug (exclure les health checks pour réduire le bruit)
app.use((req, res, next) => {
  // Ne pas logger les health checks
  if (req.originalUrl !== '/health' && req.originalUrl !== '/') {
    console.log(`📥 ${req.method} ${req.originalUrl}`, req.body ? 'avec body' : 'sans body');
  }
  next();
});

// Middleware pour rediriger dashboard.html vers safitech.shop
app.use((req, res, next) => {
  if (req.originalUrl.includes("dashboard.html")) {
    return res.redirect("https://www.safitech.shop/");
  }
  next();
});

// Routes
// Route racine pour vérifier que le service est en ligne (nécessaire pour Render)
app.get("/", (req, res) => {
  res.send('Plateforme UNEV API - serveur opérationnel 🚀')
});

// Route HEAD pour la racine (nécessaire pour les health checks Render)
app.head("/", (req, res) => {
  res.status(200).end();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


// ============================================
// Routes Google OAuth - DÉSACTIVÉES
// ============================================
// Les routes OAuth Google ont été désactivées
// L'authentification se fait maintenant uniquement via email/password

// app.get("/auth/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// app.get("/auth/google/callback",
//   passport.authenticate("google", {
//     failureRedirect: `${FRONTEND_URL}/login`
//   }),
//   async (req, res) => {
//     // ... code désactivé
//   }
// );

// Routes de diagnostic - seront montées dans startServer après chargement dynamique
// Placeholder pour éviter les erreurs
app.get("/api/diagnostic/*", async (req, res) => {
  if (!diagnosticRoutes) {
    return res.status(503).json({ 
      success: false, 
      error: 'Module diagnostic non disponible' 
    });
  }
});

// Route de test pour vérifier que le serveur répond
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API backend fonctionne", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Route GET /api/valentine-winners - PRIORITAIRE (avant toutes les autres routes)
// Cette route est définie ici pour garantir qu'elle soit toujours disponible
app.get("/api/valentine-winners", authenticate, async (req, res) => {
  console.log('💝 Route /api/valentine-winners appelée (route principale)');
  console.log('💝 User:', req.user ? { id: req.user._id, status: req.user.status } : 'non authentifié');
  console.log('💝 Query params:', req.query);

  const blurProduct = (product) => {
    const maskedName = product.name ? `${product.name.substring(0, 10)}...` : 'Produit réservé';
    return {
      name: maskedName,
      category: product.category || 'Catégorie réservée',
      priceRange: 'Disponible pour comptes actifs',
      countries: Array.isArray(product.countries) ? product.countries.slice(0, 1) : [],
      saturation: null,
      demandScore: null,
      trendScore: null,
      status: 'warm',
      lastUpdated: product.lastUpdated
    };
  };

  try {
    const WinningProduct = (await import("./models/WinningProduct.js")).default;

    let valentineProducts = await WinningProduct.find({ specialEvent: 'saint-valentin' })
      .sort({ lastUpdated: -1, createdAt: -1 })
      .limit(50)
      .lean();

    const now = new Date();
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    let shouldRefresh = false;
    let cacheMessage = null;

    if (!valentineProducts.length) {
      console.log('💝 Aucun produit St Valentin en base, génération immédiate...');
      shouldRefresh = true;
    } else {
      const mostRecentValentine = valentineProducts[0];
      if (mostRecentValentine.lastUpdated) {
        const lastUpdate = new Date(mostRecentValentine.lastUpdated);
        const timeSinceUpdate = now - lastUpdate;

        if (timeSinceUpdate >= twentyFourHoursInMs) {
          console.log(`💝 Produits St Valentin obsolètes (${Math.round(timeSinceUpdate / (60 * 60 * 1000))}h), génération...`);
          shouldRefresh = true;
        } else {
          const remainingHours = Math.round((twentyFourHoursInMs - timeSinceUpdate) / (60 * 60 * 1000));
          console.log(`💝 Produits St Valentin en cache (actualisation dans ${remainingHours}h)`);
          cacheMessage = `Produits St Valentin chargés depuis le cache. Prochaine actualisation dans ${remainingHours}h`;
        }
      } else {
        shouldRefresh = true;
      }
    }

    if (shouldRefresh) {
      try {
        const successRadarCron = await import("./services/successRadarCron.js");
        console.log('💝 Génération de nouveaux produits St Valentin via OpenAI...');
        await successRadarCron.refreshValentineProducts();
        valentineProducts = await WinningProduct.find({ specialEvent: 'saint-valentin' })
          .sort({ lastUpdated: -1, createdAt: -1 })
          .limit(50)
          .lean();
        console.log(`💝 ${valentineProducts.length} produits St Valentin générés et enregistrés`);
      } catch (err) {
        console.error('❌ Erreur génération produits St Valentin:', err.message);
        valentineProducts = await WinningProduct.find({ specialEvent: 'saint-valentin' })
          .sort({ lastUpdated: -1, createdAt: -1 })
          .limit(50)
          .lean();

        if (!valentineProducts.length) {
          return res.json({
            products: [],
            message: 'Aucun produit St Valentin disponible. Génération en cours...',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }
      }
    } else {
      console.log(`💝 Retour des ${valentineProducts.length} produits St Valentin depuis le cache`);
    }

    if (!valentineProducts.length) {
      return res.json({ products: [], message: 'Aucun produit St Valentin disponible pour le moment' });
    }

    if (req.user?.status === 'blocked') {
      return res.status(403).json({ error: 'Accès refusé. Compte bloqué.' });
    }

    if (req.user?.status === 'active') {
      return res.json({
        products: valentineProducts,
        message: cacheMessage || null,
        fromCache: !shouldRefresh
      });
    }

    const blurred = valentineProducts.map(blurProduct);
    return res.json({
      products: blurred,
      message: 'Active ton compte pour débloquer les données complètes',
      fromCache: !shouldRefresh
    });
  } catch (error) {
    console.error('❌ Erreur route /api/valentine-winners:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      error: 'Impossible de récupérer les produits St Valentin',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route de test pour vérifier que les routes sont bien chargées
app.get("/api/test-routes", (req, res) => {
  const allRoutes = [];
  
  // Collecter toutes les routes enregistrées
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase());
      allRoutes.push(`${methods.join(',')} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // Routes dans un router
      middleware.handle.stack?.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase());
          allRoutes.push(`${methods.join(',')} ${handler.regexp.source}`);
        }
      });
    }
  });
  
  res.json({
    success: true,
    message: 'Routes disponibles',
    routes: allRoutes,
    valentineRouteExists: allRoutes.some(r => r.includes('valentine-winners'))
  });
});

// Route GET /api/auth/me - Récupérer l'utilisateur depuis le cookie
app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    try {
      await ensureReferralCodeForUser(req.user._id);
      await maybeValidateReferralForUser(req.user._id);
    } catch (referralError) {
      console.warn('⚠️ Parrainage ignoré (auth/me):', referralError.message);
    }

    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const accessFlags = buildAccessFlags(user);
    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        status: user.status,
        accountStatus: user.accountStatus,
        emailVerified: user.emailVerified,
        role: user.role,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
        referralCode: user.referralCode || null,
        referralAccessUnlocked: Boolean(user.referralAccessUnlocked),
        accessGranted: accessFlags.hasAccess
      }
    });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données utilisateur' });
  }
});

// Routes seront montées dans startServer après chargement dynamique
// Placeholders pour éviter les erreurs si routes non chargées

// Routes ressources PDF (publiques) - seront montées dans startServer après chargement dynamique
// Placeholder supprimé - les routes seront chargées dans startServer()

// Routes seront montées dans startServer après chargement dynamique

// Route de test pour vérifier les routes Success Radar (sera montée après chargement dynamique)
app.get("/api/test-success-radar-routes", (req, res) => {
  if (!successRadarRoutes) {
    return res.status(503).json({ 
      success: false,
      message: 'Module successRadar non chargé' 
    });
  }
  
  const routes = successRadarRoutes.stack
    .filter(r => r.route)
    .map(r => ({
      method: Object.keys(r.route.methods)[0].toUpperCase(),
      path: r.route.path
    }));
  
  res.json({ 
    success: true,
    message: 'Routes Success Radar disponibles',
    routes: routes,
    valentineExists: routes.some(r => r.path === '/valentine-winners'),
    totalRoutes: routes.length
  });
});

// Note: La route /api/valentine-winners est définie plus haut (ligne ~183) pour garantir sa priorité
// Toutes les autres routes seront montées dans startServer après chargement dynamique

// Routes OAuth Facebook sont maintenant gérées par routes/facebookAuth.js
// Elles sont montées dans startServer() après le chargement dynamique

const CHAT_CONTEXT_TTL_MS = 5 * 60 * 1000;
const chatContextCache = {
  value: null,
  updatedAt: 0
};

const clampText = (value, maxChars = 600) => {
  if (!value) return '';
  const text = value.toString();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}…`;
};

const formatList = (items) => {
  if (!Array.isArray(items) || !items.length) return '';
  return items.map((item) => clampText(item, 200)).filter(Boolean).join(' | ');
};

const formatResource = (resource) => {
  if (!resource || typeof resource !== 'object') return '';
  const title = resource.title || 'Ressource';
  const type = resource.type ? ` (${resource.type})` : '';
  const download = resource.download ? ' - telechargement' : '';
  const link = resource.link ? ` - lien: ${resource.link}` : '';
  return `${title}${type}${download}${link}`.trim();
};

const buildPlatformContext = async () => {
  const courses = await Course.find({ isPublished: true }).sort({ createdAt: -1 }).lean();
  const courseIds = courses.map((course) => course._id);
  const modules = courseIds.length
    ? await Module.find({ courseId: { $in: courseIds } }).sort({ order: 1 }).lean()
    : [];
  const moduleIds = modules.map((module) => module._id);
  const lessons = moduleIds.length
    ? await Lesson.find({ moduleId: { $in: moduleIds } }).sort({ order: 1 }).lean()
    : [];
  const ressourcesPdf = await RessourcePdf.find({ isPublished: true }).sort({ createdAt: -1 }).lean();
  const partenaires = await Partenaire.find({
    statut: 'approuve',
    autorisation_affichage: true
  }).sort({ approved_at: -1, created_at: -1 }).lean();

  const modulesByCourse = new Map();
  modules.forEach((module) => {
    const key = module.courseId?.toString();
    if (!key) return;
    if (!modulesByCourse.has(key)) modulesByCourse.set(key, []);
    modulesByCourse.get(key).push(module);
  });

  const lessonsByModule = new Map();
  lessons.forEach((lesson) => {
    const key = lesson.moduleId?.toString();
    if (!key) return;
    if (!lessonsByModule.has(key)) lessonsByModule.set(key, []);
    lessonsByModule.get(key).push(lesson);
  });

  const lines = [];
  lines.push('CONTENU DE LA PLATEFORME (donnees internes)');
  lines.push('');
  lines.push('COURS ET FORMATIONS:');

  if (!courses.length) {
    lines.push('- Aucun cours publie pour le moment.');
  } else {
    courses.forEach((course) => {
      lines.push(`- Cours: ${course.title} (${course.slug})`);
      if (course.description) {
        lines.push(`  Description: ${clampText(course.description, 400)}`);
      }
      lines.push(`  Acces: ${course.isFree ? 'gratuit' : 'abonne/actif'}`);

      const courseModules = modulesByCourse.get(course._id.toString()) || [];
      if (!courseModules.length) {
        lines.push('  Modules: aucun module.');
        return;
      }

      courseModules.forEach((module) => {
        lines.push(`  Module ${module.order}: ${module.title}`);
        const moduleLessons = lessonsByModule.get(module._id.toString()) || [];

        if (!moduleLessons.length) {
          lines.push('    Lecons: aucune lecon.');
          return;
        }

        moduleLessons.forEach((lesson) => {
          lines.push(`    Lecon ${lesson.order}: ${lesson.title}`);
          if (lesson.summary?.text) {
            lines.push(`      Resume: ${clampText(lesson.summary.text, 500)}`);
          }
          if (Array.isArray(lesson.summary?.points) && lesson.summary.points.length) {
            lines.push(`      Points: ${formatList(lesson.summary.points)}`);
          }
          if (Array.isArray(lesson.resources) && lesson.resources.length) {
            const resources = lesson.resources
              .map(formatResource)
              .filter(Boolean)
              .join(' | ');
            if (resources) {
              lines.push(`      Ressources: ${resources}`);
            }
          }
        });
      });
    });
  }

  lines.push('');
  lines.push('RESSOURCES PDF PUBLIQUES:');
  if (!ressourcesPdf.length) {
    lines.push('- Aucune ressource PDF publiee.');
  } else {
    ressourcesPdf.forEach((pdf) => {
      const priceLabel = pdf.isFree ? 'gratuit' : `payant (${pdf.price || 0})`;
      lines.push(`- ${pdf.title} (${pdf.category || 'General'}) - ${priceLabel}`);
      if (pdf.description) {
        lines.push(`  Description: ${clampText(pdf.description, 300)}`);
      }
      lines.push(`  Auteur: ${pdf.author || 'Ecom Starter'} | Pages: ${pdf.pages || 0} | Slug: ${pdf.slug}`);
    });
  }

  lines.push('');
  lines.push('PARTENAIRES (annuaire public):');
  if (!partenaires.length) {
    lines.push('- Aucun partenaire publie.');
  } else {
    partenaires.forEach((partenaire) => {
      const domaines = Array.isArray(partenaire.domaines_activite) && partenaire.domaines_activite.length
        ? partenaire.domaines_activite.join(', ')
        : partenaire.domaine || 'autre';
      lines.push(`- ${partenaire.nom} (${partenaire.type_partenaire || 'autre'})`);
      lines.push(`  Domaine(s): ${domaines}`);
      lines.push(`  Localisation: ${partenaire.ville || 'N/A'}, ${partenaire.pays || 'N/A'}`);
      if (partenaire.description_courte) {
        lines.push(`  Description: ${clampText(partenaire.description_courte, 240)}`);
      }
      lines.push(`  Disponibilite: ${partenaire.disponibilite || 'disponible'}`);
      if (partenaire.telephone || partenaire.whatsapp || partenaire.email || partenaire.lien_contact) {
        lines.push(
          `  Contact: ${[
            partenaire.telephone ? `tel: ${partenaire.telephone}` : null,
            partenaire.whatsapp ? `whatsapp: ${partenaire.whatsapp}` : null,
            partenaire.email ? `email: ${partenaire.email}` : null,
            partenaire.lien_contact ? `lien: ${partenaire.lien_contact}` : null
          ].filter(Boolean).join(' | ')}`
        );
      }
    });
  }

  return lines.join('\n');
};

const getChatContext = async () => {
  const now = Date.now();
  if (chatContextCache.value && now - chatContextCache.updatedAt < CHAT_CONTEXT_TTL_MS) {
    return chatContextCache.value;
  }
  const context = await buildPlatformContext();
  chatContextCache.value = context;
  chatContextCache.updatedAt = now;
  return context;
};

const buildSystemPrompt = (contextText) => {
  const trimmedContext = clampText(contextText, 12000);
  return `Tu es le chatbot IA officiel de la plateforme. Tu reponds en francais et tu utilises prioritairement le contenu ci-dessous.

Regles:
- Sois clair et structure.
- Si l'information n'est pas dans le contexte, reponds quand meme avec une aide generale utile sans inventer de faits specifiques sur la plateforme.
- Ne promets pas d'acces ou de contenu qui n'est pas cite.

CONTEXTE:
${trimmedContext}`;
};

// Route chatbot (protégée - nécessite statut active)
app.post("/api/chat", authenticate, async (req, res) => {
  const { message, conversationHistory } = req.body;

  try {
    // Le frontend gère les restrictions selon user.status
    // Ne jamais bloquer ici selon le status

    if (!message) {
      return res.status(400).json({ error: 'Le message est requis' });
    }

    const platformContext = await getChatContext();
    const systemPrompt = buildSystemPrompt(platformContext);

    // Préparer les messages pour OpenAI
    let messages = [];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      const normalizedHistory = conversationHistory
        .filter((msg) => msg && msg.content)
        .map((msg) => {
          const role = msg.role === 'bot' ? 'assistant' : msg.role;
          return { role, content: msg.content };
        })
        .filter((msg) => msg.role !== 'system')
        .filter((msg) => ['user', 'assistant'].includes(msg.role));

      const lastMessage = normalizedHistory[normalizedHistory.length - 1];
      if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== message) {
        normalizedHistory.push({ role: 'user', content: message });
      }

      messages = [{ role: 'system', content: systemPrompt }, ...normalizedHistory];
    } else {
      // Si pas d'historique, créer un message simple
      messages = [
        { role: 'system', content: systemPrompt },
        { role: "user", content: message }
      ];
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur OpenAI API:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Erreur lors de la communication avec OpenAI' 
      });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Format de réponse OpenAI inattendu:', data);
      return res.status(500).json({ error: 'Format de réponse OpenAI inattendu' });
    }

    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error('Erreur chatbot:', err);
    res.status(500).json({ 
      error: err.message || "Erreur lors du traitement de votre message" 
    });
  }
});

const PORT = process.env.PORT || 3000;

// Démarrer le serveur après la connexion MongoDB
const startServer = async () => {
  try {
    // Charger TOUS les modules dynamiquement pour éviter les crashes si fichiers absents
    console.log('📦 Chargement dynamique de tous les modules...');
    
    // 0. Routes Facebook Auth OAuth (doivent être montées EN PREMIER pour capturer /auth/*)
    try {
      const facebookAuthModule = await import("./routes/facebookAuth.js");
      facebookAuthRoutes = facebookAuthModule.default;
      if (!facebookAuthRoutes) {
        throw new Error('Router facebookAuth est null ou undefined');
      }
      app.use("/", facebookAuthRoutes);
      console.log('✅ Routes Facebook Auth chargées (priorité)');
      console.log('   Route OAuth: GET /auth/facebook');
      console.log('   Route Callback: GET /auth/facebook/callback');
    } catch (error) {
      console.error('⚠️ Erreur chargement facebookAuth.js:', error.message);
      console.error('   Stack:', error.stack);
    }
    
    // 1. Routes d'authentification
    try {
      const authModule = await import("./routes/auth.js");
      authRoutes = authModule.default;
      app.use("/api", authRoutes);
      console.log('✅ Routes d\'authentification chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement auth.js:', error.message);
    }

    // 1bis. Routes parrainage (optionnelles)
    try {
      const referralsModule = await import("./routes/referrals.js");
      referralsRoutes = referralsModule.default;
      app.use("/api", referralsRoutes);
      console.log('✅ Routes parrainage chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement referrals.js:', error.message);
    }
    
    // 2. Routes vidéos
    try {
      const videoModule = await import("./routes/videos.js");
      videoRoutes = videoModule.default;
      app.use("/api", videoRoutes);
      console.log('✅ Routes vidéos chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement videos.js:', error.message);
    }
    
    // 3. Routes cours
    try {
      const coursesModule = await import("./routes/courses.js");
      coursesRoutes = coursesModule.default;
      app.use("/api/courses", coursesRoutes);
      console.log('✅ Routes cours chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement courses.js:', error.message);
    }

    // 3bis. Routes réservations coaching
    try {
      const coachingModule = await import("./routes/coaching-reservations.js");
      coachingRoutes = coachingModule.default;
      app.use("/api/coaching-reservations", coachingRoutes);
      console.log('✅ Routes coaching réservations chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement coaching-reservations.js:', error.message);
    }
    
    // 3bis2. Routes candidatures coaching 7 jours
    try {
      const coachingApplicationsModule = await import("./routes/coaching-applications.js");
      coachingApplicationsRoutes = coachingApplicationsModule.default;
      app.use("/api/coaching-applications", coachingApplicationsRoutes);
      console.log('✅ Routes candidatures coaching chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement coaching-applications.js:', error.message);
    }
    
    // 3ter. Routes recrutement (annuaire interne)
    try {
      const recrutementModule = await import("./routes/recrutement.js");
      recrutementRoutes = recrutementModule.default;
      app.use("/api/recrutement", recrutementRoutes);
      console.log('✅ Routes recrutement chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement recrutement.js:', error.message);
    }
    
    // 3quater. Routes partenaires (public)
    try {
      const partenairesModule = await import("./routes/partenaires.js");
      partenairesRoutes = partenairesModule.default;
      app.use("/api/partenaires", partenairesRoutes);
      console.log('✅ Routes partenaires chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement partenaires.js:', error.message);
    }
    
    // 4. Routes ressources PDF
    try {
      const ressourcesPdfModule = await import("./routes/ressources-pdf.js");
      ressourcesPdfRoutes = ressourcesPdfModule.default;
      app.use("/api/ressources-pdf", ressourcesPdfRoutes);
      console.log('✅ Routes ressources PDF chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement ressources-pdf.js:', error.message);
      app.get("/api/ressources-pdf", (req, res) => {
        res.status(503).json({ success: false, error: 'Module ressources-pdf non disponible' });
      });
    }
    
    // 5. Routes progression
    try {
      const progressModule = await import("./routes/progress.js");
      progressRoutes = progressModule.default;
      app.use("/api/progress", progressRoutes);
      console.log('✅ Routes progression chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement progress.js:', error.message);
    }
    
    // 6. Routes commentaires
    try {
      const commentsModule = await import("./routes/comments.js");
      commentsRoutes = commentsModule.default;
      app.use("/api/comments", commentsRoutes);
      console.log('✅ Routes commentaires chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement comments.js:', error.message);
    }
    
    // 7. Routes Success Radar
    try {
      const successRadarModule = await import("./routes/successRadar.js");
      successRadarRoutes = successRadarModule.default;
      app.use("/api", successRadarRoutes);
      console.log('✅ Routes Success Radar chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement successRadar.js:', error.message);
    }
    
    // 8. Routes admin
    try {
      const adminModule = await import("./routes/admin.js");
      adminRoutes = adminModule.default;
      app.use("/api/admin", adminRoutes);
      console.log('✅ Routes admin chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement admin.js:', error.message);
    }
    
    // 9. Routes paiement
    try {
      const paymentModule = await import("./routes/payment.js");
      paymentRoutes = paymentModule.default;
      app.use("/api/payment", paymentRoutes);
      console.log('✅ Routes paiement chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement payment.js:', error.message);
    }
    
    // 10. Routes diagnostic
    try {
      const diagnosticModule = await import("./routes/diagnostic.js");
      diagnosticRoutes = diagnosticModule.default;
      app.use("/api/diagnostic", diagnosticRoutes);
      console.log('✅ Routes diagnostic chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement diagnostic.js:', error.message);
    }
    
    // 11. Routes fichiers (File Manager)
    try {
      const filesModule = await import("./routes/files.js");
      filesRoutes = filesModule.default;
      app.use("/api/files", filesRoutes);
      console.log('✅ Routes fichiers chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement files.js:', error.message);
      app.get("/api/files", (req, res) => {
        res.status(503).json({ success: false, error: 'Module files non disponible' });
      });
    }
    
    // 12. Routes AI Analyzer
    try {
      const aiAnalyzerModule = await import("./routes/ai-analyzer.js");
      aiAnalyzerRoutes = aiAnalyzerModule.default;
      if (!aiAnalyzerRoutes) {
        throw new Error('Router ai-analyzer est null ou undefined');
      }
      app.use("/api/ai-analyzer", aiAnalyzerRoutes);
      console.log('✅ Routes AI Analyzer chargées');
      console.log('   Route analyze disponible: POST /api/ai-analyzer/analyze');
    } catch (error) {
      console.error('⚠️ Erreur chargement ai-analyzer.js:', error.message);
      console.error('   Stack:', error.stack);
      app.post("/api/ai-analyzer/analyze", (req, res) => {
        res.status(503).json({ success: false, error: 'Module ai-analyzer non disponible', details: error.message });
      });
    }

    // 13. Routes Meta (Facebook Ads)
    try {
      const metaModule = await import("./routes/meta.js");
      metaRoutes = metaModule.default;
      if (!metaRoutes) {
        throw new Error('Router meta est null ou undefined');
      }
      // Partager le Map facebookTokens avec le module meta (fallback)
      if (metaModule.setFacebookTokens) {
        metaModule.setFacebookTokens(facebookTokens);
      }
      app.use("/api/meta", metaRoutes);
      console.log('✅ Routes Meta chargées');
      console.log('   Route status: GET /api/meta/status');
      console.log('   Route businesses: GET /api/meta/businesses');
      console.log('   Route adaccounts: GET /api/meta/adaccounts');
      console.log('   Route campaigns: GET /api/meta/campaigns');
      console.log('   Route select: POST /api/meta/select');
    } catch (error) {
      console.error('⚠️ Erreur chargement meta.js:', error.message);
      console.error('   Stack:', error.stack);
    }
    
    // 15. Services Success Radar Cron
    try {
      const successRadarCronModule = await import("./services/successRadarCron.js");
      startSuccessRadarCron = successRadarCronModule.startSuccessRadarCron;
      runSuccessRadarOnce = successRadarCronModule.runSuccessRadarOnce;
      console.log('✅ Services Success Radar Cron chargés');
    } catch (error) {
      console.error('⚠️ Erreur chargement successRadarCron.js:', error.message);
    }
    
    // 16. Routes Web Push (notifications push natives)
    try {
      const pushModule = await import("./routes/push.js");
      pushRoutes = pushModule.default;
      app.use("/api/push", pushRoutes);
      console.log('✅ Routes Web Push chargées');
      console.log('   Route public-key: GET /api/push/public-key');
    } catch (error) {
      console.error('⚠️ Erreur chargement push.js:', error.message);
      console.error('   Stack:', error.stack);
    }
    
    // Routes notifications internes
    try {
      const notificationsModule = await import("./routes/notifications.js");
      notificationsRoutes = notificationsModule.default;
      app.use("/api/notifications", notificationsRoutes);
      console.log('✅ Routes notifications internes chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement notifications.js:', error.message);
    }

    // Routes ebooks
    try {
      const ebooksModule = await import("./routes/ebooks.js");
      ebooksRoutes = ebooksModule.default;
      app.use("/api/ebooks", ebooksRoutes);
      console.log('✅ Routes ebooks chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement ebooks.js:', error.message);
    }

    // Routes paiements Monetbil
    try {
      const paymentsModule = await import("./routes/payments.js");
      paymentsRoutes = paymentsModule.default;
      app.use("/api/payments", paymentsRoutes);
      console.log('✅ Routes paiements Monetbil chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement payments.js:', error.message);
    }

    // Routes Marketing Automation (Newsletters, Campagnes Email)
    try {
      const subscribersModule = await import("./routes/subscribers.js");
      if (subscribersModule && subscribersModule.default) {
        app.use("/api/subscribers", subscribersModule.default);
        console.log('✅ Routes subscribers chargées');
      } else {
        console.error('❌ subscribersModule.default est null ou undefined');
      }
      
      const emailCampaignsModule = await import("./routes/email-campaigns.js");
      if (emailCampaignsModule && emailCampaignsModule.default) {
        app.use("/api/email-campaigns", emailCampaignsModule.default);
        console.log('✅ Routes email-campaigns chargées');
        console.log('   POST /api/email-campaigns - Créer une campagne');
        console.log('   GET  /api/email-campaigns - Lister les campagnes');
        console.log('   POST /api/email-campaigns/:id/send - Envoyer une campagne');
      } else {
        console.error('❌ emailCampaignsModule.default est null ou undefined');
        console.error('   Module:', emailCampaignsModule);
      }
      
      const emailTemplatesModule = await import("./routes/email-templates.js");
      if (emailTemplatesModule && emailTemplatesModule.default) {
        app.use("/api/email-templates", emailTemplatesModule.default);
        console.log('✅ Routes email-templates chargées');
      } else {
        console.error('❌ emailTemplatesModule.default est null ou undefined');
      }
      
      const emailTrackingModule = await import("./routes/email-tracking.js");
      if (emailTrackingModule && emailTrackingModule.default) {
        app.use("/api/email", emailTrackingModule.default);
        console.log('✅ Routes email-tracking chargées');
      } else {
        console.error('❌ emailTrackingModule.default est null ou undefined');
      }
      
      const whatsappCampaignsModule = await import("./routes/whatsapp-campaigns.js");
      if (whatsappCampaignsModule && whatsappCampaignsModule.default) {
        app.use("/api/whatsapp-campaigns", whatsappCampaignsModule.default);
        console.log('✅ Routes WhatsApp campaigns chargées');
        console.log('   POST /api/whatsapp-campaigns - Créer une campagne');
        console.log('   GET  /api/whatsapp-campaigns - Lister les campagnes');
        console.log('   POST /api/whatsapp-campaigns/:id/send - Envoyer une campagne');
      } else {
        console.error('❌ whatsappCampaignsModule.default est null ou undefined');
      }
    } catch (error) {
      console.error('⚠️ Erreur chargement routes marketing:', error.message);
      console.error('   Stack:', error.stack);
    }
    
    console.log('📦 Chargement dynamique terminé\n');
    
    // Connexion MongoDB
    await connectDB();
    
    // Configuration Web Push (notifications push natives)
    try {
      await configureWebPush();
    } catch (error) {
      console.warn('⚠️ Web Push non configuré:', error.message);
      console.warn('   Les notifications push ne seront pas disponibles');
    }

    // Configuration Email Service (Marketing Automation)
    try {
      const { initEmailService } = await import("./services/emailService.js");
      initEmailService();
    } catch (error) {
      console.warn('⚠️ Service email non configuré:', error.message);
      console.warn('   Les campagnes email ne seront pas disponibles');
    }
    
    // Configuration WhatsApp Service
    try {
      const { initWhatsAppService } = await import("./services/whatsappService.js");
      await initWhatsAppService();
    } catch (error) {
      console.warn('⚠️ Service WhatsApp non configuré:', error.message);
      console.warn('   Les campagnes WhatsApp ne seront pas disponibles');
    }

    // Planification des campagnes email avec node-cron
    try {
      const cron = (await import('node-cron')).default;
      const EmailCampaign = (await import("./models/EmailCampaign.js")).default;
      const { sendBulkEmails } = await import("./services/emailService.js");
      const Subscriber = (await import("./models/Subscriber.js")).default;

      // Vérifier toutes les minutes les campagnes programmées
      cron.schedule('* * * * *', async () => {
        try {
          const now = new Date();
          const campaigns = await EmailCampaign.find({
            status: 'scheduled',
            scheduledAt: { $lte: now }
          });

          for (const campaign of campaigns) {
            console.log(`📧 Envoi campagne programmée: ${campaign.name}`);
            
            campaign.status = 'sending';
            await campaign.save();

            let subscribers = [];
            if (campaign.recipients.type === 'all') {
              subscribers = await Subscriber.find({ status: 'active' }).lean();
            } else if (campaign.recipients.type === 'segment') {
              // Si c'est un tag de statut utilisateur (pending, active, blocked)
              if (['pending', 'active', 'blocked'].includes(campaign.recipients.segment)) {
                const User = (await import("./models/User.js")).default;
                const SubscriberModel = (await import("./models/Subscriber.js")).default;
                
                // Récupérer TOUS les utilisateurs avec le statut sélectionné
                const users = await User.find({ 
                  email: { $exists: true, $ne: '' },
                  $or: [
                    { status: campaign.recipients.segment },
                    { accountStatus: campaign.recipients.segment }
                  ]
                }).select('email name status accountStatus').lean();
                
                // Pour chaque utilisateur, s'assurer qu'il existe dans Subscriber
                const subscriberPromises = users.map(async (user) => {
                  const emailLower = user.email.toLowerCase().trim();
                  
                  // Validation email
                  if (!emailLower || !/^\S+@\S+\.\S+$/.test(emailLower)) {
                    return null;
                  }
                  
                  try {
                    // Vérifier si l'utilisateur existe déjà dans Subscriber
                    let subscriber = await SubscriberModel.findOne({ email: emailLower }).lean();
                    
                    if (!subscriber) {
                      // Créer l'entrée Subscriber si elle n'existe pas
                      const newSubscriber = new SubscriberModel({
                        email: emailLower,
                        name: user.name || '',
                        source: 'sync',
                        status: 'active',
                        subscribedAt: new Date()
                      });
                      await newSubscriber.save();
                      subscriber = newSubscriber.toObject();
                    } else if (subscriber.status !== 'active') {
                      // Réactiver si nécessaire
                      await SubscriberModel.findByIdAndUpdate(subscriber._id, { status: 'active' });
                      subscriber.status = 'active';
                    }
                    
                    return {
                      ...subscriber,
                      email: emailLower,
                      name: subscriber.name || user.name || ''
                    };
                  } catch (error) {
                    console.error(`❌ Erreur traitement ${emailLower}:`, error.message);
                    return null;
                  }
                });
                
                const subscriberResults = await Promise.all(subscriberPromises);
                subscribers = subscriberResults.filter(s => s !== null);
              } else {
                subscribers = await Subscriber.find({ status: campaign.recipients.segment }).lean();
              }
            } else if (campaign.recipients.type === 'list' && campaign.recipients.customEmails?.length) {
              subscribers = campaign.recipients.customEmails.map(email => ({ email, _id: null }));
            }

            if (subscribers.length > 0) {
              const emails = subscribers.map(sub => ({
                to: sub.email,
                subject: campaign.subject,
                html: campaign.content.html,
                text: campaign.content.text,
                fromEmail: campaign.fromEmail,
                fromName: campaign.fromName,
                replyTo: campaign.replyTo,
                campaignId: campaign._id,
                subscriberId: sub._id
              }));

              const results = await sendBulkEmails(emails);
              const stats = {
                sent: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
              };

              campaign.status = 'sent';
              campaign.sentAt = new Date();
              campaign.stats.sent = stats.sent;
              await campaign.save();

              console.log(`✅ Campagne ${campaign.name} envoyée: ${stats.sent}/${subscribers.length}`);
            } else {
              campaign.status = 'draft';
              await campaign.save();
              console.warn(`⚠️ Aucun destinataire pour la campagne ${campaign.name}`);
            }
          }
        } catch (error) {
          console.error('❌ Erreur planification campagnes:', error);
        }
      });

      console.log('✅ Planificateur de campagnes email activé');
    } catch (error) {
      console.warn('⚠️ Planificateur de campagnes non configuré:', error.message);
    }
    
    // Plus de création automatique d'admin
    // L'admin doit créer son compte via /admin/login (première connexion uniquement)
    
    // S'assurer que Facebook Ads est "activé" (publié) par défaut
    let facebookAdsCourse = await Course.findOne({ slug: 'facebook-ads' });
    
    if (!facebookAdsCourse) {
      console.log('🚀 Initialisation automatique du cours Facebook Ads...');
      
      // Créer le cours Facebook Ads
      facebookAdsCourse = new Course({
        title: 'Facebook Ads',
        description: 'Apprendre à vendre avec Facebook Ads - Méthode Andromeda',
        coverImage: '/img/fbads.png',
        slug: 'facebook-ads',
        isDefault: true,
        isPublished: true
      });
      await facebookAdsCourse.save();
      console.log('✅ Cours Facebook Ads créé');

      // Créer le Module 1
      const module1 = new Module({
        courseId: facebookAdsCourse._id,
        title: 'Module 1 - Formation Andromeda',
        order: 1
      });
      await module1.save();
      console.log('✅ Module 1 créé');

      // Créer toutes les leçons
      const lessonsData = [
        {
          title: 'JOUR 1 - Introduction',
          videoId: '_FEzE2vdu_k',
          order: 1,
          summary: {
            text: `Bienvenue dans la formation Andromeda ! Cette méthode révolutionnaire vous permettra de créer des campagnes Facebook Ads performantes qui génèrent des ventes. Dans ce premier jour, vous découvrirez les fondamentaux de la méthode et comment structurer votre approche pour maximiser vos résultats.`,
            points: [
              'Découvrir la méthode Andromeda',
              'Comprendre la structure d\'une campagne performante',
              'Préparer votre stratégie de lancement',
              'Apprendre les bases du système de test',
              'Maîtriser l\'approche progressive de scaling'
            ]
          },
          resources: [
            {
              icon: '📄',
              title: 'Andromeda - Jour des créas',
              type: 'PDF',
              link: '/assets/docs/andromeda-jour-des-creas.pdf',
              download: true
            }
          ]
        },
        {
          title: 'JOUR 2 - La structure d\'une campagne qui nourrit Andromeda',
          videoId: '1151322854',
          order: 2,
          summary: {
            text: `Aujourd'hui, vous allez découvrir la structure complète d'une campagne Andromeda. Cette méthode révolutionnaire vous permettra de créer des campagnes qui génèrent des ventes de manière prévisible et scalable.`,
            points: [
              'Comprendre les principes fondamentaux de la méthode Andromeda',
              'Découvrir la structure d\'une campagne qui convertit',
              'Apprendre comment nourrir l\'algorithme Facebook efficacement',
              'Maîtriser les éléments clés d\'une campagne performante',
              'Préparer votre stratégie de test et d\'optimisation'
            ]
          },
          resources: [
            {
              icon: '🎓',
              title: 'Formation Comote Sora 2',
              type: 'Lien vers la formation',
              link: '#',
              download: false
            }
          ]
        },
        {
          title: 'JOUR 3 - Créer la créative Andromeda',
          videoId: 'gdG0xjuF7SQ',
          order: 3,
          summary: {
            text: `Aujourd'hui, vous allez créer la créative Andromeda, le cœur de votre campagne. Cette vidéo verticale doit captiver votre audience dès les premières secondes et suivre une structure précise pour maximiser les conversions.`,
            points: [
              '🎬 Vidéo verticale 9:16 – Durée : 20 à 30 secondes',
              '🎣 Hook fort dans les 2 premières secondes pour captiver immédiatement',
              '📐 Structure : Problème → Révélation → Preuve → Promesse → CTA',
              '✨ Optimiser chaque élément pour maximiser l\'engagement',
              '🎯 Créer une vidéo qui convertit efficacement'
            ]
          },
          resources: [
            {
              icon: '📄',
              title: 'Guide de création de campagne',
              type: 'PDF • 4.2 MB',
              link: '/assets/docs/guide-creation-campagne.pdf',
              download: true
            },
            {
              icon: '📝',
              title: 'Formules de copywriting',
              type: 'PDF • 1.8 MB',
              link: '/assets/docs/formules-copywriting.pdf',
              download: true
            }
          ]
        },
        {
          title: 'JOUR 4 - Paramétrer le compte publicitaire',
          videoId: '1151323764',
          order: 4,
          summary: {
            text: `Aujourd'hui, vous allez paramétrer correctement votre compte publicitaire Facebook. Cette configuration est essentielle pour que vos campagnes fonctionnent de manière optimale et que vous puissiez suivre précisément vos conversions.`,
            points: [
              '💰 Devise : HKD – Dollar Hong Kong',
              '💳 Ajouter la carte bancaire au compte',
              '💵 Créditer 25 $ (budget pour 5 jours à 5$/jour)',
              '📊 Installer le Pixel Meta sur votre site web',
              '🎯 Configurer l\'événement Purchase (achat) dans le Pixel',
              '✅ Vérifier que le tracking fonctionne correctement'
            ]
          },
          resources: [
            {
              icon: '📄',
              title: 'Dictionnaire des métriques',
              type: 'PDF • 2.8 MB',
              link: '/assets/docs/dictionnaire-metriques.pdf',
              download: true
            },
            {
              icon: '📊',
              title: 'Template de reporting',
              type: 'XLSX • 1.5 MB',
              link: '/assets/docs/template-reporting.xlsx',
              download: true
            }
          ]
        },
        {
          title: 'JOUR 5 - Lancement',
          videoId: '1151379720',
          order: 5,
          summary: {
            text: `Le moment est venu ! Aujourd'hui, vous allez lancer votre campagne Andromeda. Cette étape est simple mais cruciale : vous devez activer la campagne et laisser l'algorithme faire son travail sans intervention.`,
            points: [
              '🚀 Activer la campagne préparée hier',
              '⚠️ Ne rien modifier - Laisser l\'algorithme apprendre',
              '👀 Observer uniquement les ventes générées',
              '📊 Noter les premiers résultats sans intervenir',
              '⏳ Laisser tourner au moins 24h sans modification'
            ]
          },
          resources: [
            {
              icon: '📄',
              title: 'Guide de démarrage',
              type: 'PDF • 2.5 MB',
              link: '/assets/docs/guide-demarrage.pdf',
              download: true
            },
            {
              icon: '📊',
              title: 'Checklist de campagne',
              type: 'PDF • 1.2 MB',
              link: '/assets/docs/checklist-campagne.pdf',
              download: true
            }
          ]
        },
        {
          title: 'JOUR 6 - Analyse et optimisation',
          videoId: '148751763',
          order: 6,
          summary: {
            text: `Après 2 jours de lancement, il est temps d'analyser les premiers résultats. Cette phase d'apprentissage est cruciale : vous allez observer ce qui fonctionne et ce qui ne fonctionne pas, sans pour autant intervenir prématurément.`,
            points: [
              '⚠️ Ne couper aucune publicité à ce stade',
              '📝 Noter : Les adsets qui génèrent des achats',
              '📝 Noter : Les adsets complètement ignorés (0 engagement)',
              '📊 Analyser les métriques sans modifier',
              '⏳ Laisser l\'algorithme continuer son apprentissage',
              '📈 Observer les tendances émergentes'
            ]
          },
          resources: [
            {
              icon: '📄',
              title: 'Livre blanc stratégies avancées',
              type: 'PDF • 5.2 MB',
              link: '/assets/docs/livre-blanc-strategies.pdf',
              download: true
            },
            {
              icon: '📊',
              title: 'Exemples de funnel complets',
              type: 'PDF • 3.8 MB',
              link: '/assets/docs/exemples-funnel.pdf',
              download: true
            }
          ]
        },
        {
          title: 'JOUR 7 - Mini Scaling',
          videoId: '148751763',
          order: 7,
          summary: {
            text: `Après 3 jours d'observation, il est temps de faire votre première optimisation. Cette étape de mini scaling vous permettra d'éliminer les adsets morts et d'augmenter progressivement le budget de votre campagne performante.`,
            points: [
              '✂️ Couper uniquement les adsets totalement morts (0 engagement, 0 résultat)',
              '📈 Augmenter le budget de la campagne de +20 % maximum',
              '⚠️ Ne pas modifier les adsets qui génèrent des résultats',
              '💰 Maintenir un budget raisonnable pour continuer l\'apprentissage',
              '📊 Observer l\'impact de ces modifications sur les performances',
              '⏳ Laisser tourner 24h avant toute nouvelle modification'
            ]
          },
          resources: [
            {
              icon: '📄',
              title: 'Guide de scaling progressif',
              type: 'PDF • 2.8 MB',
              link: '/assets/docs/guide-scaling.pdf',
              download: true
            },
            {
              icon: '📊',
              title: 'Template d\'optimisation',
              type: 'XLSX • 1.2 MB',
              link: '/assets/docs/template-optimisation.xlsx',
              download: true
            }
          ]
        },
        {
          title: 'JOUR 8 - Réservation Coaching',
          videoId: '148751763',
          order: 8,
          isCoaching: true,
          summary: {
            text: `Félicitations ! Vous avez terminé la formation Andromeda. Il est maintenant temps de réserver votre session de coaching personnalisée pour approfondir vos connaissances et optimiser vos campagnes.`,
            points: []
          },
          resources: []
        }
      ];

      for (const lessonData of lessonsData) {
        const lesson = new Lesson({
          moduleId: module1._id,
          title: lessonData.title,
          videoId: lessonData.videoId,
          order: lessonData.order,
          locked: false,
          summary: lessonData.summary || {},
          resources: lessonData.resources || [],
          isCoaching: lessonData.isCoaching || false
        });
        await lesson.save();
        console.log(`✅ Leçon ${lessonData.order} créée: ${lessonData.title}`);
      }
      
      console.log('✅ Cours Facebook Ads initialisé avec succès !');
    } else {
      console.log('ℹ️ Cours Facebook Ads existe déjà');
      if (facebookAdsCourse.isPublished !== true) {
        facebookAdsCourse.isPublished = true;
        await facebookAdsCourse.save();
        console.log('✅ Facebook Ads publié (visible sur la home)');
      }
    }
    
    // Démarrer le Success Radar (cron + exécution initiale) si disponible
    if (startSuccessRadarCron && runSuccessRadarOnce) {
      startSuccessRadarCron();
      runSuccessRadarOnce();
    } else {
      console.warn('⚠️ Services Success Radar Cron non disponibles');
    }
    
    // Middleware de gestion des routes non trouvées (DOIT être après toutes les routes)
    // Exclure les routes /uploads pour permettre le service des fichiers statiques
    app.use((req, res, next) => {
      // Ne pas intercepter les routes /uploads (fichiers statiques)
      if (req.originalUrl.startsWith('/uploads/')) {
        return next();
      }
      
      console.log(`⚠️ Route non trouvée: ${req.method} ${req.originalUrl}`);
      console.log(`   - Headers:`, JSON.stringify(req.headers, null, 2));
      res.status(404).json({ 
        error: `Route non trouvée: ${req.method} ${req.originalUrl}`,
        availableRoutes: [
          'GET /auth/google',
          'GET /auth/google/callback',
          'POST /api/register',
          'POST /api/login',
          'GET /api/user/me',
          'PUT /api/profile',
          'PUT /api/change-password',
          'POST /api/chat',
          'GET /api/success-radar',
          'GET /api/valentine-winners',
          'POST /api/regenerate-products',
          'POST /api/regenerate-valentine',
          'GET /api/ressources-pdf',
          'GET /api/ressources-pdf/:slug',
          'GET /api/courses',
          'GET /api/courses/:id',
          'POST /api/coaching-reservations',
          'GET /api/comments',
          'GET /api/progress',
          'POST /api/admin/register',
          'GET /api/admin/check',
          'GET /api/admin/coaching-reservations',
          'PUT /api/admin/coaching-reservations/:id/status',
          'DELETE /api/admin/coaching-reservations/:id',
          'GET /api/admin/ressources-pdf',
          'POST /api/admin/ressources-pdf',
          'PUT /api/admin/ressources-pdf/:id',
          'DELETE /api/admin/ressources-pdf/:id'
        ]
      });
    });
    
    // Middleware 404 pour les routes non trouvées (doit être APRÈS toutes les routes)
    app.use((req, res, next) => {
      console.log(`⚠️ Route non trouvée: ${req.method} ${req.originalUrl}`);
      console.log(`   - Headers:`, JSON.stringify(req.headers, null, 2));
      res.status(404).json({ 
        error: `Route non trouvée: ${req.method} ${req.originalUrl}`,
        availableRoutes: [
          'GET /auth/facebook',
          'GET /auth/facebook/callback',
          'GET /api/meta/status',
          'GET /api/meta/businesses',
          'GET /api/meta/adaccounts',
          'GET /api/meta/campaigns',
          'POST /api/meta/select'
        ]
      });
    });
    
    // Démarrer le serveur Express
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend running on port ${PORT}`);
      console.log(`📡 API disponible sur http://localhost:${PORT}`);
      console.log(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n📋 Routes disponibles:`);
      console.log(`   POST /api/register - Inscription utilisateur`);
      console.log(`   POST /api/login - Connexion`);
      console.log(`   GET  /api/user/me - Profil utilisateur`);
      console.log(`   PUT  /api/profile - Mise à jour profil`);
      console.log(`   POST /api/admin/register - Inscription admin`);
      console.log(`   GET  /api/admin/check - Vérifier admin`);
      console.log(`   GET  /api/success-radar - Success Radar (protégé)`);
      console.log(`   GET  /api/valentine-winners - Winners St Valentin (protégé)`);
      console.log(`   GET  /auth/facebook - OAuth Facebook (protégé)`);
      console.log(`   GET  /api/meta/status - Statut Meta (protégé)`);
      console.log(`\n✅ Serveur prêt à recevoir des requêtes!\n`);
    });
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error);
    process.exit(1);
  }
};

startServer();

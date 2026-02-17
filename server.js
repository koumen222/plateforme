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
import { requireAdmin } from "./middleware/admin.js";
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
// Module E-commerce - Routes isolées
let ecomAuthRoutes = null;
let ecomProductsRoutes = null;
let ecomProductResearchRoutes = null;
let ecomReportsRoutes = null;
let ecomStockRoutes = null;
let ecomDecisionsRoutes = null;
let ecomGoalsRoutes = null;
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

// ⚠️ Configuration CORS - DOIT être AVANT toutes les routes
// ✅ Solution propre et sécurisée
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "https://www.safitech.shop",
      "https://ecomcookpit.site",
      "http://ecomcookpit.site",
      "https://plateforme-backend-production-2ec6.up.railway.app",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8081"
    ];
    
    // Log pour debug en production
    if (process.env.NODE_ENV === 'production') {
      console.log('🌐 Requête CORS depuis:', origin);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true, // IMPORTANT pour les cookies cross-domain
  optionsSuccessStatus: 204,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));


app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Pour les requêtes POST avec application/x-www-form-urlencoded
app.use(cookieParser());
app.use(referralCapture);

// Sécurité — Headers HTTP de protection
import { securityHeaders } from './ecom/middleware/security.js';
app.use(securityHeaders);

// Corriger les fautes fréquentes dans les routes (fallback)
app.use((req, res, next) => {
  if (req.url.startsWith('/api/adminn/')) {
    req.url = req.url.replace('/api/adminn/', '/api/admin/');
  }
  if (req.url.startsWith('/api/coacching-reservations')) {
    req.url = req.url.replace('/api/coacching-reservations', '/api/coaching-reservations');
  }
  
  // Debug: Log toutes les requêtes API
  if (req.url.startsWith('/api/')) {
    console.log(`🔍 Requête API: ${req.method} ${req.url}`);
  }
  
  next();
});

// Servir les fichiers statiques du backend (pour l'interface de test)
app.use(express.static(path.join(__dirname)));

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '../frontend/dist'), {
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
        res.status(404).json({
      error: 'Fichier non trouvé',
      path: req.originalUrl,
      uploadsPath: uploadsPath
    });
    return;
  }
  next();
});


// Configuration pour Render (trust proxy - OBLIGATOIRE et doit être AVANT session)
app.set("trust proxy", 1);

// Configuration de la session pour Passport (OBLIGATOIRE pour Render)
app.use(session({
  name: "safitech.sid", // Nom du cookie de session
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en production
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours au lieu de 24 heures pour mobile
    sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax", // "lax" pour compatibilité mobile
    domain: process.env.NODE_ENV === 'production' ? '.up.railway.app' : undefined // Domaine pour Railway
  }
}));

// Initialiser Passport
app.use(passport.initialize());
app.use(passport.session());

// Configurer la stratégie Google OAuth (définie dans config/passport.js)
configurePassport();

// Log de confirmation des routes OAuth

// Middleware de logging pour debug (exclure les health checks pour réduire le bruit)
app.use((req, res, next) => {
  // Ne pas logger les health checks
  if (req.originalUrl !== '/health' && req.originalUrl !== '/') {
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
      shouldRefresh = true;
    } else {
      const mostRecentValentine = valentineProducts[0];
      if (mostRecentValentine.lastUpdated) {
        const lastUpdate = new Date(mostRecentValentine.lastUpdated);
        const timeSinceUpdate = now - lastUpdate;

        if (timeSinceUpdate >= twentyFourHoursInMs) {
          shouldRefresh = true;
        } else {
          const remainingHours = Math.round((twentyFourHoursInMs - timeSinceUpdate) / (60 * 60 * 1000));
          cacheMessage = `Produits St Valentin chargés depuis le cache. Prochaine actualisation dans ${remainingHours}h`;
        }
      } else {
        shouldRefresh = true;
      }
    }

    if (shouldRefresh) {
      try {
        const successRadarCron = await import("./services/successRadarCron.js");
        await successRadarCron.refreshValentineProducts();
        valentineProducts = await WinningProduct.find({ specialEvent: 'saint-valentin' })
          .sort({ lastUpdated: -1, createdAt: -1 })
          .limit(50)
          .lean();
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
    // Routes de test simples pour vérifier que le serveur répond (AVANT le chargement des modules)
    app.get("/api/whatsapp-campaigns/health", (req, res) => {
      res.json({ 
        success: true, 
        message: 'Serveur actif - Route whatsapp-campaigns en cours de chargement',
        timestamp: new Date().toISOString()
      });
    });
    
    app.get("/api/whatsapp-campaigns", authenticate, requireAdmin, async (req, res) => {
      // Route temporaire pour diagnostiquer
      res.json({ 
        success: true, 
        message: 'Route whatsapp-campaigns accessible - Module en cours de chargement',
        campaigns: [],
        note: 'Si vous voyez ce message, le serveur fonctionne mais le module n\'est pas encore chargé'
      });
    });

    // Liste des utilisateurs avec numéros pour sélection manuelle
    app.get("/api/whatsapp-campaigns/users-with-phones", authenticate, requireAdmin, async (req, res) => {
      try {
        const { search = '', limit = 1000 } = req.query;
        const sanitizePhone = (value) => {
          if (!value) return '';
          return value.toString().replace(/\D/g, '').trim();
        };

        let query = {
          $and: [
            {
              $or: [
                { phone: { $exists: true, $ne: '' } },
                { phoneNumber: { $exists: true, $ne: '' } }
              ]
            },
            { role: { $ne: 'admin' } }
          ]
        };

        if (search && search.trim()) {
          const searchRegex = { $regex: search.trim(), $options: 'i' };
          query.$and.push({
            $or: [
              { name: searchRegex },
              { email: searchRegex },
              { phone: searchRegex },
              { phoneNumber: searchRegex }
            ]
          });
        }

        const users = await User.find(query)
          .select('phone phoneNumber name email _id')
          .limit(parseInt(limit, 10))
          .lean();

        const contacts = users
          .map((u) => {
            const rawPhone = (u.phoneNumber && u.phoneNumber.trim()) || (u.phone && u.phone.trim()) || '';
            const phone = sanitizePhone(rawPhone);
            // Extraire le prénom du nom complet (premier mot) et capitaliser
            let firstName = '';
            if (u.name && u.name.toString().trim()) {
              const nameParts = u.name.toString().trim().split(/\s+/);
              if (nameParts.length > 0 && nameParts[0]) {
                firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
              }
            }
            return {
              phone,
              firstName,
              name: u.name || '',
              email: u.email || '',
              userId: u._id,
              valid: phone.length >= 8 && phone.length <= 15
            };
          })
          .filter((c) => !!c.phone);

        // Dédoublonnage par numéro
        const seen = new Set();
        const uniqueContacts = [];
        for (const c of contacts) {
          if (seen.has(c.phone)) continue;
          seen.add(c.phone);
          uniqueContacts.push(c);
        }

        res.json({
          success: true,
          total: uniqueContacts.length,
          validCount: uniqueContacts.filter((c) => c.valid).length,
          contacts: uniqueContacts
        });
      } catch (error) {
        console.error('❌ Erreur récupération utilisateurs avec numéros:', error.message);
        console.error('   Stack:', error.stack);
        res.status(500).json({ error: 'Erreur récupération utilisateurs', details: error.message });
      }
    });

    // Preview des destinataires WhatsApp (liste de numéros avant envoi)
    // Permet au frontend d'afficher la liste et cocher/décocher avant l'envoi
    app.get("/api/whatsapp-campaigns/recipients-preview", authenticate, requireAdmin, async (req, res) => {
      try {
        const tag = (req.query.tag || 'active').toString();
        const allowedTags = ['active', 'pending', 'blocked', 'all'];

        if (!allowedTags.includes(tag)) {
          return res.status(400).json({ error: 'Tag invalide', allowedTags });
        }

        const sanitizePhone = (value) => {
          if (!value) return '';
          return value.toString().replace(/\D/g, '').trim();
        };

        // Validation légère côté preview (la validation stricte est faite au moment de l'envoi)
        const isValidPreviewPhone = (digits) => !!digits && digits.length >= 8 && digits.length <= 15;

        let users = [];
        if (tag === 'all') {
          users = await User.find({
            $and: [
              {
                $or: [
                  { phone: { $exists: true, $ne: '' } },
                  { phoneNumber: { $exists: true, $ne: '' } }
                ]
              },
              { role: { $ne: 'admin' } }
            ]
          }).select('phone phoneNumber name _id').lean();
        } else {
          users = await User.find({
            $and: [
              {
                $or: [
                  { phone: { $exists: true, $ne: '' } },
                  { phoneNumber: { $exists: true, $ne: '' } }
                ]
              },
              {
                $or: [
                  { status: tag },
                  { accountStatus: tag }
                ]
              },
              { role: { $ne: 'admin' } }
            ]
          }).select('phone phoneNumber name _id').lean();
        }

        const contactsRaw = users
          .map((u) => {
            const rawPhone = (u.phoneNumber && u.phoneNumber.trim()) || (u.phone && u.phone.trim()) || '';
            const phone = sanitizePhone(rawPhone);
            // Extraire le prénom du nom complet (premier mot) et capitaliser
            let firstName = '';
            if (u.name && u.name.toString().trim()) {
              const nameParts = u.name.toString().trim().split(/\s+/);
              if (nameParts.length > 0 && nameParts[0]) {
                firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
              }
            }
            return { phone, firstName, userId: u._id, valid: isValidPreviewPhone(phone) };
          })
          .filter((c) => !!c.phone);

        // Dédoublonnage par numéro
        const seen = new Set();
        const contacts = [];
        for (const c of contactsRaw) {
          if (seen.has(c.phone)) continue;
          seen.add(c.phone);
          contacts.push(c);
        }

        res.json({
          success: true,
          tag,
          total: contacts.length,
          validCount: contacts.filter((c) => c.valid).length,
          contacts
        });
      } catch (error) {
        console.error('❌ Erreur preview recipients WhatsApp:', error.message);
        console.error('   Stack:', error.stack);
        res.status(500).json({ error: 'Erreur récupération destinataires', details: error.message });
      }
    });
    
    app.post("/api/whatsapp-campaigns", authenticate, requireAdmin, async (req, res) => {
      try {
        let WhatsAppCampaign;
        try {
          const campaignModule = await import("./models/WhatsAppCampaign.js");
          WhatsAppCampaign = campaignModule.default;
        } catch (err) {
          console.error('❌ Erreur import WhatsAppCampaign:', err.message);
          return res.status(500).json({ 
            error: 'Modèle WhatsAppCampaign non disponible', 
            details: err.message 
          });
        }
        
        const {
          name,
          message,
          variants,
          recipients,
          scheduledAt,
          fromPhone
        } = req.body;
        
        // Générer un nom automatique si non fourni
        const campaignName = name || `Newsletter ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        
        // Vérifier qu'au moins un message ou une variante est fourni
        const hasMessage = message && message.trim();
        const hasVariants = variants && Array.isArray(variants) && variants.some(v => v && v.trim());
        
        if (!hasMessage && !hasVariants) {
          return res.status(400).json({ error: 'Au moins un message ou une variante doit être fourni' });
        }
        
        if (!recipients || !recipients.type) {
          return res.status(400).json({ error: 'Type de destinataires requis (all, segment, list)' });
        }
        
        // Valider la structure des recipients selon le type
        if (recipients.type === 'list' && (!recipients.customPhones || !Array.isArray(recipients.customPhones))) {
          return res.status(400).json({ error: 'customPhones doit être un tableau pour le type "list"' });
        }
        
        if (recipients.type === 'segment' && !recipients.segment) {
          return res.status(400).json({ error: 'segment est requis pour le type "segment"' });
        }
        
        let recipientCount = 0;
        
        try {
          if (recipients.type === 'all') {
            recipientCount = await User.countDocuments({ 
              $and: [
                {
                  $or: [
                    { phone: { $exists: true, $ne: '' } },
                    { phoneNumber: { $exists: true, $ne: '' } }
                  ]
                },
                { role: { $ne: 'admin' } }
              ]
            });
          } else if (recipients.type === 'segment') {
            if (['pending', 'active', 'blocked'].includes(recipients.segment)) {
              recipientCount = await User.countDocuments({ 
                $and: [
                  {
                    $or: [
                      { phone: { $exists: true, $ne: '' } },
                      { phoneNumber: { $exists: true, $ne: '' } }
                    ]
                  },
                  {
                    $or: [
                      { status: recipients.segment },
                      { accountStatus: recipients.segment }
                    ]
                  },
                  { role: { $ne: 'admin' } }
                ]
              });
            }
          } else if (recipients.type === 'list' && recipients.customPhones?.length) {
            recipientCount = recipients.customPhones.length;
          }
        } catch (countError) {
          console.error('❌ Erreur comptage destinataires:', countError.message);
          // Continuer avec recipientCount = 0 si erreur de comptage
        }
        
        // Vérifier que req.user existe
        if (!req.user || !req.user._id) {
          return res.status(401).json({ error: 'Utilisateur non authentifié' });
        }

        // Préparer les variants - s'assurer que c'est un tableau
        const finalVariants = hasVariants && Array.isArray(variants) 
          ? variants.filter(v => v && v.trim()) 
          : [];

        // Vérifier à nouveau qu'au moins un message ou une variante existe après filtrage
        if (!hasMessage && finalVariants.length === 0) {
          return res.status(400).json({ error: 'Au moins un message ou une variante doit être fourni' });
        }

        const campaign = new WhatsAppCampaign({
          name: campaignName,
          message: hasMessage ? message.trim() : null,
          variants: finalVariants,
          recipients: {
            ...recipients,
            count: recipientCount
          },
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          status: scheduledAt ? 'scheduled' : 'draft',
          fromPhone: fromPhone || process.env.WHATSAPP_FROM_PHONE || '',
          createdBy: req.user._id
        });
        
        await campaign.save();
        
        res.status(201).json({
          success: true,
          campaign: campaign.toObject()
        });
      } catch (error) {
        console.error('❌ Erreur création campagne WhatsApp:', error.message);
        console.error('   Stack:', error.stack);
        console.error('   Données reçues:', {
          name: req.body.name,
          hasMessage: !!(req.body.message && req.body.message.trim()),
          hasVariants: !!(req.body.variants && Array.isArray(req.body.variants) && req.body.variants.some(v => v && v.trim())),
          recipientsType: req.body.recipients?.type,
          userId: req.user?._id
        });
        
        // Si c'est une erreur de validation Mongoose, retourner les détails
        if (error.name === 'ValidationError') {
          const validationErrors = Object.values(error.errors || {}).map(err => err.message).join(', ');
          return res.status(400).json({ 
            error: 'Erreur de validation',
            details: validationErrors || error.message
          });
        }
        
        res.status(500).json({ 
          error: 'Erreur lors de la création de la campagne',
          details: error.message
        });
      }
    });

    app.get("/api/whatsapp-campaigns/:id/stream", authenticate, requireAdmin, async (req, res) => {
        try {
          const { id } = req.params;
          
          let WhatsAppCampaign, addSSEConnection;
          try {
            const campaignModule = await import("./models/WhatsAppCampaign.js");
            WhatsAppCampaign = campaignModule.default;
          } catch (err) {
            return res.status(500).json({ error: 'Modèle WhatsAppCampaign non disponible', details: err.message });
          }
          
          try {
            const serviceModule = await import("./services/whatsappService.js");
            addSSEConnection = serviceModule.addSSEConnection;
          } catch (err) {
            return res.status(500).json({ error: 'Service WhatsApp non disponible', details: err.message });
          }
          
          const campaign = await WhatsAppCampaign.findById(id).lean();
          
          if (!campaign) {
            return res.status(404).json({ error: 'Campagne non trouvée' });
          }
          
          // Configurer les headers SSE
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('X-Accel-Buffering', 'no');
          res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://www.safitech.shop');
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          
          // Envoyer un message initial
          res.write(`event: connected\ndata: ${JSON.stringify({ campaignId: id, campaignName: campaign.name })}\n\n`);
          
          // Ajouter cette connexion au système SSE
          if (addSSEConnection) {
            addSSEConnection(id, res);
          }
          
          // Envoyer un heartbeat toutes les 30 secondes
          const heartbeatInterval = setInterval(() => {
            try {
              res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
            } catch (error) {
              clearInterval(heartbeatInterval);
            }
          }, 30000);
          
          // Nettoyer quand la connexion se ferme
          req.on('close', () => {
            clearInterval(heartbeatInterval);
            res.end();
          });
        } catch (error) {
          console.error('❌ Erreur stream campagne:', error.message);
          res.status(500).json({ error: 'Erreur lors de la connexion au stream', details: error.message });
        }
      });

    app.get("/api/whatsapp-campaigns/:id/status", authenticate, requireAdmin, async (req, res) => {
        try {
          const { id } = req.params;
          
          let WhatsAppCampaign, WhatsAppLog;
          try {
            const campaignModule = await import("./models/WhatsAppCampaign.js");
            WhatsAppCampaign = campaignModule.default;
          } catch (err) {
            return res.status(500).json({ error: 'Modèle WhatsAppCampaign non disponible', details: err.message });
          }
          
          try {
            const logModule = await import("./models/WhatsAppLog.js");
            WhatsAppLog = logModule.default;
          } catch (err) {
            return res.status(500).json({ error: 'Modèle WhatsAppLog non disponible', details: err.message });
          }
          
          const campaign = await WhatsAppCampaign.findById(id).lean();
          
          if (!campaign) {
            return res.status(404).json({ error: 'Campagne non trouvée' });
          }
          
          const logs = await WhatsAppLog.find({ campaignId: id })
            .select('phone firstName messageSent status sentAt error')
            .sort({ sentAt: -1 })
            .lean();
          
          const sentLogs = logs.filter(log => log.status === 'sent' || log.status === 'delivered');
          const failedLogs = logs.filter(log => log.status === 'failed');
          const pendingLogs = logs.filter(log => log.status === 'pending');
          
          res.json({
            success: true,
            campaign: {
              _id: campaign._id,
              name: campaign.name,
              status: campaign.status,
              sentAt: campaign.sentAt,
              createdAt: campaign.createdAt
            },
            stats: {
              total: logs.length,
              sent: sentLogs.length,
              failed: failedLogs.length,
              pending: pendingLogs.length
            },
            sentMessages: sentLogs.map(log => ({
              phone: log.phone,
              firstName: log.firstName || '',
              message: log.messageSent || '',
              sentAt: log.sentAt
            })),
            failedMessages: failedLogs.map(log => ({
              phone: log.phone,
              firstName: log.firstName || '',
              error: log.error || 'Erreur inconnue',
              sentAt: log.sentAt
            }))
          });
        } catch (error) {
          console.error('❌ Erreur récupération statut campagne:', error.message);
          res.status(500).json({ error: 'Erreur lors de la récupération', details: error.message });
        }
      });

    app.post("/api/whatsapp-campaigns/:id/send", authenticate, requireAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        
        // Importer les modèles et services nécessaires avec gestion d'erreur
        let WhatsAppCampaign, sendNewsletterCampaign, WhatsAppLog;
        
        try {
          const campaignModule = await import("./models/WhatsAppCampaign.js");
          WhatsAppCampaign = campaignModule.default;
        } catch (err) {
          console.error('❌ Erreur import WhatsAppCampaign:', err.message);
          return res.status(500).json({ error: 'Modèle WhatsAppCampaign non disponible', details: err.message });
        }
        
        try {
          const serviceModule = await import("./services/whatsappService.js");
          sendNewsletterCampaign = serviceModule.sendNewsletterCampaign;
        } catch (err) {
          console.error('❌ Erreur import whatsappService:', err.message);
          return res.status(500).json({ error: 'Service WhatsApp non disponible', details: err.message });
        }
        
        try {
          const logModule = await import("./models/WhatsAppLog.js");
          WhatsAppLog = logModule.default;
        } catch (err) {
          console.error('❌ Erreur import WhatsAppLog:', err.message);
          // Ne pas bloquer si WhatsAppLog n'est pas disponible, on continuera sans logs
        }
        
        const frontendUrl = process.env.FRONTEND_URL || 'https://safitech.shop';
        
        const campaign = await WhatsAppCampaign.findById(id);
        
        if (!campaign) {
          return res.status(404).json({ error: 'Campagne non trouvée' });
        }
        
        if (campaign.status === 'sent') {
          return res.status(400).json({ error: 'Campagne déjà envoyée' });
        }
        
        let users = [];
        
        if (campaign.recipients.type === 'all') {
          users = await User.find({ 
            $or: [
              { phone: { $exists: true, $ne: '' } },
              { phoneNumber: { $exists: true, $ne: '' } }
            ],
            role: { $ne: 'admin' }
          }).select('phone phoneNumber name _id').lean();
        } else if (campaign.recipients.type === 'segment') {
          if (['pending', 'active', 'blocked'].includes(campaign.recipients.segment)) {
            users = await User.find({ 
              $and: [
                {
                  $or: [
                    { phone: { $exists: true, $ne: '' } },
                    { phoneNumber: { $exists: true, $ne: '' } }
                  ]
                },
                {
                  $or: [
                    { status: campaign.recipients.segment },
                    { accountStatus: campaign.recipients.segment }
                  ]
                },
                { role: { $ne: 'admin' } }
              ]
            }).select('phone phoneNumber name _id').lean();
          }
        } else if (campaign.recipients.type === 'list' && campaign.recipients.customPhones?.length) {
          // Pour les listes personnalisées, chercher les utilisateurs correspondants dans la base
          const sanitizePhone = (phone) => {
            if (!phone) return '';
            return phone.toString().replace(/\D/g, '').trim();
          };
          
          const cleanedPhones = campaign.recipients.customPhones.map(p => sanitizePhone(p));
          
          // Chercher les utilisateurs avec ces numéros
          const foundUsers = await User.find({
            $or: [
              { phone: { $in: cleanedPhones } },
              { phoneNumber: { $in: cleanedPhones } }
            ],
            role: { $ne: 'admin' }
          }).select('phone phoneNumber name _id').lean();
          
          // Créer un map pour retrouver rapidement les utilisateurs par numéro
          const userMap = new Map();
          foundUsers.forEach(user => {
            const userPhone = sanitizePhone(user.phoneNumber || user.phone);
            if (userPhone) {
              userMap.set(userPhone, user);
            }
          });
          
          // Créer la liste des utilisateurs avec les numéros fournis
          users = campaign.recipients.customPhones.map(phone => {
            const cleaned = sanitizePhone(phone);
            const foundUser = userMap.get(cleaned);
            if (foundUser) {
              return foundUser;
            }
            // Si pas trouvé, créer un objet minimal avec le numéro
            return { phone: cleaned, phoneNumber: cleaned, name: null, _id: null };
          });
        }
        
        // Normaliser les numéros
        users = users
          .map(user => ({
            ...user,
            phone: (user.phoneNumber && user.phoneNumber.trim()) || (user.phone && user.phone.trim()) || null
          }))
          .filter(u => u.phone && u.phone.trim() !== '');
        
        if (users.length === 0) {
          return res.status(400).json({ 
            error: 'Aucun destinataire trouvé',
            details: 'Aucun utilisateur avec le tag sélectionné n\'a de numéro de téléphone valide.'
          });
        }
        
        
        campaign.status = 'sending';
        await campaign.save();
        
        // Déterminer les variantes
        const useVariants = campaign.variants && campaign.variants.length > 0;
        const variants = useVariants ? campaign.variants : (campaign.message ? [campaign.message] : []);
        
        // Déterminer le lien selon le segment
        let linkToUse = null;
        if (campaign.recipients.type === 'segment' && 
            (campaign.recipients.segment === 'blocked' || campaign.recipients.segment === 'pending')) {
          linkToUse = `${frontendUrl}/profil`;
        } else {
          linkToUse = `${frontendUrl}/`;
        }
        
        // Préparer les contacts avec le prénom
        const contacts = users.map(user => {
          const phone = (user.phoneNumber && user.phoneNumber.trim()) || (user.phone && user.phone.trim());
          // Extraire le prénom du nom complet (premier mot)
          let firstName = '';
          if (user.name && user.name.trim()) {
            // Prendre le premier mot et capitaliser la première lettre
            const nameParts = user.name.trim().split(/\s+/);
            if (nameParts.length > 0 && nameParts[0]) {
              firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
            }
          }
          
          return {
            to: phone,
            campaignId: campaign._id,
            userId: user._id || null,
            profileLink: linkToUse,
            firstName: firstName || ''
          };
        });
        
        // Envoyer la campagne
        if (!sendNewsletterCampaign) {
          return res.status(500).json({ 
            error: 'Service WhatsApp non disponible',
            details: 'Le service sendNewsletterCampaign n\'a pas pu être chargé'
          });
        }
        
        const newsletterResults = await sendNewsletterCampaign(contacts, variants);
        
        const results = newsletterResults.results || [];
        const sent = results.filter(r => r.success);
        const failed = results.filter(r => !r.success && !r.skipped);
        const skipped = results.filter(r => r.skipped);
        
        // Vérification des logs
        let confirmedSent = 0;
        if (WhatsAppLog) {
          try {
            const logs = await WhatsAppLog.find({ campaignId: campaign._id }).lean();
            confirmedSent = logs.filter(log => log.status === 'sent' || log.status === 'delivered').length;
          } catch (logError) {
            console.warn('⚠️ Erreur récupération logs WhatsApp:', logError.message);
          }
        }
        
        const stats = {
          total: newsletterResults.total || users.length,
          sent: newsletterResults.sent || sent.length,
          failed: newsletterResults.failed || failed.length,
          skipped: newsletterResults.skipped || skipped.length,
          confirmed: confirmedSent,
          quotaReached: newsletterResults.quotaReached || false,
          failedPhones: failed.map(f => ({ phone: f.phone, error: f.error }))
        };
        
        // Mettre à jour la campagne
        campaign.status = (newsletterResults.sent > 0 && !newsletterResults.quotaReached) ? 'sent' : 
                          (newsletterResults.quotaReached ? 'sending' : 'failed');
        campaign.sentAt = campaign.status === 'sent' ? new Date() : null;
        campaign.stats = {
          sent: stats.sent,
          failed: stats.failed,
          delivered: stats.confirmed,
          read: 0
        };
        campaign.error = newsletterResults.quotaReached ? 'Quota atteint' : null;
        await campaign.save();
        
        res.json({
          success: true,
          message: `Campagne "${campaign.name}" ${campaign.status === 'sent' ? 'envoyée' : 'en cours'}`,
          stats
        });
      } catch (error) {
        console.error('❌ Erreur envoi campagne WhatsApp:', error.message);
        console.error('   Stack:', error.stack);
        
        // Mettre à jour le statut de la campagne en cas d'erreur
        try {
          const WhatsAppCampaign = (await import("./models/WhatsAppCampaign.js")).default;
          await WhatsAppCampaign.findByIdAndUpdate(req.params.id, { 
            status: 'failed',
            error: error.message 
          });
        } catch (updateError) {
          console.error('❌ Erreur mise à jour campagne:', updateError.message);
        }
        
        res.status(500).json({ 
          error: 'Erreur lors de l\'envoi de la campagne',
          details: error.message,
          campaignId: req.params.id
        });
      }
    });
    
    // Charger TOUS les modules dynamiquement pour éviter les crashes si fichiers absents
    
    // 0. Routes Facebook Auth OAuth (doivent être montées EN PREMIER pour capturer /auth/*)
    try {
      const facebookAuthModule = await import("./routes/facebookAuth.js");
      facebookAuthRoutes = facebookAuthModule.default;
      if (!facebookAuthRoutes) {
        throw new Error('Router facebookAuth est null ou undefined');
      }
      app.use("/", facebookAuthRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement facebookAuth.js:', error.message);
      console.error('   Stack:', error.stack);
    }
    
    // 1. Routes d'authentification
    try {
      const authModule = await import("./routes/auth.js");
      authRoutes = authModule.default;
      app.use("/api", authRoutes);
      console.log('✅ Routes auth.js chargées avec succès');
    } catch (error) {
      console.error('⚠️ Erreur chargement auth.js:', error.message);
      console.error('   Stack:', error.stack);
    }

    // 1.1. Routes auth spécifiques sous /api/auth/ pour compatibilité frontend
    app.post("/api/auth/forgot-password", async (req, res) => {
      try {
        const { email } = req.body;

        // Validation
        if (!email) {
          return res.status(400).json({ error: 'L\'adresse email est requise' });
        }

        // Validation de l'email
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Veuillez entrer une adresse email valide' });
        }

    // Trouver l'utilisateur par email
    const User = (await import('./models/User.js')).default;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    console.log(`🔍 Tentative de réinitialisation pour: ${email}`);
    
    // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
    if (!user) {
      console.log(`❌ Email non trouvé dans la base: ${email}`);
      return res.json({ 
        success: true, 
        message: 'Si cet email existe dans notre base de données, vous recevrez un lien de réinitialisation.' 
      });
    }

    console.log(`👤 Utilisateur trouvé: ${user.name} (${user._id})`);
    console.log(`🔑 AuthProvider: ${user.authProvider}`);
    console.log(`📝 Password présent: ${!!user.password}`);

    // Vérifier que l'utilisateur a un mot de passe (pas OAuth)
    if (!user.password && user.authProvider === 'google') {
      console.log(`❌ Tentative de réinitialisation pour un compte OAuth Google: ${email}`);
      return res.json({ 
        success: true, 
        message: 'Ce compte utilise l\'authentification Google. Veuillez vous connecter avec Google.' 
      });
    }

        // Générer un token de réinitialisation
        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Sauvegarder le token dans la base de données
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = resetTokenExpiry;
        await user.save();

        console.log(`✅ Token de réinitialisation généré pour: ${email}`);

        // Envoyer l'email avec Resend
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          
          console.log('🔧 Tentative d\'envoi email avec Resend...');
          console.log('   - API Key:', process.env.RESEND_API_KEY ? '✅ Définie' : '❌ Manquante');
          console.log('   - From:', process.env.EMAIL_FROM || 'noreply@infomania.store');
          console.log('   - To:', email);
          
          const result = await resend.emails.send({
            from: `Ecomstarter <${process.env.EMAIL_FROM || 'noreply@infomania.store'}>`,
            to: email,
            subject: 'Réinitialisation de votre mot de passe',
            html: `
              <h2 style="color: #333; font-family: Arial, sans-serif;">Réinitialisation de votre mot de passe</h2>
              <p style="color: #666; font-family: Arial, sans-serif;">Bonjour ${user.name},</p>
              <p style="color: #666; font-family: Arial, sans-serif;">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour continuer:</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Réinitialiser mon mot de passe
                </a>
              </div>
              <p style="color: #999; font-size: 14px; font-family: Arial, sans-serif;">Ce lien expirera dans 10 minutes.</p>
              <p style="color: #999; font-size: 14px; font-family: Arial, sans-serif;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; font-family: Arial, sans-serif;">
                Ceci est un email automatique de la plateforme de formation Andromeda.
              </p>
            `
          });
          
          console.log('✅ Email de réinitialisation envoyé à:', email);
          console.log('   - Result ID:', result.id);
        } catch (emailError) {
          console.error('❌ Erreur envoi email:', emailError);
          console.error('   Details:', emailError.message);
          console.error('   Stack:', emailError.stack);
          // Ne pas retourner d'erreur 500, juste logger et continuer
          console.log('⚠️ Email non envoyé mais token généré - mode dégradé');
        }

        res.json({ 
          success: true, 
          message: 'Si cet email existe dans notre base de données, vous recevrez un lien de réinitialisation.' 
        });

      } catch (error) {
        console.error('❌ Erreur forgot-password:', error);
        res.status(500).json({ 
          error: 'Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer plus tard.' 
        });
      }
    });

    // 1bis. Routes parrainage (optionnelles)
    try {
      const referralsModule = await import("./routes/referrals.js");
      referralsRoutes = referralsModule.default;
      app.use("/api", referralsRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement referrals.js:', error.message);
    }
    
    // 2. Routes vidéos
    try {
      const videoModule = await import("./routes/videos.js");
      videoRoutes = videoModule.default;
      app.use("/api", videoRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement videos.js:', error.message);
    }
    
    // 3. Routes cours
    try {
      const coursesModule = await import("./routes/courses.js");
      coursesRoutes = coursesModule.default;
      app.use("/api/courses", coursesRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement courses.js:', error.message);
    }

    // 3bis. Routes réservations coaching
    try {
      const coachingModule = await import("./routes/coaching-reservations.js");
      coachingRoutes = coachingModule.default;
      app.use("/api/coaching-reservations", coachingRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement coaching-reservations.js:', error.message);
    }
    
    // 3bis2. Routes candidatures coaching 7 jours
    try {
      const coachingApplicationsModule = await import("./routes/coaching-applications.js");
      coachingApplicationsRoutes = coachingApplicationsModule.default;
      app.use("/api/coaching-applications", coachingApplicationsRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement coaching-applications.js:', error.message);
    }
    
    // 3ter. Routes recrutement (annuaire interne)
    try {
      const recrutementModule = await import("./routes/recrutement.js");
      recrutementRoutes = recrutementModule.default;
      app.use("/api/recrutement", recrutementRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement recrutement.js:', error.message);
    }
    
    // 3quater. Routes partenaires (public)
    try {
      const partenairesModule = await import("./routes/partenaires.js");
      partenairesRoutes = partenairesModule.default;
      app.use("/api/partenaires", partenairesRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement partenaires.js:', error.message);
    }
    
    // 4. Routes ressources PDF
    try {
      const ressourcesPdfModule = await import("./routes/ressources-pdf.js");
      ressourcesPdfRoutes = ressourcesPdfModule.default;
      app.use("/api/ressources-pdf", ressourcesPdfRoutes);
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
    } catch (error) {
      console.error('⚠️ Erreur chargement progress.js:', error.message);
    }
    
    // 6. Routes commentaires
    try {
      const commentsModule = await import("./routes/comments.js");
      commentsRoutes = commentsModule.default;
      app.use("/api/comments", commentsRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement comments.js:', error.message);
    }
    
    // 7. Routes Success Radar
    try {
      const successRadarModule = await import("./routes/successRadar.js");
      successRadarRoutes = successRadarModule.default;
      app.use("/api", successRadarRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement successRadar.js:', error.message);
    }
    
    // 8. Routes admin
    try {
      const adminModule = await import("./routes/admin.js");
      adminRoutes = adminModule.default;
      app.use("/api/admin", adminRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement admin.js:', error.message);
    }
    
    // 9. Routes paiement
    try {
      const paymentModule = await import("./routes/payment.js");
      paymentRoutes = paymentModule.default;
      app.use("/api/payment", paymentRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement payment.js:', error.message);
    }
    
    // 10. Routes diagnostic
    try {
      const diagnosticModule = await import("./routes/diagnostic.js");
      diagnosticRoutes = diagnosticModule.default;
      app.use("/api/diagnostic", diagnosticRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement diagnostic.js:', error.message);
    }
    
    // 11. Routes fichiers (File Manager)
    try {
      const filesModule = await import("./routes/files.js");
      filesRoutes = filesModule.default;
      app.use("/api/files", filesRoutes);
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
    } catch (error) {
      console.error('⚠️ Erreur chargement meta.js:', error.message);
      console.error('   Stack:', error.stack);
    }
    
    // 15. Services Success Radar Cron
    try {
      const successRadarCronModule = await import("./services/successRadarCron.js");
      startSuccessRadarCron = successRadarCronModule.startSuccessRadarCron;
      runSuccessRadarOnce = successRadarCronModule.runSuccessRadarOnce;
    } catch (error) {
      console.error('⚠️ Erreur chargement successRadarCron.js:', error.message);
    }
    
    // 16. Routes Web Push (notifications push natives)
    try {
      const pushModule = await import("./routes/push.js");
      pushRoutes = pushModule.default;
      app.use("/api/push", pushRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement push.js:', error.message);
      console.error('   Stack:', error.stack);
    }
    
    // Routes notifications internes
    try {
      const notificationsModule = await import("./routes/notifications.js");
      notificationsRoutes = notificationsModule.default;
      app.use("/api/notifications", notificationsRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement notifications.js:', error.message);
    }

    // Routes ebooks
    try {
      const ebooksModule = await import("./routes/ebooks.js");
      ebooksRoutes = ebooksModule.default;
      app.use("/api/ebooks", ebooksRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ebooks.js:', error.message);
    }

    // Routes paiements Monetbil
    try {
      const paymentsModule = await import("./routes/payments.js");
      paymentsRoutes = paymentsModule.default;
      app.use("/api/payments", paymentsRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement payments.js:', error.message);
    }

    // ===== MODULE E-COMMERCE ISOLÉ =====
    
    // Routes E-commerce Authentification
    try {
      const ecomAuthModule = await import("./ecom/routes/auth.js");
      ecomAuthRoutes = ecomAuthModule.default;
      app.use("/api/ecom/auth", ecomAuthRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/auth.js:', error.message);
    }

    // Routes E-commerce Produits
    try {
      const ecomProductsModule = await import("./ecom/routes/products.js");
      ecomProductsRoutes = ecomProductsModule.default;
      app.use("/api/ecom/products", ecomProductsRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/products.js:', error.message);
    }

    // Routes E-commerce Recherche Produits
    try {
      const ecomProductResearchModule = await import("./ecom/routes/productResearch.js");
      ecomProductResearchRoutes = ecomProductResearchModule.default;
      app.use("/api/ecom/products-research", ecomProductResearchRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/productResearch.js:', error.message);
    }

    // Routes E-commerce Objectifs
    try {
      const ecomGoalsModule = await import("./ecom/routes/goals.js");
      ecomGoalsRoutes = ecomGoalsModule.default;
      app.use("/api/ecom/goals", ecomGoalsRoutes);
      
      // Forcer la synchronisation des index du modèle Goal
      const Goal = (await import("./ecom/models/Goal.js")).default;
      await Goal.syncIndexes();
      console.log('✅ Index des objectifs synchronisés');
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/goals.js ou sync indexes:', error.message);
    }

    try {
      const ecomReportsModule = await import("./ecom/routes/reports.js");
      ecomReportsRoutes = ecomReportsModule.default;
      app.use("/api/ecom/reports", ecomReportsRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/reports.js:', error.message);
    }

    // Routes E-commerce Stock
    try {
      const ecomStockModule = await import("./ecom/routes/stock.js");
      ecomStockRoutes = ecomStockModule.default;
      app.use("/api/ecom/stock", ecomStockRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/stock.js:', error.message);
    }

    // Routes E-commerce Stock Locations (gestion stock par ville/agence)
    try {
      const ecomStockLocationsModule = await import("./ecom/routes/stockLocations.js");
      app.use("/api/ecom/stock-locations", ecomStockLocationsModule.default);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/stockLocations.js:', error.message);
    }

    // Routes E-commerce Décisions
    try {
      const ecomDecisionsModule = await import("./ecom/routes/decisions.js");
      ecomDecisionsRoutes = ecomDecisionsModule.default;
      app.use("/api/ecom/decisions", ecomDecisionsRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/decisions.js:', error.message);
    }

    // Routes E-commerce Transactions (Comptabilité)
    try {
      const ecomTransactionsModule = await import("./ecom/routes/transactions.js");
      const ecomTransactionsRoutes = ecomTransactionsModule.default;
      app.use("/api/ecom/transactions", ecomTransactionsRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/transactions.js:', error.message);
    }

    // Routes E-commerce Utilisateurs (Admin)
    try {
      const ecomUsersModule = await import("./ecom/routes/users.js");
      const ecomUsersRoutes = ecomUsersModule.default;
      app.use("/api/ecom/users", ecomUsersRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/users.js:', error.message);
    }

    // Routes E-commerce Super Admin
    try {
      const ecomSuperAdminModule = await import("./ecom/routes/superAdmin.js");
      const ecomSuperAdminRoutes = ecomSuperAdminModule.default;
      app.use("/api/ecom/super-admin", ecomSuperAdminRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/superAdmin.js:', error.message);
    }

    // Routes E-commerce Import (Google Sheets)
    try {
      const ecomImportModule = await import("./ecom/routes/import.js");
      const ecomImportRoutes = ecomImportModule.default;
      app.use("/api/ecom/import", ecomImportRoutes);
      console.log('✅ Routes ecom/import.js chargées avec succès');
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/import.js:', error.message);
    }

    // Routes E-commerce Clients
    try {
      const ecomClientsModule = await import("./ecom/routes/clients.js");
      const ecomClientsRoutes = ecomClientsModule.default;
      app.use("/api/ecom/clients", ecomClientsRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/clients.js:', error.message);
    }

    // Routes E-commerce Commandes (Google Sheets)
    try {
      const ecomOrdersModule = await import("./ecom/routes/orders.js");
      const ecomOrdersRoutes = ecomOrdersModule.default;
      app.use("/api/ecom/orders", ecomOrdersRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/orders.js:', error.message);
    }

    // Routes E-commerce Campagnes Marketing
    try {
      const ecomCampaignsModule = await import("./ecom/routes/campaigns.js");
      const ecomCampaignsRoutes = ecomCampaignsModule.default;
      app.use("/api/ecom/campaigns", ecomCampaignsRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/campaigns.js:', error.message);
    }

    // Routes E-commerce Ecore (Analyse économique)
    try {
      const ecomEcoreModule = await import("./ecom/routes/ecore.js");
      const ecomEcoreRoutes = ecomEcoreModule.default;
      app.use("/api/ecom/ecore", ecomEcoreRoutes);
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/ecore.js:', error.message);
    }
    
    // Routes E-commerce Push Notifications
    try {
      const ecomPushModule = await import("./ecom/routes/push.js");
      const ecomPushRoutes = ecomPushModule.default;
      app.use("/api/ecom/push", ecomPushRoutes);
      console.log('✅ Routes E-commerce Push chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/push.js:', error.message);
    }

    // Routes E-commerce Notifications internes
    try {
      const ecomNotificationsModule = await import("./ecom/routes/notifications.js");
      const ecomNotificationsRoutes = ecomNotificationsModule.default;
      app.use("/api/ecom/notifications", ecomNotificationsRoutes);
      console.log('✅ Routes E-commerce Notifications chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/notifications.js:', error.message);
    }

    // Routes E-commerce Workspaces (Multi-workspaces)
    try {
      const ecomWorkspacesModule = await import("./ecom/routes/workspaces.js");
      const ecomWorkspacesRoutes = ecomWorkspacesModule.default;
      app.use("/api/ecom/workspaces", ecomWorkspacesRoutes);
      console.log('✅ Routes E-commerce Workspaces chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/workspaces.js:', error.message);
    }

    // Routes E-commerce Affectations (Sources et Produits par closeuse)
    try {
      const ecomAssignmentsModule = await import("./ecom/routes/assignments.js");
      const ecomAssignmentsRoutes = ecomAssignmentsModule.default;
      app.use("/api/ecom/assignments", ecomAssignmentsRoutes);
      console.log('✅ Routes E-commerce Assignments chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/assignments.js:', error.message);
    }

    // Routes E-commerce Auto-Synchronisation
    try {
      const ecomAutoSyncModule = await import("./ecom/routes/autoSync.js");
      const ecomAutoSyncRoutes = ecomAutoSyncModule.default;
      app.use("/api/ecom/auto-sync", ecomAutoSyncRoutes);
      console.log('✅ Routes E-commerce Auto-Sync chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/autoSync.js:', error.message);
    }

    // Routes E-commerce Agent Vendeur WhatsApp
    try {
      const ecomAgentModule = await import("./ecom/routes/agent.js");
      const ecomAgentRoutes = ecomAgentModule.default;
      app.use("/api/ecom/agent", ecomAgentRoutes);
      console.log('✅ Routes E-commerce Agent Vendeur chargées');
      
      // Charger les routes des nouvelles commandes agent
      const ecomAgentCommandsModule = await import("./ecom/routes/agentCommands.js");
      const ecomAgentCommandsRoutes = ecomAgentCommandsModule.default;
      app.use("/api/ecom/agent/commands", ecomAgentCommandsRoutes);
      console.log('✅ Routes E-commerce Agent Commandes chargées');
      
      // Démarrer les cron jobs de l'agent vendeur
      const { startAgentCronJobs } = await import("./ecom/services/agentCronService.js");
      startAgentCronJobs();
    } catch (error) {
      console.error('⚠️ Erreur chargement ecom/agent.js:', error.message);
    }

    // Routes Marketing Automation (Newsletters, Campagnes Email)
    try {
      try {
        const subscribersModule = await import("./routes/subscribers.js");
        if (subscribersModule && subscribersModule.default) {
          app.use("/api/subscribers", subscribersModule.default);
          // Route de test pour vérifier que le router fonctionne
          app.get("/api/subscribers/test", (req, res) => {
            res.json({ success: true, message: 'Route subscribers fonctionnelle', timestamp: new Date().toISOString() });
          });
        } else {
          console.error('❌ subscribersModule.default est null ou undefined');
          console.error('   subscribersModule:', subscribersModule);
          // Route de fallback pour diagnostiquer
          app.get("/api/subscribers/test", (req, res) => {
            res.status(503).json({ error: 'Module subscribers non chargé', subscribersModule: !!subscribersModule });
          });
        }
      } catch (importError) {
        console.error('❌ Erreur lors de l\'import du module subscribers:', importError.message);
        console.error('   Stack:', importError.stack);
        // Route de fallback pour diagnostiquer
        app.get("/api/subscribers/test", (req, res) => {
          res.status(503).json({ error: 'Erreur import module subscribers', details: importError.message });
        });
      }
      
      const emailCampaignsModule = await import("./routes/email-campaigns.js");
      if (emailCampaignsModule && emailCampaignsModule.default) {
        app.use("/api/email-campaigns", emailCampaignsModule.default);
      } else {
        console.error('❌ emailCampaignsModule.default est null ou undefined');
        console.error('   Module:', emailCampaignsModule);
      }
      
      const emailTemplatesModule = await import("./routes/email-templates.js");
      if (emailTemplatesModule && emailTemplatesModule.default) {
        app.use("/api/email-templates", emailTemplatesModule.default);
        } else {
        console.error('❌ emailTemplatesModule.default est null ou undefined');
      }
      
      const emailTrackingModule = await import("./routes/email-tracking.js");
      if (emailTrackingModule && emailTrackingModule.default) {
        app.use("/api/email", emailTrackingModule.default);
        } else {
        console.error('❌ emailTrackingModule.default est null ou undefined');
      }
      
      // Routes email-logs (tracking détaillé des emails envoyés)
      try {
        const emailLogsModule = await import("./routes/email-logs.js");
        if (emailLogsModule && emailLogsModule.default) {
          app.use("/api/email-logs", emailLogsModule.default);
          }
      } catch (error) {
        console.error('⚠️ Erreur chargement email-logs.js:', error.message);
      }
      
      // Routes de tracking des visites
      try {
        const visitsModule = await import("./routes/visits.js");
        if (visitsModule && visitsModule.default) {
          app.use("/api/visits", visitsModule.default);
        } else {
          console.error('❌ visitsModule.default est null ou undefined');
          console.error('   Module:', visitsModule);
          // Routes de fallback pour diagnostiquer
          app.get("/api/visits/test", (req, res) => {
            res.status(503).json({ error: 'Module visits non chargé', visitsModule: !!visitsModule });
          });
          app.post("/api/visits/track", async (req, res) => {
            res.status(503).json({ 
              error: 'Module visits non chargé', 
              details: 'visitsModule.default est null ou undefined',
              suggestion: 'Vérifier les logs du serveur pour plus de détails'
            });
          });
          app.get("/api/visits/stats", authenticate, requireAdmin, (req, res) => {
            res.status(503).json({ 
              error: 'Module visits non chargé', 
              details: 'visitsModule.default est null ou undefined',
              suggestion: 'Vérifier les logs du serveur pour plus de détails'
            });
          });
          app.get("/api/visits/recent", authenticate, requireAdmin, (req, res) => {
            res.status(503).json({ 
              error: 'Module visits non chargé', 
              details: 'visitsModule.default est null ou undefined',
              suggestion: 'Vérifier les logs du serveur pour plus de détails'
            });
          });
        }
      } catch (importError) {
        console.error('❌ Erreur lors de l\'import du module visits:', importError.message);
        console.error('   Stack:', importError.stack);
        // Routes de fallback complètes avec logique intégrée
        console.log('⚠️ Utilisation des routes de fallback pour visits');
        
        app.post("/api/visits/track", async (req, res) => {
          try {
            const Visit = (await import("./models/Visit.js")).default;
            const { 
              country, 
              countryCode, 
              city, 
              region, 
              path,
              referrer,
              sessionId 
            } = req.body;

            const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                       req.headers['x-real-ip'] || 
                       req.connection?.remoteAddress || 
                       req.socket?.remoteAddress ||
                       'unknown';

            const userAgent = req.headers['user-agent'] || 'unknown';
            const userId = req.user?._id || null;

            const visit = new Visit({
              ip,
              country: country || 'Unknown',
              countryCode: countryCode || null,
              city: city || null,
              region: region || null,
              userAgent,
              referrer: referrer || null,
              path: path || '/',
              userId,
              sessionId: sessionId || null
            });

            await visit.save();

            res.status(201).json({ 
              success: true, 
              message: 'Visite enregistrée',
              visitId: visit._id 
            });
          } catch (error) {
            console.error('Erreur enregistrement visite (fallback):', error);
            res.status(500).json({ 
              error: 'Erreur lors de l\'enregistrement de la visite',
              details: error.message 
            });
          }
        });
        
        app.get("/api/visits/stats", authenticate, requireAdmin, async (req, res) => {
          try {
            const Visit = (await import("./models/Visit.js")).default;
            const { period = '30' } = req.query;
            const days = parseInt(period, 10);

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const statsByCountry = await Visit.aggregate([
              {
                $match: {
                  createdAt: { $gte: startDate }
                }
              },
              {
                $group: {
                  _id: '$country',
                  countryCode: { $first: '$countryCode' },
                  count: { $sum: 1 },
                  uniqueIPs: { $addToSet: '$ip' }
                }
              },
              {
                $project: {
                  country: '$_id',
                  countryCode: 1,
                  visits: '$count',
                  uniqueVisitors: { $size: '$uniqueIPs' }
                }
              },
              {
                $sort: { visits: -1 }
              }
            ]);

            const totalVisits = await Visit.countDocuments({
              createdAt: { $gte: startDate }
            });

            const uniqueVisitors = await Visit.distinct('ip', {
              createdAt: { $gte: startDate }
            });

            const visitsByDay = await Visit.aggregate([
              {
                $match: {
                  createdAt: { $gte: startDate }
                }
              },
              {
                $group: {
                  _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                  },
                  count: { $sum: 1 }
                }
              },
              {
                $sort: { _id: 1 }
              },
              {
                $project: {
                  date: '$_id',
                  visits: '$count'
                }
              }
            ]);

            res.json({
              success: true,
              period: days,
              totalVisits,
              uniqueVisitors: uniqueVisitors.length,
              statsByCountry,
              visitsByDay
            });
          } catch (error) {
            console.error('Erreur récupération statistiques (fallback):', error);
            res.status(500).json({ 
              error: 'Erreur lors de la récupération des statistiques',
              details: error.message 
            });
          }
        });
        
        app.get("/api/visits/recent", authenticate, requireAdmin, async (req, res) => {
          try {
            const Visit = (await import("./models/Visit.js")).default;
            const { limit = 100, page = 1 } = req.query;
            const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

            const visits = await Visit.find()
              .sort({ createdAt: -1 })
              .limit(parseInt(limit, 10))
              .skip(skip)
              .select('ip country countryCode city path createdAt userAgent')
              .lean();

            const total = await Visit.countDocuments();

            res.json({
              success: true,
              visits,
              pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                total,
                pages: Math.ceil(total / parseInt(limit, 10))
              }
            });
          } catch (error) {
            console.error('Erreur récupération visites récentes (fallback):', error);
            res.status(500).json({ 
              error: 'Erreur lors de la récupération des visites',
              details: error.message 
            });
          }
        });
      }
      
      try {
        const whatsappCampaignsModule = await import("./routes/whatsapp-campaigns.js");
        if (whatsappCampaignsModule && whatsappCampaignsModule.default) {
          app.use("/api/whatsapp-campaigns", whatsappCampaignsModule.default);
          // Route de test pour vérifier que le router fonctionne
          app.get("/api/whatsapp-campaigns/test", (req, res) => {
            res.json({ success: true, message: 'Route whatsapp-campaigns fonctionnelle', timestamp: new Date().toISOString() });
          });
        } else {
          console.error('❌ whatsappCampaignsModule.default est null ou undefined');
          console.error('   whatsappCampaignsModule:', whatsappCampaignsModule);
          // Route de fallback pour diagnostiquer
          app.get("/api/whatsapp-campaigns/test", (req, res) => {
            res.status(503).json({ error: 'Module whatsapp-campaigns non chargé', whatsappCampaignsModule: !!whatsappCampaignsModule });
          });
        }
      } catch (importError) {
        console.error('❌ Erreur lors de l\'import du module whatsapp-campaigns:', importError.message);
        console.error('   Stack:', importError.stack);
        // Route de fallback pour diagnostiquer
        app.get("/api/whatsapp-campaigns/test", (req, res) => {
          res.status(503).json({ error: 'Erreur import module whatsapp-campaigns', details: importError.message });
        });
      }
    } catch (error) {
      console.error('⚠️ Erreur chargement routes marketing:', error.message);
      console.error('   Stack:', error.stack);
      // Routes de fallback pour diagnostiquer
      app.get("/api/subscribers/test", (req, res) => {
        res.status(503).json({ error: 'Erreur chargement module subscribers', details: error.message });
      });
      app.get("/api/whatsapp-campaigns/test", (req, res) => {
        res.status(503).json({ error: 'Erreur chargement module whatsapp-campaigns', details: error.message });
      });
      app.get("/api/visits/test", (req, res) => {
        res.status(503).json({ error: 'Erreur chargement module visits', details: error.message });
      });
      // Routes de fallback complètes avec logique intégrée
      console.log('⚠️ Utilisation des routes de fallback pour visits (bloc marketing)');
      
      app.post("/api/visits/track", async (req, res) => {
        try {
          const Visit = (await import("./models/Visit.js")).default;
          const { 
            country, 
            countryCode, 
            city, 
            region, 
            path,
            referrer,
            sessionId 
          } = req.body;

          const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress ||
                     'unknown';

          const userAgent = req.headers['user-agent'] || 'unknown';
          const userId = req.user?._id || null;

          const visit = new Visit({
            ip,
            country: country || 'Unknown',
            countryCode: countryCode || null,
            city: city || null,
            region: region || null,
            userAgent,
            referrer: referrer || null,
            path: path || '/',
            userId,
            sessionId: sessionId || null
          });

          await visit.save();

          res.status(201).json({ 
            success: true, 
            message: 'Visite enregistrée',
            visitId: visit._id 
          });
        } catch (error) {
          console.error('Erreur enregistrement visite (fallback):', error);
          res.status(500).json({ 
            error: 'Erreur lors de l\'enregistrement de la visite',
            details: error.message 
          });
        }
      });
      
      app.get("/api/visits/stats", authenticate, requireAdmin, async (req, res) => {
        try {
          const Visit = (await import("./models/Visit.js")).default;
          const { period = '30' } = req.query;
          const days = parseInt(period, 10);

          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);

          const statsByCountry = await Visit.aggregate([
            {
              $match: {
                createdAt: { $gte: startDate }
              }
            },
            {
              $group: {
                _id: '$country',
                countryCode: { $first: '$countryCode' },
                count: { $sum: 1 },
                uniqueIPs: { $addToSet: '$ip' }
              }
            },
            {
              $project: {
                country: '$_id',
                countryCode: 1,
                visits: '$count',
                uniqueVisitors: { $size: '$uniqueIPs' }
              }
            },
            {
              $sort: { visits: -1 }
            }
          ]);

          const totalVisits = await Visit.countDocuments({
            createdAt: { $gte: startDate }
          });

          const uniqueVisitors = await Visit.distinct('ip', {
            createdAt: { $gte: startDate }
          });

          const visitsByDay = await Visit.aggregate([
            {
              $match: {
                createdAt: { $gte: startDate }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            {
              $sort: { _id: 1 }
            },
            {
              $project: {
                date: '$_id',
                visits: '$count'
              }
            }
          ]);

          res.json({
            success: true,
            period: days,
            totalVisits,
            uniqueVisitors: uniqueVisitors.length,
            statsByCountry,
            visitsByDay
          });
        } catch (error) {
          console.error('Erreur récupération statistiques (fallback):', error);
          res.status(500).json({ 
            error: 'Erreur lors de la récupération des statistiques',
            details: error.message 
          });
        }
      });
      
      app.get("/api/visits/recent", authenticate, requireAdmin, async (req, res) => {
        try {
          const Visit = (await import("./models/Visit.js")).default;
          const { limit = 100, page = 1 } = req.query;
          const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

          const visits = await Visit.find()
            .sort({ createdAt: -1 })
            .limit(parseInt(limit, 10))
            .skip(skip)
            .select('ip country countryCode city path createdAt userAgent')
            .lean();

          const total = await Visit.countDocuments();

          res.json({
            success: true,
            visits,
            pagination: {
              page: parseInt(page, 10),
              limit: parseInt(limit, 10),
              total,
              pages: Math.ceil(total / parseInt(limit, 10))
            }
          });
        } catch (error) {
          console.error('Erreur récupération visites récentes (fallback):', error);
          res.status(500).json({ 
            error: 'Erreur lors de la récupération des visites',
            details: error.message 
          });
        }
      });
      app.get("/api/whatsapp-campaigns", authenticate, requireAdmin, (req, res) => {
        res.status(503).json({ 
          error: 'Module whatsapp-campaigns non chargé', 
          details: error.message,
          suggestion: 'Vérifier les logs du serveur pour plus de détails'
        });
      });
      app.post("/api/whatsapp-campaigns", authenticate, requireAdmin, (req, res) => {
        res.status(503).json({ 
          error: 'Module whatsapp-campaigns non chargé', 
          details: error.message,
          suggestion: 'Vérifier les logs du serveur pour plus de détails'
        });
      });
    }
    
    
    // Connexion MongoDB
    await connectDB();
    
    // Configuration Web Push (notifications push natives)
    try {
      await configureWebPush();
    } catch (error) {
      console.warn('⚠️ Web Push non configuré:', error.message);
    }

    // Configuration Email Service (Marketing Automation)
    try {
      const { initEmailService } = await import("./services/emailService.js");
      initEmailService();
    } catch (error) {
      console.warn('⚠️ Service email non configuré:', error.message);
    }
    
    // Configuration WhatsApp Service
    try {
      const { initWhatsAppService } = await import("./services/whatsappService.js");
      await initWhatsAppService();
    } catch (error) {
      console.warn('⚠️ Service WhatsApp non configuré:', error.message);
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
            } else {
              campaign.status = 'draft';
              await campaign.save();
            }
          }
        } catch (error) {
          console.error('❌ Erreur planification campagnes:', error);
        }
      });

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

      // Créer le Module 1
      const module1 = new Module({
        courseId: facebookAdsCourse._id,
        title: 'Module 1 - Formation Andromeda',
        order: 1
      });
      await module1.save();

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
      }
      
    } else {
        if (facebookAdsCourse.isPublished !== true) {
        facebookAdsCourse.isPublished = true;
        await facebookAdsCourse.save();
      }
    }
    
    // Démarrer le Success Radar (cron + exécution initiale) si disponible
    if (startSuccessRadarCron && runSuccessRadarOnce) {
      startSuccessRadarCron();
      runSuccessRadarOnce();
    } else {
      console.warn('⚠️ Services Success Radar Cron non disponibles');
    }

    // Démarrer le service d'auto-synchronisation Google Sheets
    try {
      const autoSyncService = (await import("./services/autoSyncService.js")).default;
      await autoSyncService.start();
      console.log('✅ Service d\'auto-synchronisation Google Sheets démarré');
    } catch (error) {
      console.error('⚠️ Erreur démarrage auto-sync service:', error.message);
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
    });
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error);
    process.exit(1);
  }
};

startServer();
